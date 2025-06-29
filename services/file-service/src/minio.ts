import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { MINIO_CONFIG } from "./config.js";

const s3 = new S3Client({
  endpoint: `http://${MINIO_CONFIG.endpoint}:${MINIO_CONFIG.port}`,
  region: "us-east-1",
  forcePathStyle: true,
  credentials: {
    accessKeyId: MINIO_CONFIG.accessKeyId,
    secretAccessKey: MINIO_CONFIG.secretAccessKey,
  },
});

export { s3, PutObjectCommand, GetObjectCommand };
