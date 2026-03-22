import express from "express";
import fetch from "node-fetch";
import multer from "multer";
import pdf from "pdf-parse";
import fs from "fs";
import path from "path";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { fileURLToPath } from "url";
import { initDB } from "./db.js";

const app = express();
app.use(express.json());

const db = await initDB();
const SECRET = "amran_secret";

const upload = multer({ dest: "uploads/" });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ================= LOGIN =================

app.post("/register", async (req, res) => {
  const { email, password } = req.body;
  const hash = await bcrypt.hash(password, 10);

  try {
    await db.run("INSERT INTO users (email, password) VALUES (?, ?)", [email, hash]);
    res.json({ message: "Register berhasil" });
  } catch {
    res.status(400).json({ error: "Email sudah ada" });
  }
});

app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  const user = await db.get("SELECT * FROM users WHERE email = ?", [email]);

  if (!user) return res.status(400).json({ error: "User tidak ada" });

  const valid = await bcrypt.compare(password, user.password);

  if (!valid) return res.status(400).json({ error: "Password salah" });

  const token = jwt.sign({ id: user.id }, SECRET);

  res.json({ token });
});

// ================= CHAT =================

const memory = {};

app.post("/chat", async (req, res) => {
  const userMessage = req.body.message;
  const token = req.headers.authorization?.split(" ")[1];

  let userIdDB = null;

  if (token) {
    const decoded = jwt.verify(token, SECRET);
    userIdDB = decoded.id;
  }

  if (!memory[userIdDB]) {
    memory[userIdDB] = [
      {
        role: "system",
        content: "Jawab santai, natural, bahasa Indonesia"
      }
    ];
  }

  memory[userIdDB].push({ role: "user", content: userMessage });

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "openrouter/auto",
      messages: memory[userIdDB]
    })
  });

  const data = await response.json();

  const reply = data?.choices?.[0]?.message?.content || "Tidak ada jawaban";

  memory[userIdDB].push({ role: "assistant", content: reply });

  if (userIdDB) {
    await db.run(
      "INSERT INTO chats (userId, message, reply) VALUES (?, ?, ?)",
      [userIdDB, userMessage, reply]
    );
  }

  res.json({ reply });
});

// ================= UPLOAD =================

app.post("/upload", upload.single("file"), async (req, res) => {
  const buffer = fs.readFileSync(req.file.path);
  const pdfData = await pdf(buffer);

  const prompt = `
Analisis laporan berikut:
${pdfData.text.substring(0, 3000)}

Buat:
1. Ringkasan
2. Masalah
3. Rekomendasi
`;

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "openrouter/auto",
      messages: [{ role: "user", content: prompt }]
    })
  });

  const data = await response.json();

  res.json({
    result: data?.choices?.[0]?.message?.content
  });
});

// ================= HISTORY =================

app.get("/history", async (req, res) => {
  const token = req.headers.authorization.split(" ")[1];
  const decoded = jwt.verify(token, SECRET);

  const chats = await db.all(
    "SELECT * FROM chats WHERE userId = ? ORDER BY id DESC",
    [decoded.id]
  );

  res.json(chats);
});

// ================= FRONTEND =================

app.use(express.static(path.join(__dirname, "public")));

app.listen(3000, () => console.log("Server jalan 🚀"));
