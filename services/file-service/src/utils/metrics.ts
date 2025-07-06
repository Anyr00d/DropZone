import client from 'prom-client';

client.collectDefaultMetrics(); // collects CPU/mem usage, event loop lag

export const uploadCounter = new client.Counter({
  name: 'file_upload_total',
  help: 'Total number of uploaded files',
});

export const downloadCounter = new client.Counter({
  name: 'file_download_total',
  help: 'Total number of downloaded files',
});

export function getMetrics(): Promise<string> {
  return client.register.metrics();
}
