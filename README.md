# ALTxi - The Alternate Reality Tactical Simulator

## 🏆 Project Overview
ALTxi is a live tactical football simulation platform that bridges the gap between real-world sports data and interactive AI-driven narratives. By aggregating live match events and merging them with user-defined tactical configurations, ALTxi allows fans to "coach" a real team and observe how their unique tactical decisions would dynamically alter the course of an ongoing live match.

## 🌟 What It Does
ALTxi transforms passive sports viewership into an active, strategic experience:
- **Live Match Synchronization**: Connects to real-world live matches in real-time.
- **Pre-Match Tactical Setup**: Users configure their Formation, Mentality, Build-Up Play, Defensive Line, and Tempo before kickoff.
- **Alternate Reality Engine**: Every 10 minutes, raw real-world match events are aggregated and fed into a Large Language Model (OpenAI GPT-4o) alongside the user's tactical instructions. 
- **Cinematic & Visual Feedback**: The AI generates a dynamic, cinematic narrative critiquing the team's performance based heavily on the user's chosen tactics. It simultaneously outputs structured spatial data to drive real-time 2D animations on the browser's tactical pitch.

## 🏗️ How We Built It

ALTxi is built on a decoupled, highly scalable architecture optimized for real-time data streaming:

### Frontend
- **Tech Stack**: Vanilla JavaScript, HTML5, and CSS3.
- **Architecture**: Designed for maximum performance without framework overhead. Utilizes **Server-Sent Events (SSE)** to consume real-time narrative streams without polling.
- **Visualization**: Features a custom HTML5 `<canvas>` API implementation for the interactive 2D pitch, reacting dynamically to AI-structured coordinate data.

### Backend Orchestration
- **Tech Stack**: Node.js and Express.
- **Data Ingestion**: Maintains secure, stateful SSE connections to the **TxLINE Live Football WebSockets**, buffering real-time match events into chronological 10-minute batches.
- **Data Enrichment**: Integrates with the **API-Football** database to retrieve verified Starting XIs and official team rosters.
- **AI Processing**: Interfaces securely with the **OpenAI API**, prompting GPT-4o to act as an elite football tactician and translate raw JSON event data into compelling sports journalism and visualization coordinates.

## 💡 Innovation & Challenges
- **Real-Time AI Synchronization**: One of the core challenges was ensuring the LLM could process unpredictable live sports data without breaking the JSON schema required by the frontend canvas. We implemented robust error-handling and prompt-engineering to guarantee structural integrity.
- **Stateful Live Streaming**: Bridging the TxLINE WebSockets with our own frontend SSE tunnel required careful memory management on the Node.js server to prevent memory leaks during 90+ minute matches.

## 🚀 Future Roadmap
- **Multiplayer "Head-to-Head"**: Allowing two users to set competing tactics for opposing teams in the same live match.
- **Blockchain Integration**: Full deployment of the Web3 wallet profiles to mint successful tactical gameplans as verifiable digital assets.
- **Expanded Sports**: Adapting the Alternate Reality Engine to ingest live data from basketball and American football.

## 🎮 How to Play
1. **Connect your wallet** on the landing page (a simulated profile will be created).
2. **Select a match** from the Live & Upcoming Fixtures board.
3. **Lock in your Game Plan** by configuring your Formation, Mentality, and specific player roles.
4. **Enter the Simulation Engine** and wait for kickoff.
5. **Watch the alternate reality unfold** via the live pitch canvas and AI terminal!
