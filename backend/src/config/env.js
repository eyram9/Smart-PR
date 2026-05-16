import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: process.env.PORT || 3001,
  nodeEnv: process.env.NODE_ENV || 'development',
  github: {
    token: process.env.GITHUB_TOKEN,
  },
  llm: {
    provider: process.env.LLM_PROVIDER || 'openai',
    openai: {
      apiKey: process.env.OPENAI_API_KEY,
    },
    anthropic: {
      apiKey: process.env.ANTHROPIC_API_KEY,
    },
    gemini: {
      apiKey: process.env.GEMINI_API_KEY,
    },
  },
};

// Validate required environment variables
export function validateConfig() {
  const errors = [];

  if (!config.github.token) {
    errors.push('GITHUB_TOKEN is required');
  }

  if (config.llm.provider === 'openai' && !config.llm.openai.apiKey) {
    errors.push('OPENAI_API_KEY is required when using OpenAI provider');
  }

  if (config.llm.provider === 'anthropic' && !config.llm.anthropic.apiKey) {
    errors.push('ANTHROPIC_API_KEY is required when using Anthropic provider');
  }

  if (config.llm.provider === 'gemini' && !config.llm.gemini.apiKey) {
    errors.push('GEMINI_API_KEY is required when using Gemini provider');
  }

  if (errors.length > 0) {
    throw new Error(`Configuration errors:\n${errors.join('\n')}`);
  }
}

// Made with Bob
