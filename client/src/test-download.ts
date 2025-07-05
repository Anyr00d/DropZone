// src/test-download.ts
import fs from 'fs';
import path from 'path';
import grpc from '@grpc/grpc-js';
import protoLoader from '@grpc/proto-loader';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ✅ Path to proto
const PROTO_PATH = path.resolve(__dirname, '../../proto/file-service.proto');

// ✅ Load and cast proto
const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});
const proto = grpc.loadPackageDefinition(packageDefinition) as unknown as {
  fileservice: {
    FileService: grpc.ServiceClientConstructor;
  };
};

// ✅ Create client
const client = new proto.fileservice.FileService(
  'file.anirudhsanthanam.me:443', //replace with IP in which you have your file service
   grpc.credentials.createSsl()   //if it does not have ssl yet use insecure()
);

// 🔐 Provide token and passcode
const downloadToken = process.argv[3]; // Pass as CLI arg
const passcode = process.argv[4];      // Pass as CLI arg
const outputPath = path.join(__dirname, 'downloaded.txt'); // Output file

console.log(downloadToken)
console.log("passcode: ",passcode)

if (!downloadToken || !passcode) {
  console.error('❌ Provide both downloadToken and passcode as arguments.');
  process.exit(1);
}

// 🚀 Start download
const call = client.Download({ downloadToken, passcode });

const writeStream = fs.createWriteStream(outputPath);

// Track if we hit an error
let hasError = false;

call.on('data', (chunk: { content: Buffer }) => {
  if (!hasError) {
    writeStream.write(chunk.content);
  }
});

call.on('end', () => {
  if (!hasError) {
    writeStream.end();
    console.log('✅ Download complete. Saved to:', outputPath);
  }
});

call.on('error', (err:any) => {
  hasError = true;
  writeStream.destroy();
  fs.unlinkSync(outputPath); // Delete partial file
  console.error('❌ Download failed:', err.message);
});