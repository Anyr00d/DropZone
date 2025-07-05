import * as grpc from "@grpc/grpc-js";
import * as protoLoader from "@grpc/proto-loader";
import fs from "fs";
import path from "path";
import readline from "readline";
import { finished } from "stream/promises";
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

export async function downloadCommand(token: string) {
  const passcode = await prompt("Enter passcode: ");

  const call = client.Download({ downloadToken: token, passcode });

  const outputPath = path.join(process.cwd(), `downloaded-${Date.now()}.bin`);
  const tempChunks: Buffer[] = [];

  let hadData = false;

  call.on("data", (chunk: any) => {
    hadData = true;
    tempChunks.push(chunk.content);
  });

  call.on("end", async () => {
    if (!hadData) {
      console.error("❌ No data recieved from server");
      return;
    }

    const writeStream = fs.createWriteStream(outputPath);
    for (const chunk of tempChunks) {
      writeStream.write(chunk);
    }
    writeStream.end();
    await finished(writeStream);
    console.log(`✅ File saved to ${outputPath}`);
  });

  call.on("error", (err: any) => {
    console.error("❌ Download failed:", err.message);
  });
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
