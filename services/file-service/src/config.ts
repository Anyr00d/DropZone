import dotenv from "dotenv";
dotenv.config();

export const MINIO_CONFIG = {
  endpoint: process.env.MINIO_ENDPOINT!,
  port: parseInt(process.env.MINIO_PORT!),
  accessKeyId: process.env.MINIO_ACCESS_KEY!,
  secretAccessKey: process.env.MINIO_SECRET_KEY!,
  bucket: process.env.MINIO_BUCKET!,
};

export const HMAC_SECRET = process.env.HMAC_SECRET;
