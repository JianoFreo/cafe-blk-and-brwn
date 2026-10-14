import cors from "cors";
import express, { NextFunction, Request, Response } from "express";
import fs from "fs";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import { connectDatabase } from "./config/db.js";
import { ENV, assertEnv } from "./config/env.js";
import adminRouter from "./routes/admin.route.js";
import authRouter from "./routes/auth.route.js";
import publicRouter from "./routes/public.route.js";

assertEnv();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

app.set("trust proxy", 1); // correct client IPs behind Render / Railway / Nginx (rate limits)
app.use(cors(ENV.CLIENT_URL ? { origin: ENV.CLIENT_URL.split(",") } : undefined));
app.use(express.json({ limit: "1mb" }));

app.get("/api/health", (_req, res) => res.json({ ok: true }));

// One server, three doors:
app.use("/api/public", publicRouter); // the website (no sign-in)
app.use("/api/auth", authRouter); //     sign-in
app.use("/api/admin", adminRouter); //   the editor (administrators only)

app.use("/api", (_req, res) => res.status(404).json({ error: "Not found." }));

// Demo images created by `npm run seed:local` (kept out of the way unless the folder exists)
const seedAssets = path.resolve(__dirname, "../seed/assets");
if (fs.existsSync(seedAssets)) app.use("/seed-assets", express.static(seedAssets, { maxAge: "7d" }));

// In production the same server also serves the built React app (and its client-side routes)
const frontendPath = path.resolve(__dirname, "../../frontend/dist");
if (fs.existsSync(frontendPath)) {
  app.use(express.static(frontendPath));
  app.get(/^(?!\/api).*/, (_req, res) => res.sendFile(path.join(frontendPath, "index.html")));
}

// upload and parsing errors become plain messages instead of stack traces
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof multer.MulterError) {
    const message = err.code === "LIMIT_FILE_SIZE" ? "That image is larger than 10 MB." : err.message;
    return res.status(400).json({ error: message });
  }
  if ((err as any).type === "entity.parse.failed") return res.status(400).json({ error: "Invalid request." });
  if (err.message?.startsWith("Only JPG")) return res.status(400).json({ error: err.message });
  console.error(err);
  res.status(500).json({ error: "Something went wrong." });
});

connectDatabase()
  .then(() => app.listen(Number(ENV.PORT), () => console.log(`Server running on http://localhost:${ENV.PORT} (${ENV.NODE_ENV})`)))
  .catch((err) => {
    console.error("Could not start:", err);
    process.exit(1);
  });
