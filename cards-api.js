// cards-api.js
// Simple Express.js REST API for a playing card collection (in-memory)

const express = require('express');
const crypto = require('crypto');

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

/**
 * In-memory store for cards.
 * Each card: { id: string, suit: 'Hearts'|'Diamonds'|'Clubs'|'Spades', value: 'A'|'2'..'10'|'J'|'Q'|'K' }
 */
let cards = [];

// Helpers
const validSuits = new Set(['Hearts', 'Diamonds', 'Clubs', 'Spades']);
const validValues = new Set([
  'A','2','3','4','5','6','7','8','9','10','J','Q','K'
]);

function generateId() {
  if (crypto.randomUUID) return crypto.randomUUID();
  return crypto.randomBytes(12).toString('hex');
}

// Routes

// GET /cards - list all cards
app.get('/cards', (req, res) => {
  res.json({ success: true, count: cards.length, cards });
});

// GET /cards/:id - retrieve a card by id
app.get('/cards/:id', (req, res) => {
  const card = cards.find(c => c.id === req.params.id);
  if (!card) return res.status(404).json({ success: false, message: 'Card not found' });
  res.json({ success: true, card });
});

// POST /cards - add a new card
// Expected JSON body: { suit: "Hearts", value: "A" }
app.post('/cards', (req, res) => {
  const { suit, value } = req.body || {};

  if (!suit || !value) {
    return res.status(400).json({ success: false, message: 'Both suit and value are required' });
  }
  if (!validSuits.has(suit)) {
    return res.status(400).json({ success: false, message: `Invalid suit. Allowed: ${[...validSuits].join(', ')}` });
  }
  if (!validValues.has(String(value))) {
    return res.status(400).json({ success: false, message: `Invalid value. Allowed: ${[...validValues].join(', ')}` });
  }

  // Prevent duplicates (same suit+value) optionally
  const exists = cards.some(c => c.suit === suit && String(c.value) === String(value));
  if (exists) {
    return res.status(409).json({ success: false, message: 'Card with same suit and value already exists' });
  }

  const newCard = {
    id: generateId(),
    suit,
    value: String(value)
  };
  cards.push(newCard);
  res.status(201).json({ success: true, message: 'Card added', card: newCard });
});

// DELETE /cards/:id - delete a card by id
app.delete('/cards/:id', (req, res) => {
  const idx = cards.findIndex(c => c.id === req.params.id);
  if (idx === -1) return res.status(404).json({ success: false, message: 'Card not found' });
  const removed = cards.splice(idx, 1)[0];
  res.json({ success: true, message: 'Card deleted', card: removed });
});

// Optional: reset or seed endpoints (useful for testing)
// POST /cards/seed - populate with a small sample set
app.post('/cards/seed', (req, res) => {
  cards = [
    { id: generateId(), suit: 'Hearts', value: 'A' },
    { id: generateId(), suit: 'Spades', value: 'K' },
    { id: generateId(), suit: 'Clubs', value: '10' }
  ];
  res.json({ success: true, message: 'Seeded sample cards', cards });
});

// Start server
app.listen(PORT, () => {
  console.log(`Cards API running on http://localhost:${PORT}`);
});
