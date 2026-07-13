/**
 * LinkedIn Integration Layer
 * 
 * Production-safe LinkedIn integration that never:
 * - Scrapes LinkedIn
 * - Automates browser interactions
 * - Automatically sends connection requests
 * - Automatically sends LinkedIn messages
 * - Circumvents LinkedIn authentication
 * 
 * Instead, it provides:
 * - Extensible architecture for official LinkedIn integrations
 * - CSV/manual import fallbacks
 * - Contact ranking and recommendation algorithms
 * - Email integration for outreach
 */

export interface LinkedInConnection {
  id: string;
  name: string;
  currentRole: string;
  company: string;
  location: string;
  linkedInProfile: string;
  relationship: 'Recruiter' | 'Hiring Manager' | 'Engineering Manager' | 'University Alumni' | 'Employee' | 'Talent Acquisition' | 'HR' | 'Other';
  mutualConnections?: number;
  university?: string;
  team?: string;
  isFirstDegree: boolean;
  confidenceScore: number;
  recommendationReason: string;
}

export interface JobContext {
  company: string;
  jobTitle: string;
  jobDescription?: string;
  userUniversity?: string;
  userSkills?: string[];
}

export interface ContactRanking {
  contact: LinkedInConnection;
  score: number;
  reasons: string[];
}

/**
 * LinkedIn Integration Provider Interface
 * Extensible for future official LinkedIn integrations
 */
export interface LinkedInIntegrationProvider {
  isConnected(): boolean;
  getConnections(): Promise<LinkedInConnection[]>;
  getConnectionsByCompany(company: string): Promise<LinkedInConnection[]>;
  getMutualConnections(contactId: string): Promise<number>;
}

/**
 * Manual/CSV Import Provider
 * Fallback when no official LinkedIn integration is available
 */
export class ManualImportProvider implements LinkedInIntegrationProvider {
  private connections: LinkedInConnection[] = [];

  constructor(connections: LinkedInConnection[] = []) {
    this.connections = connections;
  }

  isConnected(): boolean {
    return this.connections.length > 0;
  }

  async getConnections(): Promise<LinkedInConnection[]> {
    return this.connections;
  }

  async getConnectionsByCompany(company: string): Promise<LinkedInConnection[]> {
    return this.connections.filter(c => 
      c.company.toLowerCase().includes(company.toLowerCase())
    );
  }

  async getMutualConnections(contactId: string): Promise<number> {
    const contact = this.connections.find(c => c.id === contactId);
    return contact?.mutualConnections || 0;
  }

  addConnection(connection: LinkedInConnection): void {
    this.connections.push(connection);
  }

  importFromCSV(csvData: string): LinkedInConnection[] {
    const lines = csvData.split('\n');
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    
    const connections: LinkedInConnection[] = [];
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',');
      if (values.length < 4) continue;
      
      const connection: LinkedInConnection = {
        id: `manual-${Date.now()}-${i}`,
        name: values[0]?.trim() || '',
        currentRole: values[1]?.trim() || '',
        company: values[2]?.trim() || '',
        location: values[3]?.trim() || '',
        linkedInProfile: values[4]?.trim() || '',
        relationship: this.parseRelationship(values[5]?.trim() || 'Other'),
        mutualConnections: parseInt(values[6]?.trim() || '0'),
        university: values[7]?.trim(),
        team: values[8]?.trim(),
        isFirstDegree: values[9]?.trim().toLowerCase() === 'true',
        confidenceScore: 0,
        recommendationReason: ''
      };
      
      connections.push(connection);
    }
    
    this.connections = [...this.connections, ...connections];
    return connections;
  }

  private parseRelationship(value: string): LinkedInConnection['relationship'] {
    const lower = value.toLowerCase();
    if (lower.includes('recruiter')) return 'Recruiter';
    if (lower.includes('hiring manager')) return 'Hiring Manager';
    if (lower.includes('engineering manager')) return 'Engineering Manager';
    if (lower.includes('alumni')) return 'University Alumni';
    if (lower.includes('talent acquisition')) return 'Talent Acquisition';
    if (lower.includes('hr')) return 'HR';
    if (lower.includes('employee')) return 'Employee';
    return 'Other';
  }
}

/**
 * Contact Ranking Algorithm
 * Ranks contacts based on relevance to a specific job
 */
export class ContactRanker {
  private rankingPriorities: Record<string, number> = {
    'First-degree Recruiter': 100,
    'First-degree Hiring Manager': 90,
    'First-degree Engineering Manager': 85,
    'University Alumni': 75,
    'Same Team Employee': 70,
    'Talent Acquisition': 60,
    'HR': 50,
    'Other': 20
  };

