const express = require('express');
const WebSocket = require('ws');
const { v4: uuidv4 } = require('uuid');
const app = express();

app.use(express.static('public'));
const server = app.listen(3000, () =>
  console.log('Server running on http://localhost:3000')
);

const wss = new WebSocket.Server({ server });

let players = {};
let coins = [];
const LATENCY = 200; // ms artificial delay

// Spawn coins randomly
function spawnCoin() {
  coins.push({
    id: uuidv4(),
    x: Math.random() * 560 + 20,
    y: Math.random() * 560 + 20,
  });
}

// Spawn 10 coins initially
for (let i = 0; i < 10; i++) spawnCoin();

function sendWithLag(ws, data) {
  setTimeout(() => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(data));
    }
  }, LATENCY);
}

wss.on('connection', (ws) => {
  const id = uuidv4();

  players[id] = {
    id,
    x: 300,
    y: 300,
    color: 'blue',
    score: 0,
  };

  sendWithLag(ws, { type: 'init', selfId: id });

  ws.on('message', (msg) => {
    setTimeout(() => {
      const data = JSON.parse(msg);

      if (data.type === 'move' && players[id]) {
        players[id].x += data.dx * 5;
        players[id].y += data.dy * 5;

        // clamp bounds
        players[id].x = Math.max(0, Math.min(580, players[id].x));
        players[id].y = Math.max(0, Math.min(580, players[id].y));
      }
    }, LATENCY);
  });

  ws.on('close', () => {
    delete players[id];
  });
});

// Game loop
setInterval(() => {
  // Collision detection
  for (let id in players) {
    let p = players[id];

    for (let i = coins.length - 1; i >= 0; i--) {
      let c = coins[i];
      let dx = p.x - c.x;
      let dy = p.y - c.y;
      let dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < 25) {
        p.score += 1;
        coins.splice(i, 1);
        spawnCoin(); // replace collected coin
      }
    }
  }

  // Broadcast
  const packet = {
    type: "state",
    players,
    coins,
    timestamp: Date.now(),
  };

  wss.clients.forEach((client) => sendWithLag(client, packet));

}, 50);
