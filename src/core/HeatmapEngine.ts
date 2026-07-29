import {
  StorageProvider,
  KeywordHeatmap,
  KeywordMatchItem,
  KeywordMissingItem,
  CategoryBreakdownItem,
  ImpactImprovement,
} from '../storage/StorageProvider.js';
import { Logger } from './Logger.js';

export interface TechDefinition {
  canonical: string;
  category: string;
  aliases: string[];
  stems?: string[];
}

const CATEGORY_WEIGHTS: Record<string, number> = {
  'Programming Languages': 0.15,
  'Frameworks': 0.20,
  'Databases': 0.15,
  'Cloud Platforms': 0.15,
  'DevOps Tools': 0.10,
  'Tools & Infrastructure': 0.10,
  'AI / ML Technologies': 0.10,
  'Soft Skills': 0.05,
};

const STOP_WORDS = new Set([
  'we', 'our', 'you', 'candidate', 'role', 'job', 'looking', 'seeking', 'hiring',
  'build', 'develop', 'strong', 'excellent', 'knowledge', 'requirements',
  'responsibilities', 'ability', 'environment', 'experience', 'to', 'the', 'a',
  'an', 'of', 'for', 'with', 'or', 'and', 'must', 'will', 'work', 'your', 'about',
  'team', 'required', 'preferred', 'skills', 'description', 'seeking', 'qualifications',
  'duties', 'deliver', 'support', 'help', 'work', 'working', 'join', 'part', 'member',
]);

// Technologies strictly excluded from semantic inference
const STRICT_EXCLUSIONS = new Set([
  'kubernetes',
  'terraform',
  'aws',
  'azure',
  'google cloud platform',
  'kafka',
  'redis',
  'ci/cd',
  'docker',
]);

// Conservative Semantic Evidence Rules Map
const SEMANTIC_RULES: { targetCanonical: string; triggers: string[]; inferredFrom: string }[] = [
  {
    targetCanonical: 'Problem Solving',
    triggers: ['benchmarking', 'optimization', 'adaptive algorithms', 'problem-solving', 'analytical', 'algorithmic', 'performance tuning', 'troubleshooting'],
    inferredFrom: 'optimization & benchmarking experience',
  },
  {
    targetCanonical: 'Communication',
    triggers: ['publicity head', 'event organization', 'presentations', 'public speaking', 'moderator', 'technical writer', 'content lead'],
    inferredFrom: 'leadership & event organization experience',
  },
  {
    targetCanonical: 'Leadership',
    triggers: ['publicity head', 'event organization', 'lead developer', 'head of', 'vice president', 'president', 'organizer', 'team captain'],
    inferredFrom: 'leadership & organizational roles',
  },
  {
    targetCanonical: 'Backend Development',
    triggers: ['backend api', 'restful endpoints', 'microservices', 'server-side', 'database modeling'],
    inferredFrom: 'backend API & server-side experience',
  },
  {
    targetCanonical: 'Agile',
    triggers: ['sprint planning', 'scrum master', 'standups', 'jira workflows', 'retrospectives'],
    inferredFrom: 'Scrum & sprint execution experience',
  },
  {
    targetCanonical: 'Scrum',
    triggers: ['agile methodology', 'sprints', 'standups', 'jira', 'retrospectives'],
    inferredFrom: 'Agile & sprint workflow experience',
  },
  {
    targetCanonical: 'Teamwork',
    triggers: ['cross-functional team', 'collaborate', 'collaborated', 'pair programming', 'co-developed'],
    inferredFrom: 'cross-functional collaboration experience',
  },
  {
    targetCanonical: 'Mentorship',
    triggers: ['guiding engineers', 'onboarding devs', 'code reviews', 'coaching', 'teaching assistant'],
    inferredFrom: 'engineering guidance & coaching experience',
  },
];