  rankContacts(contacts: LinkedInConnection[], jobContext: JobContext): ContactRanking[] {
    return contacts
      .map(contact => this.calculateScore(contact, jobContext))
      .sort((a, b) => b.score - a.score);
  }

  private calculateScore(contact: LinkedInConnection, jobContext: JobContext): ContactRanking {
    let score = 0;
    const reasons: string[] = [];

    // Base score from relationship priority
    const relationshipKey = this.getRelationshipKey(contact, jobContext);
    score += this.rankingPriorities[relationshipKey] || 20;
    reasons.push(this.getRelationshipReason(contact, jobContext));

    // First-degree connection bonus
    if (contact.isFirstDegree) {
      score += 30;
      reasons.push('First-degree connection');
    }

    // Same company match
    if (contact.company.toLowerCase().includes(jobContext.company.toLowerCase())) {
      score += 25;
      reasons.push(`Works at ${jobContext.company}`);
    }

    // University alumni bonus
    if (contact.university && jobContext.userUniversity && 
        contact.university.toLowerCase() === jobContext.userUniversity.toLowerCase()) {
      score += 20;
      reasons.push(`University alumni from ${jobContext.userUniversity}`);
    }

    // Same team bonus
    if (contact.team && jobContext.jobTitle && 
        this.isRelevantTeam(contact.team, jobContext.jobTitle)) {
      score += 15;
      reasons.push(`Works in relevant team: ${contact.team}`);
    }

    // Mutual connections bonus
    if (contact.mutualConnections && contact.mutualConnections > 0) {
      score += Math.min(contact.mutualConnections * 2, 20);
      reasons.push(`${contact.mutualConnections} mutual connections`);
    }

    // Skills match bonus (if skills provided)
    if (jobContext.userSkills && jobContext.userSkills.length > 0) {
      const roleLower = contact.currentRole.toLowerCase();
      const skillMatch = jobContext.userSkills.some(skill => 
        roleLower.includes(skill.toLowerCase())
      );
      if (skillMatch) {
        score += 10;
        reasons.push('Role matches your skills');
      }
    }

    // Normalize score to 0-100
    const normalizedScore = Math.min(Math.round(score), 100);
    contact.confidenceScore = normalizedScore;
    contact.recommendationReason = reasons.join('; ');

    return {
      contact,
      score: normalizedScore,
      reasons
    };
  }

  private getRelationshipKey(contact: LinkedInConnection, jobContext: JobContext): string {
    if (contact.isFirstDegree) {
      return `First-degree ${contact.relationship}`;
    }
    return contact.relationship;
  }

  private getRelationshipReason(contact: LinkedInConnection, jobContext: JobContext): string {
    const degree = contact.isFirstDegree ? 'First-degree' : 'Second-degree';
    return `${degree} ${contact.relationship} at ${contact.company}`;
  }

  private isRelevantTeam(team: string, jobTitle: string): string {
    const teamLower = team.toLowerCase();
    const titleLower = jobTitle.toLowerCase();
    
    const relevantTeams = [
      'engineering', 'software', 'product', 'data', 'machine learning',
      'frontend', 'backend', 'full stack', 'devops', 'cloud'
    ];
    
    return relevantTeams.some(rt => 
      teamLower.includes(rt) && titleLower.includes(rt)
    ) ? team : '';
  }
}

/**
 * LinkedIn Integration Manager
 * Main entry point for LinkedIn integration
 */
export class LinkedInIntegrationManager {
  private provider: LinkedInIntegrationProvider;
  private ranker: ContactRanker;

  constructor(provider?: LinkedInIntegrationProvider) {
    this.provider = provider || new ManualImportProvider();
    this.ranker = new ContactRanker();
  }

  setProvider(provider: LinkedInIntegrationProvider): void {
    this.provider = provider;
  }

  async getRecommendedContacts(jobContext: JobContext): Promise<ContactRanking[]> {
    const connections = await this.provider.getConnectionsByCompany(jobContext.company);
    return this.ranker.rankContacts(connections, jobContext);
  }

  async getAllConnections(): Promise<LinkedInConnection[]> {
    return this.provider.getConnections();
  }

  isConnected(): boolean {
    return this.provider.isConnected();
  }

  async getMutualConnections(contactId: string): Promise<number> {
    return this.provider.getMutualConnections(contactId);
  }
}

/**
 * Email Integration for Gmail
 * Provides email prefill and actions
 */
