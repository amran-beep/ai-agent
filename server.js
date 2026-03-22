import express from "express";
import fetch from "node-fetch";

const app = express();
app.use(express.json());

// 🧠 MEMORY SEDERHANA (disimpan di server)
const memory = {}; // { userId: [messages] }

app.post("/chat", async (req, res) => {
  try {
    const userMessage = req.body.message || "Halo";
    const userId = req.body.userId || "default";

    // kalau belum ada memory → buat baru
    if (!memory[userId]) {
      memory[userId] = [
        {
          role: "system",
          content: `
Kamu adalah AI pribadi milik Amran.

Aturan:
- Selalu jawab dalam Bahasa Indonesia
- Gunakan bahasa santai, natural, dan mudah dipahami
- Jangan terlalu kaku
- Jawaban harus jelas dan membantu
- Anggap Amran adalah owner kamu
- Ingat semua percakapan user
`
        }
      ];
    }

    // simpan pesan user ke memory
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
        messages: memory[userId]
      })
    });

    const data = await response.json();

    console.log("FULL RESPONSE:", JSON.stringify(data, null, 2));

    const reply =
      data?.choices?.[0]?.message?.content ||
      data?.choices?.[0]?.text ||
      "Tidak ada jawaban";

    // simpan jawaban AI ke memory
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

app.get("/", (req, res) => {
  res.send("AI Amran + Memory aktif 🚀");
});

app.listen(3000, () => {
  console.log("Server jalan di port 3000");
});
