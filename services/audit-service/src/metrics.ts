import client from 'prom-client';

client.collectDefaultMetrics(); // collects CPU/mem usage, event loop lag

export const auditEventCounter = new client.Counter({
  name: 'audit_events_total',
  help: 'Total audit messages processed',
});

export function getMetrics(): Promise<string> {
  return client.register.metrics();
}
