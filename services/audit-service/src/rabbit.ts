import amqp from "amqplib";
import { RABBITMQ_URI, QUEUE_NAME } from "./config.js";
import { AuditLog } from "./models/AuditLog.js";
import { auditEventCounter } from "./metrics.js";

export async function startConsumer() {
  const conn = await amqp.connect(RABBITMQ_URI);
  const channel = await conn.createChannel();

  await channel.assertQueue(QUEUE_NAME, { durable: true });

  console.log(`🐇 Waiting for messages in queue: ${QUEUE_NAME}`);

  channel.consume(QUEUE_NAME, async (msg) => {
    if (msg) {
      try {
        const content = msg.content.toString();
        const data = JSON.parse(content);

        const log = new AuditLog({
          event: data.event,
          fileId: data.fileId,
          user: data.user,
          metadata: data.metadata,
        });

        await log.save();
        console.log(`✅ Logged: ${data.event} for ${data.fileId}`);
        channel.ack(msg);
        auditEventCounter.inc()
      } catch (err) {
        console.error("❌ Failed to process message:", err);
        channel.nack(msg, false, false); // discard bad message
      }
    }
  });
}
