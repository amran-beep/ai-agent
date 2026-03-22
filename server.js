import express from "express";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// endpoint utama
app.get("/", (req, res) => {
  res.send("Agen AI aktif 🚀");
});

// 🔥 endpoint AI (baru)
app.post("/chat", (req, res) => {
  const { message } = req.body;

  res.json({
    reply: "Kamu bilang: " + message,
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
