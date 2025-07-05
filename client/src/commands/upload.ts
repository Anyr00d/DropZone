import * as grpc from "@grpc/grpc-js";
import * as protoLoader from "@grpc/proto-loader";
import fs from "fs";
import path from "path";
import readline from "readline";
import { createReadStream } from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROTO_PATH = path.resolve(__dirname, "../../../proto/file-service.proto");

const packageDef = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});
const grpcObj = grpc.loadPackageDefinition(packageDef) as any;
const FileService = grpcObj.fileservice.FileService;

const client = new FileService(
  "file.anirudhsanthanam.me:443",
  grpc.credentials.createSsl()
);

export async function uploadCommand(filepath: string) {
  if (!fs.existsSync(filepath)) {
    console.error("❌ File does not exist");
    process.exit(1);
  }

  const filename = path.basename(filepath);
  const passcode = await prompt("Enter passcode: ");

  const call = client.Upload((err: any, response: any) => {
    if (err) {
      console.error("Upload failed:", err.message);
    } else {
      console.log("✅ Upload complete!");
      console.log("File ID:         ", response.fileId);
      console.log("Download Token:  ", response.downloadToken);
      console.log("Expires At:      ", response.expiresAt);
    }
  });

  const stream = createReadStream(filepath, { highWaterMark: 64 * 1024 }); // 64KB chunks

  for await (const chunk of stream) {
    call.write({
      content: chunk,
      fileName: filename,
      passcode: passcode,
    });

    // After first chunk, avoid resending fileName/passcode
    delete (call as any).fileName;
    delete (call as any).passcode;
  }

  call.end();
}

function prompt(query: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) =>
    rl.question(query, (ans) => {
      rl.close();
      resolve(ans);
    })
  );
}
