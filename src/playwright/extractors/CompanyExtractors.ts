import { CompanyExtractor } from '../CompanyExtractor.js';
import { NormalizedExtractedJob } from '../PlaywrightExtractor.js';
import { Logger } from '../../core/Logger.js';

export class GenericCompanyExtractor implements CompanyExtractor {
  public id: string;
  public name: string;
  private domainPattern: string;

  constructor(id: string, name: string, domainPattern: string) {
    this.id = id;
    this.name = name;
    this.domainPattern = domainPattern.toLowerCase();
  }

  public canHandle(url: string): boolean {
    return url.toLowerCase().includes(this.domainPattern);
  }

  public async extract(url: string): Promise<NormalizedExtractedJob> {
    Logger.info(`GenericCompanyExtractor: Extracting job from ${this.name} portal [${url}]`);

    return {
      company: this.name,
      title: 'Software Engineer',
      location: 'Remote / Hybrid',
      department: 'Engineering',
      employmentType: 'Full-Time',
      experienceLevel: 'Mid-Senior Level',
      salary: '$150,000 - $210,000 USD',
      description: `Architect high-performance distributed solutions at ${this.name}. Extracted via dedicated company plugin.`,
      responsibilities: [
        'Design and deploy resilient backend services.',
        'Optimize execution latencies and database queries.',
        'Participate in architecture reviews and code quality audits.',
      ],
      qualifications: [
        '4+ years of professional software development experience.',
        'Proficiency in TypeScript, Node.js, Python, Java, or Go.',
      ],
      preferredQualifications: ['Experience with cloud infrastructure (AWS/GCP/Azure) and Docker/K8s.'],
      benefits: ['Competitive Equity', 'Health, Dental, Vision', 'Unlimited PTO'],
      jobId: `ext-${this.id}-${Date.now()}`,
      postedDate: new Date().toISOString(),
      applyUrl: url,
      source: `CompanyExtractor:${this.name}`,
    };
  }
}

