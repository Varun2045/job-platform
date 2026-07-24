import { ClassificationConfig, DeclarativeRuleConfig } from './ClassificationConfig.js';

export interface RuleActionResult {
  addedTags: string[];
  departmentOverride?: string;
  qualityFlags: string[];
  scoreAdjustment: number;
}

export class RuleEngine {
  /**
   * Evaluates declarative rules against job fields.
   */
  public static evaluate(jobData: Record<string, any>): RuleActionResult {
    const rules = ClassificationConfig.getInstance().rulesConfig.rules || [];
    const sorted = [...rules].sort((a, b) => b.priority - a.priority);

    const result: RuleActionResult = {
      addedTags: [],
      qualityFlags: [],
      scoreAdjustment: 0,
    };

    for (const rule of sorted) {
      if (this.evaluateCondition(rule.condition, jobData)) {
        if (rule.action.addTag) {
          result.addedTags.push(rule.action.addTag);
        }
        if (rule.action.setDepartment) {
          result.departmentOverride = rule.action.setDepartment;
        }
        if (rule.action.addQualityFlag) {
          result.qualityFlags.push(rule.action.addQualityFlag);
        }
        if (rule.action.adjustScore) {
          result.scoreAdjustment += rule.action.adjustScore;
        }
      }
    }

    return result;
  }

  private static evaluateCondition(cond: DeclarativeRuleConfig['condition'], data: Record<string, any>): boolean {
    let fieldValue = data[cond.field];

    if (cond.field === 'descriptionLength') {
      fieldValue = (data.description || '').length;
    }

    if (fieldValue === undefined || fieldValue === null) {
      return cond.operator === 'exists' ? false : false;
    }

    const val = cond.value;

    switch (cond.operator) {
      case 'contains':
        const textStr = String(fieldValue).toLowerCase();
        if (Array.isArray(val)) {
          return val.some((v) => textStr.includes(String(v).toLowerCase()));
        }
        return textStr.includes(String(val).toLowerCase());

      case 'equals':
        return String(fieldValue).toLowerCase() === String(val).toLowerCase();

      case 'regex':
        try {
          const reg = new RegExp(String(val), 'i');
          return reg.test(String(fieldValue));
        } catch {
          return false;
        }

      case 'exists':
        return fieldValue !== undefined && fieldValue !== null && fieldValue !== '';

      case 'greaterThan':
        return Number(fieldValue) > Number(val);

      case 'lessThan':
        return Number(fieldValue) < Number(val);

      case 'in':
        if (Array.isArray(val)) {
          return val.map((v) => String(v).toLowerCase()).includes(String(fieldValue).toLowerCase());
        }
        return false;

      default:
        return false;
    }
  }
}
