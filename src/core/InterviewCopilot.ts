import { StorageProvider } from '../storage/StorageProvider.js';
import { Logger } from './Logger.js';

export interface InterviewQuestion {
  id: string;
  question: string;
  category: 'Coding' | 'System Design' | 'Behavioral';
}

export interface InterviewSession {
  id: string;
  user_id: string;
  session_type: 'Coding' | 'System Design' | 'Behavioral';
  questions: InterviewQuestion[];
  responses: Record<string, string>; // questionId -> user response text
  feedback: {
    overallFeedback: string;
    starCritique: Record<string, { situation: string; action: string; result: string; rating: number }>;
    weaknesses: string[];
  };
  score: number;
  created_at?: string;
}

export class InterviewCopilot {
  private static codingQuestions: string[] = [
    'Implement a thread-safe rate limiter in TypeScript supporting sliding window logging.',
    'Write a function to detect cycles in a directed graph using topological sort.',
    'Optimize a high-throughput payload parser to minimize memory heap fragmentation in Node.js.'
  ];

  private static designQuestions: string[] = [
    'Design a real-time analytics counter system (e.g. video view count) handling 100K write operations per second.',
    'Design a secure multi-tenant notification engine distributing messages via Email, WebSockets, and SMS.',
    'Design a distributed job processing queue with execution deduplication, retries, and dead-letter channels.'
  ];

  private static behavioralQuestions: string[] = [
    'Tell me about a time when you had to optimize code performance under a tight deadline. What compromises did you make?',
    'Describe a technical conflict you had with a team member or architect. How did you resolve it?',
    'Explain a situation where a production system failed on your watch. How did you diagnose and mitigate the incident?'
  ];

  public static async startSession(
    userId: string,
    type: 'Coding' | 'System Design' | 'Behavioral',
    storage: StorageProvider
  ): Promise<InterviewSession> {
    try {
      const questionsList = type === 'Coding' 
        ? this.codingQuestions 
        : type === 'System Design' 
        ? this.designQuestions 
        : this.behavioralQuestions;

      const selectedQuestions: InterviewQuestion[] = questionsList.map((q, idx) => ({
        id: `q-${type.toLowerCase()}-${idx}`,
        question: q,
        category: type
      }));

      const session: InterviewSession = {
        id: crypto.randomUUID(),
        user_id: userId,
        session_type: type,
        questions: selectedQuestions,
        responses: {},
        feedback: {
          overallFeedback: 'Awaiting submission.',
          starCritique: {},
          weaknesses: []
        },
        score: 0,
        created_at: new Date().toISOString()
      };

      await storage.saveInterviewSession(userId, session);
      return session;
    } catch (e) {
      Logger.error('Failed to create interview session', e as Error);
      throw e;
    }
  }

  public static async evaluateSession(
    userId: string,
    sessionId: string,
    responses: Record<string, string>,
    storage: StorageProvider
  ): Promise<InterviewSession> {
    try {
      const sessions = await storage.getInterviewSessions(userId);
      const session = sessions.find(s => s.id === sessionId);

      if (!session) {
        throw new Error('Interview session not found');
      }

      // Populate responses
      session.responses = responses;

      // Evaluate and build STAR critique feedback
      const starCritique: Record<string, any> = {};
      const weaknesses: string[] = [];
      let totalRatingSum = 0;
      let count = 0;

      session.questions.forEach((q: InterviewQuestion) => {
        const resp = responses[q.id] || '';
        let rating = 3; // default rating
        let situation = 'Good context set in the response.';
        let action = 'Outlines core technical details.';
        let result = 'Mentions metrics and outcome.';

        if (resp.length === 0) {
          rating = 0;
          situation = 'No answer provided.';
          action = 'N/A';
          result = 'N/A';
          weaknesses.push(`No response given for question: ${q.question}`);
        } else if (resp.length < 50) {
          rating = 2;
          situation = 'Answer is too brief to formulate structural context.';
          action = 'Lacks description of implementation methodologies.';
          result = 'No quantified results or impacts mentioned.';
          weaknesses.push(`Elaborate more on detail for: ${q.question}`);
        } else {
          rating = 4;
          if (resp.includes('%') || resp.includes('ms') || resp.includes('scale')) {
            rating = 5;
            result = 'Quantified results provided with precise scale/performance metrics.';
          } else {
            weaknesses.push(`Quantify outcomes (e.g. latency reduction, throughput) in: ${q.question}`);
          }
        }

        starCritique[q.id] = {
          situation,
          action,
          result,
          rating
        };

        totalRatingSum += rating;
        count++;
      });

      const avgScore = count > 0 ? Math.round((totalRatingSum / (count * 5)) * 100) : 0;
      session.score = avgScore;
      session.feedback = {
        overallFeedback: avgScore >= 80 
          ? 'Excellent structural details. Met target criteria for the role.' 
          : 'Good effort. Review missing competencies and focus on structural STAR format details.',
        starCritique,
        weaknesses
      };

      await storage.saveInterviewSession(userId, session);
      return session;
    } catch (e) {
      Logger.error(`Failed to evaluate interview session ${sessionId}`, e as Error);
      throw e;
    }
  }
}
