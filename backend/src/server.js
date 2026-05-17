import express from 'express';
import cors from 'cors';
import { config, validateConfig } from './config/env.js';
import apiRoutes from './routes/api.routes.js';

// Validate configuration on startup
try {
  validateConfig();
  console.log('✓ Configuration validated');
} catch (error) {
  console.error('✗ Configuration error:', error.message);
  console.error('\nPlease check your .env file. See .env.example for reference.');
  process.exit(1);
}

// Create Express app
const app = express();

// Middleware
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  process.env.FRONTEND_URL,
  'https://smart-pr-front.vercel.app'
  // Add your Vercel URL here
].filter(Boolean);

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Routes
app.use('/api', apiRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'Smart PR Analyzer',
    description: 'AI-powered PR analysis using IBM Bob principles',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      api: '/api',
      health: '/api/health',
      analyzePR: 'POST /api/analyze-pr',
    },
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Cannot ${req.method} ${req.path}`,
    availableEndpoints: {
      api: '/api',
      health: '/api/health',
      analyzePR: 'POST /api/analyze-pr',
    },
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: config.nodeEnv === 'development' ? err.message : 'Something went wrong',
  });
});

// Start server
const PORT = config.port;
app.listen(PORT, () => {
  console.log('\n🚀 Smart PR Analyzer Backend');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`✓ Server running on http://localhost:${PORT}`);
  console.log(`✓ Environment: ${config.nodeEnv}`);
  console.log(`✓ LLM Provider: ${config.llm.provider}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('\nEndpoints:');
  console.log(`  GET  http://localhost:${PORT}/api`);
  console.log(`  GET  http://localhost:${PORT}/api/health`);
  console.log(`  POST http://localhost:${PORT}/api/analyze-pr`);
  console.log('\nReady to analyze PRs! 🎯\n');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('\nReceived SIGTERM, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('\nReceived SIGINT, shutting down gracefully...');
  process.exit(0);
});

// Made with Bob
