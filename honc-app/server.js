const express = require('express');
const cors = require('cors');
const OpenAI = require('openai');
require('dotenv').config({ path: '.dev.vars' });

const app = express();
const PORT = 8787;

// Initialize OpenAI with your API key
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Middleware
app.use(cors({
  origin: ["http://localhost:3000", "chrome-extension://*"],
  allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowHeaders: ["Content-Type", "Authorization"]
}));

app.use(express.json());

// Route de test
app.get('/', (req, res) => {
  res.json({ 
    message: "Market Prediction Chatbot API! 🤖📈",
    status: "running",
    timestamp: new Date().toISOString()
  });
});

// Route de santé
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Route chatbot avec vrai OpenAI + quick actions
app.post('/api/chatbot/chat', async (req, res) => {
  try {
    const { message } = req.body;
    console.log('Received message:', message);
    
    // Détection de Market ID (uniquement des nombres)
    const marketIdMatch = message.match(/market\s*(?:id\s*)?[:#]?\s*(\d+)/i);
    const quickActions = [];
    
    if (marketIdMatch) {
      const marketId = marketIdMatch[1];
      quickActions.push({
        type: 'show_market',
        label: `View Market ${marketId}`,
        marketId: marketId,
        marketUrl: `https://alpha.xo.market/markets/${marketId}`
      });
    }
    
    // Appel à OpenAI pour la vraie réponse
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant that provides information about prediction markets. When users mention specific market IDs, acknowledge them and provide relevant insights about prediction markets in general."
        },
        {
          role: "user",
          content: message
        }
      ],
      max_tokens: 150
    });
    
    const chatbotResponse = completion.choices[0].message.content;
    
    res.json({
      response: chatbotResponse,
      timestamp: new Date().toISOString(),
      quickActions: quickActions.length > 0 ? quickActions : undefined
    });
    
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({
      error: 'Failed to process request',
      timestamp: new Date().toISOString()
    });
  }
});

// Démarrer le serveur
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on http://0.0.0.0:${PORT}`);
  console.log(`✅ Using real OpenAI API`);
  console.log(`✅ Health check: http://0.0.0.0:${PORT}/health`);
});