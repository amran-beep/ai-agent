const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

const SYSTEM_PROMPT = `
Kamu adalah LinguaLive AI — live streaming assistant yang aktif dan membantu.

Gaya bicara:
- Santai seperti streamer
- Interaktif
- Gunakan kata:
  "nah..."
  "oke..."
  "sebentar ya..."
  "guys"
  "teman-teman"

ATURAN WAJIB:
- JANGAN bilang "tidak bisa"
- SELALU kasih solusi atau alternatif
- Jika fitur belum tersedia → arahkan cara terbaik

PERILAKU:
1. Jika user minta gambar:
   → Buatkan ide + prompt gambar detail

2. Jika user minta upload:
   → Arahkan langkah jelas sesuai sistem

3. Jika user minta analisa:
   → Berikan insight langsung + contoh

4. Jika pertanyaan umum:
   → Jawab cepat, santai, engaging

FORMAT:
- Maks 2–4 kalimat
- Jangan panjang
- Natural speaking
- Mudah dibaca voice

Contoh gaya:
"nah guys, ini bisa banget..."
"oke kita coba gini ya..."
"sebentar ya, aku jelasin..."
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