const TECH_DICTIONARY: TechDefinition[] = [
  // --- Programming Languages ---
  { canonical: 'Java', category: 'Programming Languages', aliases: ['java', 'j2ee', 'core java'] },
  { canonical: 'Python', category: 'Programming Languages', aliases: ['python', 'py', 'python3'] },
  { canonical: 'JavaScript', category: 'Programming Languages', aliases: ['javascript', 'js', 'ecmascript', 'es6', 'vanilla js'] },
  { canonical: 'TypeScript', category: 'Programming Languages', aliases: ['typescript', 'ts'] },
  { canonical: 'Go', category: 'Programming Languages', aliases: ['go', 'golang'] },
  { canonical: 'Rust', category: 'Programming Languages', aliases: ['rust', 'rustlang'] },
  { canonical: 'C', category: 'Programming Languages', aliases: ['c language', 'c lang'] },
  { canonical: 'C++', category: 'Programming Languages', aliases: ['c++', 'cpp', 'c plus plus'] },
  { canonical: 'C#', category: 'Programming Languages', aliases: ['c#', 'csharp', 'c sharp', '.net c#'] },
  { canonical: 'Kotlin', category: 'Programming Languages', aliases: ['kotlin'] },
  { canonical: 'Swift', category: 'Programming Languages', aliases: ['swift'] },
  { canonical: 'PHP', category: 'Programming Languages', aliases: ['php', 'php7', 'php8'] },
  { canonical: 'Ruby', category: 'Programming Languages', aliases: ['ruby', 'ruby lang'] },
  { canonical: 'Scala', category: 'Programming Languages', aliases: ['scala'] },
  { canonical: 'Elixir', category: 'Programming Languages', aliases: ['elixir'] },
  { canonical: 'Haskell', category: 'Programming Languages', aliases: ['haskell'] },
  { canonical: 'Dart', category: 'Programming Languages', aliases: ['dart'] },
  { canonical: 'R', category: 'Programming Languages', aliases: ['r language', 'r programming'] },
  { canonical: 'SQL', category: 'Programming Languages', aliases: ['sql', 'structured query language'] },
  { canonical: 'HTML', category: 'Programming Languages', aliases: ['html', 'html5'] },
  { canonical: 'CSS', category: 'Programming Languages', aliases: ['css', 'css3'] },

  // --- Frameworks ---
  { canonical: 'Spring Boot', category: 'Frameworks', aliases: ['spring boot', 'springboot', 'spring framework', 'spring mvc'] },
  { canonical: 'FastAPI', category: 'Frameworks', aliases: ['fastapi', 'fast api'] },
  { canonical: 'Express', category: 'Frameworks', aliases: ['express', 'express.js', 'expressjs'] },
  { canonical: 'NestJS', category: 'Frameworks', aliases: ['nestjs', 'nest.js', 'nest js'] },
  { canonical: 'Django', category: 'Frameworks', aliases: ['django', 'django rest'] },
  { canonical: 'Flask', category: 'Frameworks', aliases: ['flask'] },
  { canonical: 'ASP.NET', category: 'Frameworks', aliases: ['asp.net', 'asp.net core', 'dotnet core', '.net core', '.net'] },
  { canonical: 'Laravel', category: 'Frameworks', aliases: ['laravel'] },
  { canonical: 'Ruby on Rails', category: 'Frameworks', aliases: ['ruby on rails', 'rails', 'ror'] },
  { canonical: 'React', category: 'Frameworks', aliases: ['react', 'react.js', 'reactjs'] },
  { canonical: 'Angular', category: 'Frameworks', aliases: ['angular', 'angular.js', 'angularjs', 'angular 2+'] },
  { canonical: 'Vue', category: 'Frameworks', aliases: ['vue', 'vue.js', 'vuejs', 'vue3'] },
  { canonical: 'Next.js', category: 'Frameworks', aliases: ['next.js', 'nextjs', 'next js'] },
  { canonical: 'Nuxt', category: 'Frameworks', aliases: ['nuxt', 'nuxt.js', 'nuxtjs'] },
  { canonical: 'Svelte', category: 'Frameworks', aliases: ['svelte', 'sveltekit'] },
  { canonical: 'Redux', category: 'Frameworks', aliases: ['redux', 'redux toolkit'] },
  { canonical: 'Tailwind CSS', category: 'Frameworks', aliases: ['tailwind css', 'tailwindcss', 'tailwind'] },
  { canonical: 'Bootstrap', category: 'Frameworks', aliases: ['bootstrap', 'bootstrap 5'] },
  { canonical: 'Node.js', category: 'Frameworks', aliases: ['node.js', 'nodejs', 'node'] },
  { canonical: 'REST API', category: 'Frameworks', aliases: ['rest api', 'restful api', 'restful apis', 'rest apis', 'restful'] },
  { canonical: 'Microservices Architecture', category: 'Frameworks', aliases: ['microservices architecture', 'microservices', 'microservice', 'microservice architecture'] },
  { canonical: 'GraphQL', category: 'Frameworks', aliases: ['graphql', 'apollo graphql'] },

  // --- Databases ---
  { canonical: 'MySQL', category: 'Databases', aliases: ['mysql', 'my sql'] },
  { canonical: 'PostgreSQL', category: 'Databases', aliases: ['postgresql', 'postgres', 'postgres db', 'pg'] },
  { canonical: 'MongoDB', category: 'Databases', aliases: ['mongodb', 'mongo', 'mongodb atlas'] },
  { canonical: 'MongoDB Atlas', category: 'Databases', aliases: ['mongodb atlas'] },
  { canonical: 'Redis', category: 'Databases', aliases: ['redis', 'redis cache'] },
  { canonical: 'SQLite', category: 'Databases', aliases: ['sqlite', 'sqlite3'] },
  { canonical: 'Oracle', category: 'Databases', aliases: ['oracle', 'oracle db', 'oracle database'] },
  { canonical: 'SQL Server', category: 'Databases', aliases: ['sql server', 'mssql', 'microsoft sql server'] },
  { canonical: 'Cassandra', category: 'Databases', aliases: ['cassandra', 'apache cassandra'] },
  { canonical: 'Elasticsearch', category: 'Databases', aliases: ['elasticsearch', 'elastic search', 'elk'] },
  { canonical: 'DynamoDB', category: 'Databases', aliases: ['dynamodb', 'amazon dynamodb'] },
  { canonical: 'Supabase', category: 'Databases', aliases: ['supabase'] },
  { canonical: 'Firebase', category: 'Databases', aliases: ['firebase', 'firestore', 'realtime database'] },
  { canonical: 'Snowflake', category: 'Databases', aliases: ['snowflake', 'snowflake data warehouse'] },
  { canonical: 'BigQuery', category: 'Databases', aliases: ['bigquery', 'google bigquery'] },

  // --- Cloud Platforms ---
  { canonical: 'AWS', category: 'Cloud Platforms', aliases: ['aws', 'amazon web services', 'aws cloud', 'aws cloud services'] },
  { canonical: 'Azure', category: 'Cloud Platforms', aliases: ['azure', 'microsoft azure', 'azure cloud', 'azure devops'] },
  { canonical: 'Google Cloud Platform', category: 'Cloud Platforms', aliases: ['google cloud platform', 'gcp', 'google cloud', 'google cloud services'] },
  { canonical: 'Cloudflare', category: 'Cloud Platforms', aliases: ['cloudflare', 'cloudflare workers'] },
  { canonical: 'Heroku', category: 'Cloud Platforms', aliases: ['heroku'] },
  { canonical: 'DigitalOcean', category: 'Cloud Platforms', aliases: ['digitalocean'] },

  // --- DevOps Tools ---
  { canonical: 'Docker', category: 'DevOps Tools', aliases: ['docker', 'docker container', 'dockerization', 'containerization', 'containers', 'container'] },
  { canonical: 'Kubernetes', category: 'DevOps Tools', aliases: ['kubernetes', 'k8s', 'k8'] },
  { canonical: 'Terraform', category: 'DevOps Tools', aliases: ['terraform', 'tf'] },
  { canonical: 'Jenkins', category: 'DevOps Tools', aliases: ['jenkins', 'jenkins ci'] },
  { canonical: 'GitHub Actions', category: 'DevOps Tools', aliases: ['github actions', 'gh actions'] },
  { canonical: 'GitLab CI', category: 'DevOps Tools', aliases: ['gitlab ci', 'gitlab ci/cd', 'gitlab-ci'] },
  { canonical: 'Ansible', category: 'DevOps Tools', aliases: ['ansible'] },
  { canonical: 'Helm', category: 'DevOps Tools', aliases: ['helm', 'helm charts'] },
  { canonical: 'CI/CD', category: 'DevOps Tools', aliases: ['ci/cd', 'ci cd', 'continuous integration', 'continuous deployment'] },
  { canonical: 'Azure DevOps', category: 'DevOps Tools', aliases: ['azure devops'] },
  { canonical: 'Prometheus', category: 'DevOps Tools', aliases: ['prometheus'] },
  { canonical: 'Grafana', category: 'DevOps Tools', aliases: ['grafana'] },

  // --- Tools & Infrastructure ---
  { canonical: 'Git', category: 'Tools & Infrastructure', aliases: ['git', 'version control', 'github', 'gitlab'] },
  { canonical: 'Linux', category: 'Tools & Infrastructure', aliases: ['linux', 'unix', 'ubuntu', 'debian', 'centos', 'rhel'] },
  { canonical: 'Postman', category: 'Tools & Infrastructure', aliases: ['postman'] },
  { canonical: 'Swagger', category: 'Tools & Infrastructure', aliases: ['swagger', 'openapi'] },
  { canonical: 'RabbitMQ', category: 'Tools & Infrastructure', aliases: ['rabbitmq'] },
  { canonical: 'Kafka', category: 'Tools & Infrastructure', aliases: ['kafka', 'apache kafka'] },
  { canonical: 'Nginx', category: 'Tools & Infrastructure', aliases: ['nginx'] },
  { canonical: 'Apache', category: 'Tools & Infrastructure', aliases: ['apache', 'apache http'] },
  { canonical: 'Jira', category: 'Tools & Infrastructure', aliases: ['jira'] },
  { canonical: 'WebSockets', category: 'Tools & Infrastructure', aliases: ['websockets', 'websocket'] },

  // --- AI / ML Technologies ---
  { canonical: 'PyTorch', category: 'AI / ML Technologies', aliases: ['pytorch'] },
  { canonical: 'TensorFlow', category: 'AI / ML Technologies', aliases: ['tensorflow', 'tf'] },
  { canonical: 'LangChain', category: 'AI / ML Technologies', aliases: ['langchain'] },
  { canonical: 'LangGraph', category: 'AI / ML Technologies', aliases: ['langgraph'] },
  { canonical: 'OpenAI', category: 'AI / ML Technologies', aliases: ['openai', 'gpt-4', 'chatgpt'] },
  { canonical: 'Gemini', category: 'AI / ML Technologies', aliases: ['gemini', 'google gemini'] },
  { canonical: 'Ollama', category: 'AI / ML Technologies', aliases: ['ollama'] },
  { canonical: 'FAISS', category: 'AI / ML Technologies', aliases: ['faiss'] },
  { canonical: 'Pinecone', category: 'AI / ML Technologies', aliases: ['pinecone'] },
  { canonical: 'RAG', category: 'AI / ML Technologies', aliases: ['rag', 'retrieval augmented generation'] },
  { canonical: 'Vector Database', category: 'AI / ML Technologies', aliases: ['vector database', 'vector db', 'vector search'] },
  { canonical: 'Machine Learning', category: 'AI / ML Technologies', aliases: ['machine learning', 'ml'] },
  { canonical: 'Artificial Intelligence', category: 'AI / ML Technologies', aliases: ['artificial intelligence', 'ai'] },

  // --- Mobile Technologies ---
  { canonical: 'React Native', category: 'Frameworks', aliases: ['react native'] },
  { canonical: 'Flutter', category: 'Frameworks', aliases: ['flutter'] },
  { canonical: 'Android', category: 'Tools & Infrastructure', aliases: ['android', 'android sdk'] },
  { canonical: 'iOS', category: 'Tools & Infrastructure', aliases: ['ios', 'ios development'] },

  // --- Soft Skills ---
  { canonical: 'Leadership', category: 'Soft Skills', aliases: ['leadership', 'leading', 'lead'] },
  { canonical: 'Communication', category: 'Soft Skills', aliases: ['communication', 'written communication', 'verbal communication'] },
  { canonical: 'Problem Solving', category: 'Soft Skills', aliases: ['problem solving', 'problem-solving', 'analytical skills'] },
  { canonical: 'Agile', category: 'Soft Skills', aliases: ['agile', 'agile methodology'] },
  { canonical: 'Scrum', category: 'Soft Skills', aliases: ['scrum', 'scrum master'] },
  { canonical: 'Teamwork', category: 'Soft Skills', aliases: ['teamwork', 'collaboration', 'collaborative'] },
  { canonical: 'Mentorship', category: 'Soft Skills', aliases: ['mentorship', 'mentoring', 'coaching'] },
  { canonical: 'Project Management', category: 'Soft Skills', aliases: ['project management'] },
];

