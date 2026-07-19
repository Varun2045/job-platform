import dotenv from 'dotenv';
import { HttpClient } from './HttpClient.js';
import { Logger } from './Logger.js';

export interface CheatsheetSection {
  title: string;
  type: 'table' | 'key_value' | 'code' | 'list';
  content: any;
}

export interface CheatsheetData {
  title: string;
  description: string;
  sections: CheatsheetSection[];
}

export class CheatsheetGenerator {
  /**
   * Generates technical interview preparation study guides dynamically using the Groq AI API.
   * Throws an error if key is missing or generation fails.
   */
  public static async generate(
    topic: string,
    options?: { difficulty?: string; mode?: string; company?: string },
  ): Promise<any> {
    // Reload dotenv dynamically to capture newly saved .env file settings immediately
    dotenv.config();

    const groqKey = process.env.GROQ_API_KEY;
    if (!groqKey) {
      throw new Error('Groq API Key is not configured in environment variables.');
    }

    const mode = options?.mode || 'core';
    const difficulty = options?.difficulty || 'Intermediate';
    const company = options?.company || 'Google';

    try {
      Logger.info(`Using Groq API to generate cheatsheet in mode: "${mode}" for topic: "${topic}"`);
      const client = new HttpClient();
      const url = 'https://api.groq.com/openai/v1/chat/completions';

      let prompt = '';

      if (mode === 'core') {
        prompt = `Generate a high-quality technical interview preparation core guide for the topic: "${topic}".
The target difficulty is: ${difficulty}.
Analyze this topic and output a strictly structured JSON object. Focus on providing detailed, production-grade core overview and concepts.
Return ONLY a JSON object containing these keys:
- "title" (string): Descriptive title (e.g., "React Technical Interview Study Guide").
- "description" (string): Short 1-2 sentence overview.
- "overview" (object):
  - "introduction" (string)
  - "whyMatters" (string)
  - "industryUsage" (string)
  - "difficulty" (string)
  - "readingTime" (string)
- "concepts" (array of objects): 6-8 core concepts. Each having:
  - "name" (string): e.g. "Virtual DOM"
  - "explanation" (string)
  - "realWorldUsage" (string)
  - "interviewPoints" (string)
- "relatedTopics" (array of strings): Recommended study paths

No conversational text or markdown wrapper. Output strictly valid JSON.`;
      } else if (mode === 'qa') {
        prompt = `Generate 10 highly detailed technical interview Q&As for the topic: "${topic}".
Return ONLY a JSON object containing this key:
- "interviewQA" (array of objects):
  - "question" (string)
  - "answer" (string): Detailed answer
  - "example" (string): Code example or syntax snippet
  - "commonMistakes" (string): What candidates get wrong
  - "followUp" (array of strings): Related follow-up topics
  - "difficulty" (string): "Easy" | "Medium" | "Hard"

No conversational text or markdown wrapper. Output strictly valid JSON.`;
      } else if (mode === 'coding') {
        prompt = `Generate 5 detailed coding challenges for the topic: "${topic}".
Return ONLY a JSON object containing this key:
- "codingProblems" (array of objects):
  - "problemStatement" (string)
  - "difficulty" (string): "Easy" | "Medium" | "Hard"
  - "expectedApproach" (string)
  - "timeComplexity" (string)
  - "spaceComplexity" (string)
  - "optimizedSolution" (string): Code implementation
  - "commonMistakes" (string)

No conversational text or markdown wrapper. Output strictly valid JSON.`;
      } else if (mode === 'company') {
        prompt = `Generate 8 company specific interview questions commonly asked by: "${company}" for the topic: "${topic}".
Return ONLY a JSON object containing this key:
- "companyQuestions" (object): A key-value pair where the key is "${company}" and value is an array of strings (questions asked by them).

No conversational text or markdown wrapper. Output strictly valid JSON.`;
      } else if (mode === 'examples') {
        prompt = `Generate 3 real-world practical examples with code implementations for the topic: "${topic}".
Return ONLY a JSON object containing this key:
- "practicalExamples" (array of objects):
  - "title" (string)
  - "description" (string)
  - "code" (string): Implementation code snippet

No conversational text or markdown wrapper. Output strictly valid JSON.`;
      } else if (mode === 'best-practices') {
        prompt = `Generate 6 industry best practices and 4 common mistakes for the topic: "${topic}".
Return ONLY a JSON object containing these keys:
- "bestPractices" (array of objects):
  - "category" (string): e.g. "Performance", "Security", "Scalability", "Clean Code"
  - "tip" (string)
  - "details" (string)
- "commonMistakes" (array of objects):
  - "mistake" (string)
  - "whyWrong" (string)
  - "howToAvoid" (string)

No conversational text or markdown wrapper. Output strictly valid JSON.`;
      } else if (mode === 'revision') {
        prompt = `Generate a 30-minute quick revision sheet for the topic: "${topic}".
Return ONLY a JSON object containing this key:
- "revisionSheet" (object):
  - "keywords" (array of strings)
  - "definitions" (object mapping keyword to definition)
  - "importantAPIsOrCommands" (array of strings)
  - "shortNotes" (array of strings)

No conversational text or markdown wrapper. Output strictly valid JSON.`;
      } else if (mode === 'resources') {
        prompt = `Generate recommended learning resources for the topic: "${topic}".
Return ONLY a JSON object containing this key:
- "resources" (object):
  - "officialDoc" (string): Official URL
  - "bestBooks" (array of strings)
  - "gitHubRepos" (array of strings)
  - "recommendedArticles" (array of strings)
  - "practicePlatforms" (array of strings)

No conversational text or markdown wrapper. Output strictly valid JSON.`;
      } else if (mode === 'hr') {
        prompt = `Generate a set of 8 HR, behavioral, and cultural interview questions specific to a candidate preparing for roles using: "${topic}".
Return ONLY a JSON object containing:
- "title" (string): e.g., "Python Developer HR Interview Guide"
- "questions" (array of objects):
  - "question" (string)
  - "answer" (string): Best response strategy using STAR method
  - "commonMistakes" (string): What to avoid saying
  - "followUp" (array of strings)
  - "difficulty" (string)

No conversational text or markdown wrapper. Output strictly valid JSON.`;
      } else if (mode === 'system-design') {
        prompt = `Generate 4 advanced System Design interview scenarios and architecture patterns for: "${topic}".
Return ONLY a JSON object containing:
- "title" (string): e.g., "React Applications System Design"
- "scenarios" (array of objects):
  - "title" (string): System scenario name
  - "problem" (string): The design challenge
  - "solution" (string): Architectural proposal
  - "keyComponents" (array of strings)
  - "tradeOffs" (array of strings): Cost vs performance trade-offs

No conversational text or markdown wrapper. Output strictly valid JSON.`;
      } else if (mode === 'eli5') {
        prompt = `Explain the core concepts of: "${topic}" in simple, "Explain Like I'm 5" terms. Use simple real-world analogies.
Return ONLY a JSON object containing:
- "title" (string)
- "explanation" (string): Comprehensive ELI5 summary.
- "analogies" (array of objects):
  - "concept" (string)
  - "analogy" (string)

No conversational text or markdown wrapper. Output strictly valid JSON.`;
      } else {
        throw new Error(`Unsupported generation mode: ${mode}`);
      }

      const response = await client.request(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${groqKey}`,
          'Content-Type': 'application/json',
        },
        body: {
          model: 'llama-3.1-8b-instant',
          messages: [
            {
              role: 'system',
              content:
                'You are an expert technical interview preparation builder. You output strictly structured JSON guides with rich reference information.',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          response_format: { type: 'json_object' },
          temperature: 0.5,
        },
        timeoutMs: 30000,
        retries: 4,
        backoffMs: 3000,
      });

      const responseData = response.data;
      let parsed: any = null;

      if (typeof responseData === 'object' && responseData !== null) {
        const content = responseData.choices?.[0]?.message?.content;
        if (content) {
          parsed = JSON.parse(content);
        }
      } else if (typeof responseData === 'string') {
        const jsonVal = JSON.parse(responseData);
        const content = jsonVal.choices?.[0]?.message?.content;
        if (content) {
          parsed = JSON.parse(content);
        }
      }

      if (parsed) {
        return parsed;
      }

      throw new Error('Invalid JSON structure returned by Groq.');
    } catch (err: any) {
      Logger.error(`Groq cheatsheet generation failed: ${err.message}`);
      throw new Error(`AI Cheatsheet generation failed: ${err.message}`);
    }
  }
}
