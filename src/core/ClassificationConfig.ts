import fs from 'fs';
import path from 'path';

export interface ExperienceLevelConfig {
  id: string;
  displayName: string;
  legacyBucket: string;
  explicitPatterns: string[];
  minYears: number;
  maxYears: number;
}

export interface DepartmentKeywordConfig {
  id: string;
  displayName: string;
  legacyBucket: string;
  keywords: Array<{
    keyword: string;
    defaultWeight: number;
    currentWeight: number;
    source: string;
  }>;
}

export interface TagRuleConfig {
  name: string;
  conditionField: string;
  conditionValue?: any;
  regex?: string;
  greaterThan?: number;
}

export interface DeclarativeRuleConfig {
  name: string;
  priority: number;
  condition: {
    field: string;
    operator: 'contains' | 'equals' | 'regex' | 'exists' | 'greaterThan' | 'lessThan' | 'in';
    value: any;
  };
  action: {
    addTag?: string;
    setDepartment?: string;
    addQualityFlag?: string;
    adjustScore?: number;
  };
}

export class ClassificationConfig {
  private static instance: ClassificationConfig;

  public experienceConfig: { configVersion: string; levels: ExperienceLevelConfig[] } = {
    configVersion: 'v2.0.0',
    levels: [],
  };

  public companyLevelConfig: { configVersion: string; companies: Record<string, Record<string, string>> } = {
    configVersion: 'v5.0.0',
    companies: {},
  };

  public departmentConfig: { configVersion: string; departments: DepartmentKeywordConfig[] } = {
    configVersion: 'v3.0.0',
    departments: [],
  };

  public tagConfig: { configVersion: string; tags: TagRuleConfig[] } = {
    configVersion: 'v2.0.0',
    tags: [],
  };

  public rulesConfig: { configVersion: string; rules: DeclarativeRuleConfig[] } = {
    configVersion: 'v1.0.0',
    rules: [],
  };

  public synonymsConfig: { configVersion: string; synonyms: Record<string, string> } = {
    configVersion: 'v2.0.0',
    synonyms: {},
  };

  private constructor() {
    this.loadAll();
  }

  public static getInstance(): ClassificationConfig {
    if (!ClassificationConfig.instance) {
      ClassificationConfig.instance = new ClassificationConfig();
    }
    return ClassificationConfig.instance;
  }

  public loadAll(): void {
    const baseDir = path.join(process.cwd(), 'config');

    this.experienceConfig = this.loadJson(path.join(baseDir, 'experience-levels.json'), this.experienceConfig);
    this.companyLevelConfig = this.loadJson(path.join(baseDir, 'company-level-mappings.json'), this.companyLevelConfig);
    this.departmentConfig = this.loadJson(path.join(baseDir, 'department-keywords.json'), this.departmentConfig);
    this.tagConfig = this.loadJson(path.join(baseDir, 'job-tags.json'), this.tagConfig);
    this.rulesConfig = this.loadJson(path.join(baseDir, 'rules.json'), this.rulesConfig);
    this.synonymsConfig = this.loadJson(path.join(baseDir, 'synonyms.json'), this.synonymsConfig);
  }

  private loadJson<T>(filePath: string, fallback: T): T {
    try {
      if (fs.existsSync(filePath)) {
        const raw = fs.readFileSync(filePath, 'utf-8');
        return JSON.parse(raw);
      }
    } catch {
      // Return fallback cleanly if file load fails
    }
    return fallback;
  }

  public getConfigVersionsMap(): Record<string, string> {
    return {
      experienceLevels: this.experienceConfig.configVersion || 'v2.0.0',
      companyMappings: this.companyLevelConfig.configVersion || 'v5.0.0',
      departmentKeywords: this.departmentConfig.configVersion || 'v3.0.0',
      jobTags: this.tagConfig.configVersion || 'v2.0.0',
      rules: this.rulesConfig.configVersion || 'v1.0.0',
      synonyms: this.synonymsConfig.configVersion || 'v2.0.0',
    };
  }
}
