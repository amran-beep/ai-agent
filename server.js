import express from "express";

const app = express();
app.use(express.json());

app.post("/chat", async (req, res) => {
  const userMessage = req.body.message;

  const reply = `Halo Amran 👋, kamu bilang: ${userMessage}`;

  res.json({ reply });
});

app.get("/", (req, res) => {
  res.send("AI Agent aktif 🚀");
});

app.listen(3000, () => {
  console.log("Server jalan di port 3000");
});
