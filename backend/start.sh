#!/bin/bash
echo "🚀 Starting Smart PR Backend..."
echo "📝 Configuration:"
echo "  - LLM Provider: $(grep LLM_PROVIDER .env | cut -d'=' -f2)"
echo "  - Port: 3001"
echo ""
echo "⚠️  Note: If Gemini API fails, will automatically use demo mode"
echo ""
node src/server.js

# Made with Bob
