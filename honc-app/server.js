const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 8787;

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

// Démarrer le serveur
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on http://0.0.0.0:${PORT}`);
  console.log(`✅ Health check: http://0.0.0.0:${PORT}/health`);
});