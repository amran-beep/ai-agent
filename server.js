const express = require("express");
const fetch = require("node-fetch");
const multer = require("multer");
const pdf = require("pdf-parse");
const fs = require("fs");
const sqlite3 = require("sqlite3").verbose();

const app = express();
app.use(express.json());
app.use(express.static("public"));

const upload = multer({ dest: "uploads/" });
const db = new sqlite3.Database("./database.sqlite");

const memory = {}; // memory per user

// ================= DB =================
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS chats (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId TEXT,
      message TEXT,
      reply TEXT
    )
  `);
});

// ================= CHAT =================
app.post("/chat", async (req, res) => {
  try {
    const userMessage = req.body.message || "Halo";
    const userId = "user"; // bisa dikembangkan login nanti

    // init memory
    if (!memory[userId]) {
      memory[userId] = [
        {
          role: "system",
         content: `
Kamu adalah AI pribadi milik Amran.

ATURAN WAJIB (TIDAK BOLEH DILANGGAR):

1. SELALU gunakan Bahasa Indonesia
2. Dilarang menggunakan Bahasa Inggris kecuali diminta khusus
3. Jawaban harus natural seperti manusia
4. Tidak kaku, tidak formal berlebihan

FORMAT WAJIB:
- Gunakan ## untuk judul
- Gunakan ### untuk subjudul
- Gunakan * untuk bullet
- Gunakan **bold untuk highlight**
- Gunakan spasi antar paragraf

GAYA:
- Seperti teman ngobrol pintar
- Santai tapi tetap profesional
- Mudah dipahami

JANGAN:
- campur bahasa
- buat paragraf panjang tanpa struktur
`
        }
      ];
    }

    memory[userId].push({
      role: "user",
      content: userMessage
    });

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
       model: "meta-llama/llama-3-8b-instruct",
        messages: memory[userId],
        temperature: 0.8
      })
    });

    const data = await response.json();

    const reply = data?.choices?.[0]?.message?.content || "Tidak ada jawaban";

    memory[userId].push({
      role: "assistant",
      content: reply
    });

    // simpan ke DB
    db.run(
      "INSERT INTO chats (userId, message, reply) VALUES (?, ?, ?)",
      [userId, userMessage, reply]
    );

    res.json({ reply });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// ================= UPLOAD + ANALISIS =================
app.post("/upload", upload.single("file"), async (req, res) => {
  try {
    let text = "";

    if (req.file.mimetype === "application/pdf") {
      const buffer = fs.readFileSync(req.file.path);
      const pdfData = await pdf(buffer);
      text = pdfData.text;
    } else {
      text = fs.readFileSync(req.file.path, "utf8");
    }

    const prompt = `
Analisis laporan berikut:

${text.substring(0, 4000)}

Format output WAJIB:
Gunakan:
## Judul utama
### Subjudul
* Bullet point
**Bold untuk highlight**

Isi:
1. Ringkasan
2. Masalah utama
3. Insight penting
4. Rekomendasi

Gunakan bahasa Indonesia profesional tapi tetap natural.
`;

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "openrouter/auto",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7
      })
    });

    const data = await response.json();

    const result = data?.choices?.[0]?.message?.content || "Gagal analisis";

    res.json({ result });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ================= HISTORY =================
app.get("/history", (req, res) => {
  db.all("SELECT * FROM chats ORDER BY id DESC LIMIT 20", [], (err, rows) => {
    res.json(rows);
  });
});

// ================= PORT =================
const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", () => {
  console.log("Server jalan di port", PORT);
});
