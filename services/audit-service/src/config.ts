import dotenv from "dotenv";
dotenv.config();

export const MONGODB_URI = process.env.MONGODB_URI!;
export const RABBITMQ_URI = process.env.RABBITMQ_URI!;
export const QUEUE_NAME = process.env.QUEUE_NAME!;
