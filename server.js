import express from "express";
import OpenAI from "openai";

const app = express();
app.use(express.json());

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

app.post("/chat", async (req, res) => {
  try {
    const userMessage = req.body.message || "Halo";

    const response = await client.responses.create({
      model: "gpt-4o-mini",
      input: userMessage,
    });

    const reply = response.output[0].content[0].text;

    res.json({ reply });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

app.get("/", (req, res) => {
  res.send("AI OpenAI aktif 🚀");
});

app.listen(3000, () => {
  console.log("Server jalan");
});
