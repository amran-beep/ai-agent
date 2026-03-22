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

// ================= INIT =================
const db = await initDB();
const SECRET = "amran_secret";

// ================= FILE PATH =================
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ================= UPLOAD =================
const upload = multer({ dest: "uploads/" });

// ================= MEMORY =================
const memory = {};

// ================= REGISTER =================
app.post("/register", async (req, res) => {
  const { email, password } = req.body;

  try {
    const hash = await bcrypt.hash(password, 10);

    await db.run(
      "INSERT INTO users (email, password) VALUES (?, ?)",
      [email, hash]
    );

    res.json({ message: "Register berhasil" });
  } catch {
    res.status(400).json({ error: "Email sudah digunakan" });
  }
});

// ================= LOGIN =================
app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  const user = await db.get(
    "SELECT * FROM users WHERE email = ?",
    [email]
  );

  if (!user) return res.status(400).json({ error: "User tidak ditemukan" });

  const valid = await bcrypt.compare(password, user.password);

  if (!valid) return res.status(400).json({ error: "Password salah" });

  const token = jwt.sign({ id: user.id }, SECRET);

  res.json({ token });
});

// ================= CHAT =================
app.post("/chat", async (req, res) => {
  try {
    const userMessage = req.body.message || "Halo";

    const token = req.headers.authorization?.split(" ")[1];
    let userIdDB = "guest";

    if (token) {
      const decoded = jwt.verify(token, SECRET);
      userIdDB = decoded.id;
    }

    // init memory
    if (!memory[userIdDB]) {
      memory[userIdDB] = [
        {
          role: "system",
          content: `
Kamu adalah AI pribadi milik Amran.

Gaya bicara:
- Santai, natural, seperti teman ngobrol
- Bahasa Indonesia sehari-hari
- Tidak kaku
- Jawaban singkat & jelas

Kepribadian:
- Ramah, pintar, santai
- Kadang pakai kata: "ya", "oke", "nah", "sip"
`
        }
      ];
    }

    memory[userIdDB].push({
      role: "user",
      content: userMessage
    });

    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "openrouter/auto",
          messages: memory[userIdDB],
          temperature: 0.8
        })
      }
    );

    const data = await response.json();

    const reply =
      data?.choices?.[0]?.message?.content ||
      "Maaf, tidak ada jawaban";

    memory[userIdDB].push({
      role: "assistant",
      content: reply
    });

    // simpan ke DB
    if (userIdDB !== "guest") {
      await db.run(
        "INSERT INTO chats (userId, message, reply) VALUES (?, ?, ?)",
        [userIdDB, userMessage, reply]
      );
    }

    res.json({ reply });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// ================= UPLOAD + ANALISIS =================
app.post("/upload", upload.single("file"), async (req, res) => {
  try {
    const filePath = req.file.path;
    let text = "";

    if (req.file.mimetype === "application/pdf") {
      const buffer = fs.readFileSync(filePath);
      const pdfData = await pdf(buffer);
      text = pdfData.text;
    } else {
      text = fs.readFileSync(filePath, "utf8");
    }

    const prompt = `
Analisis laporan berikut:

${text.substring(0, 4000)}

Buat:
1. Ringkasan
2. Masalah utama
3. Rekomendasi
`;

    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "openrouter/auto",
          messages: [
            { role: "user", content: prompt }
          ]
        })
      }
    );

    const data = await response.json();

    const result =
      data?.choices?.[0]?.message?.content ||
      "Gagal analisis";

    res.json({ result });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ================= HISTORY =================
app.get("/history", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const decoded = jwt.verify(token, SECRET);

    const chats = await db.all(
      "SELECT * FROM chats WHERE userId = ? ORDER BY id DESC",
      [decoded.id]
    );

    res.json(chats);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ================= FRONTEND =================
app.use(express.static(path.join(__dirname, "public")));

// ================= ROOT =================
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public/index.html"));
});

// ================= PORT FIX (WAJIB UNTUK RENDER) =================
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Server jalan di port", PORT);
});
