const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const axios = require("axios");

const app = express();
const PORT = process.env.PORT || 3000;

// Настройка CORS для разрешения запросов с https://chibe.lol
app.use(cors({
  origin: "https://chibe.lol", // Укажите ваш домен
}));

const OPENAI_API_KEY = "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";

app.use(bodyParser.json());

app.post("/api/chat", async (req, res) => {
  const { message } = req.body;

  try {
    const response = await axios.post(
      "https://api.openai.com/v1/completions",
      {
        model: "text-davinci-003",
        prompt: `You are an AI assistant. Respond in a friendly and helpful manner.\n\nUser: ${message}\nAI:`,
        max_tokens: 150,
        temperature: 0.7,
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${OPENAI_API_KEY}`,
        }
      }
    );

    res.json({ reply: response.data.choices[0].text.trim() });
  } catch (error) {
    console.error("Error:", error.message);
    res.status(500).json({ error: "Failed to fetch response from OpenAI." });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
