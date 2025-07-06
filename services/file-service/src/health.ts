import express from "express";
import { getMetrics } from "./utils/metrics.js";

export function startHealthServer(port: number) {
  const app = express();

  app.get("/healthz", (_, res) => {
    res.status(200).send("OK");
  });

  app.get('/metrics', async (req, res) => {
    res.set('Content-Type', 'text/plain');
    res.send(await getMetrics());
  });

  app.listen(port, () => {
    console.log(`✅ Health check server running on port ${port}`);
  });
}