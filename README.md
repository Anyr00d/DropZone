# DropZone - Secure File Drop Service

DropZone is a secure CLI-based ephemeral file sharing system designed for internal teams. Built with Node.js, gRPC, RabbitMQ, and MinIO, it ensures privacy, auditability, and ease of deployment.
Note: Currently this project is just in its initial phase. Play around but don't upload anything sesnsitive until further notice.

---

## 🌐 Features

- ⚡ Secure file upload/download with passcode-protected HMAC tokens
- 🪝 Event-based audit logging with RabbitMQ and MongoDB
- ☁️ Internal-only object storage via S3-compatible MinIO
- 🧾 Auto-expiry, rate-limiting, and CLI token-based access
- 📈 Deployable via Docker Compose or Kubernetes with ArgoCD (Yet to be added. Stay tuned!!!)

---

## 🚀 Quickstart

### Prerequisites

- [Node.js](https://nodejs.org/) (v18+ recommended)
- [Docker & Docker Compose](https://docs.docker.com/compose/install/)

### Client installation and usage

#### 🛠 Build CLI

```bash
cd client/
npm install
npm run build
npm link   # Register globally as `dropzone`
```

#### 📥 Upload a file

```bash
dropzone upload ./secrets.txt
```

#### 📤 Download a file

```bash
dropzone download <TOKEN>
```

### 📁 Project Structure

```
dropzone/
├── client/              # CLI interface (dropzone upload/download)
├── services/
│   ├── file-service/    # gRPC upload/download service
│   └── audit-service/   # RabbitMQ consumer that logs events to MongoDB
├── proto/               # gRPC proto files
├── infra/
│   └── docker-compose.yml  # Local dev setup
└── README.md
```

### Self-hosting:

Note: Modify client to call your deployed file-service

```bash
cd infra/
docker-compose up -d
```

- MinIO Console: [http://localhost:9001](http://localhost:9001)
- RabbitMQ UI: [http://localhost:15672](http://localhost:15672) (`guest` / `guest`)
- MongoDB: localhost:27017

> ✅ Creates a MinIO bucket: `dropzone` (must be created manually or on first run)

#### 🔧 Environment Variables

Set up a `.env` file in `file-service/`:

```env
MINIO_ACCESS_KEY=minio
MINIO_SECRET_KEY=minio123
S3_BUCKET=dropzone
S3_ENDPOINT=http://localhost:9000
```

Do the same for `audit-service/` (for MongoDB URL, if needed).
You can check out your variables in docker-compose.yml.

#### File Service

```bash
cd services/file-service
npx ts-node src/index.ts
```

#### Audit Service

```bash
cd services/audit-service
npx ts-node src/index.ts
```

#### Mongo Inspection

You can inspect logs:

```bash
docker exec -it <mongo-container> mongosh
use dropzone
show collections
```

---

## 🔒 Security Notes

- Token is HMAC signed using passcode (but can be brute-forced — future: use signed URLs)
- MinIO is internal-only — not exposed to internet
- Rate-limiting and expiry implemented in memory (can be enhanced via Redis)

---

## 🤝 Contributing / Feedback

Pull requests welcome! Raise issues for bugs or enhancements.

---

## 📜 License

MIT License
