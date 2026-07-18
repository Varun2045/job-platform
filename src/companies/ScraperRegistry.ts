import { CompanyConfig, ScraperPlugin } from './Scraper.js';
import { plugin as googlePlugin } from './plugins/GooglePlugin.js';
import { plugin as microsoftPlugin } from './plugins/MicrosoftPlugin.js';
import { plugin as amazonPlugin } from './plugins/AmazonPlugin.js';
import { plugin as applePlugin } from './plugins/ApplePlugin.js';
import { plugin as metaPlugin } from './plugins/MetaPlugin.js';
import { plugin as workdayPlugin } from './plugins/WorkdayPlugin.js';
import { plugin as greenhousePlugin } from './plugins/GreenhousePlugin.js';
import { plugin as leverPlugin } from './plugins/LeverPlugin.js';
import { Logger } from '../core/Logger.js';

export class ScraperRegistry {
  private static plugins: ScraperPlugin[] = [
    googlePlugin,
    microsoftPlugin,
    amazonPlugin,
    applePlugin,
    metaPlugin,
    workdayPlugin,
    greenhousePlugin,
    leverPlugin,
  ];

  /**
   * Returns a list of all registered scraper plugins.
   */
  public static getAllPlugins(): ScraperPlugin[] {
    return this.plugins;
  }

  /**
   * Retrieves the appropriate scraper plugin based on the company config's detected_ats.
   */
  public static getPlugin(company: CompanyConfig): ScraperPlugin | null {
    if (!company.detected_ats) {
      Logger.warn(`Company ${company.name} has no detected_ats value set.`);
      return null;
    }

    const plugin = this.plugins.find((p) => p.metadata.id === company.detected_ats);
    if (!plugin) {
      Logger.warn(`No registered scraper plugin matches detected_ats: "${company.detected_ats}" for ${company.name}`);
      return null;
    }

    return plugin;
  }
}
