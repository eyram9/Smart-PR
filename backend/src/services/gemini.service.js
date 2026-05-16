import { config } from '../config/env.js';
import { SYSTEM_PROMPT, ANALYSIS_PROMPT } from '../utils/prompts.js';

/**
 * Google Gemini service for AI-powered code analysis
 */
class GeminiService {
  constructor() {
    this.apiKey = config.llm.gemini?.apiKey;
    // Use the correct v1 API endpoint with gemini-1.5-flash model
    this.apiUrl = 'https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent';
  }

  /**
   * Analyze PR using Google Gemini
   * @param {Object} prData - PR data from GitHub
   * @returns {Promise<Object>} Analysis results
   */
  async analyzePR(prData) {
    try {
      const prompt = `${SYSTEM_PROMPT}\n\n${ANALYSIS_PROMPT(prData)}`;

      const response = await fetch(`${this.apiUrl}?key=${this.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 4096,
          }
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Gemini API error: ${error.error?.message || response.statusText}`);
      }

      const result = await response.json();
      const content = result.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!content) {
        throw new Error('No content in Gemini response');
      }

      // Extract JSON from response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Failed to extract JSON from Gemini response');
      }

      return JSON.parse(jsonMatch[0]);
    } catch (error) {
      throw new Error(`Gemini analysis failed: ${error.message}`);
    }
  }
}

export default new GeminiService();

// Made with Bob
