import * as grpc from "@grpc/grpc-js";
import * as protoLoader from "@grpc/proto-loader";
import path from "path";
import fs from "fs";
import { randomUUID } from "crypto";
import { s3, PutObjectCommand, GetObjectCommand } from "./minio.js";
import { Readable } from "stream";
import { generateHmac } from "./utils/hmac.js";
import { connectRabbitMQ, publishToQueue } from "./rabbitmq.js";
import { fileURLToPath } from "url";
import { startHealthServer } from "./health.js";
import { RateLimiter } from "./utils/RateLimiter.js";
import { downloadCounter, uploadCounter } from "./utils/metrics.js";

const uploadLimiter = new RateLimiter(5, 5); //5 uploads per minute
const downloadLimiter = new RateLimiter(5, 5);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROTO_PATH = path.join(__dirname, "../proto/file-service.proto");

// Load proto definition
const packageDef = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});
const grpcObj = grpc.loadPackageDefinition(packageDef) as any;
const fileService = grpcObj.fileservice;

// Implement service handlers
const server = new grpc.Server();

//fileservice->package while Fileservice->service(has upload and download handlers)
server.addService(fileService.FileService.service, {
  Upload: async (call: any, callback: any) => {
    //rate-limiter
    const clientKey = call.getPeer(); //we limit by IP
    if (!uploadLimiter.isAllowed(clientKey)) {
      return callback({
        code: grpc.status.RESOURCE_EXHAUSTED,
        message: 'Too many upload attempts. Please try again later.',
      });
    }

    let fileName = "";
    let passcode = "";
    const fileId = randomUUID();
    const tempPath = path.join(__dirname, `${fileId}.tmp`);
    const writeStream = fs.createWriteStream(tempPath);

    call.on("data", (chunk: any) => {
      if (!fileName && chunk.fileName) {
        fileName = chunk.fileName;
        passcode = chunk.passcode;
        console.log(`Receiving file: ${fileName}`);
      }
      writeStream.write(chunk.content);
    });

    call.on("end", async () => {
      writeStream.end();

      // Waiting for writeStream to fully flush
      await new Promise<void>((resolve, reject) => {
        writeStream.on("finish", () => resolve());
        writeStream.on("error", (err) => reject(err));
      });

      const fileBuffer = fs.readFileSync(tempPath);

      //for audit:
      const stats = fs.statSync(tempPath);
      const fileSize = stats.size;

      //upload to minIO
      const s3Key = `uploads/${fileId}-${fileName}`; //path inside S3(minIO here)
      await s3.send(
        new PutObjectCommand({
          Bucket: "dropzone",
          Key: s3Key,
          Body: fileBuffer,
        })
      );

      fs.unlinkSync(tempPath); // Clean up

      const hmac = generateHmac(fileId, s3Key, passcode);
      const downloadToken = Buffer.from(`${fileId}:${s3Key}:${hmac}`).toString(
        "base64"
      );
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour

      callback(null, {
        fileId,
        downloadToken,
        expiresAt,
      });

      publishToQueue({
        event: "file.uploaded",
        fileId: fileId,
        user: "cli-user", // placeholder for auth in MVP
        metadata: {
          filename: fileName,
          size: fileSize,
        },
      });
      
      //for metrics observavility:
      uploadCounter.inc();
    });

    call.on("error", (err: any) => {
      console.error("Upload failed:", err);
    });
  },

  Download: async (call: any) => {
    //rate-limiting:
    const clientKey = call.getPeer();
    if (!downloadLimiter.isAllowed(clientKey)) {
      call.emit("error", {
        code: grpc.status.RESOURCE_EXHAUSTED,
        message: "Too many downloads. Please try again later.",
      });
      return;
    }

    const { downloadToken, passcode } = call.request;

    try {
      // Decode token: base64(fileId:key:passcode)
      const decoded = Buffer.from(downloadToken, "base64").toString();
      const [fileId, key, providedHmac] = decoded.split(":"); //key->path in S3

      //check if valid token
      if (!fileId || !key || !providedHmac) {
        call.emit("error", new Error("Malformed token"));
        return;
      }

      // Check passcode match
      const expectedHmac = generateHmac(fileId, key, passcode);
      if (expectedHmac !== providedHmac) {
        call.emit("error", new Error("Invalid passcode or Malformed token"));
        return;
      }

      // Get file from MinIO (S3-compatible)
      const { Body } = await s3.send(
        new GetObjectCommand({
          Bucket: "dropzone",
          Key: key,
        })
      );

      if (!Body) {
        call.emit("error", new Error("File doesn't exist or invalid token"));
        return;
      }

      const stream = Body as Readable;

      stream.on("data", (chunk: Buffer) => {
        call.write({ content: chunk });
      });

      stream.on("end", () => {
        call.end();
        publishToQueue({
          event: "file.downloaded",
          fileId: fileId,
          user: "cli-user", // placeholder for session
          metadata: {
            filename: key.split("/").pop(),
            size: stream.readableLength || 0, // approximate size
          },
        });
        //for metrics observability:
        downloadCounter.inc();
      });

      stream.on("error", (err: any) => {
        console.error("❌ Stream error:", err);
        call.emit(err);
      });
    } catch (err: any) {
      console.error("❌ Download handler failed:", err.message);
      call.emit(err);
    }
  },
});

(async () => {
  try {
    await connectRabbitMQ();
    server.bindAsync(
      "0.0.0.0:50051",
      grpc.ServerCredentials.createInsecure(),
      () => {
        console.log("gRPC file-service running at 0.0.0.0:50051");
      }
    );
  } catch (err) {
    console.error("Failed to start file-service:", err);
    process.exit(1);
  }
})();

startHealthServer(3000);  //health endpoint in express