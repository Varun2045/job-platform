import { ClassificationConfig } from './ClassificationConfig.js';

export class SynonymNormalizer {
  /**
   * Normalizes a text string, title, or skill using the synonym dictionary.
   */
  public static normalizeTerm(term: string): string {
    if (!term) return '';
    const clean = term.trim().toLowerCase();
    const synonyms = ClassificationConfig.getInstance().synonymsConfig.synonyms;

    if (synonyms[clean]) {
      return synonyms[clean];
    }
    return term.trim();
  }

  /**
   * Replaces known technology and title aliases in a larger text body.
   */
  public static normalizeTextBody(text: string): string {
    if (!text) return '';
    const synonyms = ClassificationConfig.getInstance().synonymsConfig.synonyms;
    let result = text;

    for (const [alias, canonical] of Object.entries(synonyms)) {
      if (alias.length <= 2) continue; // Skip short terms for full body regex
      const regex = new RegExp(`\\b${alias.replace('.', '\\.')}\\b`, 'gi');
      result = result.replace(regex, canonical);
    }
    return result;
  }
}
