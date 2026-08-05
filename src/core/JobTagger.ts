import { ClassificationConfig } from './ClassificationConfig.js';
import { RuleEngine } from './RuleEngine.js';
import { Logger } from './Logger.js';

export interface TagResult {
  tags: string[];
  qualityFlags: string[];
  confidence: number;
}

export class JobTagger {
  /**
   * Evaluates job tags and quality flags automatically.
   */
  public static tag(jobData: Record<string, any>): TagResult {
    const config = ClassificationConfig.getInstance();
    const tagRules = config.tagConfig.tags || [];
    const tagsSet = new Set<string>();
    const qualityFlagsSet = new Set<string>();

    // 1. Evaluate predefined tag rules in job-tags.json
    for (const rule of tagRules) {
      const val = jobData[rule.conditionField];
      if (val !== undefined && val !== null) {
        if (rule.conditionValue !== undefined && val === rule.conditionValue) {
          tagsSet.add(rule.name);
        } else if (rule.regex) {
          try {
            const reg = new RegExp(rule.regex, 'i');
            if (reg.test(String(val))) {
              tagsSet.add(rule.name);
            }
          } catch (error) {
            Logger.debug('Failed to evaluate regex rule', error as Error);
          }
        } else if (rule.greaterThan !== undefined && Number(val) > rule.greaterThan) {
          tagsSet.add(rule.name);
        }
      }
    }

    // 2. Evaluate RuleEngine declarative rules in rules.json
    const ruleResult = RuleEngine.evaluate(jobData);
    ruleResult.addedTags.forEach((t) => tagsSet.add(t));
    ruleResult.qualityFlags.forEach((f) => qualityFlagsSet.add(f));

    // 3. Fallback Quality Flags checks
    const desc = String(jobData.description || '');
    if (desc.length < 50) {
      qualityFlagsSet.add('incomplete_description');
    }
    if (!jobData.salary || jobData.salary === 'Not Specified') {
      qualityFlagsSet.add('missing_salary');
    }

    const tagList = Array.from(tagsSet);
    const flagsList = Array.from(qualityFlagsSet);
    const confidence = tagList.length > 0 ? 95 : 85;

    return {
      tags: tagList,
      qualityFlags: flagsList,
      confidence,
    };
  }
}
