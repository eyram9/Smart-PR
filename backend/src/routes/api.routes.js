import express from 'express';
import analyzerService from '../services/analyzer.service.js';

const router = express.Router();

/**
 * POST /api/analyze-pr
 * Analyze a GitHub pull request
 */
router.post('/analyze-pr', async (req, res) => {
  try {
    const { prUrl } = req.body;

    // Validate input
    if (!prUrl) {
      return res.status(400).json({
        error: 'Missing required field: prUrl',
        example: {
          prUrl: 'https://github.com/owner/repo/pull/123',
        },
      });
    }

    // Validate URL format
    if (!prUrl.includes('github.com') || !prUrl.includes('/pull/')) {
      return res.status(400).json({
        error: 'Invalid GitHub PR URL format',
        expected: 'https://github.com/owner/repo/pull/123',
      });
    }

    console.log(`Received analysis request for: ${prUrl}`);

    // Perform analysis
    const result = await analyzerService.analyzePR(prUrl);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Analysis error:', error);

    // Determine appropriate status code
    let statusCode = 500;
    if (error.message.includes('not found')) statusCode = 404;
    if (error.message.includes('authentication')) statusCode = 401;
    if (error.message.includes('Invalid')) statusCode = 400;

    res.status(statusCode).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/health
 * Health check endpoint
 */
router.get('/health', async (req, res) => {
  try {
    const health = await analyzerService.getHealth();
    res.json(health);
  } catch (error) {
    res.status(500).json({
      status: 'error',
      error: error.message,
    });
  }
});

/**
 * GET /api/
 * API info endpoint
 */
router.get('/', (req, res) => {
  res.json({
    name: 'Smart PR Analyzer API',
    version: '1.0.0',
    description: 'AI-powered PR analysis using IBM Bob principles',
    endpoints: {
      'POST /api/analyze-pr': 'Analyze a GitHub pull request',
      'GET /api/health': 'Check API health status',
    },
    example: {
      method: 'POST',
      url: '/api/analyze-pr',
      body: {
        prUrl: 'https://github.com/owner/repo/pull/123',
      },
    },
  });
});

export default router;

// Made with Bob
