import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import geminiService from './gemini.service.js';
import { config } from '../config/env.js';
import { SYSTEM_PROMPT, ANALYSIS_PROMPT } from '../utils/prompts.js';

/**
 * LLM service for AI-powered code analysis
 * Supports OpenAI, Anthropic, and Google Gemini
 */
class LLMService {
  constructor() {
    this.provider = config.llm.provider;

    if (this.provider === 'openai') {
      this.openai = new OpenAI({
        apiKey: config.llm.openai.apiKey,
      });
    } else if (this.provider === 'anthropic') {
      this.anthropic = new Anthropic({
        apiKey: config.llm.anthropic.apiKey,
      });
    }
    // Gemini is handled by geminiService
  }

  /**
   * Analyze PR using OpenAI
   * @param {Object} prData - PR data from GitHub
   * @returns {Promise<Object>} Analysis results
   */
  async analyzeWithOpenAI(prData) {
    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: SYSTEM_PROMPT,
          },
          {
            role: 'user',
            content: ANALYSIS_PROMPT(prData),
          },
        ],
        temperature: 0.3,
        response_format: { type: 'json_object' },
      });

      const content = response.choices[0].message.content;
      return JSON.parse(content);
    } catch (error) {
      throw new Error(`OpenAI analysis failed: ${error.message}`);
    }
  }

  /**
   * Analyze PR using Anthropic Claude
   * @param {Object} prData - PR data from GitHub
   * @returns {Promise<Object>} Analysis results
   */
  async analyzeWithAnthropic(prData) {
    try {
      const response = await this.anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 4096,
        temperature: 0.3,
        system: SYSTEM_PROMPT,
        messages: [
          {
            role: 'user',
            content: ANALYSIS_PROMPT(prData),
          },
        ],
      });

      const content = response.content[0].text;
      // Extract JSON from response (Claude might add extra text)
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Failed to extract JSON from Claude response');
      }
      return JSON.parse(jsonMatch[0]);
    } catch (error) {
      throw new Error(`Anthropic analysis failed: ${error.message}`);
    }
  }

  /**
   * Analyze PR code using configured LLM provider
   * @param {Object} prData - PR data from GitHub
   * @returns {Promise<Object>} Analysis results
   */
  async analyzePR(prData) {
    console.log(`Analyzing PR with ${this.provider}...`);

    try {
      let analysis;

      if (this.provider === 'openai') {
        analysis = await this.analyzeWithOpenAI(prData);
      } else if (this.provider === 'anthropic') {
        analysis = await this.analyzeWithAnthropic(prData);
      } else if (this.provider === 'gemini') {
        analysis = await geminiService.analyzePR(prData);
      } else {
        throw new Error(`Unsupported LLM provider: ${this.provider}`);
      }

      // Validate and normalize the response
      return this.normalizeAnalysis(analysis);
    } catch (error) {
      console.error('LLM analysis error:', error);
      throw error;
    }
  }

  /**
   * Normalize analysis response to ensure consistent format
   * @param {Object} analysis - Raw analysis from LLM
   * @returns {Object} Normalized analysis
   */
  normalizeAnalysis(analysis) {
    return {
      qualityScore: analysis.qualityScore || 85,
      securityFindings: (analysis.securityFindings || []).map((f, idx) => ({
        id: idx + 1,
        severity: f.severity || 'medium',
        title: f.title || 'Security Issue',
        file: f.file || 'unknown',
        line: f.line || 0,
        description: f.description || 'No description provided',
        fixSuggestion: f.fixSuggestion || null,
      })),
      performanceFindings: (analysis.performanceFindings || []).map((f, idx) => ({
        id: idx + 1,
        impact: f.impact || 'medium',
        title: f.title || 'Performance Issue',
        file: f.file || 'unknown',
        line: f.line || 0,
        description: f.description || 'No description provided',
        fixSuggestion: f.fixSuggestion || null,
      })),
      bestPractices: analysis.bestPractices || [],
      summary: analysis.summary || 'Analysis completed',
    };
  }
}

export default new LLMService();

// Made with Bob
