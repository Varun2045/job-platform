import fs from 'fs';
import path from 'path';

export interface ValidationReport {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export class ConfigValidator {
  /**
   * Validates all JSON configuration files in config/ directory.
   */
  public static validateAll(configDir?: string): ValidationReport {
    const errors: string[] = [];
    const warnings: string[] = [];

    const baseDir = configDir || path.join(process.cwd(), 'config');

    if (!fs.existsSync(baseDir)) {
      errors.push(`Config directory "${baseDir}" does not exist.`);
      return { valid: false, errors, warnings };
    }

    // 1. Validate experience-levels.json
    const expPath = path.join(baseDir, 'experience-levels.json');
    if (fs.existsSync(expPath)) {
      try {
        const raw = fs.readFileSync(expPath, 'utf-8');
        const data = JSON.parse(raw);
        if (!data.levels || !Array.isArray(data.levels)) {
          errors.push('experience-levels.json: Missing "levels" array.');
        } else {
          const ids = new Set<string>();
          for (const lvl of data.levels) {
            if (!lvl.id || !lvl.displayName) {
              errors.push(`experience-levels.json: Invalid level entry missing id or displayName.`);
            }
            if (ids.has(lvl.id)) {
              errors.push(`experience-levels.json: Duplicate level id "${lvl.id}".`);
            }
            ids.add(lvl.id);
          }
        }
      } catch (err: any) {
        errors.push(`experience-levels.json: JSON Syntax Error - ${err.message}`);
      }
    }

    // 2. Validate company-level-mappings.json
    const compPath = path.join(baseDir, 'company-level-mappings.json');
    if (fs.existsSync(compPath)) {
      try {
        const raw = fs.readFileSync(compPath, 'utf-8');
        const data = JSON.parse(raw);
        if (!data.companies || typeof data.companies !== 'object') {
          errors.push('company-level-mappings.json: Missing "companies" object.');
        }
      } catch (err: any) {
        errors.push(`company-level-mappings.json: JSON Syntax Error - ${err.message}`);
      }
    }

    // 3. Validate department-keywords.json
    const deptPath = path.join(baseDir, 'department-keywords.json');
    if (fs.existsSync(deptPath)) {
      try {
        const raw = fs.readFileSync(deptPath, 'utf-8');
        const data = JSON.parse(raw);
        if (!data.departments || !Array.isArray(data.departments)) {
          errors.push('department-keywords.json: Missing "departments" array.');
        } else {
          for (const dept of data.departments) {
            if (!dept.id || !dept.displayName) {
              errors.push(`department-keywords.json: Invalid department missing id or displayName.`);
            }
          }
        }
      } catch (err: any) {
        errors.push(`department-keywords.json: JSON Syntax Error - ${err.message}`);
      }
    }

    // 4. Validate rules.json
    const rulesPath = path.join(baseDir, 'rules.json');
    if (fs.existsSync(rulesPath)) {
      try {
        const raw = fs.readFileSync(rulesPath, 'utf-8');
        const data = JSON.parse(raw);
        if (!data.rules || !Array.isArray(data.rules)) {
          errors.push('rules.json: Missing "rules" array.');
        } else {
          for (const rule of data.rules) {
            if (!rule.name || !rule.condition || !rule.action) {
              errors.push(`rules.json: Rule missing name, condition, or action.`);
            }
          }
        }
      } catch (err: any) {
        errors.push(`rules.json: JSON Syntax Error - ${err.message}`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }
}
