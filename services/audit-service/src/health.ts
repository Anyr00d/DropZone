import express from "express";

export function startHealthServer(port: number) {
  const app = express();

  app.get("/healthz", (_, res) => {
    res.status(200).send("OK");
  });

  app.listen(port, () => {
    console.log(`✅ Health check server running on port ${port}`);
  });
}