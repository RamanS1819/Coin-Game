const express = require('express');
const WebSocket = require('ws');
const { v4: uuidv4 } = require('uuid');
const app = express();

app.use(express.static('public'));
const server = app.listen(3000, () =>
  console.log('Server running on http://localhost:3000')
);

const wss = new WebSocket.Server({ server });

// All player data
let players = {};
const LATENCY = 200; // 200ms artificial lag

// Delayed send wrapper
function sendWithLag(ws, data) {
  setTimeout(() => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(data));
    }
  }, LATENCY);
}

wss.on('connection', (ws) => {
  const id = uuidv4();

  players[id] = { id, x: 300, y: 300, color: 'blue' };

  // Send init with latency
  sendWithLag(ws, { type: 'init', selfId: id });

  // Incoming message (UPSTREAM lag)
  ws.on('message', (msg) => {
    setTimeout(() => {
      const data = JSON.parse(msg);

      if (data.type === 'move' && players[id]) {
        players[id].x += data.dx * 5;
        players[id].y += data.dy * 5;
      }
    }, LATENCY);
  });

  ws.on('close', () => {
    delete players[id];
  });
});

// DOWNSTREAM lag + timestamp
setInterval(() => {
  const packet = { type: 'state', players, timestamp: Date.now() };

  wss.clients.forEach((client) => {
    sendWithLag(client, packet);
  });
}, 50);
