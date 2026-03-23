const express = require("express");
const fetch = require("node-fetch");
const multer = require("multer");
const pdf = require("pdf-parse");
const fs = require("fs");
const db = require("./db");

const app = express();
app.use(express.json());
app.use(express.static("public"));

const upload = multer({ dest: "uploads/" });
const memory = {};

// ================= CHAT =================
app.post("/chat", async (req, res) => {
  try {
    const userMessage = req.body.message || "Halo";
    const userId = "user";

    if (!memory[userId]) {
      memory[userId] = [
        {
          role: "system",
          content: `
Kamu adalah AI pribadi milik Amran.

WAJIB:
- Bahasa Indonesia
- Santai, natural
- Tidak kaku

FORMAT:
## Judul
### Subjudul
* Bullet
**Bold**

Jawaban harus rapi dan mudah dibaca.
`
        }
      ];
    }

    memory[userId].push({
      role: "user",
      content: "Jawab dalam Bahasa Indonesia:\n" + userMessage
    });

    // limit memory
    if (memory[userId].length > 6) {
      memory[userId] = memory[userId].slice(-6);
    }

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "mistralai/mistral-7b-instruct",
        messages: memory[userId],
        temperature: 0.7
      })
    });

    const data = await response.json();
    const reply = data?.choices?.[0]?.message?.content || "Tidak ada jawaban";

    memory[userId].push({
      role: "assistant",
      content: reply
    });

    db.run(
      "INSERT INTO chats (userId, message, reply) VALUES (?, ?, ?)",
      [userId, userMessage, reply]
    );

    res.json({ reply });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ================= IMAGE =================
app.post("/image", async (req, res) => {
  try {
    const prompt = req.body.prompt;

    const response = await fetch("https://openrouter.ai/api/v1/images/generations", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "stability-ai/sdxl",
        prompt: prompt,
        size: "1024x1024"
      })
    });

    const data = await response.json();
    const imageUrl = data.data?.[0]?.url;

    res.json({ image: imageUrl });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ================= UPLOAD =================
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

${text.substring(0, 1500)}

Gunakan format:
## Ringkasan
### Masalah
### Rekomendasi
* Bullet
`;

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "mistralai/mistral-7b-instruct",
        messages: [{ role: "user", content: prompt }]
      })
    });

    const data = await response.json();

    res.json({
      result: data?.choices?.[0]?.message?.content
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
