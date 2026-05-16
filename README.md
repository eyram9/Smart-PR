# Smart PR - AI-Powered Pull Request Analyzer

An IBM Bob-powered bot that automatically analyzes GitHub pull requests in 15 seconds to detect security bugs, performance issues, testing gaps, and bad practices—replacing 30 minutes of manual review.

## 🎯 Hackathon Project

This project was built for the IBM Bob Hackathon to demonstrate how AI can accelerate code review and help developers learn from their mistakes.

## ✨ Features

- **🔒 Security Analysis**: Detects SQL injection, XSS, authentication issues, and data exposure
- **⚡ Performance Detection**: Identifies N+1 queries, memory leaks, and inefficient algorithms
- **📋 Best Practices**: Checks error handling, naming conventions, and code organization
- **🎓 Educational**: Explains WHY issues are problems and HOW to fix them
- **⚡ Fast**: Complete analysis in 10-20 seconds
- **🤖 AI-Powered**: Uses OpenAI GPT-4 or Anthropic Claude for intelligent analysis

## 🏗️ Architecture

```
┌─────────────┐      ┌──────────────┐      ┌─────────────┐
│   Frontend  │─────▶│   Backend    │─────▶│   GitHub    │
│  React + UI │      │  Node.js API │      │     API     │
└─────────────┘      └──────────────┘      └─────────────┘
                            │
                            ▼
                     ┌──────────────┐
                     │  LLM Service │
                     │ (GPT-4/Claude)│
                     └──────────────┘
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- GitHub Personal Access Token
- OpenAI API Key OR Anthropic API Key

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd Smart-PR
```

### 2. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Create .env file from template
cp .env.example .env

# Edit .env and add your API keys:
# - GITHUB_TOKEN (from https://github.com/settings/tokens)
# - OPENAI_API_KEY (from https://platform.openai.com/api-keys)
# OR
# - ANTHROPIC_API_KEY (from https://console.anthropic.com/)
```

**Required Environment Variables:**

```env
GITHUB_TOKEN=ghp_your_token_here
OPENAI_API_KEY=sk-your_key_here
LLM_PROVIDER=openai
PORT=3001
```

### 3. Frontend Setup

```bash
cd ../frontend

# Install dependencies
npm install
```

### 4. Run the Application

**Terminal 1 - Backend:**
```bash
cd backend
npm start
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

### 5. Access the Application

Open your browser to: `http://localhost:5173`

## 📖 Usage

1. **Enter a GitHub PR URL** in the input field (e.g., `https://github.com/owner/repo/pull/123`)
2. **Click "Analyze"** or press Enter
3. **Wait 10-20 seconds** for AI analysis
4. **Review findings** organized by:
   - Security vulnerabilities
   - Performance issues
   - Best practices violations
5. **Click any finding** to see:
   - Detailed explanation
   - Why it's a problem
   - Before/after code examples
   - Suggested fixes

## 🔑 Getting API Keys

### GitHub Token
1. Go to https://github.com/settings/tokens
2. Click "Generate new token (classic)"
3. Select scopes: `repo` (for private repos) or `public_repo` (for public only)
4. Copy the token to your `.env` file

### OpenAI API Key
1. Go to https://platform.openai.com/api-keys
2. Click "Create new secret key"
3. Copy the key to your `.env` file

### Anthropic API Key (Alternative)
1. Go to https://console.anthropic.com/
2. Create an API key
3. Copy the key to your `.env` file
4. Set `LLM_PROVIDER=anthropic` in `.env`

## 🛠️ Development

### Backend Structure
```
backend/
├── src/
│   ├── server.js              # Express app entry point
│   ├── config/
│   │   └── env.js             # Environment configuration
│   ├── services/
│   │   ├── github.service.js  # GitHub API integration
│   │   ├── llm.service.js     # OpenAI/Anthropic integration
│   │   └── analyzer.service.js # Main analysis orchestrator
│   ├── routes/
│   │   └── api.routes.js      # API endpoints
│   └── utils/
│       └── prompts.js         # LLM prompts for analysis
├── package.json
└── .env
```

### API Endpoints

**POST /api/analyze-pr**
```json
{
  "prUrl": "https://github.com/owner/repo/pull/123"
}
```

**GET /api/health**
```json
{
  "status": "ok",
  "services": {
    "github": true,
    "llm": true
  }
}
```

### Frontend Structure
```
frontend/
├── src/
│   ├── App.jsx        # Main application component
│   ├── main.jsx       # React entry point
│   └── index.css      # Tailwind CSS imports
├── package.json
└── vite.config.js
```

## 🧪 Testing

### Test with a Real PR

Try analyzing this sample PR:
```
https://github.com/facebook/react/pull/28000
```

Or use any public GitHub PR URL.

### Backend Health Check

```bash
curl http://localhost:3001/api/health
```

## 🎨 Tech Stack

### Frontend
- **React 19** - UI framework
- **Vite 8** - Build tool
- **Tailwind CSS 4** - Styling

### Backend
- **Node.js** - Runtime
- **Express** - Web framework
- **Octokit** - GitHub API client
- **OpenAI SDK** - GPT-4 integration
- **Anthropic SDK** - Claude integration

## 🤝 How IBM Bob Powers This

This project demonstrates IBM Bob's capabilities:

1. **Intent Understanding**: Bob understands the goal of analyzing PRs for quality issues
2. **Repository Context**: Bob reads and understands code changes in context
3. **Intelligent Analysis**: Bob identifies security, performance, and best practice issues
4. **Clear Explanations**: Bob explains problems in educational, actionable terms
5. **Fix Suggestions**: Bob provides before/after code examples

The LLM prompts in `backend/src/utils/prompts.js` are designed to make the AI act like IBM Bob, providing:
- Precise, actionable feedback
- Educational explanations (WHY it's a problem)
- Constructive suggestions (HOW to fix it)
- Prioritized findings by severity

## 📊 Performance

- **Analysis Time**: 10-20 seconds per PR
- **Accuracy**: High-quality findings using GPT-4 or Claude
- **Cost**: ~$0.01-0.05 per PR analysis (depending on PR size)

## 🐛 Troubleshooting

### "GitHub authentication failed"
- Check your `GITHUB_TOKEN` in `.env`
- Ensure the token has correct permissions
- Token must not be expired

### "OpenAI/Anthropic analysis failed"
- Verify your API key in `.env`
- Check you have API credits
- Ensure `LLM_PROVIDER` matches your chosen service

### "PR not found"
- Ensure the PR URL is correct
- Check you have access to the repository
- For private repos, token needs `repo` scope

### CORS errors
- Backend must be running on port 3001
- Frontend must be running on port 5173
- Check CORS configuration in `backend/src/server.js`

## 📝 License

MIT

## 🙏 Acknowledgments

Built with IBM Bob for the IBM Bob Hackathon 2024.

---

**Made with ❤️ and IBM Bob**