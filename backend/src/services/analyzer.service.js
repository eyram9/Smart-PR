import githubService from './github.service.js';
import llmService from './llm.service.js';
import { generateMockAnalysis } from './mock-analysis.service.js';
import { config } from '../config/env.js';

/**
 * Main PR analyzer service that coordinates GitHub and LLM services
 */
class AnalyzerService {
  /**
   * Analyze a GitHub PR
   * @param {string} prUrl - GitHub PR URL
   * @returns {Promise<Object>} Complete analysis results
   */
  async analyzePR(prUrl) {
    console.log(`Starting analysis for PR: ${prUrl}`);
    const startTime = Date.now();

    try {
      // Step 1: Fetch PR data from GitHub
      console.log('Fetching PR data from GitHub...');
      const prData = await githubService.fetchPRData(prUrl);
      console.log(`Fetched PR: ${prData.title} by ${prData.author}`);

      // Step 2: Prepare diff for analysis (limit size for LLM)
      const analysisDiff = githubService.getAnalysisDiff(prData);
      console.log(`Diff size: ${analysisDiff.length} characters`);

      // Step 3: Analyze with LLM (with fallback to mock)
      console.log('Analyzing code with AI...');
      let analysis;
      
      try {
        analysis = await llmService.analyzePR({
          title: prData.title,
          author: prData.author,
          branch: prData.branch,
          filesChanged: prData.filesChanged,
          diff: analysisDiff,
        });
      } catch (error) {
        console.warn('LLM analysis failed, using mock analysis:', error.message);
        console.log('💡 Using demo mode with simulated AI results');
        analysis = generateMockAnalysis(prData);
      }

      // Step 4: Combine results
      const result = {
        // PR metadata
        title: prData.title,
        author: prData.author,
        branch: prData.branch,
        status: prData.status,
        
        // Statistics
        filesChanged: prData.filesChanged,
        additions: prData.additions,
        deletions: prData.deletions,
        reviewers: prData.reviewers,
        comments: prData.comments,
        
        // Analysis results
        qualityScore: analysis.qualityScore,
        securityFindings: analysis.securityFindings,
        performanceFindings: analysis.performanceFindings,
        bestPractices: analysis.bestPractices,
        summary: analysis.summary,
        
        // Metadata
        timestamp: this.getRelativeTime(prData.updatedAt),
        analyzedAt: new Date().toISOString(),
        analysisTime: `${((Date.now() - startTime) / 1000).toFixed(1)}s`,
      };

      console.log(`Analysis completed in ${result.analysisTime}`);
      console.log(`Quality Score: ${result.qualityScore}/100`);
      console.log(`Security Issues: ${result.securityFindings.length}`);
      console.log(`Performance Issues: ${result.performanceFindings.length}`);

      return result;
    } catch (error) {
      console.error('Analysis failed:', error);
      throw error;
    }
  }

  /**
   * Get relative time string (e.g., "2 hours ago")
   * @param {string} timestamp - ISO timestamp
   * @returns {string} Relative time
   */
  getRelativeTime(timestamp) {
    const now = new Date();
    const then = new Date(timestamp);
    const diffMs = now - then;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    return then.toLocaleDateString();
  }

  /**
   * Get health status of the analyzer
   * @returns {Promise<Object>} Health status
   */
  async getHealth() {
    return {
      status: 'ok',
      services: {
        github: !!githubService,
        llm: !!llmService,
      },
      timestamp: new Date().toISOString(),
    };
  }
}

export default new AnalyzerService();

// Made with Bob
