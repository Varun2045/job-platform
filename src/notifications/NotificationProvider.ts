export interface DigestJob {
  companyName: string;
  title: string;
  location: string;
  experience: string;
  employmentType: string;
  datePosted: string;
  applyUrl: string;
  jobId: string;
  matchScore: number;
  isRemote: boolean;
}

export interface JobDigest {
  runTimestamp: string;
  totalCompaniesChecked: number;
  totalJobsFound: number;
  totalNewJobs: number;
  jobs: DigestJob[];
}

export interface NotificationProvider {
  id: string;
  sendDigest(digest: JobDigest): Promise<void>;
}