export class HeatmapEngine {
  constructor(private storage?: StorageProvider) {}

  /**
   * Helper: Calculates Levenshtein Distance for fuzzy matching.
   */
  private levenshteinDistance(a: string, b: string): number {
    const matrix: number[][] = [];
    for (let i = 0; i <= b.length; i++) matrix[i] = [i];
    for (let j = 0; j <= a.length; j++) matrix[0][j] = j;

    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        if (b.charAt(i - 1) === a.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            Math.min(matrix[i][j - 1] + 1, matrix[i - 1][j] + 1)
          );
        }
      }
    }
    return matrix[b.length][a.length];
  }

  /**
   * Helper: Calculates string similarity ratio (0.0 to 1.0).
   */
  private getSimilarityRatio(str1: string, str2: string): number {
    const s1 = str1.toLowerCase().trim();
    const s2 = str2.toLowerCase().trim();
    if (s1 === s2) return 1.0;
    const maxLen = Math.max(s1.length, s2.length);
    if (maxLen === 0) return 1.0;
    const distance = this.levenshteinDistance(s1, s2);
    return 1.0 - distance / maxLen;
  }

  /**
   * Tokenizes and extracts normalized, high-value technical keywords & multi-word technology phrases from text.
   */
  public extractKeywords(text: string): string[] {
    const extracted = this.extractDetailedKeywords(text);
    return Array.from(new Set(extracted.map(item => item.canonical.toLowerCase())));
  }

  /**
   * Detailed Keyword Extractor returning canonical tech objects found in text.
   */
  public extractDetailedKeywords(text: string): { canonical: string; category: string; matchedAlias: string }[] {
    if (!text || text.trim() === '') return [];

    const lowerText = text.toLowerCase();
    const foundMap = new Map<string, { canonical: string; category: string; matchedAlias: string }>();

    // 1. Scan Dictionary Multi-word and Single-word Aliases
    for (const tech of TECH_DICTIONARY) {
      for (const alias of tech.aliases) {
        const escaped = alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const leadingBoundary = `(?:^|[^a-zA-Z0-9#+.])`;
        const lastChar = alias[alias.length - 1];
        const trailingBoundary = /[a-zA-Z0-9]/.test(lastChar)
          ? `(?![a-zA-Z0-9])`
          : `(?![a-zA-Z0-9+#])`;

        const regex = new RegExp(`${leadingBoundary}(${escaped})${trailingBoundary}`, 'i');
        
        if (regex.test(lowerText)) {
          if (!foundMap.has(tech.canonical.toLowerCase())) {
            foundMap.set(tech.canonical.toLowerCase(), {
              canonical: tech.canonical,
              category: tech.category,
              matchedAlias: alias,
            });
          }
          break;
        }
      }
    }

    // 2. Fallback for unlisted single tech tokens (excluding stop words)
    const words = lowerText
      .replace(/[^a-z0-9#+.]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length >= 2 && !STOP_WORDS.has(w));

    for (const word of words) {
      const normalizedKey = word.toLowerCase();
      if (!foundMap.has(normalizedKey)) {
        let matchedTech: TechDefinition | undefined;
        for (const tech of TECH_DICTIONARY) {
          if (tech.aliases.some(a => a.toLowerCase() === normalizedKey)) {
            matchedTech = tech;
            break;
          }
        }

        if (matchedTech) {
          foundMap.set(matchedTech.canonical.toLowerCase(), {
            canonical: matchedTech.canonical,
            category: matchedTech.category,
            matchedAlias: word,
          });
        }
      }
    }

    return Array.from(foundMap.values());
  }

  /**
   * Calculates density match percentage between matched keywords and total job keywords.
   */
  public calculateMatchDensity(matchedCount: number, totalJobKeywords: number): number {
    if (totalJobKeywords <= 0) return 0;
    const density = (matchedCount / totalJobKeywords) * 100;
    return Math.min(100, Math.max(0, Math.round(density * 10) / 10));
  }

  /**
   * Helper: Performs evidence-based conservative Semantic Skill Inference.
   */
  private inferSemanticMatch(targetCanonical: string, resumeContent: string): { inferred: boolean; inferredFrom?: string } {
    const canonLower = targetCanonical.toLowerCase();
    
    // Strict exclusion check: never infer infrastructure/cloud tools
    if (STRICT_EXCLUSIONS.has(canonLower)) {
      return { inferred: false };
    }

    const lowerResume = resumeContent.toLowerCase();

    for (const rule of SEMANTIC_RULES) {
      if (rule.targetCanonical.toLowerCase() === canonLower) {
        for (const trigger of rule.triggers) {
          if (lowerResume.includes(trigger.toLowerCase())) {
            return {
              inferred: true,
              inferredFrom: rule.inferredFrom,
            };
          }
        }
      }
    }

    return { inferred: false };
  }

  /**
   * Generates enterprise ATS Keyword Match Heatmap comparing Resume against Job Description.
   */
  public generateHeatmap(
    jobId: string,
    resumeProfileId: string,
    jobDescription: string,
    resumeContent: string,
  ): KeywordHeatmap {
    const jobTechItems = this.extractDetailedKeywords(jobDescription);
    const resumeTechItems = this.extractDetailedKeywords(resumeContent);

    // Create lookup structures for resume
    const resumeCanonicalSet = new Set(resumeTechItems.map(item => item.canonical.toLowerCase()));
    const resumeAliasMap = new Map<string, string>();
    resumeTechItems.forEach(item => {
      resumeAliasMap.set(item.canonical.toLowerCase(), item.matchedAlias);
    });

    const matchedDetails: KeywordMatchItem[] = [];
    const semanticDetails: KeywordMatchItem[] = [];
    const missingDetails: KeywordMissingItem[] = [];
    const matchedKeywords: string[] = [];
    const semanticKeywords: string[] = [];
    const missingKeywords: string[] = [];

    // Grouping by Category for Weighted Scoring
    const categoryMap = new Map<string, { matched: KeywordMatchItem[]; missing: KeywordMissingItem[] }>();

    for (const item of jobTechItems) {
      const canonLower = item.canonical.toLowerCase();
      if (!categoryMap.has(item.category)) {
        categoryMap.set(item.category, { matched: [], missing: [] });
      }
      const catEntry = categoryMap.get(item.category)!;

      // 1. Exact Canonical Match (🟢 100% Credit)
      if (resumeCanonicalSet.has(canonLower)) {
        const resumeAlias = resumeAliasMap.get(canonLower) || item.canonical;
        const isExactAlias = resumeAlias.toLowerCase() === item.canonical.toLowerCase();
        
        const matchItem: KeywordMatchItem = {
          keyword: item.canonical,
          category: item.category,
          matchType: isExactAlias ? 'exact' : 'synonym',
          matchedTerm: resumeAlias,
          matchReason: isExactAlias ? 'Matched exactly' : `Matched using synonym (${resumeAlias})`,
          creditPct: 100,
        };
        matchedDetails.push(matchItem);
        matchedKeywords.push(canonLower);
        catEntry.matched.push(matchItem);
        continue;
      }

      // 2. Fuzzy Similarity Search across Resume Tech Items (🟢 100% Credit)
      let fuzzyMatchFound = false;
      for (const resItem of resumeTechItems) {
        const sim = this.getSimilarityRatio(canonLower, resItem.canonical.toLowerCase());
        if (sim >= 0.85) {
          const matchItem: KeywordMatchItem = {
            keyword: item.canonical,
            category: item.category,
            matchType: 'fuzzy',
            matchedTerm: resItem.canonical,
            matchReason: `Matched using fuzzy similarity (${resItem.canonical})`,
            creditPct: 100,
          };
          matchedDetails.push(matchItem);
          matchedKeywords.push(canonLower);
          catEntry.matched.push(matchItem);
          fuzzyMatchFound = true;
          break;
        }
      }

      if (fuzzyMatchFound) continue;

      // 3. Semantic Skill Inference Search (🟡 70% Credit)
      const semanticResult = this.inferSemanticMatch(item.canonical, resumeContent);
      if (semanticResult.inferred) {
        const semItem: KeywordMatchItem = {
          keyword: item.canonical,
          category: item.category,
          matchType: 'semantic',
          inferredFrom: semanticResult.inferredFrom,
          matchReason: `${item.canonical} inferred through ${semanticResult.inferredFrom}`,
          creditPct: 70,
        };
        semanticDetails.push(semItem);
        semanticKeywords.push(canonLower);
        catEntry.matched.push(semItem);
        continue;
      }

      // 4. Missing Keyword (🔴 0% Credit)
      const missItem: KeywordMissingItem = {
        keyword: item.canonical,
        category: item.category,
      };
      missingDetails.push(missItem);
      missingKeywords.push(canonLower);
      catEntry.missing.push(missItem);
    }

    // Calculate Category Breakdown & Weighted ATS Score
    const categoryBreakdown: CategoryBreakdownItem[] = [];
    let totalScoreWeightSum = 0;
    let weightedScoreAccumulator = 0;

    categoryMap.forEach((val, catName) => {
      const weight = CATEGORY_WEIGHTS[catName] || 0.10;
      const totalCount = val.matched.length + val.missing.length;
      
      // Calculate weighted credit sum for category (100% for exact/synonym/fuzzy, 70% for semantic)
      const creditSum = val.matched.reduce((sum, item) => sum + ((item.creditPct ?? 100) / 100), 0);
      const scorePct = totalCount > 0 ? (creditSum / totalCount) * 100 : 0;

      totalScoreWeightSum += weight;
      weightedScoreAccumulator += (scorePct / 100) * weight;

      categoryBreakdown.push({
        category: catName,
        weightPct: Math.round(weight * 100),
        matchedCount: val.matched.length,
        totalCount,
        scorePct: Math.round(scorePct),
        matched: val.matched,
        missing: val.missing,
      });
    });

    // Normalize Weighted Score (0 to 100%)
    const overallAtsScore = totalScoreWeightSum > 0
      ? Math.min(100, Math.max(0, Math.round((weightedScoreAccumulator / totalScoreWeightSum) * 100)))
      : (jobTechItems.length > 0 ? Math.round((matchedKeywords.length / jobTechItems.length) * 100) : 100);

    const matchDensityPct = overallAtsScore;

    // Calculate Highest Impact Improvements & Score Gain
    const highestImpactImprovements: ImpactImprovement[] = [];
    let totalEstimatedGain = 0;

    if (totalScoreWeightSum > 0 && jobTechItems.length > 0) {
      for (const miss of missingDetails) {
        const catWeight = CATEGORY_WEIGHTS[miss.category] || 0.10;
        const catItems = categoryMap.get(miss.category);
        const catTotalCount = catItems ? catItems.matched.length + catItems.missing.length : 1;
        
        // Single keyword addition gain = (categoryWeight / catTotalCount) * (1 / totalScoreWeightSum) * 100
        const gain = Math.max(1, Math.round(((catWeight / catTotalCount) / totalScoreWeightSum) * 100));
        
        highestImpactImprovements.push({
          keyword: miss.keyword,
          category: miss.category,
          estimatedScoreGain: gain,
        });
      }
    }

    // Rank missing skills descending by estimated score gain
    highestImpactImprovements.sort((a, b) => b.estimatedScoreGain - a.estimatedScoreGain);
    totalEstimatedGain = highestImpactImprovements.reduce((sum, item) => sum + item.estimatedScoreGain, 0);

    // Generate AI Insights & Recommendations
    const insights: string[] = [];

    insights.push(`Overall ATS Match Score: ${overallAtsScore}%.`);

    // Semantic Matches Recommendations
    if (semanticDetails.length > 0) {
      semanticDetails.forEach((sem) => {
        insights.push(
          `${sem.keyword} inferred through ${sem.inferredFrom}. Mention it explicitly in your resume to improve ATS compatibility.`
        );
      });
    }

    // Missing High Impact Improvements
    if (highestImpactImprovements.length > 0) {
      const top3 = highestImpactImprovements.slice(0, 3);
      const topList = top3.map((imp) => `+ ${imp.keyword} (+${imp.estimatedScoreGain}%)`).join(', ');
      insights.push(`Highest Impact Improvements: ${topList}.`);
      insights.push(`Adding these high-priority keywords could increase your ATS match score by up to +${totalEstimatedGain}%.`);
    } else {
      insights.push(`Exceptional coverage! Resume covers 100% of detected technical requirements.`);
    }

    const timestamp = new Date().toISOString();

    Logger.info(
      `HeatmapEngine: Generated enterprise ATS heatmap for Job [${jobId}] vs Resume [${resumeProfileId}] (Score: ${overallAtsScore}%, Exact: ${matchedKeywords.length}, Semantic: ${semanticKeywords.length}, Missing: ${missingKeywords.length})`
    );

    return {
      jobId,
      resumeProfileId,
      matchedKeywords,
      semanticKeywords,
      missingKeywords,
      matchDensityPct,
      overallAtsScore,
      categoryBreakdown,
      matchedDetails,
      semanticDetails,
      missingDetails,
      highestImpactImprovements,
      totalEstimatedGain,
      insights,
      timestamp,
    };
  }
}
