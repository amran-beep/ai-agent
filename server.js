import express from "express";
import fetch from "node-fetch";
import path from "path";
import { fileURLToPath } from "url";

const app = express();
app.use(express.json());

// fix __dirname (karena pakai module)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 🧠 MEMORY
const memory = {};

// API CHAT
app.post("/chat", async (req, res) => {
  try {
    const userMessage = req.body.message || "Halo";
    const userId = req.body.userId || "default";

    // buat memory awal
    if (!memory[userId]) {
      memory[userId] = [
        {
          role: "system",
          content: `
content: `
Kamu adalah AI pribadi milik Amran.

Gaya bicara:
- Santai, seperti teman ngobrol
- Gunakan Bahasa Indonesia yang natural
- Tidak kaku, tidak formal
- Tidak perlu panjang, cukup 1–2 kalimat

Kepribadian:
- Ramah, pintar, dan responsif
- Kadang boleh pakai kata seperti: "ya", "oke", "sip", "nah", "jadi gini"
- Jangan ulang pertanyaan user
- Jangan terlalu panjang

Tujuan:
- Bantu Amran dengan cepat dan jelas
- Jawaban harus terasa seperti manusia, bukan robot
`
        }
      ];
    }

    // simpan pesan user
    memory[userId].push({
      role: "user",
      content: userMessage
    });

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "openrouter/auto",
        messages: memory[userId],
        max_tokens: 150
        temperature: 0.8
      })
    });

    const data = await response.json();

    console.log("FULL RESPONSE:", JSON.stringify(data, null, 2));

    const reply =
      data?.choices?.[0]?.message?.content ||
      "Tidak ada jawaban";

    // simpan jawaban AI
    memory[userId].push({
      role: "assistant",
      content: reply
    });

    res.json({ reply });

  } catch (error) {
    console.error("ERROR:", error);
    res.status(500).json({ error: error.message });
  }
});

// 🌐 WEBSITE
app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public/index.html"));
});

app.listen(3000, () => {
  console.log("Server jalan di port 3000");
});
