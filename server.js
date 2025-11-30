const express = require('express');
const WebSocket = require('ws');
const app = express();

app.use(express.static('public'));
const server = app.listen(3000, () => console.log('Server running on http://localhost:3000'));

const wss = new WebSocket.Server({ server });

wss.on('connection', (ws) => {
    console.log('Client connected');
    ws.send(JSON.stringify({ type: 'info', message: 'Welcome to the Server' }));
});
