import { CompanyConfig } from '../companies/Scraper.js';
import { HttpClient } from './HttpClient.js';
import { Logger } from './Logger.js';

export class AtsDetector {
  /**
   * Evaluates if a company needs ATS detection based on cache expiration (30 days)
   * or empty values.
   */
  public static shouldDetect(company: CompanyConfig, urlChanged: boolean = false, force: boolean = false): boolean {
    if (force || urlChanged) return true;
    if (!company.detected_ats || company.detected_ats === 'auto') return true;

    // Direct persistent plugin selection (e.g. google, microsoft, workday) bypasses auto-probing
    return false;
  }

  /**
   * Probes the company career site and attempts to auto-detect its ATS provider.
   */
  public static async detect(company: CompanyConfig, httpClient: HttpClient): Promise<string> {
    const url = company.api_endpoint || `https://www.${company.id}.com/careers`;
    Logger.info(`Probing ATS signature for: ${company.name} at URL: ${url}`);

    try {
      // First check if url itself has a signature
      if (/myworkdayjobs\.com/i.test(url)) {
        Logger.info(`Detected Workday ATS by URL structure for ${company.name}`);
        return 'workday';
      }
      if (/greenhouse\.io/i.test(url) || /boards\.greenhouse\.io/i.test(url)) {
        Logger.info(`Detected Greenhouse ATS by URL structure for ${company.name}`);
        return 'greenhouse';
      }
      if (/lever\.co/i.test(url)) {
        Logger.info(`Detected Lever ATS by URL structure for ${company.name}`);
        return 'lever';
      }
      if (/ashbyhq\.com/i.test(url)) {
        Logger.info(`Detected Ashby ATS by URL structure for ${company.name}`);
        return 'ashby';
      }
      if (/smartrecruiters\.com/i.test(url)) {
        Logger.info(`Detected SmartRecruiters ATS by URL structure for ${company.name}`);
        return 'smartrecruiters';
      }
      if (/oraclecloud\.com/i.test(url)) {
        Logger.info(`Detected Oracle Cloud ATS by URL structure for ${company.name}`);
        return 'oraclecloud';
      }
      if (/bamboohr\.com/i.test(url)) {
        Logger.info(`Detected BambooHR ATS by URL structure for ${company.name}`);
        return 'bamboohr';
      }
      if (/successfactors\.com/i.test(url) || /successfactors\.eu/i.test(url)) {
        Logger.info(`Detected SuccessFactors ATS by URL structure for ${company.name}`);
        return 'successfactors';
      }
      if (/icims\.com/i.test(url)) {
        Logger.info(`Detected iCIMS ATS by URL structure for ${company.name}`);
        return 'icims';
      }
      if (/recruitee\.com/i.test(url)) {
        Logger.info(`Detected Recruitee ATS by URL structure for ${company.name}`);
        return 'recruitee';
      }
      if (/teamtailor\.com/i.test(url)) {
        Logger.info(`Detected Teamtailor ATS by URL structure for ${company.name}`);
        return 'teamtailor';
      }
      if (/comeet\.co/i.test(url) || /comeet\.com/i.test(url)) {
        Logger.info(`Detected Comeet ATS by URL structure for ${company.name}`);
        return 'comeet';
      }

      // Probing the HTML page content
      const response = await httpClient.get<string>(url, {}, { timeoutMs: 10000 });
      const html = response.data;

      if (/myworkdayjobs/i.test(html) || /wday\/cxs/i.test(html)) {
        Logger.info(`Detected Workday ATS via HTML footprint for ${company.name}`);
        return 'workday';
      }

      if (/boards\.greenhouse\.io/i.test(html) || /greenhouse-embed/i.test(html)) {
        Logger.info(`Detected Greenhouse ATS via HTML footprint for ${company.name}`);
        return 'greenhouse';
      }

      if (/lever\.co/i.test(html) || /lever-embed/i.test(html)) {
        Logger.info(`Detected Lever ATS via HTML footprint for ${company.name}`);
        return 'lever';
      }

      if (/smartrecruiters\.com/i.test(html)) {
        Logger.info(`Detected SmartRecruiters ATS via HTML for ${company.name}`);
        return 'smartrecruiters';
      }

      if (/ashbyhq\.com/i.test(html)) {
        Logger.info(`Detected Ashby ATS via HTML for ${company.name}`);
        return 'ashby';
      }

      if (/bamboohr\.com/i.test(html)) {
        Logger.info(`Detected BambooHR ATS via HTML for ${company.name}`);
        return 'bamboohr';
      }

      if (/successfactors/i.test(html)) {
        Logger.info(`Detected SuccessFactors ATS via HTML for ${company.name}`);
        return 'successfactors';
      }

      if (/icims/i.test(html)) {
        Logger.info(`Detected iCIMS ATS via HTML for ${company.name}`);
        return 'icims';
      }

      if (/recruitee/i.test(html)) {
        Logger.info(`Detected Recruitee ATS via HTML for ${company.name}`);
        return 'recruitee';
      }

      if (/teamtailor/i.test(html)) {
        Logger.info(`Detected Teamtailor ATS via HTML for ${company.name}`);
        return 'teamtailor';
      }

      if (/comeet/i.test(html)) {
        Logger.info(`Detected Comeet ATS via HTML for ${company.name}`);
        return 'comeet';
      }

      Logger.info(`No specific ATS signatures found for ${company.name}. Falling back to default.`);
      return 'fallback';
    } catch (e: any) {
      Logger.warn(`ATS detection probe failed for ${company.name}: ${e.message}. Using fallback.`);
      return 'fallback';
    }
  }
}