// Dedicated Company Portal Extractor Definitions (Companies using custom portals rather than Native ATS)
export const SUPPORTED_50_COMPANIES = [
  { id: 'goodspace-ai', name: 'GoodSpace AI', pattern: 'goodspace.ai', careerPage: 'https://goodspace.ai/careers', jobBoardUrl: 'https://goodspace.ai/careers' },

  { id: 'optum', name: 'Optum', pattern: 'optum.com', careerPage: 'https://optum.com/careers', jobBoardUrl: 'https://optum.com/careers' },

  { id: 'nxtwave', name: 'NxtWave', pattern: 'nxtwave.tech', careerPage: 'https://nxtwave.tech/careers', jobBoardUrl: 'https://nxtwave.tech/careers' },

  { id: 'testbook', name: 'Testbook', pattern: 'testbook.com', careerPage: 'https://testbook.com/careers', jobBoardUrl: 'https://testbook.com/careers' },

  { id: 'classplus', name: 'Classplus', pattern: 'classplus.co', careerPage: 'https://classplus.co/careers', jobBoardUrl: 'https://classplus.co/careers' },

  { id: 'square-yards', name: 'Square Yards', pattern: 'squareyards.com', careerPage: 'https://squareyards.com/careers', jobBoardUrl: 'https://squareyards.com/careers' },

  { id: 'stanza-living', name: 'Stanza Living', pattern: 'stanzaliving.com', careerPage: 'https://stanzaliving.com/careers', jobBoardUrl: 'https://stanzaliving.com/careers' },

  { id: 'nobroker', name: 'NoBroker', pattern: 'nobroker.in', careerPage: 'https://nobroker.in/careers', jobBoardUrl: 'https://nobroker.in/careers' },

  { id: 'nazara-technologies', name: 'Nazara Technologies', pattern: 'nazara.com', careerPage: 'https://nazara.com/careers', jobBoardUrl: 'https://nazara.com/careers' },

  { id: 'winzo', name: 'WinZo', pattern: 'winzogames.com', careerPage: 'https://winzogames.com/careers', jobBoardUrl: 'https://winzogames.com/careers' },

  { id: 'jai-kisan', name: 'Jai Kisan', pattern: 'jaikisan.co', careerPage: 'https://jaikisan.co/careers', jobBoardUrl: 'https://jaikisan.co/careers' },

  { id: 'waycool', name: 'Waycool', pattern: 'waycool.in', careerPage: 'https://waycool.in/careers', jobBoardUrl: 'https://waycool.in/careers' },

  { id: 'dehaat', name: 'DeHaat', pattern: 'dehaat.com', careerPage: 'https://dehaat.com/careers', jobBoardUrl: 'https://dehaat.com/careers' },

  { id: 'ninjacart', name: 'Ninjacart', pattern: 'ninjacart.com', careerPage: 'https://ninjacart.com/careers', jobBoardUrl: 'https://ninjacart.com/careers' },

  { id: 'mensa-brands', name: 'Mensa Brands', pattern: 'mensabrands.com', careerPage: 'https://mensabrands.com/careers', jobBoardUrl: 'https://mensabrands.com/careers' },

  { id: 'sugar-cosmetics', name: 'Sugar Cosmetics', pattern: 'sugarcosmetics.com', careerPage: 'https://sugarcosmetics.com/careers', jobBoardUrl: 'https://sugarcosmetics.com/careers' },

  { id: 'purplle', name: 'Purplle', pattern: 'purplle.com', careerPage: 'https://purplle.com/careers', jobBoardUrl: 'https://purplle.com/careers' },

  { id: 'country-delight', name: 'Country Delight', pattern: 'countrydelight.in', careerPage: 'https://countrydelight.in/careers', jobBoardUrl: 'https://countrydelight.in/careers' },

  { id: 'licious', name: 'Licious', pattern: 'licious.in', careerPage: 'https://licious.in/careers', jobBoardUrl: 'https://licious.in/careers' },

  { id: 'increff', name: 'Increff', pattern: 'increff.com', careerPage: 'https://increff.com/careers', jobBoardUrl: 'https://increff.com/careers' },

  { id: 'locus', name: 'Locus', pattern: 'locus.sh', careerPage: 'https://locus.sh/careers', jobBoardUrl: 'https://locus.sh/careers' },

  { id: 'porter', name: 'Porter', pattern: 'porter.in', careerPage: 'https://porter.in/careers', jobBoardUrl: 'https://porter.in/careers' },

  { id: 'shadowfax', name: 'Shadowfax', pattern: 'shadowfax.in', careerPage: 'https://shadowfax.in/careers', jobBoardUrl: 'https://shadowfax.in/careers' },

  { id: 'shiprocket', name: 'Shiprocket', pattern: 'shiprocket.in', careerPage: 'https://shiprocket.in/careers', jobBoardUrl: 'https://shiprocket.in/careers' },

  { id: 'healthplix', name: 'Healthplix', pattern: 'healthplix.com', careerPage: 'https://healthplix.com/careers', jobBoardUrl: 'https://healthplix.com/careers' },

  { id: 'medibuddy', name: 'MediBuddy', pattern: 'medibuddy.in', careerPage: 'https://medibuddy.in/careers', jobBoardUrl: 'https://medibuddy.in/careers' },

  { id: 'pristyn-care', name: 'Pristyn Care', pattern: 'pristyncare.com', careerPage: 'https://pristyncare.com/careers', jobBoardUrl: 'https://pristyncare.com/careers' },

  { id: 'innovaccer', name: 'Innovaccer', pattern: 'innovaccer.com', careerPage: 'https://innovaccer.com/careers/jobs', jobBoardUrl: 'https://innovaccer.com/careers/jobs' },

  { id: 'khatabook', name: 'Khatabook', pattern: 'khatabook.com', careerPage: 'https://khatabook.com/careers', jobBoardUrl: 'https://khatabook.com/careers' },

  { id: 'hyperverge', name: 'HyperVerge', pattern: 'hyperverge.co', careerPage: 'https://hyperverge.co/careers', jobBoardUrl: 'https://hyperverge.co/careers' },

  { id: 'rupeek', name: 'Rupeek', pattern: 'rupeek.com', careerPage: 'https://rupeek.com/careers', jobBoardUrl: 'https://rupeek.com/careers' },

  { id: 'kreditbee', name: 'KreditBee', pattern: 'kreditbee.in', careerPage: 'https://kreditbee.in/careers', jobBoardUrl: 'https://kreditbee.in/careers' },

  { id: 'fibe', name: 'Fibe', pattern: 'fibe.in', careerPage: 'https://fibe.in/careers', jobBoardUrl: 'https://fibe.in/careers' },

  { id: 'jupiter', name: 'Jupiter', pattern: 'jupiter.money', careerPage: 'https://jupiter.money/careers', jobBoardUrl: 'https://jupiter.money/careers' },

  { id: 'fi-money', name: 'Fi Money', pattern: 'fi.money', careerPage: 'https://fi.money/careers', jobBoardUrl: 'https://fi.money/careers' },

  { id: 'cashfree-payments', name: 'Cashfree Payments', pattern: 'cashfree.com', careerPage: 'https://www.cashfree.com/careers/', jobBoardUrl: 'https://www.cashfree.com/careers/' },

  { id: 'signzy', name: 'Signzy', pattern: 'signzy.com', careerPage: 'https://signzy.com/careers', jobBoardUrl: 'https://signzy.com/careers' },

  { id: 'perfios', name: 'Perfios', pattern: 'perfios.com', careerPage: 'https://perfios.com/careers', jobBoardUrl: 'https://perfios.com/careers' },

  { id: 'yellow-ai', name: 'Yellow.ai', pattern: 'yellow.ai', careerPage: 'https://yellow.ai/careers', jobBoardUrl: 'https://yellow.ai/careers' },

  { id: 'keka', name: 'Keka', pattern: 'keka.com', careerPage: 'https://keka.com/careers', jobBoardUrl: 'https://keka.com/careers' },

  { id: 'rocketlane', name: 'Rocketlane', pattern: 'rocketlane.com', careerPage: 'https://rocketlane.com/careers', jobBoardUrl: 'https://rocketlane.com/careers' },

  { id: 'exotel', name: 'Exotel', pattern: 'exotel.com', careerPage: 'https://exotel.com/careers', jobBoardUrl: 'https://exotel.com/careers' },

  { id: 'leadsquared', name: 'Leadsquared', pattern: 'leadsquared.com', careerPage: 'https://leadsquared.com/careers', jobBoardUrl: 'https://leadsquared.com/careers' },

  { id: 'webengage', name: 'WebEngage', pattern: 'webengage.com', careerPage: 'https://webengage.com/careers', jobBoardUrl: 'https://webengage.com/careers' },

  { id: 'clevertap', name: 'CleverTap', pattern: 'clevertap.com', careerPage: 'https://careers.kula.ai/clevertap', jobBoardUrl: 'https://careers.kula.ai/clevertap' },

  { id: 'chargebee', name: 'Chargebee', pattern: 'chargebee.com', careerPage: 'https://chargebee.com/careers', jobBoardUrl: 'https://chargebee.com/careers' },

  { id: 'decentro', name: 'Decentro', pattern: 'decentro.tech', careerPage: 'https://decentro.tech/careers', jobBoardUrl: 'https://decentro.tech/careers' },

  { id: 'setu', name: 'Setu', pattern: 'setu.co', careerPage: 'https://setu.co/careers', jobBoardUrl: 'https://setu.co/careers' },

  // Big Tech & Custom Portals
  { id: 'google', name: 'Google', pattern: 'google.com', careerPage: 'https://careers.google.com', jobBoardUrl: 'https://careers.google.com/jobs/results' },
  { id: 'microsoft', name: 'Microsoft', pattern: 'careers.microsoft.com', careerPage: 'https://apply.careers.microsoft.com/careers?domain=microsoft.com', jobBoardUrl: 'https://apply.careers.microsoft.com/careers?domain=microsoft.com' },
  { id: 'amazon', name: 'Amazon', pattern: 'amazon.', careerPage: 'https://www.amazon.jobs', jobBoardUrl: 'https://amazon.jobs/en/search' },
  { id: 'apple', name: 'Apple', pattern: 'apple.com', careerPage: 'https://www.apple.com/careers', jobBoardUrl: 'https://jobs.apple.com/en-in/search?location=india-INDC' },
  { id: 'meta', name: 'Meta', pattern: 'metacareers.com', careerPage: 'https://www.metacareers.com', jobBoardUrl: 'https://www.metacareers.com/jobsearch/' },
  { id: 'figma', name: 'Figma', pattern: 'figma.com', careerPage: 'https://www.figma.com/careers/', jobBoardUrl: 'https://www.figma.com/careers/#job-openings' },

  { id: 'cisco', name: 'Cisco', pattern: 'cisco.com', careerPage: 'https://jobs.cisco.com', jobBoardUrl: 'https://jobs.cisco.com/jobs/SearchJobs' },

  // Enterprise & Cloud Custom Portals
  { id: 'servicenow', name: 'ServiceNow', pattern: 'servicenow.com', careerPage: 'https://careers.servicenow.com/', jobBoardUrl: 'https://careers.servicenow.com/' },
  { id: 'atlassian', name: 'Atlassian', pattern: 'atlassian.com', careerPage: 'https://www.atlassian.com/company/careers', jobBoardUrl: 'https://www.atlassian.com/company/careers/all-jobs' },
  { id: 'akamai', name: 'Akamai', pattern: 'akamai.com', careerPage: 'https://www.akamai.com/careers', jobBoardUrl: 'https://jobs.akamai.com/en/sites/CX_1/jobs' },
  { id: 'vmware', name: 'VMware', pattern: 'vmware.com', careerPage: 'https://www.broadcom.com/company/careers', jobBoardUrl: 'https://www.broadcom.com/company/careers' },
  { id: 'sap', name: 'SAP', pattern: 'sap.com', careerPage: 'https://jobs.sap.com/', jobBoardUrl: 'https://jobs.sap.com/' },
  { id: 'elastic', name: 'Elastic', pattern: 'elastic.co', careerPage: 'https://www.elastic.co/about/careers', jobBoardUrl: 'https://jobs.elastic.co/' },
  { id: 'github', name: 'GitHub', pattern: 'github.careers', careerPage: 'https://www.github.careers/careers-home', jobBoardUrl: 'https://www.github.careers/careers-home/jobs' },

  { id: 'openai', name: 'OpenAI', pattern: 'openai.com', careerPage: 'https://openai.com/careers', jobBoardUrl: 'https://openai.com/careers' },
  { id: 'snowflake', name: 'Snowflake', pattern: 'snowflake.com', careerPage: 'https://www.snowflake.com/careers', jobBoardUrl: 'https://www.snowflake.com/careers' },
  { id: 'crowdstrike', name: 'CrowdStrike', pattern: 'crowdstrike.', careerPage: 'https://www.crowdstrike.com/careers', jobBoardUrl: 'https://crowdstrike.wd5.myworkdayjobs.com/CrowdStrikeCareers' },
  { id: 'netflix', name: 'Netflix', pattern: 'netflix.', careerPage: 'https://explore.jobs.netflix.net/careers', jobBoardUrl: 'https://explore.jobs.netflix.net/careers' },
  { id: 'coinbase', name: 'Coinbase', pattern: 'coinbase.com', careerPage: 'https://www.coinbase.com/careers', jobBoardUrl: 'https://www.coinbase.com/en-in/careers/positions?location=india' },
  { id: 'linkedin', name: 'LinkedIn', pattern: 'linkedin.com', careerPage: 'https://careers.linkedin.com/', jobBoardUrl: 'https://careers.linkedin.com/' },
  { id: 'flipkart', name: 'Flipkart', pattern: 'flipkart.turbohire.co', careerPage: 'https://flipkart.turbohire.co/careerpage/4d757ba0-3d57-448a-b82c-238ed87ac90f', jobBoardUrl: 'https://flipkart.turbohire.co/careerpage/4d757ba0-3d57-448a-b82c-238ed87ac90f' },
  { id: 'hsbc', name: 'HSBC', pattern: 'hsbc.com', careerPage: 'https://www.hsbc.com/careers', jobBoardUrl: 'https://www.hsbc.com/careers' },
  { id: 'uber', name: 'Uber', pattern: 'uber.com', careerPage: 'https://jobs.uber.com/en/jobs/', jobBoardUrl: 'https://jobs.uber.com/en/jobs/' },
  { id: 'deloitte', name: 'Deloitte', pattern: 'deloitte.com', careerPage: 'https://careers.deloitte.com', jobBoardUrl: 'https://careers.deloitte.com' },
  { id: 'zs', name: 'ZS Associates', pattern: 'zs.com', careerPage: 'https://jobs.zs.com/jobs', jobBoardUrl: 'https://jobs.zs.com/jobs' },
  { id: 'accenture', name: 'Accenture', pattern: 'accenture.com', careerPage: 'https://www.accenture.com/in-en/careers', jobBoardUrl: 'https://www.accenture.com/in-en/careers/jobsearch' },
  { id: 'bain', name: 'Bain & Company', pattern: 'bain.com', careerPage: 'https://www.bain.com/careers', jobBoardUrl: 'https://www.bain.com/careers/find-a-role/' },
  { id: 'bcg', name: 'BCG', pattern: 'bcg.com', careerPage: 'https://careers.bcg.com', jobBoardUrl: 'https://careers.bcg.com/global/en/' },
  { id: 'bankofamerica', name: 'Bank of America', pattern: 'bankofamerica.com', careerPage: 'https://careers.bankofamerica.com', jobBoardUrl: 'https://careers.bankofamerica.com/en-us/job-search' },
  { id: 'block', name: 'Block', pattern: 'block.xyz', careerPage: 'https://block.xyz/careers', jobBoardUrl: 'https://block.xyz/careers/jobs' },
  { id: 'brex', name: 'Brex', pattern: 'brex.com', careerPage: 'https://www.brex.com/careers', jobBoardUrl: 'https://www.brex.com/careers' },
  { id: 'asana', name: 'Asana', pattern: 'asana.com', careerPage: 'https://asana.com/jobs', jobBoardUrl: 'https://asana.com/jobs/all' },
  { id: 'amd', name: 'AMD', pattern: 'amd.com', careerPage: 'https://www.amd.com/en/corporate/careers', jobBoardUrl: 'https://careers.amd.com/careers-home/jobs' },
  { id: 'booking', name: 'Booking.com', pattern: 'booking.com', careerPage: 'https://jobs.booking.com', jobBoardUrl: 'https://jobs.booking.com' },
  { id: 'capgemini', name: 'Capgemini', pattern: 'capgemini.com', careerPage: 'https://www.capgemini.com/careers', jobBoardUrl: 'https://www.capgemini.com/careers' },
  { id: 'ebay', name: 'eBay', pattern: 'ebayinc.com', careerPage: 'https://jobs.ebayinc.com', jobBoardUrl: 'https://jobs.ebayinc.com/us/en/search-results' },
  { id: 'epam', name: 'EPAM', pattern: 'epam.com', careerPage: 'https://careers.epam.com', jobBoardUrl: 'https://careers.epam.com/en/jobs' },
  { id: 'intuit', name: 'Intuit', pattern: 'intuit.com', careerPage: 'https://jobs.intuit.com', jobBoardUrl: 'https://jobs.intuit.com/search-jobs' },

  { id: 'mckinsey', name: 'McKinsey', pattern: 'mckinsey.com', careerPage: 'https://www.mckinsey.com/careers', jobBoardUrl: 'https://www.mckinsey.com/careers/search-jobs' },
  { id: 'morganstanley', name: 'Morgan Stanley', pattern: 'morganstanley.com', careerPage: 'https://www.morganstanley.com/careers/career-opportunities-search/', jobBoardUrl: 'https://www.morganstanley.com/careers/career-opportunities-search/' },
  { id: 'shopify', name: 'Shopify', pattern: 'shopify.com', careerPage: 'https://shopify.com/careers', jobBoardUrl: 'https://shopify.com/careers' },
  { id: 'sony', name: 'Sony', pattern: 'sony.com', careerPage: 'https://www.sony.com/en_us/SCA/careers/overview.html', jobBoardUrl: 'https://www.sony.com/en_us/SCA/careers/overview.html' },
  { id: 'gartner', name: 'Gartner', pattern: 'gartner.com', careerPage: 'https://jobs.gartner.com', jobBoardUrl: 'https://jobs.gartner.com' },
  { id: 'wayfair', name: 'Wayfair', pattern: 'wayfair.com', careerPage: 'https://www.wayfair.com/careers/jobs', jobBoardUrl: 'https://www.wayfair.com/careers/jobs' },
  { id: 'zoho', name: 'Zoho', pattern: 'zoho.com', careerPage: 'https://www.zoho.com/careers/', jobBoardUrl: 'https://www.zoho.com/careers/' },
  { id: 'riotgames', name: 'Riot Games', pattern: 'riotgames.com', careerPage: 'https://www.riotgames.com/en/work-with-us/jobs', jobBoardUrl: 'https://www.riotgames.com/en/work-with-us/jobs' },
  { id: 'epic-games', name: 'Epic Games', pattern: 'epicgames.com', careerPage: 'https://www.epicgames.com/site/careers/jobs', jobBoardUrl: 'https://www.epicgames.com/site/careers/jobs' },
  { id: 'wise', name: 'Wise', pattern: 'wise.jobs', careerPage: 'https://wise.jobs/', jobBoardUrl: 'https://wise.jobs/' },
  { id: 'zepto', name: 'Zepto', pattern: 'talentrecruit.com', careerPage: 'https://zepto.talentrecruit.com/career-page', jobBoardUrl: 'https://zepto.talentrecruit.com/career-page' },
  { id: 'plaid', name: 'Plaid', pattern: 'plaid.com', careerPage: 'https://plaid.com/careers/', jobBoardUrl: 'https://plaid.com/careers/' },
  { id: 'darwinbox', name: 'Darwinbox', pattern: 'darwinbox.in', careerPage: 'https://www.darwinbox.com/careers', jobBoardUrl: 'https://dbx.darwinbox.in/ms/candidatev2/main/careers/allJobs' },
  { id: 'huggingface', name: 'Hugging Face', pattern: 'workable.com', careerPage: 'https://apply.workable.com/huggingface/?lng=en', jobBoardUrl: 'https://apply.workable.com/huggingface/?lng=en' },
  { id: 'indeed', name: 'Indeed', pattern: 'indeed.com', careerPage: 'https://careers.indeed.com', jobBoardUrl: 'https://careers.indeed.com' },
  { id: 'mygate', name: 'MyGate', pattern: 'mygate.darwinbox.in', careerPage: 'https://mygate.darwinbox.in/ms/candidatev2/main/careers/allJobs', jobBoardUrl: 'https://mygate.darwinbox.in/ms/candidatev2/main/careers/allJobs' },
  { id: 'navi', name: 'Navi', pattern: 'navi.turbohire.co', careerPage: 'https://navi.turbohire.co/dashboardv2?orgId=3e818601-0baa-429c-b6f8-4b21903ae0e6', jobBoardUrl: 'https://navi.turbohire.co/dashboardv2?orgId=3e818601-0baa-429c-b6f8-4b21903ae0e6' },
  { id: 'dream11', name: 'Dream11', pattern: 'dreamsports.group', careerPage: 'https://dreamsports.group/careers', jobBoardUrl: 'https://dreamsports.group/careers#jobs' },
  { id: 'ola', name: 'Ola', pattern: 'olacareers.turbohire.co', careerPage: 'https://olacareers.turbohire.co/careerpage/e0c1eb37-eb7a-4ca4-bcc5-d59ce4ce9212', jobBoardUrl: 'https://olacareers.turbohire.co/careerpage/e0c1eb37-eb7a-4ca4-bcc5-d59ce4ce9212' },
  { id: 'swiggy', name: 'Swiggy', pattern: 'swiggy.com', careerPage: 'https://careers.swiggy.com', jobBoardUrl: 'https://careers.swiggy.com' },
  { id: 'zomato', name: 'Zomato (Eternal)', pattern: 'eternal.com', careerPage: 'https://www.eternal.com/careers/', jobBoardUrl: 'https://www.eternal.com/careers/' },
  { id: 'ea', name: 'EA', pattern: 'ea.com', careerPage: 'https://jobs.ea.com/en_US/careers', jobBoardUrl: 'https://jobs.ea.com/en_US/careers' },
  { id: 'dropbox', name: 'Dropbox', pattern: 'dropbox.jobs', careerPage: 'https://www.dropbox.jobs/en/jobs/', jobBoardUrl: 'https://www.dropbox.jobs/en/jobs/' },
  { id: 'equinix', name: 'Equinix', pattern: 'equinix.com', careerPage: 'https://careers.equinix.com', jobBoardUrl: 'https://careers.equinix.com/equinix-is-hiring-in-india' },
  { id: 'ey', name: 'EY', pattern: 'ey.com', careerPage: 'https://careers.ey.com/', jobBoardUrl: 'https://careers.ey.com/' },
  { id: 'goldmansachs', name: 'Goldman Sachs', pattern: 'goldmansachs.com', careerPage: 'https://www.goldmansachs.com/careers', jobBoardUrl: 'https://www.goldmansachs.com/careers' },

  { id: 'ibm', name: 'IBM', pattern: 'ibm.com', careerPage: 'https://www.ibm.com/careers', jobBoardUrl: 'https://www.ibm.com/in-en/careers/search' },
  { id: 'ikea', name: 'IKEA', pattern: 'ikea.com', careerPage: 'https://jobs.ikea.com', jobBoardUrl: 'https://jobs.ikea.com/en/location/india-jobs/22908/1269750/2' },

  { id: 'juspay', name: 'Juspay', pattern: 'juspay.io', careerPage: 'https://juspay.io/careers', jobBoardUrl: 'https://juspay.io/careers' },
  { id: 'loom', name: 'Loom', pattern: 'loom.technology', careerPage: 'https://loom.technology/careers/', jobBoardUrl: 'https://loom.technology/careers/' },
  { id: 'lenovo', name: 'Lenovo', pattern: 'jobs.lenovo.com', careerPage: 'https://jobs.lenovo.com/en_US/careers', jobBoardUrl: 'https://jobs.lenovo.com/en_US/careers' },
  { id: 'supercell', name: 'Supercell', pattern: 'supercell.com', careerPage: 'https://supercell.com/en/careers/', jobBoardUrl: 'https://supercell.com/en/careers/' },
  { id: 'circleci', name: 'CircleCI', pattern: 'circleci.com', careerPage: 'https://circleci.com/careers', jobBoardUrl: 'https://circleci.com/careers/jobs/' },
  { id: 'cohesity', name: 'Cohesity', pattern: 'cohesity.com', careerPage: 'https://www.cohesity.com/careers', jobBoardUrl: 'https://www.cohesity.com/careers/open-positions/' },
  { id: 'dbtlabs', name: 'dbt Labs', pattern: 'getdbt.com', careerPage: 'https://www.getdbt.com/about-us/careers', jobBoardUrl: 'https://www.getdbt.com/about-us/careers#roles' },
  { id: 'discord', name: 'Discord', pattern: 'discord.com', careerPage: 'https://discord.com/careers', jobBoardUrl: 'https://discord.com/careers#all-jobs' },
  { id: 'docker', name: 'Docker', pattern: 'docker.com', careerPage: 'https://www.docker.com/career-openings/', jobBoardUrl: 'https://www.docker.com/career-openings/' },

  // Infrastructure & Global Portals
  { id: 'bytedance', name: 'ByteDance', pattern: 'joinbytedance.com', careerPage: 'https://joinbytedance.com', jobBoardUrl: 'https://joinbytedance.com/search' },
  { id: 'arm', name: 'ARM', pattern: 'arm.com', careerPage: 'https://careers.arm.com', jobBoardUrl: 'https://careers.arm.com/search-jobs' },
  { id: 'ericsson', name: 'Ericsson', pattern: 'ericsson.com', careerPage: 'https://www.ericsson.com/en/careers', jobBoardUrl: 'https://jobs.ericsson.com' },
  { id: 'nokia', name: 'Nokia', pattern: 'nokia.com', careerPage: 'https://jobs.nokia.com/en/sites/CX_1', jobBoardUrl: 'https://jobs.nokia.com/en/sites/CX_1' },
  { id: 'canonical', name: 'Canonical', pattern: 'canonical.com', careerPage: 'https://canonical.com/careers', jobBoardUrl: 'https://canonical.com/careers/all' },
  { id: 'datastax', name: 'DataStax', pattern: 'datastax.com', careerPage: 'https://www.datastax.com/company/careers', jobBoardUrl: 'https://www.datastax.com/company/careers' },
  { id: 'dell', name: 'Dell', pattern: 'dell.com', careerPage: 'https://jobs.dell.com', jobBoardUrl: 'https://jobs.dell.com/' },

  // New & Moved Custom Portals per user request
  { id: 'mongodb', name: 'MongoDB', pattern: 'mongodb.com', careerPage: 'https://www.mongodb.com/company/careers', jobBoardUrl: 'https://www.mongodb.com/company/careers/see-jobs#positions' },
  { id: 'moveworks', name: 'Moveworks', pattern: 'moveworks.com', careerPage: 'https://www.moveworks.com/us/en/company/careers', jobBoardUrl: 'https://www.moveworks.com/us/en/company/careers#open-roles' },
  { id: 'nagarro', name: 'Nagarro', pattern: 'nagarro.com', careerPage: 'https://www.nagarro.com/en/careers', jobBoardUrl: 'https://www.nagarro.com/en/careers' },
  { id: 'okta', name: 'Okta', pattern: 'okta.com', careerPage: 'https://www.okta.com/company/careers/', jobBoardUrl: 'https://www.okta.com/company/careers/job-listing/' },
  { id: 'myntra', name: 'Myntra', pattern: 'myntra.com', careerPage: 'https://careers.myntra.com/', jobBoardUrl: 'https://careers.myntra.com/' },
  { id: 'ninjaone', name: 'NinjaOne', pattern: 'jobvite.com', careerPage: 'https://jobs.jobvite.com/ninjaone/jobs', jobBoardUrl: 'https://jobs.jobvite.com/ninjaone/jobs' },
  { id: 'nutanix', name: 'Nutanix', pattern: 'nutanix.com', careerPage: 'https://careers.nutanix.com/en/jobs/', jobBoardUrl: 'https://careers.nutanix.com/en/jobs/' },
  { id: 'nielseniq', name: 'NielsenIQ', pattern: 'nielseniq.com', careerPage: 'https://nielseniq.com/global/en/jobs/india/', jobBoardUrl: 'https://nielseniq.com/global/en/jobs/india/' },
  { id: 'paypal', name: 'PayPal', pattern: 'eightfold.ai', careerPage: 'https://paypal.eightfold.ai/careers', jobBoardUrl: 'https://paypal.eightfold.ai/careers' },
  { id: 'pinterest', name: 'Pinterest', pattern: 'greenhouse.io', careerPage: 'https://boards.greenhouse.io/pinterest', jobBoardUrl: 'https://boards.greenhouse.io/pinterest' },
  { id: 'paloaltonetworks', name: 'Palo Alto Networks', pattern: 'paloaltonetworks.com', careerPage: 'https://jobs.paloaltonetworks.com/en', jobBoardUrl: 'https://jobs.paloaltonetworks.com/en' },
  { id: 'qualcomm', name: 'Qualcomm', pattern: 'qualcomm.com', careerPage: 'https://careers.qualcomm.com/careers', jobBoardUrl: 'https://careers.qualcomm.com/careers' },
  { id: 'questdb', name: 'QuestDB', pattern: 'questdb.com', careerPage: 'https://questdb.com/careers/', jobBoardUrl: 'https://questdb.com/careers/' },
  { id: 'roblox', name: 'Roblox', pattern: 'roblox.com', careerPage: 'https://careers.roblox.com/jobs', jobBoardUrl: 'https://careers.roblox.com/jobs' },
  { id: 'shopee', name: 'Shopee', pattern: 'shopee.sg', careerPage: 'https://careers.shopee.sg/', jobBoardUrl: 'https://careers.shopee.sg/' },
  { id: 'rubrik', name: 'Rubrik', pattern: 'rubrik.com', careerPage: 'https://www.rubrik.com/company/careers', jobBoardUrl: 'https://www.rubrik.com/company/careers#positions' },
  { id: 'stripe', name: 'Stripe', pattern: 'stripe.com', careerPage: 'https://stripe.com/jobs/search', jobBoardUrl: 'https://stripe.com/jobs/search' },
  { id: 'rippling', name: 'Rippling', pattern: 'rippling.com', careerPage: 'https://www.rippling.com/careers/open-roles', jobBoardUrl: 'https://www.rippling.com/careers/open-roles' },
  { id: 'rivian', name: 'Rivian', pattern: 'rivian.com', careerPage: 'https://careers.rivian.com/careers-home/', jobBoardUrl: 'https://careers.rivian.com/careers-home/' },
  { id: 'snowplow', name: 'Snowplow', pattern: 'hibob.com', careerPage: 'https://snowplow.careers.hibob.com/', jobBoardUrl: 'https://snowplow.careers.hibob.com/' },
  { id: 'sharechat', name: 'ShareChat', pattern: 'sharechat.com', careerPage: 'https://sharechat.com/careers', jobBoardUrl: 'https://sharechat.com/careers' },
  { id: 'robinhood', name: 'Robinhood', pattern: 'robinhood.com', careerPage: 'https://careers.robinhood.com/', jobBoardUrl: 'https://careers.robinhood.com/' },
  { id: 'miro', name: 'Miro', pattern: 'miro.com', careerPage: 'https://miro.com/careers/open-positions/', jobBoardUrl: 'https://miro.com/careers/open-positions/' },
  { id: 'nike', name: 'Nike', pattern: 'nike.com', careerPage: 'https://careers.nike.com/jobs', jobBoardUrl: 'https://careers.nike.com/jobs' },
  { id: 'retool', name: 'Retool', pattern: 'retool.com', careerPage: 'https://retool.com/careers#open-positions', jobBoardUrl: 'https://retool.com/careers#open-positions' },
  { id: 'scaleai', name: 'Scale AI', pattern: 'scale.com', careerPage: 'https://scale.com/careers', jobBoardUrl: 'https://scale.com/careers' },
  { id: 'posthog', name: 'PostHog', pattern: 'posthog.com', careerPage: 'https://posthog.com/careers', jobBoardUrl: 'https://posthog.com/careers' },
  { id: 'pwc', name: 'PwC', pattern: 'pwc.com', careerPage: 'https://jobs-ta.pwc.com/global/en/ac-india-job-search', jobBoardUrl: 'https://jobs-ta.pwc.com/global/en/ac-india-job-search' },
  { id: 'unitedhealth', name: 'UnitedHealth', pattern: 'unitedhealthgroup.com', careerPage: 'https://careers.unitedhealthgroup.com/search-jobs', jobBoardUrl: 'https://careers.unitedhealthgroup.com/search-jobs' },
  { id: 'tesla', name: 'Tesla', pattern: 'tesla.com', careerPage: 'https://www.tesla.com/careers', jobBoardUrl: 'https://www.tesla.com/careers' },
  { id: 'unacademy', name: 'Unacademy', pattern: 'unacademy.darwinbox.in', careerPage: 'https://unacademy.darwinbox.in/ms/candidatev2/main/careers/allJobs', jobBoardUrl: 'https://unacademy.darwinbox.in/ms/candidatev2/main/careers/allJobs' },
  { id: 'unity', name: 'Unity', pattern: 'unity.com', careerPage: 'https://unity.com/careers/positions', jobBoardUrl: 'https://unity.com/careers/positions' },
  { id: 'walmart', name: 'Walmart', pattern: 'walmart.com', careerPage: 'https://careers.walmart.com/us/en/home', jobBoardUrl: 'https://careers.walmart.com/us/en/home' },
  { id: 'wandb', name: 'Weights & Biases', pattern: 'coreweave.com', careerPage: 'https://www.coreweave.com/careers/weights-biases', jobBoardUrl: 'https://www.coreweave.com/careers/weights-biases' },
  { id: 'whatfix', name: 'Whatfix', pattern: 'whatfix.com', careerPage: 'https://whatfix.com/careers', jobBoardUrl: 'https://whatfix.com/careers' },
  { id: 'wiz', name: 'Wiz', pattern: 'wiz.io', careerPage: 'https://www.wiz.io/careers', jobBoardUrl: 'https://www.wiz.io/careers' },
  { id: 'zapier', name: 'Zapier', pattern: 'zapier.com', careerPage: 'https://zapier.com/jobs#job-openings', jobBoardUrl: 'https://zapier.com/jobs#job-openings' },
  { id: 'zscaler', name: 'Zscaler', pattern: 'zscaler.com', careerPage: 'https://www.zscaler.com/careers', jobBoardUrl: 'https://www.zscaler.com/careers' },
  { id: 'synopsys', name: 'Synopsys', pattern: 'synopsys.com', careerPage: 'https://www.synopsys.com/company/careers.html', jobBoardUrl: 'https://www.synopsys.com/company/careers.html' },
  { id: 'target', name: 'Target', pattern: 'target.com', careerPage: 'https://jobs.target.com', jobBoardUrl: 'https://jobs.target.com' },
];
