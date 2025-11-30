const express = require('express');
const WebSocket = require('ws');
const { v4: uuidv4 } = require('uuid');
const app = express();

app.use(express.static('public'));
const server = app.listen(3000, () =>
  console.log('Server running on http://localhost:3000')
);

const wss = new WebSocket.Server({ server });

// All connected players
let players = {};

wss.on('connection', (ws) => {
    const id = uuidv4();

    // Initial player state
    players[id] = { id, x: 300, y: 300, color: 'blue' };

    // Tell client their own ID
    ws.send(JSON.stringify({ type: 'init', selfId: id }));

    // When client sends movement input
    ws.on('message', (msg) => {
        const data = JSON.parse(msg);

        if (data.type === 'move' && players[id]) {
            players[id].x += data.dx * 5;
            players[id].y += data.dy * 5;
        }
    });

    ws.on('close', () => {
        delete players[id];
    });
});

// Broadcast game state 20 times per second
setInterval(() => {
    const packet = JSON.stringify({ type: 'state', players });

    wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(packet);
        }
    });
}, 50);
