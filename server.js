import express from "express";

const app = express();
app.use(express.json());

app.post("/chat", async (req, res) => {
  try {
    const userMessage = req.body.message || "Halo";

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "mistralai/mistral-7b-instruct", // GRATIS
        messages: [
          { role: "user", content: userMessage }
        ]
      })
    });

    const data = await response.json();

    const reply = data.choices?.[0]?.message?.content || "Tidak ada jawaban";

    res.json({ reply });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

app.get("/", (req, res) => {
  res.send("AI GRATIS aktif 🚀");
});

app.listen(3000, () => {
  console.log("Server jalan");
});
  res.send("AI OpenAI aktif 🚀");
});

app.listen(3000, () => {
  console.log("Server jalan");
});
