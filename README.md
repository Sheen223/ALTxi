# ALTxi - The Alternate Reality Tactical Simulator

## Overview
**ALTxi** is a live tactical football simulation platform that bridges the gap between real-world sports data and interactive AI-driven narratives. By aggregating live match events and merging them with user-defined tactical configurations, ALTxi allows fans to "coach" a real team and observe how their unique tactical decisions dynamically alter the course of an ongoing live match.

---

## Table of Contents
- [Project Architecture](#project-architecture)
- [Backend Orchestration](#backend-orchestration)
- [Frontend Development](#frontend-development)
- [Core Features](#core-features)
- [Data Ingestion Flow](#data-ingestion-flow)
- [Deployment Instructions](#deployment-instructions)
- [Testing Guide](#testing-guide)
- [Troubleshooting](#troubleshooting)
- [Hackathon Submission](#hackathon-submission)

---

## Project Architecture

### Tech Stack
| Component | Technology |
| :--- | :--- |
| **Frontend UI** | Vanilla JavaScript, HTML5, CSS3 |
| **Graphics Engine**| Custom HTML5 `<canvas>` API |
| **Backend API** | Node.js + Express |
| **Data Streaming** | Server-Sent Events (SSE) |
| **Live Sports Data**| TxLINE Live WebSockets |
| **Team Rosters** | API-Football |
| **AI Narrative Engine**| OpenAI GPT-4o API |

### Folder Structure
```text
ALTxi/
├── backend/                 # AI Orchestration & Data Streaming
│   ├── index.js             # Express API Entry Point
│   ├── services/
│   │   ├── txlineStream.js  # WebSocket Listener for Live Matches
│   │   ├── footballApi.js   # Starting XI & Roster Fetcher
│   │   └── llmService.js    # OpenAI GPT-4o Prompting Engine
│   └── utils/
├── frontend/                # Interactive Tactical Dashboard
│   ├── css/
│   │   └── styles.css       # Custom styling (No Frameworks)
│   ├── js/
│   │   ├── canvasEngine.js  # 2D Pitch Renderer
│   │   ├── sseClient.js     # Real-time Stream Consumer
│   │   └── app.js           # Core Game Logic
│   └── index.html
├── package.json
└── README.md
```

---

## Backend Orchestration

The Node.js backend serves as the "brain" of ALTxi, maintaining stateful streams and orchestrating the AI.

### Key Responsibilities
1. **TxLINE Ingestion**: Maintains secure, stateful WebSocket connections to the **TxLINE** live sports feed, buffering real-time match events (passes, shots, fouls) into chronological 10-minute batches.
2. **Context Enrichment**: Integrates with **API-Football** to retrieve verified Starting XIs, ensuring the AI agent knows exactly which players are on the pitch.
3. **The Alternate Reality Engine**: Interfaces with the **OpenAI API**, prompting GPT-4o to act as an elite football tactician. It merges the raw 10-minute event batches with the user's custom tactics to generate compelling sports journalism and coordinate data.

---

## Frontend Development

Built entirely with Vanilla JavaScript to ensure maximum performance and zero framework overhead during live data streaming.

### Running Development Server
```bash
# Clone repository
git clone https://github.com/YOUR_USERNAME/ALTxi.git
cd ALTxi

# Start Backend Server
cd backend
npm install
node index.js

# Start Frontend (Use Live Server or any static host)
cd ../frontend
npx serve .
```

---

## Core Features

### 1. Pre-Match Tactical Setup
Users act as the head coach before kickoff. They configure:
- **Formation** (e.g., 4-3-3, 4-2-3-1)
- **Mentality** (Attacking, Defensive, Possession)
- **Build-Up Play & Tempo**
- **Defensive Line Depth**

### 2. Live Match Synchronization
The platform synchronizes with the real-world clock. As the actual match is played, the dashboard reflects live developments.

### 3. Dynamic Cinematic Narrative
Every 10 minutes, the AI generates a cinematic narrative critiquing the team's performance. If a user chose an "Attacking" mentality but the real-world team is being dominated, the AI narrative will dynamically explore how the user's aggressive tactics are leaving them vulnerable to counter-attacks.

### 4. Real-time 2D Pitch Visualization
The AI outputs structured spatial coordinate data alongside its narrative. The custom HTML5 `<canvas>` engine parses this data to animate players on a 2D pitch, visualizing the alternate reality tactical shifts.

---

## Data Ingestion Flow

1. **Real Match Kicks Off**: TxLINE WebSocket begins streaming raw JSON match events to the Node.js backend.
2. **Buffer & Batch**: Node.js buffers 10 minutes of real-world events.
3. **AI Injection**: The batch, plus the user's tactical settings, are sent to GPT-4o.
4. **SSE Broadcast**: GPT-4o returns a parsed narrative and spatial coordinates. The backend streams this payload down to the frontend via Server-Sent Events (SSE).
5. **Render**: The HTML5 Canvas animates the play, and the terminal displays the tactical critique.

---

## Deployment Instructions

### Deploying the Backend (Render/Heroku)
1. Set up environment variables: `OPENAI_API_KEY`, `TXLINE_TOKEN`, `API_FOOTBALL_KEY`.
2. Ensure the host supports long-lived HTTP connections for SSE.
3. Deploy the Express server.

### Deploying the Frontend (Vercel/Netlify)
1. Update the `BACKEND_URL` in `sseClient.js` to point to your live backend.
2. Drag and drop the `frontend` folder to Netlify, or deploy via Vercel.

---

## Testing Guide

### Prerequisites
- Active API keys for OpenAI and TxLINE.
- Node.js installed locally.

### Test Flow
1. Start the Node.js backend.
2. Open the frontend in a browser.
3. Use the **Simulate Match** button (if no live matches are currently playing) to stream a pre-recorded TxLINE payload.
4. Set your tactics and watch the Canvas engine react to the AI's SSE stream!

---

## Troubleshooting

| Error | Cause | Solution |
| :--- | :--- | :--- |
| **"SSE Stream Disconnected"** | Timeout / Memory Leak | Ensure Node.js is actively managing stale connections and your host allows streams > 30s. |
| **"Canvas Not Rendering"** | Malformed JSON from AI | The LLM broke the strict JSON schema. Implemented retry logic in `llmService.js` prevents this. |
| **"No Live Matches Found"** | TxLINE markets closed | Use the mock simulation mode to test the UI during off-hours. |

---

## Hackathon Submission

| Field | Value |
| :--- | :--- |
| **Project Name** | ALTxi |
| **Category** | Sports Tech & AI |
| **GitHub Repository** | *Pending...* |
| **Live Demo URL** | [Watch on YouTube](https://youtu.be/HnbuebCFZDQ?si=OJHsioQkjQpy_KtR) |

---

## Future Roadmap

- **Multiplayer "Head-to-Head"**: Allowing two users to set competing tactics for opposing teams in the same live match.
- **Blockchain Integration**: Minting successful tactical gameplans as verifiable digital assets (NFTs).
- **Expanded Sports**: Adapting the Alternate Reality Engine to ingest live data from basketball and American football.

---
*Built for the Sports & AI Innovation Hackathon*
