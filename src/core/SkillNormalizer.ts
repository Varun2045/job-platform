import fs from 'fs';
import path from 'path';
import { Logger } from './Logger.js';

export class SkillNormalizer {
  private static synonyms: Record<string, string> = {};

  static {
    this.loadSynonyms();
  }

  private static loadSynonyms(): void {
    try {
      const synonymsPath = path.join(process.cwd(), 'config', 'synonyms.json');
      if (fs.existsSync(synonymsPath)) {
        const raw = fs.readFileSync(synonymsPath, 'utf-8');
        this.synonyms = JSON.parse(raw);
      }
    } catch (e) {
      Logger.error('Failed to load synonyms.json', e as any);
      this.synonyms = {
        node: 'Node.js',
        nodejs: 'Node.js',
        js: 'JavaScript',
        javascript: 'JavaScript',
        ts: 'TypeScript',
        typescript: 'TypeScript',
        reactjs: 'React',
        react: 'React',
        postgres: 'PostgreSQL',
        postgresql: 'PostgreSQL',
        spring: 'Spring Boot',
        springboot: 'Spring Boot',
        'spring boot': 'Spring Boot',
        llm: 'Large Language Model',
        'large language model': 'Large Language Model',
      };
    }
  }

  /**
   * Normalizes a technology/skill name to its canonical form if it matches a synonym.
   */
  public static normalize(skill: string): string {
    const key = skill.trim().toLowerCase();
    return this.synonyms[key] || skill;
  }

  /**
   * Normalizes a text block (e.g. job description) by replacing synonym variations
   * of skills with their canonical forms to improve exact keyword matching.
   */
  public static normalizeText(text: string): string {
    if (!text) return '';
    const keys = Object.keys(this.synonyms).sort((a, b) => b.length - a.length);
    if (keys.length === 0) return text;

    const escapedKeys = keys.map((k) => k.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'));
    const regex = new RegExp(`\\b(${escapedKeys.join('|')})\\b`, 'gi');

    return text.replace(regex, (match) => {
      const canonical = this.synonyms[match.toLowerCase()];
      return canonical !== undefined ? canonical : match;
    });
  }
}
