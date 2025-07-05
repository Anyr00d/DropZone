// src/test-upload.ts
import fs from 'fs';
import path from 'path';
import grpc from '@grpc/grpc-js';
import protoLoader from '@grpc/proto-loader';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// For __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Proto path
const PROTO_PATH = path.resolve(__dirname, '../../proto/file-service.proto');

// Load and parse proto
const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});

// Cast the loaded object to match your proto structure
const proto = grpc.loadPackageDefinition(packageDefinition) as unknown as {
  fileservice: {
    FileService: grpc.ServiceClientConstructor;
  };
};

// Create client
const client = new proto.fileservice.FileService(
  'file.anirudhsanthanam.me:443', //replace with IP in which you have your file service
  grpc.credentials.createSsl()   //if it does not have ssl yet use insecure()
);

// Upload logic
const filePath = path.resolve(__dirname, 'hello.txt');
const fileName = 'hello.txt';
const passcode = 'test-passcode';
const CHUNK_SIZE = 32 * 1024;

function uploadFile() {
  const call = client.Upload((err: grpc.ServiceError | null, response: any) => {
    if (err) {
      console.error('Upload error:', err);
    } else {
      console.log('✅ Upload successful!');
      console.log('📄 File ID:', response.fileId);
      console.log('🔑 Download token:', response.downloadToken);
      console.log('🕒 Expires at:', response.expiresAt);
    }
  });

  const readStream = fs.createReadStream(filePath, { highWaterMark: CHUNK_SIZE });

  let firstChunk = true;
  readStream.on('data', (chunk) => {
    const fileChunk: any = {
      content: chunk,
    };

    if (firstChunk) {
      fileChunk.fileName = fileName;
      fileChunk.passcode = passcode;
      firstChunk = false;
    }

    call.write(fileChunk);
  });

  readStream.on('end', () => call.end());
  readStream.on('error', (err) => {
    console.error('File read error:', err);
    call.end();
  });
}

uploadFile();
