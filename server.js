const express = require("express");
const fetch = require("node-fetch");
const multer = require("multer");
const pdf = require("pdf-parse");
const fs = require("fs");
const path = require("path");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const sqlite3 = require("sqlite3").verbose();

const app = express();
app.use(express.json());
app.use(express.static("public"));

const SECRET = "amran_secret";

// ================= DB =================
const db = new sqlite3.Database("./database.sqlite");

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE,
      password TEXT
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS chats (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER,
      message TEXT,
      reply TEXT
    )
  `);
});

// ================= UPLOAD =================
const upload = multer({ dest: "uploads/" });

// ================= MEMORY =================
const memory = {};

// ================= REGISTER =================
app.post("/register", async (req, res) => {
  const { email, password } = req.body;

  const hash = await bcrypt.hash(password, 10);

  db.run(
    "INSERT INTO users (email, password) VALUES (?, ?)",
    [email, hash],
    function (err) {
      if (err) {
        return res.status(400).json({ error: "Email sudah digunakan" });
      }
      res.json({ message: "Register berhasil" });
    }
  );
});

// ================= LOGIN =================
app.post("/login", (req, res) => {
  const { email, password } = req.body;

  db.get(
    "SELECT * FROM users WHERE email = ?",
    [email],
    async (err, user) => {
      if (!user) return res.status(400).json({ error: "User tidak ditemukan" });

      const valid = await bcrypt.compare(password, user.password);

      if (!valid) return res.status(400).json({ error: "Password salah" });

      const token = jwt.sign({ id: user.id }, SECRET);

      res.json({ token });
    }
  );
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

    if (!memory[userIdDB]) {
      memory[userIdDB] = [
        {
          role: "system",
          content: `
Kamu adalah AI pribadi milik Amran.
Jawab santai, natural, bahasa Indonesia sehari-hari.
Tidak kaku. Singkat dan jelas.
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
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
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
      "Tidak ada jawaban";

    memory[userIdDB].push({
      role: "assistant",
      content: reply
    });

    if (userIdDB !== "guest") {
      db.run(
        "INSERT INTO chats (userId, message, reply) VALUES (?, ?, ?)",
        [userIdDB, userMessage, reply]
      );
    }

    res.json({ reply });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// ================= UPLOAD =================
app.post("/upload", upload.single("file"), async (req, res) => {
  try {
    const buffer = fs.readFileSync(req.file.path);
    const dataPdf = await pdf(buffer);

    const prompt = `
Analisis laporan berikut:

${dataPdf.text.substring(0, 3000)}

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
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "openrouter/auto",
          messages: [{ role: "user", content: prompt }]
        })
      }
    );

    const result = await response.json();

    res.json({
      result:
        result?.choices?.[0]?.message?.content || "Gagal analisis"
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ================= PORT =================
const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", () => {
  console.log("Server jalan di port", PORT);
});
