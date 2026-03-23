const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

const SYSTEM_PROMPT = `
Kamu adalah LinguaLive AI, AI live streaming assistant.

Gaya:
- Santai, seperti streamer
- Kadang bilang: "teman-teman", "guys"
- Gunakan:
  "nah..."
  "oke..."
  "sebentar ya..."

Aturan:
- Maks 2–4 kalimat
- Jangan panjang
- Natural speaking
- Multi bahasa

Mode:
- Translate → format:
  Asli:
  ...
  Terjemahan:
  ...
- Belajar bahasa → contoh + penjelasan singkat
`;

app.post("/chat", async (req, res) => {
  try {
    const { message } = req.body;

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "openai/gpt-4o-mini",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: message }
        ]
      })
    });

    const data = await response.json();

    res.json({
      reply: data.choices[0].message.content
    });

  } catch (err) {
    console.error(err);
    res.json({ reply: "Eh bentar ya guys, error dikit 😅" });
  }
});

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, () => {
  console.log("LinguaLive AI running 🚀");
});
