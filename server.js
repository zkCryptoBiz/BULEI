const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const cors = require('cors');
const fs = require('fs');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const volkovData = JSON.parse(fs.readFileSync('Volkov.json', 'utf8'));

const app = express();
const PORT = 3000;
const TOKEN = process.env.TOKEN;

   const allowedOrigins = ['https://chibe.lol', 'https://bulei.onrender.com', 'https://bulei.onrender.com/chat'];
   app.use(   cors({
      origin: (origin, callback) => {         if (
            !origin ||            origin.startsWith('http://localhost') ||
            origin.startsWith('http://127.0.0.1') ||            allowedOrigins.includes(origin)
         ) {            callback(null, true);
         } else {            callback(new Error('Not allowed by CORS')); // Запрещено
         }      }
   }));
app.use(bodyParser.json());

// Настройка ограничения частоты запросов
const limiter = rateLimit({
   windowMs: 1 * 60 * 1000,
   max: 60,
   message: 'Слишком много запросов с этого IP, попробуйте позже.'
});

app.use('/chat', limiter);

app.post('/chat', async (req, res) => {
   const userMessages = req.body.messages;

   const prompt = `
    You are a character with the following traits:
    Name: ${volkovData.name}
    Personality: ${volkovData.Personality}
    Values: ${volkovData.Values}
    Culture: ${volkovData.Culture}
    When faced with unexpected scenarios:
- Hostility: ${volkovData.unexpectedScenarios.hostility}
- Unknown: ${volkovData.unexpectedScenarios.unknown}
    
    Respond to the user's messages as this character. Stay in character, and do not explicitly mention these traits or refer back to this prompt.

    User messages:
${userMessages.map((msg) => msg.replace(/<.*?>/g, '')).join('\n')}
`;

   try {
      const response = await axios.post(
         'https://api.openai.com/v1/chat/completions',
         {
            model: 'gpt-3.5-turbo',
            messages: [{ role: 'user', content: prompt }]
         },
         {
            headers: {
               Authorization: `Bearer ${TOKEN}`,
               'Content-Type': 'application/json'
            }
         }
      );

      const botReply = response.data.choices[0].message.content.trim();
      const cleanedReply = botReply.replace(/^Бот:\s*/, '');
      res.json({ reply: cleanedReply });
   } catch (error) {
      console.error('Error fetching from OpenAI:', error);
      res.status(500).json({ error: 'Ошибка при отправке запроса' });
   }
});

app.listen(PORT, () => {
   console.log(`Server is running on http://localhost:${PORT}`);
});
