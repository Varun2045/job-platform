import { ResumeMatcher } from '../core/ResumeMatcher.js';
import { Job } from '../companies/Scraper.js';

describe('ResumeMatcher Unit Tests', () => {
  const createMockJob = (title: string, description: string): Job => ({
    company: 'Google',
    id: 'test_job_1',
    title,
    location: 'Bangalore, India',
    country: 'India',
    experience: 'Early Career',
    employmentType: 'Full-time',
    url: 'https://careers.google.com/jobs/results/test_job_1',
    datePosted: new Date().toISOString(),
    team: 'Engineering',
    source: 'google',
    isRemote: false,
    salary: 'Not Specified',
    description,
    jobHash: 'hash_test_1'
  });

  it('should score a backend developer job highly on the backend profile', () => {
    const job = createMockJob(
      'Software Engineer, Backend (Node.js/TypeScript)',
      'We are looking for a Software Engineer to join our backend systems team. You will build highly scalable microservices using TypeScript, Node.js, Express, and PostgreSQL. Experience with distributed systems and database queries is required.'
    );

    const score = ResumeMatcher.match(job, 'backend');
    expect(score).toBeGreaterThanOrEqual(70);

    const aiScore = ResumeMatcher.match(job, 'ai');
    // The AI resume should score lower than backend resume for a pure backend job
    expect(score).toBeGreaterThan(aiScore);
  });

  it('should score an AI/ML job highly on the AI profile', () => {
    const job = createMockJob(
      'Machine Learning Engineer (NLP & LLMs)',
      'Join our team to train, evaluate and deploy machine learning models. You will work with PyTorch, TensorFlow, Transformers, and build RAG pipelines using LangChain and Pinecone vector databases. Experience fine-tuning LLMs is required.'
    );

    const score = ResumeMatcher.match(job, 'ai');
    expect(score).toBeGreaterThanOrEqual(70);

    const backendScore = ResumeMatcher.match(job, 'backend');
    // Backend resume should score lower on a pure AI/ML job
    expect(score).toBeGreaterThan(backendScore);
  });

  it('should apply senior experience level penalty for senior target roles', () => {
    const juniorJob = createMockJob(
      'Associate Software Engineer (Graduate)',
      'Looking for a university graduate or early career backend developer.'
    );
    const seniorJob = createMockJob(
      'Principal Software Engineering Manager',
      'Manage a team of engineers. Must have 10+ years of experience leading projects.'
    );

    const juniorScore = ResumeMatcher.match(juniorJob, 'backend');
    const seniorScore = ResumeMatcher.match(seniorJob, 'backend');

    // Experience score should penalize the senior role leading to a lower overall score
    expect(juniorScore).toBeGreaterThan(seniorScore);
  });
});
