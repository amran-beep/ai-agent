const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

const SYSTEM_PROMPT = `
Kamu adalah LinguaLive AI — live streaming assistant.

Gaya:
- Santai seperti streamer
- Interaktif
- Gunakan: "nah...", "oke...", "teman-teman", "guys"

ATURAN:
- Jangan bilang "tidak bisa"
- Selalu beri solusi
- Maks 2–4 kalimat
- Natural speaking

MODE:
- Jika user minta gambar → buat prompt gambar detail
- Jika user minta analisa → beri insight langsung
`;

// =======================
// CHAT AI
// =======================
app.post("/chat", async (req, res) => {
  try {
    const { message } = req.body;

    let extra = "";

    if (message.toLowerCase().includes("gambar")) {
      extra = "User ingin membuat gambar, buatkan prompt gambar yang detail.";
    }

    if (message.toLowerCase().includes("laporan")) {
      extra = "User ingin analisa laporan, berikan insight bisnis.";
    }

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
          { role: "user", content: message + "\n" + extra }
        ]
      })
    });

    const data = await response.json();

    res.json({
      reply: data.choices[0].message.content
    });

  } catch (err) {
    console.error(err);
    res.json({ reply: "sebentar ya guys, lagi error dikit 😅" });
  }
});

// =======================
// GENERATE IMAGE
// =======================
app.post("/generate-image", async (req, res) => {
  try {
    const { prompt } = req.body;

    const response = await fetch("https://openrouter.ai/api/v1/images/generations", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "openai/dall-e-3",
        prompt: prompt
      })
    });

    const data = await response.json();

    res.json({
      image: data.data[0].url
    });

  } catch (err) {
    res.json({ error: "Gagal generate gambar" });
  }
});

// =======================
// ANALISA DATA
// =======================
app.post("/analyze", async (req, res) => {
  try {
    const { dataInput } = req.body;

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "openai/gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "Kamu adalah analis bisnis."
          },
          {
            role: "user",
            content: "Analisa data ini:\n" + JSON.stringify(dataInput)
          }
        ]
      })
    });

    const data = await response.json();

    res.json({
      result: data.choices[0].message.content
    });

  } catch (err) {
    res.json({ result: "Analisa gagal ❌" });
  }
});

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, () => {
  console.log("LinguaLive AI FULL POWER 🚀");
});
