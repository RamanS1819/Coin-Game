// server.js
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
const PACKET_LOSS = 0.05; // 5% packet loss

// Spawn coins randomly
function spawnCoin() {
  coins.push({
    id: uuidv4(),
    x: Math.random() * 560 + 20,
    y: Math.random() * 560 + 20,
  });
}

// initial coins
for (let i = 0; i < 10; i++) spawnCoin();

function withPacketLoss() {
  return Math.random() < PACKET_LOSS;
}

function sendWithLag(ws, data) {
  // simulate downstream packet loss
  if (withPacketLoss()) return; // drop outgoing packet
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
    color: 'hsl(' + Math.floor(Math.random() * 360) + ',70%,50%)',
    score: 0,
    lastSeq: 0, // last input seq processed from this client
  };

  // send init
  sendWithLag(ws, { type: 'init', selfId: id });

  ws.on('message', (raw) => {
    // simulate upstream packet loss
    if (withPacketLoss()) return;
    // simulate upstream latency
    setTimeout(() => {
      try {
        const msg = JSON.parse(raw);

        // ping-pong for RTT measurement
        if (msg.type === 'ping') {
          // echo back pong (will be delayed by sendWithLag)
          sendWithLag(ws, { type: 'pong', clientSent: msg.clientSent });
          return;
        }

        // input messages: client prediction inputs
        if (msg.type === 'input') {
          // msg: {type:'input', seq, dx, dy}
          const seq = msg.seq || 0;
          if (players[id]) {
            // apply input on server (authoritative)
            players[id].x += msg.dx * 5;
            players[id].y += msg.dy * 5;
            // clamp
            players[id].x = Math.max(0, Math.min(580, players[id].x));
            players[id].y = Math.max(0, Math.min(580, players[id].y));
            players[id].lastSeq = seq; // record last processed seq
          }
        }
      } catch (e) {
        console.error('Failed to parse client message', e);
      }
    }, LATENCY);
  });

  ws.on('close', () => {
    delete players[id];
  });
});

// Game loop (collision + broadcast)
setInterval(() => {
  // collisions
  for (let id in players) {
    const p = players[id];
    for (let i = coins.length - 1; i >= 0; i--) {
      const c = coins[i];
      const dx = p.x - c.x;
      const dy = p.y - c.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 25) {
        p.score += 1;
        coins.splice(i, 1);
        spawnCoin();
      }
    }
  }

  // broadcast full state: include lastSeq for reconciliation
  const packet = {
    type: 'state',
    timestamp: Date.now(),
    players,
    coins,
  };

  wss.clients.forEach((client) => sendWithLag(client, packet));
}, 50);
