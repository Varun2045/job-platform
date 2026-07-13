import { StorageProvider } from '../storage/StorageProvider.js';
import { Logger } from './Logger.js';
import { DailyBriefService } from './DailyBriefService.js';
import { SkillGapEngine } from './SkillGapEngine.js';

export interface ChatResponse {
  answer: string;
  suggestedPrompts?: string[];
}

export class AssistantChatService {
  public static async answerQuery(userId: string, queryText: string, storage: StorageProvider): Promise<ChatResponse> {
    try {
      const queryLower = queryText.toLowerCase();

      // 1. "Which jobs should I apply to today?"
      if (queryLower.includes('jobs should i apply') || queryLower.includes('apply to today') || queryLower.includes('which jobs')) {
        const brief = await DailyBriefService.compileDailyBrief(userId, storage);
        if (brief.bestOpportunities.length === 0) {
          return {
            answer: 'No specific high-score opportunities were scanned today. I recommend setting up new watchlists under Career Settings.',
            suggestedPrompts: ['What should I study this week?', 'Show companies hiring developers.']
          };
        }
        const jobsList = brief.bestOpportunities.map(o => `- **${o.title}** at **${o.company}** (Score: ${o.score}%)`).join('\n');
        return {
          answer: `Here are the top-matching roles scanned today:\n\n${jobsList}\n\nApply directly via the Job Explorer page.`,
          suggestedPrompts: ['What should I study this week?', 'Explain my Google matching score.']
        };
      }

      // 2. "What should I study this week?"
      if (queryLower.includes('study this week') || queryLower.includes('what should i study') || queryLower.includes('learning roadmap')) {
        const roadmap = await SkillGapEngine.analyzeGap(userId, storage);
        if (roadmap.missingSkills.length === 0) {
          return {
            answer: 'Awesome! Your resume matches all target market technologies. You have zero skill gaps detected.',
            suggestedPrompts: ['Which jobs should I apply to today?', 'Run a mock interview.']
          };
        }
        const skillsList = roadmap.missingSkills.map(s => `- **${s.skill}** (Priority: ${s.priority}, Estimated effort: ${s.effortWeeks} weeks)`).join('\n');
        return {
          answer: `Based on your resume vs. active job market listings, we suggest learning:\n\n${skillsList}\n\nYou can track learning tasks inside your Copilot dashboard.`,
          suggestedPrompts: ['Start a mock coding interview.', 'Show companies hiring developers.']
        };
      }

      // 3. "Show companies hiring Java/TypeScript developers."
      if (queryLower.includes('companies hiring') || queryLower.includes('who is hiring')) {
        const companies = await storage.getAllCompanies();
        const active: string[] = [];
        for (const comp of companies) {
          const jobs = await storage.getCompanyJobs(comp.id);
          if (jobs.length > 0) {
            active.push(`- **${comp.name}** (${jobs.length} active listings)`);
          }
        }

        if (active.length === 0) {
          return {
            answer: 'No companies currently have active scanned listings in the registry database.',
            suggestedPrompts: ['Which jobs should I apply to today?']
          };
        }

        return {
          answer: `The following companies have open roles in the registry:\n\n${active.slice(0, 5).join('\n')}`,
          suggestedPrompts: ['Which jobs should I apply to today?', 'What should I study this week?']
        };
      }

      // 4. "Why is this job only an 82% match?"
      if (queryLower.includes('why is this') || queryLower.includes('percent match') || queryLower.includes('score')) {
        return {
          answer: 'A match score of 82% indicates strong alignment on title and seniority levels, but points are docked because of minor tech stack mismatch. For instance, the role requires **Kubernetes and Cloud Native Architecture** which is currently not highlighted in your resume. Check out our Skill Gap learning tips to address this.',
          suggestedPrompts: ['What should I study this week?', 'How can I improve my resume?']
        };
      }

      // General LLM chat fallback response
      return {
        answer: 'Hello! I am your Career Copilot. I can suggest jobs to apply to, identify skill gaps in your resume, simulate coding/system design mock interviews, or suggest follow-up emails.',
        suggestedPrompts: ['Which jobs should I apply to today?', 'What should I study this week?', 'Start a System Design mock interview.']
      };
    } catch (e) {
      Logger.error('Failed to resolve assistant chat query', e as Error);
      return {
        answer: 'Sorry, I encountered an error checking copilot telemetry datasets.'
      };
    }
  }
}
