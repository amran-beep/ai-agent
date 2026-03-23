const express = require("express");
const cors = require("cors");
const multer = require("multer");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

// middleware
app.use(cors());
app.use(express.json());

// WAJIB: static folder
app.use(express.static(__dirname));

// upload config
const upload = multer({ dest: "uploads/" });

// CHAT API
app.post("/chat", (req, res) => {
  const { message } = req.body;

  if (!message) {
    return res.json({ reply: "Pesan kosong ❌" });
  }

  res.json({
    reply: "AI Amran: " + message
  });
});

// UPLOAD API
app.post("/upload", upload.single("file"), (req, res) => {
  res.json({
    reply: "File berhasil diupload 📄"
  });
});

// 🔥 FIX UTAMA: route root
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// 🔥 FIX TAMBAHAN (ANTI NOT FOUND)
app.use((req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// start
app.listen(PORT, () => {
  console.log("Server jalan di port", PORT);
});
