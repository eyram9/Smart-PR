# Smart PR Backend

Node.js backend API for AI-powered GitHub PR analysis.

## Quick Start

```bash
# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your API keys

# Start server
npm start

# Development mode (auto-reload)
npm run dev
```

## Environment Variables

Required variables in `.env`:

```env
# GitHub API
GITHUB_TOKEN=ghp_xxxxxxxxxxxxx

# LLM Provider (choose one)
LLM_PROVIDER=openai
OPENAI_API_KEY=sk-xxxxxxxxxxxxx

# OR
LLM_PROVIDER=anthropic
ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxx

# Server
PORT=3001
NODE_ENV=development
```

## API Endpoints

### POST /api/analyze-pr

Analyze a GitHub pull request.

**Request:**
```json
{
  "prUrl": "https://github.com/owner/repo/pull/123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "title": "feat: Add authentication",
    "author": "username",
    "branch": "feature/auth",
    "status": "In Review",
    "qualityScore": 87,
    "securityFindings": [...],
    "performanceFindings": [...],
    "timestamp": "2 hours ago",
    "analysisTime": "12.3s"
  }
}
```

### GET /api/health

Check API health status.

**Response:**
```json
{
  "status": "ok",
  "services": {
    "github": true,
    "llm": true
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## Architecture

### Services

**github.service.js**
- Fetches PR data from GitHub API
- Parses PR URLs
- Retrieves diffs and metadata

**llm.service.js**
- Integrates with OpenAI or Anthropic
- Sends code for analysis
- Parses AI responses

**analyzer.service.js**
- Orchestrates GitHub + LLM services
- Combines results
- Calculates quality scores

### Prompts

The `utils/prompts.js` file contains specialized prompts that make the LLM act like IBM Bob:

- **SYSTEM_PROMPT**: Defines Bob's role as an expert code reviewer
- **ANALYSIS_PROMPT**: Structures the analysis request
- **Quality Score Calculation**: Deducts points based on finding severity

## Error Handling

The API returns appropriate HTTP status codes:

- `200` - Success
- `400` - Invalid request (bad PR URL)
- `401` - Authentication failed (invalid GitHub token)
- `404` - PR not found
- `500` - Internal server error

## Performance

- Average analysis time: 10-20 seconds
- Diff size limit: 8000 characters (truncated for LLM)
- Concurrent requests: Supported

## Development

### Adding New Analysis Types

1. Update `utils/prompts.js` with new finding types
2. Modify `llm.service.js` to parse new findings
3. Update frontend to display new findings

### Switching LLM Providers

Change `LLM_PROVIDER` in `.env`:
- `openai` - Uses GPT-4 Turbo
- `anthropic` - Uses Claude 3.5 Sonnet

## Troubleshooting

**"Configuration errors"**
- Check all required env vars are set
- Verify API keys are valid

**"GitHub authentication failed"**
- Generate new token at https://github.com/settings/tokens
- Ensure token has `repo` or `public_repo` scope

**"LLM analysis failed"**
- Check API key is valid
- Verify you have API credits
- Check API service status

## Testing

Test the health endpoint:
```bash
curl http://localhost:3001/api/health
```

Test PR analysis:
```bash
curl -X POST http://localhost:3001/api/analyze-pr \
  -H "Content-Type: application/json" \
  -d '{"prUrl":"https://github.com/facebook/react/pull/28000"}'