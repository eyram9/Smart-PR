/**
 * Mock analysis service for demo/testing without API keys
 * Simulates AI analysis results
 */

export function generateMockAnalysis(prData) {
  // Simulate realistic findings based on PR data
  const findings = {
    qualityScore: Math.floor(Math.random() * 20) + 75, // 75-95
    
    securityFindings: [
      {
        id: 1,
        severity: 'high',
        title: 'Potential SQL Injection Vulnerability',
        file: prData.files?.[0]?.filename || 'src/database/queries.js',
        line: 45,
        description: 'User input is directly concatenated into SQL query without proper sanitization or parameterization. This allows attackers to inject malicious SQL commands.',
        fixSuggestion: {
          before: `const query = "SELECT * FROM users WHERE id = '" + userId + "'";
db.execute(query);`,
          after: `const query = "SELECT * FROM users WHERE id = ?";
db.execute(query, [userId]);`
        }
      },
      {
        id: 2,
        severity: 'medium',
        title: 'Weak Password Hashing Algorithm',
        file: prData.files?.[1]?.filename || 'src/auth/password.js',
        line: 23,
        description: 'Using MD5 for password hashing is cryptographically weak. Modern attacks can crack MD5 hashes quickly. Use bcrypt, Argon2, or scrypt instead.',
        fixSuggestion: {
          before: `const hash = crypto.createHash('md5')
  .update(password)
  .digest('hex');`,
          after: `import bcrypt from 'bcrypt';
const hash = await bcrypt.hash(password, 10);`
        }
      },
      {
        id: 3,
        severity: 'low',
        title: 'Missing Rate Limiting on Authentication Endpoint',
        file: prData.files?.[2]?.filename || 'src/api/routes.js',
        line: 12,
        description: 'Login endpoint lacks rate limiting, making it vulnerable to brute force attacks. Implement rate limiting to prevent credential stuffing.',
        fixSuggestion: {
          before: `app.post('/login', async (req, res) => {
  // Login logic
});`,
          after: `import rateLimit from 'express-rate-limit';

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5
});

app.post('/login', loginLimiter, async (req, res) => {
  // Login logic
});`
        }
      }
    ],

    performanceFindings: [
      {
        id: 1,
        impact: 'high',
        title: 'N+1 Query Problem Detected',
        file: prData.files?.[0]?.filename || 'src/models/user.js',
        line: 78,
        description: 'Multiple database queries are executed in a loop, causing the N+1 problem. Each iteration makes a separate database call, resulting in poor performance with large datasets.',
        fixSuggestion: {
          before: `users.forEach(user => {
  const posts = db.query(
    'SELECT * FROM posts WHERE user_id = ?',
    [user.id]
  );
  user.posts = posts;
});`,
          after: `const userIds = users.map(u => u.id);
const posts = db.query(
  'SELECT * FROM posts WHERE user_id IN (?)',
  [userIds]
);

users.forEach(user => {
  user.posts = posts.filter(p => p.user_id === user.id);
});`
        }
      },
      {
        id: 2,
        impact: 'medium',
        title: 'Large Bundle Size from Full Library Import',
        file: prData.files?.[1]?.filename || 'src/components/Dashboard.jsx',
        line: 5,
        description: 'Importing the entire lodash library increases bundle size significantly. Use specific imports to reduce bundle size and improve load times.',
        fixSuggestion: {
          before: `import _ from 'lodash';

const result = _.map(items, item => item.value);`,
          after: `import map from 'lodash/map';

const result = map(items, item => item.value);`
        }
      },
      {
        id: 3,
        impact: 'low',
        title: 'Unoptimized Image Assets',
        file: 'src/assets/hero.png',
        line: 0,
        description: 'Image file size is 2.4MB which is too large for web delivery. Consider compression and modern formats like WebP for better performance.',
        fixSuggestion: {
          before: `<img src="/assets/hero.png" alt="Hero" />`,
          after: `<picture>
  <source srcset="/assets/hero.webp" type="image/webp" />
  <img src="/assets/hero-compressed.png" alt="Hero" />
</picture>`
        }
      }
    ],

    bestPractices: [
      {
        severity: 'medium',
        title: 'Missing Error Handling in Async Function',
        file: prData.files?.[0]?.filename || 'src/api/handlers.js',
        line: 34,
        description: 'Async function lacks try-catch block, which can cause unhandled promise rejections and crash the application.'
      },
      {
        severity: 'low',
        title: 'Inconsistent Naming Convention',
        file: prData.files?.[1]?.filename || 'src/utils/helpers.js',
        line: 12,
        description: 'Function uses snake_case instead of camelCase, which is inconsistent with JavaScript conventions.'
      }
    ],

    summary: `This PR introduces ${prData.filesChanged} file changes with ${prData.additions} additions and ${prData.deletions} deletions. The code quality is generally good, but there are some security concerns that should be addressed before merging. The N+1 query problem could cause performance issues at scale. Overall, the implementation follows most best practices but needs attention to security vulnerabilities.`
  };

  return findings;
}

export default { generateMockAnalysis };

// Made with Bob
