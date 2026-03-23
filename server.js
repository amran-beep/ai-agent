const express = require("express");
const cors = require("cors");
const multer = require("multer");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

// middleware
app.use(cors());
app.use(express.json());

// static file (WAJIB)
app.use(express.static(path.join(__dirname)));

// upload config
const upload = multer({ dest: "uploads/" });

// ROOT → tampilkan index.html
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// CHAT
app.post("/chat", (req, res) => {
  const { message } = req.body;

  if (!message) {
    return res.json({ reply: "Pesan kosong ❌" });
  }

  res.json({
    reply: "AI Amran: " + message
  });
});

// UPLOAD
app.post("/upload", upload.single("file"), (req, res) => {
  res.json({
    reply: "File berhasil diupload 📄"
  });
});

// START SERVER
app.listen(PORT, () => {
  console.log("Server jalan di port", PORT);
});
