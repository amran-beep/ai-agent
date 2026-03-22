import express from "express";
import fetch from "node-fetch";

const app = express();
app.use(express.json());

app.post("/chat", async (req, res) => {
  try {
    const userMessage = req.body.message || "Halo";

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "openrouter/auto",
        messages: [
          {
            role: "system",
            content: `
Kamu adalah AI pribadi milik Amran.

Aturan:
- Selalu jawab dalam Bahasa Indonesia
- Gunakan bahasa santai tapi profesional
- Jawaban harus jelas dan mudah dipahami
- Anggap Amran adalah owner kamu
- Jika ditanya tentang Amran, jawab dengan positif dan percaya diri
`
          },
          {
            role: "user",
            content: userMessage
          }
        ]
      })
    });

    const data = await response.json();

    console.log("FULL RESPONSE:", JSON.stringify(data, null, 2));

    const reply =
      data?.choices?.[0]?.message?.content ||
      data?.choices?.[0]?.text ||
      JSON.stringify(data);

    res.json({ reply });

  } catch (error) {
    console.error("ERROR:", error);
    res.status(500).json({ error: error.message });
  }
});

app.get("/", (req, res) => {
  res.send("AI Amran aktif 🚀");
});

app.listen(3000, () => {
  console.log("Server jalan di port 3000");
});
