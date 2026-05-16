import { Octokit } from '@octokit/rest';
import { config } from '../config/env.js';

/**
 * GitHub API service for fetching PR data
 */
class GitHubService {
  constructor() {
    this.octokit = new Octokit({
      auth: config.github.token,
    });
  }

  /**
   * Parse GitHub PR URL to extract owner, repo, and PR number
   * @param {string} prUrl - Full GitHub PR URL
   * @returns {Object} { owner, repo, pull_number }
   */
  parsePRUrl(prUrl) {
    const regex = /github\.com\/([^\/]+)\/([^\/]+)\/pull\/(\d+)/;
    const match = prUrl.match(regex);

    if (!match) {
      throw new Error('Invalid GitHub PR URL format. Expected: https://github.com/owner/repo/pull/123');
    }

    return {
      owner: match[1],
      repo: match[2],
      pull_number: parseInt(match[3], 10),
    };
  }

  /**
   * Fetch PR metadata and diff
   * @param {string} prUrl - GitHub PR URL
   * @returns {Promise<Object>} PR data with diff
   */
  async fetchPRData(prUrl) {
    try {
      const { owner, repo, pull_number } = this.parsePRUrl(prUrl);

      // Fetch PR details
      const { data: pr } = await this.octokit.pulls.get({
        owner,
        repo,
        pull_number,
      });

      // Fetch PR files
      const { data: files } = await this.octokit.pulls.listFiles({
        owner,
        repo,
        pull_number,
      });

      // Fetch PR diff
      const { data: diff } = await this.octokit.pulls.get({
        owner,
        repo,
        pull_number,
        mediaType: {
          format: 'diff',
        },
      });

      // Count reviewers and comments
      const { data: reviews } = await this.octokit.pulls.listReviews({
        owner,
        repo,
        pull_number,
      });

      const { data: comments } = await this.octokit.issues.listComments({
        owner,
        repo,
        issue_number: pull_number,
      });

      return {
        title: pr.title,
        author: pr.user.login,
        branch: pr.head.ref,
        status: pr.state === 'open' ? 'In Review' : pr.merged ? 'Merged' : 'Closed',
        filesChanged: files.length,
        additions: pr.additions,
        deletions: pr.deletions,
        reviewers: new Set(reviews.map(r => r.user.login)).size,
        comments: comments.length,
        diff: typeof diff === 'string' ? diff : '',
        files: files.map(f => ({
          filename: f.filename,
          status: f.status,
          additions: f.additions,
          deletions: f.deletions,
          patch: f.patch || '',
        })),
        createdAt: pr.created_at,
        updatedAt: pr.updated_at,
      };
    } catch (error) {
      if (error.status === 404) {
        throw new Error('PR not found. Check the URL and ensure you have access to the repository.');
      }
      if (error.status === 401) {
        throw new Error('GitHub authentication failed. Check your GITHUB_TOKEN.');
      }
      throw new Error(`Failed to fetch PR data: ${error.message}`);
    }
  }

  /**
   * Get a simplified diff for analysis (limit size for LLM)
   * @param {Object} prData - PR data from fetchPRData
   * @param {number} maxLength - Maximum diff length
   * @returns {string} Truncated diff
   */
  getAnalysisDiff(prData, maxLength = 8000) {
    let diff = prData.diff;

    if (diff.length > maxLength) {
      // Prioritize showing the most important files
      const importantFiles = prData.files
        .filter(f => !f.filename.includes('test') && !f.filename.includes('spec'))
        .slice(0, 5);

      diff = importantFiles
        .map(f => `diff --git a/${f.filename} b/${f.filename}\n${f.patch || ''}`)
        .join('\n\n')
        .slice(0, maxLength);

      diff += '\n\n... (diff truncated for analysis)';
    }

    return diff;
  }
}

export default new GitHubService();

// Made with Bob