export interface EmailContext {
  to: string;
  subject: string;
  body: string;
  cc?: string;
  bcc?: string;
}

export class EmailIntegration {
  /**
   * Generate Gmail compose URL
   */
  static generateGmailUrl(context: EmailContext): string {
    const params = new URLSearchParams({
      to: context.to,
      subject: context.subject,
      body: context.body
    });
    
    if (context.cc) params.append('cc', context.cc);
    if (context.bcc) params.append('bcc', context.bcc);
    
    return `https://mail.google.com/mail/?view=cm&${params.toString()}`;
  }

  /**
   * Generate .eml file content
   */
  static generateEML(context: EmailContext): string {
    const date = new Date().toISOString().replace(/T/, ' ').replace(/\.\d+Z/, '');
    
    return `From: <>
To: <${context.to}>
Subject: ${context.subject}
Date: ${date}
MIME-Version: 1.0
Content-Type: text/plain; charset=utf-8

${context.body}`;
  }

  /**
   * Download .eml file
   */
  static downloadEML(context: EmailContext, filename: string = 'email.eml'): void {
    const emlContent = this.generateEML(context);
    const blob = new Blob([emlContent], { type: 'message/rfc822' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /**
   * Copy text to clipboard
   */
  static async copyToClipboard(text: string): Promise<boolean> {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      return false;
    }
  }
}

/**
 * Message Templates Generator
 * Generates personalized messages for different outreach types
 */
export class MessageTemplates {
  static generateConnectionRequest(contact: LinkedInConnection, jobContext: JobContext): string {
    const { name, company, currentRole } = contact;
    const { jobTitle, userUniversity } = jobContext;
    
    let message = `Hi ${name},\n\n`;
    
    if (userUniversity && contact.university === userUniversity) {
      message += `I noticed we're both alumni from ${userUniversity}. `;
    }
    
    message += `I came across your profile while researching opportunities at ${company}. `;
    message += `I'm interested in the ${jobTitle} position and would love to connect to learn more about your experience as a ${currentRole}.\n\n`;
    message += `Best regards`;
    
    return message;
  }

  static generateReferralRequest(contact: LinkedInConnection, jobContext: JobContext): string {
    const { name, company, currentRole } = contact;
    const { jobTitle, jobDescription } = jobContext;
    
    let message = `Hi ${name},\n\n`;
    message += `I hope you're doing well. I'm writing to express my interest in the ${jobTitle} position at ${company}. `;
    message += `Given your experience as a ${currentRole}, I thought you might be able to provide some insights or potentially refer me.\n\n`;
    
    if (jobDescription) {
      message += `The role aligns well with my background in [relevant skills], and I'm particularly excited about [specific aspect from job description].\n\n`;
    }
    
    message += `If you're open to it, I'd appreciate any guidance you could provide. Thank you for considering my request.\n\n`;
    message += `Best regards`;
    
    return message;
  }

  static generateFollowUpMessage(contact: LinkedInConnection, jobContext: JobContext, daysSinceContact: number): string {
    const { name } = contact;
    
    let message = `Hi ${name},\n\n`;
    message += `I hope you're having a good week. I wanted to follow up on my previous message regarding the ${jobContext.jobTitle} position at ${jobContext.company}.\n\n`;
    
    if (daysSinceContact < 7) {
      message += `I understand you're likely busy, but I wanted to reiterate my interest and see if there might be any updates.\n\n`;
    } else {
      message += `It's been a while since we last connected, so I wanted to check in and see if you might have any insights to share.\n\n`;
    }
    
    message += `Thank you again for your time and consideration.\n\n`;
    message += `Best regards`;
    
    return message;
  }

  static generateColdEmail(contact: LinkedInConnection, jobContext: JobContext): string {
    const { name, company, currentRole } = contact;
    const { jobTitle, userUniversity } = jobContext;
    
    let message = `Subject: Inquiry about ${jobTitle} position at ${company}\n\n`;
    message += `Dear ${name},\n\n`;
    message += `I hope this email finds you well. I am writing to express my strong interest in the ${jobTitle} position at ${company}.\n\n`;
    
    if (userUniversity) {
      message += `As a graduate from ${userUniversity}, I have developed [relevant skills] that align well with this role. `;
    }
    
    message += `Given your experience as a ${currentRole}, I would value any insights you might share about the team culture or the position.\n\n`;
    message += `I have attached my resume for your review and would welcome the opportunity to discuss how my background might contribute to ${company}.\n\n`;
    message += `Thank you for your time and consideration.\n\n`;
    message += `Best regards`;
    
    return message;
  }
}
