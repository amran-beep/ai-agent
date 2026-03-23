const express = require("express");
const cors = require("cors");
const multer = require("multer");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

// middleware
app.use(cors());
app.use(express.json());

// 🔥 STATIC PUBLIC (PENTING)
app.use(express.static(path.join(__dirname, "public")));

// upload config
const upload = multer({ dest: "uploads/" });

// ==========================
// API CHAT
// ==========================
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
          {
            role: "system",
            content: "Kamu adalah AI Amran, asisten bisnis pintar."
          },
          {
            role: "user",
            content: message
          }
        ]
      })
    });

    const data = await response.json();

    const reply = data.choices[0].message.content;

    res.json({ reply });

  } catch (err) {
    console.error(err);
    res.json({ reply: "AI error ❌" });
  }
});
// ==========================
// API UPLOAD
// ==========================
app.post("/upload", upload.single("file"), (req, res) => {
  res.json({
    reply: "File berhasil diupload 📄"
  });
});

// ==========================
// ROOT → INDEX.HTML
// ==========================
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// ==========================
// ANTI NOT FOUND
// ==========================
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// start server
app.listen(PORT, () => {
  console.log("Server jalan di port", PORT);
});
