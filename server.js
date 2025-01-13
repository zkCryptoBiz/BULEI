const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const cors = require('cors');
const fs = require('fs');
const rateLimit = require('express-rate-limit');

const volkovData = JSON.parse(fs.readFileSync('Volkov.json', 'utf8'));

const app = express();
const PORT = 3000;
const TOKEN =
   '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';

app.use(cors());
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
    Unexpected Scenarios:
    - Hostility: ${volkovData.unexpectedScenarios.hostility}
    - Unknown: ${volkovData.unexpectedScenarios.unknown}
    
    Respond to the user's messages in character without mentioning your name or prefixing your responses.

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
