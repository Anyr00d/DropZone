import amqp from "amqplib";
import dotenv from "dotenv";
dotenv.config();

let channel: amqp.Channel;

export async function connectRabbitMQ() {
  const connection = await amqp.connect(process.env.RABBITMQ_URI!);
  channel = await connection.createChannel();
  await channel.assertQueue(process.env.QUEUE_NAME!, { durable: true });
  console.log("✅ Connected to RabbitMQ from file-service");
}

export function publishToQueue(payload: object) {
  if (!channel) {
    console.error("❌ RabbitMQ channel not initialized");
    return;
  }

  channel.sendToQueue(
    process.env.QUEUE_NAME!,
    Buffer.from(JSON.stringify(payload)),
    {
      persistent: true,
    }
  );
}
