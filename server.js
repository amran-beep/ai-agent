const express = require("express");
const cors = require("cors");
const multer = require("multer");

const app = express();
const PORT = process.env.PORT || 3000;

// middleware
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// upload config
const upload = multer({ dest: "uploads/" });

// test route
app.get("/", (req, res) => {
  res.send("AI Amran Server Running 🚀");
});

// CHAT AI (FIX UTAMA)
app.post("/chat", async (req, res) => {
  try {
    const { message } = req.body;

    console.log("Pesan masuk:", message);

    if (!message) {
      return res.json({ reply: "Pesan kosong ❌" });
    }

    // simulasi AI (bisa diganti OpenAI nanti)
    const reply = "AI Amran: Saya menerima pesan → " + message;

    res.json({ reply });

  } catch (err) {
    console.error(err);
    res.status(500).json({ reply: "Server error ❌" });
  }
});

// UPLOAD PDF
app.post("/upload", upload.single("file"), (req, res) => {
  try {
    console.log("File diterima:", req.file);

    res.json({
      reply: "File berhasil diupload & siap dianalisis 📄"
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ reply: "Upload gagal ❌" });
  }
});

// start server
app.listen(PORT, () => {
  console.log(`Server jalan di port ${PORT}`);
});
