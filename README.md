# 🎮 Coin Collector Multiplayer (Krafton Assignment)

A real-time multiplayer coin-collection game built using **raw WebSockets**, **server-authoritative logic**, **client-side prediction**, **server reconciliation**, **entity interpolation**, and **network degradation simulation** (latency + packet loss).

This project was built specifically to satisfy and exceed all requirements of the **Krafton Associate Game Developer Assignment**.

---

# ▶️ How to Run the Project

**1. Install dependencies**
```bash
npm install
```

**2. Start the server**
```
node server.js
```

**3. Open two browser tabs**
```
http://localhost:3000
```

**4. Move using Arrow Keys (in your keyboard)**
```
(↑ ↓ ← →)
```

---
# 🚀 Features

### ✅ **1. Server-Authoritative Architecture**
- Server holds the true state of all players & coins.
- Clients send only inputs (no position hacks).
- Server validates coin collisions & scoring.

### ✅ **2. Artificial Network Degradation**
Simulates real-world unstable networks:
- **200ms upstream delay**
- **200ms downstream delay**
- **5% packet loss simulation**

### ✅ **3. Entity Interpolation**
Remote players appear smooth even under:
- High latency  
- Packet delay  
- Packet loss  
- Irregular update arrival  

Interpolation uses: to replay world state *in the past* using snapshot pairs.

### ✅ **4. Client-Side Prediction (Local Player)**
Local movement feels **instant** even with heavy lag.

### ✅ **5. Server Reconciliation**
The client:
1. Predicts instantly  
2. Sends input with sequence number  
3. Receives authoritative state  
4. Re-applies pending inputs  

Eliminates rubber-banding and keeps prediction accurate.

### ✅ **6. Packet Loss Recovery**
Interpolation + reconciliation allow the game to remain smooth even when server drops packets.

### ✅ **7. Debug Overlay (Top-Left)**
Shows real networking metrics:
- Ping / RTT  
- Snapshot buffer size  
- Pending inputs  
- Packets received  
- Estimated packet loss  
- Local predicted position  

### ✅ **8. Snapshot Timeline Graph (Top-Right)**
Visual debugging tool:
- Blue bars = incoming snapshots  
- Red line = renderTime pointer  
- Helps visualize interpolation & network jitter  

### ✅ **9. Smooth, Deterministic Server Tick**
Server sends authoritative game snapshots at **20Hz** (50ms tick).

---

# 🏗️ Architecture


## Server Responsibilities
- Tracks all players
- Tracks coins
- Handles movement
- Handles collisions
- Updates scores
- Broadcasts snapshots with timestamps

## Client Responsibilities
- Sends inputs
- Predicts local movement
- Receives delayed state
- Interpolates remote players smoothly
- Reconciles authoritative state

---
