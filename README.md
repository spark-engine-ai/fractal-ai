# Fractal Engine - AI Cognitive Intelligence

![Fractal Engine Interface](./public/images/prev-1.png)

### AI-Powered Cognitive Intelligence Through Fractal Agent Processing

A recursive fractal-based AI engine that implements cognitive intelligence through layered agent processing. Built on the principles of fractal reasoning, this system creates emergent intelligence by decomposing complex tasks into specialized sub-agents that work collaboratively to provide comprehensive responses.

## 🚀 Features

- **🌀 Fractal AI Processing**: Recursive agent delegation up to 8 layers deep with 8 agents per layer
- **🧠 GPT-4o Integration**: Powered by OpenAI's most capable model with function calling
- **💬 Modern Chat Interface**: Clean, responsive interface with markdown rendering
- **📊 3D Fractal Visualization**: Interactive Three.js visualization of agent processing trees
- **📋 Real-time Console Logging**: Detailed execution logs showing fractal processing in action
- **🎯 Goal-oriented Sessions**: Set specific objectives for targeted AI assistance
- **⚡ Smart Processing**: Only activates fractal system for complex queries requiring delegation

## 🏗️ Architecture

The Fractal Engine implements a hierarchical reasoning system:

### Core Concepts:
- **Root Agent**: Single GPT-4o agent that decides when to delegate tasks
- **Fractal Delegation**: Complex tasks are broken into specialized subtasks
- **Layer Processing**: Each layer can further delegate or execute directly
- **Synthesis**: Results are synthesized back up the tree for comprehensive responses

### Parameters:
- **Depth (1-8)**: Maximum number of recursive delegation layers
- **Length (1-8)**: Maximum number of agents per layer when delegating
- **Total Agent Calculation**: Dynamically calculated based on actual task complexity

## 📋 Prerequisites

- Node.js 18.x or higher
- OpenAI API key with GPT-4o access

## 🛠️ Installation & Setup

### 1. Clone and Install
```bash
git clone <repository-url>
cd fractal-engine
npm install
```

### 2. Environment Configuration
Create a `.env` file in the root directory:
```env
OPENAI_API_KEY=your_openai_api_key_here
PORT=3000
```

### 3. Build Tailwind CSS
```bash
npm run build:css
```

### 4. Start the Server
```bash
# Development mode with auto-restart
npm run dev

# Production mode
npm start
```

### 5. Access the Application
Open your browser to `http://localhost:3000`

## 📖 Usage Guide

### Getting Started:
1. **Add your OpenAI API key** to the `.env` file
2. **Set your parameters**:
   - **Depth**: How many layers deep the fractal can go
   - **Length**: How many specialized agents can be created per layer
   - **Goal**: The overarching objective for your session

3. **Create a New Session** to initialize the AI system

4. **Start chatting** - simple queries get direct responses, complex ones trigger fractal processing

### Interface Tabs:
- **Chat**: Main conversation interface with markdown rendering
- **Console**: Detailed logs of fractal execution when triggered
- **3D View**: Interactive visualization of the agent processing tree

![Chat Interface](./public/images/prev-2.jpg)
*Clean chat interface with markdown rendering and real-time processing*

### Example Interaction Flow:
```
User: "Analyze the pros and cons of renewable energy"
  ↓
Root Agent: Determines this needs specialized analysis
  ↓
Delegates to 3 agents:
  • Economic Impact Specialist
  • Environmental Impact Analyst  
  • Technical Feasibility Expert
  ↓
Each agent provides detailed analysis
  ↓
Root Agent: Synthesizes all perspectives into comprehensive response
```

## 🔧 Configuration

### Agent Limits:
- **Maximum agents per session**: 4,100
- **Recommended starting values**: Depth 3, Length 3 (up to 13 agents)
- **Performance consideration**: Higher settings create exponentially more processing

### Fractal Processing:
- Only activates for complex queries requiring specialized analysis
- Simple queries receive direct responses for efficiency
- Agent count is dynamic based on actual task complexity

![Console Agent Layers](./public/images/prev-3.jpg)
*Console view showing detailed agent execution across fractal layers*

## 🎨 Technology Stack

- **Backend**: Node.js + Express.js
- **AI**: OpenAI GPT-4o with function calling
- **Frontend**: Vanilla JavaScript + Tailwind CSS
- **3D Visualization**: Three.js
- **Markdown**: Custom renderer with syntax highlighting
- **Security**: Helmet.js with CSP

## 📡 API Reference

### Create Session
```http
POST /api/session
Content-Type: application/json

{
  "goal": "General AI assistance"
}
```

### Process Query
```http
POST /api/query
Content-Type: application/json

{
  "sessionId": "uuid",
  "query": "Your question here",
  "depth": 3,
  "length": 3
}
```

## 🔬 Research & Development

This project is developed by **[Spark Engine](https://sparkengine.ai)**, an AI research company and R&D agency focused on:
- **Agentic AI Systems**
- **Chain-of-Thought (CoT) Reasoning**
- **Cognitive-based AI Research**

### Research Foundation:
The Fractal Engine is inspired by our research on **[Fractal-based Intelligence](https://sparkengine.ai/research/more/fractal-intelligence)**, exploring how recursive, self-similar patterns can enhance AI reasoning capabilities.

## 🌍 Community

**Join our Discord Community**: [https://discord.gg/bMuQ3mWQzc](https://discord.gg/bMuQ3mWQzc)

Connect with other researchers, developers, and AI enthusiasts working on cognitive AI systems, fractal reasoning, and agentic AI architectures.

## 🚀 Deployment

### Vercel (Recommended)
```bash
vercel
```

### Manual Deployment
1. Set environment variables on your hosting platform
2. Run `npm run build:css` 
3. Start with `npm start`
4. Ensure Node.js 18.x+ is available

## ⚠️ Performance & Cost Warnings

> **🚨 CRITICAL WARNING**: High depth/length settings can create **HUNDREDS or THOUSANDS** of agents in a single query, resulting in **EXTREMELY HIGH** OpenAI API costs and processing times. Always test with low values first!

### Cost & Performance Impact:
- **Exponential scaling**: Agent count = Length^Depth per layer
- **Example costs**:
  - Depth 3, Length 3: ~13 agents (safe)
  - Depth 5, Length 5: ~781 agents (expensive)
  - Depth 8, Length 8: ~19,173,961 agents (💸 BANKRUPTCY RISK!)
- **API costs**: Each agent = 1 OpenAI API call (potentially $0.01-0.30+ per agent)
- **Processing time**: Higher complexity can take minutes to complete
- **Memory usage**: Large fractal trees consume significant system resources

### Safe Usage Recommendations:
- **Start small**: Begin with Depth 2-3, Length 2-3
- **Monitor costs**: Check your OpenAI usage dashboard regularly  
- **Test incrementally**: Gradually increase parameters while monitoring performance
- **Set API limits**: Configure spending limits in your OpenAI account
- **Production usage**: Consider implementing cost controls and user limits

## 📄 License

MIT License - See LICENSE file for details

## 🤝 Contributing

We welcome contributions! Please see our contributing guidelines and join our Discord community to discuss ideas and collaborate on advancing fractal-based AI research.

---

**Built with ❤️ by [Spark Engine](https://sparkengine.ai)**  
*Advancing the frontiers of cognitive AI through fractal reasoning*
