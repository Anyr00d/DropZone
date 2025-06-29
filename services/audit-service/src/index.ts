import mongoose from "mongoose";
import { MONGODB_URI } from "./config";
import { startConsumer } from "./rabbit";

async function start() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    await startConsumer();
  } catch (err) {
    console.error("❌ Failed to start audit service:", err);
    process.exit(1);
  }
}

start();
