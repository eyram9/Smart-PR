/**
 * Specialized prompts for AI-powered PR analysis
 * These prompts guide the LLM to act like IBM Bob analyzing code
 */

export const SYSTEM_PROMPT = `You are an expert code reviewer powered by IBM Bob, analyzing pull requests for security vulnerabilities, performance issues, and best practices violations.

Your analysis should be:
- Precise and actionable
- Educational (explain WHY something is a problem)
- Constructive (provide specific fix suggestions)
- Prioritized by severity/impact

Focus on:
1. Security vulnerabilities (SQL injection, XSS, auth issues, data exposure)
2. Performance problems (N+1 queries, memory leaks, inefficient algorithms)
3. Best practices violations (error handling, naming, code organization)
4. Testing gaps (missing tests, poor coverage)

For each finding, provide:
- Severity/Impact level (high/medium/low)
- Clear title
- Detailed explanation of the issue
- Specific file and line number
- Before/after code examples for fixes`;

export const ANALYSIS_PROMPT = (prData) => `Analyze this pull request and identify issues:

**PR Title:** ${prData.title}
**Author:** ${prData.author}
**Branch:** ${prData.branch}
**Files Changed:** ${prData.filesChanged}

**Code Changes:**
\`\`\`diff
${prData.diff}
\`\`\`

Provide your analysis in the following JSON format:
{
  "qualityScore": <number 0-100>,
  "securityFindings": [
    {
      "severity": "high|medium|low",
      "title": "Brief title",
      "file": "path/to/file.js",
      "line": <line_number>,
      "description": "Detailed explanation",
      "fixSuggestion": {
        "before": "code snippet",
        "after": "fixed code snippet"
      }
    }
  ],
  "performanceFindings": [
    {
      "impact": "high|medium|low",
      "title": "Brief title",
      "file": "path/to/file.js",
      "line": <line_number>,
      "description": "Detailed explanation",
      "fixSuggestion": {
        "before": "code snippet",
        "after": "fixed code snippet"
      }
    }
  ],
  "bestPractices": [
    {
      "severity": "high|medium|low",
      "title": "Brief title",
      "file": "path/to/file.js",
      "line": <line_number>,
      "description": "Detailed explanation"
    }
  ],
  "summary": "Overall assessment of the PR quality"
}

Return ONLY valid JSON, no additional text.`;

export const QUALITY_SCORE_FACTORS = {
  security: {
    high: -15,
    medium: -8,
    low: -3,
  },
  performance: {
    high: -12,
    medium: -6,
    low: -2,
  },
  bestPractices: {
    high: -8,
    medium: -4,
    low: -1,
  },
};

/**
 * Calculate quality score based on findings
 */
export function calculateQualityScore(findings) {
  let score = 100;

  // Deduct points for security findings
  findings.securityFindings?.forEach((finding) => {
    score += QUALITY_SCORE_FACTORS.security[finding.severity] || 0;
  });

  // Deduct points for performance findings
  findings.performanceFindings?.forEach((finding) => {
    score += QUALITY_SCORE_FACTORS.performance[finding.impact] || 0;
  });

  // Deduct points for best practices violations
  findings.bestPractices?.forEach((finding) => {
    score += QUALITY_SCORE_FACTORS.bestPractices[finding.severity] || 0;
  });

  return Math.max(0, Math.min(100, score));
}

// Made with Bob
