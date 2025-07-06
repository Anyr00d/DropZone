//Test
import amqp from "amqplib";
import dotenv from "dotenv";
dotenv.config();

const QUEUE_NAME = process.env.QUEUE_NAME!;
const RABBITMQ_URI = process.env.RABBITMQ_URI!;

async function sendTestAuditLog() {
  const conn = await amqp.connect(RABBITMQ_URI);
  const channel = await conn.createChannel();

  await channel.assertQueue(QUEUE_NAME, { durable: true });

  const msg = {
    event: "file.uploaded",
    fileId: "test123",
    user: "test-cli-user",
    metadata: {
      filename: "resume.pdf",
      size: "12345",
    },
  };

  channel.sendToQueue(QUEUE_NAME, Buffer.from(JSON.stringify(msg)), {
    persistent: true,
  });

  console.log("✅ Sent test message to audit.logs queue");

  await channel.close();
  await conn.close();
}

sendTestAuditLog();
