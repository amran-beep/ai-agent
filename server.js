import express from "express";
import OpenAI from "openai";

const app = express();
app.use(express.json());

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

app.post("/chat", async (req, res) => {
  try {
    const userMessage = req.body.message;

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "Kamu adalah AI yang ramah, pintar, dan membantu." },
        { role: "user", content: userMessage },
      ],
    });

    const reply = completion.choices[0].message.content;

    res.json({ reply });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Terjadi error dari AI" });
  }
});

app.get("/", (req, res) => {
  res.send("AI OpenAI aktif 🚀");
});

app.listen(3000, () => {
  console.log("Server jalan di port 3000");
});
