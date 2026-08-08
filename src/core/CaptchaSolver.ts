import { Logger } from './Logger.js';

export interface CaptchaSolution {
  solution: string;
  captchaId: string;
  solveTimeMs: number;
}

export interface RecaptchaV2Config {
  siteKey: string;
  pageUrl: string;
  isInvisible?: boolean;
}

export interface HCaptchaConfig {
  siteKey: string;
  pageUrl: string;
  isInvisible?: boolean;
}

export interface ImageCaptchaConfig {
  imageBase64: string;
  numeric?: boolean;
  minLength?: number;
  maxLength?: number;
  phrase?: boolean;
  caseSensitive?: boolean;
  calc?: boolean;
}

/**
 * CAPTCHA Solver Service
 * 
 * Integrates with CAPTCHA solving services (2Captcha, Anti-Captcha, etc.)
 * to automatically solve CAPTCHAs during scraping operations.
 */
export class CaptchaSolver {
  private static instance: CaptchaSolver | null = null;
  private apiKey: string;
  private provider: '2captcha' | 'anticaptcha' | 'custom';
  private baseUrl: string;
  private pollingIntervalMs: number = 2000;
  private maxPollAttempts: number = 30;

  private constructor() {
    this.apiKey = process.env.CAPTCHA_API_KEY || '';
    this.provider = (process.env.CAPTCHA_PROVIDER as '2captcha' | 'anticaptcha' | 'custom') || '2captcha';
    
    // Set base URL based on provider
    switch (this.provider) {
      case '2captcha':
        this.baseUrl = 'http://2captcha.com';
        break;
      case 'anticaptcha':
        this.baseUrl = 'https://api.anti-captcha.com';
        break;
      default:
        this.baseUrl = 'http://2captcha.com';
    }

    if (!this.apiKey) {
      Logger.warn('[CaptchaSolver] No CAPTCHA API key configured. CAPTCHA solving will be disabled.');
    } else {
      Logger.info(`[CaptchaSolver] Initialized with provider: ${this.provider}`);
    }
  }

  public static getInstance(): CaptchaSolver {
    if (!CaptchaSolver.instance) {
      CaptchaSolver.instance = new CaptchaSolver();
    }
    return CaptchaSolver.instance;
  }

  /**
   * Check if CAPTCHA solver is configured
   */
  public isConfigured(): boolean {
    return !!this.apiKey;
  }

  /**
   * Solve reCAPTCHA v2
   */
  public async solveRecaptchaV2(config: RecaptchaV2Config): Promise<CaptchaSolution | null> {
    if (!this.isConfigured()) {
      Logger.warn('[CaptchaSolver] RecaptchaV2 solving requested but not configured');
      return null;
    }

    Logger.info(`[CaptchaSolver] Solving reCAPTCHA v2 for ${config.pageUrl}`);
    const startTime = Date.now();

    try {
      if (this.provider === '2captcha') {
        return await this.solveRecaptchaV2With2Captcha(config);
      } else if (this.provider === 'anticaptcha') {
        return await this.solveRecaptchaV2WithAntiCaptcha(config);
      }

      return null;
    } catch (error: any) {
      Logger.error(`[CaptchaSolver] Failed to solve reCAPTCHA v2: ${error.message}`);
      return null;
    }
  }

  /**
   * Solve hCaptcha
   */
  public async solveHCaptcha(config: HCaptchaConfig): Promise<CaptchaSolution | null> {
    if (!this.isConfigured()) {
      Logger.warn('[CaptchaSolver] HCaptcha solving requested but not configured');
      return null;
    }

    Logger.info(`[CaptchaSolver] Solving hCaptcha for ${config.pageUrl}`);
    const startTime = Date.now();

    try {
      if (this.provider === '2captcha') {
        return await this.solveHCaptchaWith2Captcha(config);
      } else if (this.provider === 'anticaptcha') {
        return await this.solveHCaptchaWithAntiCaptcha(config);
      }

      return null;
    } catch (error: any) {
      Logger.error(`[CaptchaSolver] Failed to solve hCaptcha: ${error.message}`);
      return null;
    }
  }

  /**
   * Solve image CAPTCHA
   */
  public async solveImageCaptcha(config: ImageCaptchaConfig): Promise<CaptchaSolution | null> {
    if (!this.isConfigured()) {
      Logger.warn('[CaptchaSolver] Image CAPTCHA solving requested but not configured');
      return null;
    }

    Logger.info('[CaptchaSolver] Solving image CAPTCHA');
    const startTime = Date.now();

    try {
      if (this.provider === '2captcha') {
        return await this.solveImageCaptchaWith2Captcha(config);
      } else if (this.provider === 'anticaptcha') {
        return await this.solveImageCaptchaWithAntiCaptcha(config);
      }

      return null;
    } catch (error: any) {
      Logger.error(`[CaptchaSolver] Failed to solve image CAPTCHA: ${error.message}`);
      return null;
    }
  }

  /**
   * Solve reCAPTCHA v2 with 2Captcha
   */
  private async solveRecaptchaV2With2Captcha(config: RecaptchaV2Config): Promise<CaptchaSolution> {
    // Create task
    const taskData = {
      key: this.apiKey,
      method: 'userrecaptcha',
      googlekey: config.siteKey,
      pageurl: config.pageUrl,
      json: 1,
    };

    const createResponse = await this.makeRequest(`${this.baseUrl}/in.php`, taskData);
    const result = JSON.parse(createResponse);

    if (result.status !== 1) {
      throw new Error(`Failed to create CAPTCHA task: ${result.request}`);
    }

    const captchaId = result.request;

    // Poll for solution
    const solution = await this.pollForSolution(captchaId);
    const solveTimeMs = Date.now() - Date.now();

    return {
      solution,
      captchaId,
      solveTimeMs,
    };
  }

  /**
   * Solve hCaptcha with 2Captcha
   */
  private async solveHCaptchaWith2Captcha(config: HCaptchaConfig): Promise<CaptchaSolution> {
    const taskData = {
      key: this.apiKey,
      method: 'hcaptcha',
      sitekey: config.siteKey,
      pageurl: config.pageUrl,
      json: 1,
    };

    const createResponse = await this.makeRequest(`${this.baseUrl}/in.php`, taskData);
    const result = JSON.parse(createResponse);

    if (result.status !== 1) {
      throw new Error(`Failed to create CAPTCHA task: ${result.request}`);
    }

    const captchaId = result.request;
    const solution = await this.pollForSolution(captchaId);
    const solveTimeMs = Date.now() - Date.now();

    return {
      solution,
      captchaId,
      solveTimeMs,
    };
  }

  /**
   * Solve image CAPTCHA with 2Captcha
   */
  private async solveImageCaptchaWith2Captcha(config: ImageCaptchaConfig): Promise<CaptchaSolution> {
    const formData = new URLSearchParams();
    formData.append('key', this.apiKey);
    formData.append('method', 'base64');
    formData.append('body', config.imageBase64);
    formData.append('json', 1);

    if (config.numeric !== undefined) formData.append('numeric', config.numeric ? '1' : '0');
    if (config.minLength) formData.append('min_len', config.minLength.toString());
    if (config.maxLength) formData.append('max_len', config.maxLength.toString());
    if (config.phrase !== undefined) formData.append('phrase', config.phrase ? '1' : '0');
    if (config.caseSensitive !== undefined) formData.append('regsense', config.caseSensitive ? '1' : '0');
    if (config.calc !== undefined) formData.append('calc', config.calc ? '1' : '0');

    const createResponse = await this.makeRequest(`${this.baseUrl}/in.php`, formData.toString(), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
    const result = JSON.parse(createResponse);

    if (result.status !== 1) {
      throw new Error(`Failed to create CAPTCHA task: ${result.request}`);
    }

    const captchaId = result.request;
    const solution = await this.pollForSolution(captchaId);
    const solveTimeMs = Date.now() - Date.now();

    return {
      solution,
      captchaId,
      solveTimeMs,
    };
  }

  /**
   * Solve reCAPTCHA v2 with Anti-Captcha
   */
  private async solveRecaptchaV2WithAntiCaptcha(config: RecaptchaV2Config): Promise<CaptchaSolution> {
    const taskData = {
      clientKey: this.apiKey,
      task: {
        type: 'RecaptchaV2TaskProxyless',
        websiteURL: config.pageUrl,
        websiteKey: config.siteKey,
        isInvisible: config.isInvisible || false,
      },
    };

    const createResponse = await this.makeRequest(`${this.baseUrl}/createTask`, taskData);
    const result = JSON.parse(createResponse);

    if (result.errorId !== 0) {
      throw new Error(`Failed to create CAPTCHA task: ${result.errorDescription}`);
    }

    const taskId = result.taskId;
    const solution = await this.pollForSolutionAntiCaptcha(taskId);
    const solveTimeMs = Date.now() - Date.now();

    return {
      solution,
      captchaId: taskId.toString(),
      solveTimeMs,
    };
  }

  /**
   * Solve hCaptcha with Anti-Captcha
   */
  private async solveHCaptchaWithAntiCaptcha(config: HCaptchaConfig): Promise<CaptchaSolution> {
    const taskData = {
      clientKey: this.apiKey,
      task: {
        type: 'HCaptchaTaskProxyless',
        websiteURL: config.pageUrl,
        websiteKey: config.siteKey,
        isInvisible: config.isInvisible || false,
      },
    };

    const createResponse = await this.makeRequest(`${this.baseUrl}/createTask`, taskData);
    const result = JSON.parse(createResponse);

    if (result.errorId !== 0) {
      throw new Error(`Failed to create CAPTCHA task: ${result.errorDescription}`);
    }

    const taskId = result.taskId;
    const solution = await this.pollForSolutionAntiCaptcha(taskId);
    const solveTimeMs = Date.now() - Date.now();

    return {
      solution,
      captchaId: taskId.toString(),
      solveTimeMs,
    };
  }

  /**
   * Solve image CAPTCHA with Anti-Captcha
   */
  private async solveImageCaptchaWithAntiCaptcha(config: ImageCaptchaConfig): Promise<CaptchaSolution> {
    const taskData = {
      clientKey: this.apiKey,
      task: {
        type: 'ImageToTextTask',
        body: config.imageBase64,
        numeric: config.numeric !== undefined ? (config.numeric ? 1 : 0) : undefined,
        minLength: config.minLength,
        maxLength: config.maxLength,
        phrase: config.phrase,
        caseSensitive: config.caseSensitive,
        calc: config.calc,
      },
    };

    const createResponse = await this.makeRequest(`${this.baseUrl}/createTask`, taskData);
    const result = JSON.parse(createResponse);

    if (result.errorId !== 0) {
      throw new Error(`Failed to create CAPTCHA task: ${result.errorDescription}`);
    }

    const taskId = result.taskId;
    const solution = await this.pollForSolutionAntiCaptcha(taskId);
    const solveTimeMs = Date.now() - Date.now();

    return {
      solution,
      captchaId: taskId.toString(),
      solveTimeMs,
    };
  }

  /**
   * Poll for solution with 2Captcha
   */
  private async pollForSolution(captchaId: string): Promise<string> {
    for (let attempt = 0; attempt < this.maxPollAttempts; attempt++) {
      await new Promise(resolve => setTimeout(resolve, this.pollingIntervalMs));

      const pollData = {
        key: this.apiKey,
        action: 'get',
        id: captchaId,
        json: 1,
      };

      const pollResponse = await this.makeRequest(`${this.baseUrl}/res.php`, pollData);
      const result = JSON.parse(pollResponse);

      if (result.status === 1) {
        Logger.info(`[CaptchaSolver] CAPTCHA solved successfully`);
        return result.request;
      } else if (result.request === 'CAPCHA_NOT_READY') {
        continue;
      } else {
        throw new Error(`CAPTCHA solve failed: ${result.request}`);
      }
    }

    throw new Error('CAPTCHA solve timeout');
  }

  /**
   * Poll for solution with Anti-Captcha
   */
  private async pollForSolutionAntiCaptcha(taskId: number): Promise<string> {
    for (let attempt = 0; attempt < this.maxPollAttempts; attempt++) {
      await new Promise(resolve => setTimeout(resolve, this.pollingIntervalMs));

      const pollData = {
        clientKey: this.apiKey,
        taskId: taskId,
      };

      const pollResponse = await this.makeRequest(`${this.baseUrl}/getTaskResult`, pollData);
      const result = JSON.parse(pollResponse);

      if (result.status === 'ready') {
        Logger.info(`[CaptchaSolver] CAPTCHA solved successfully`);
        return result.solution.gRecaptchaResponse || result.solution.text;
      } else if (result.status === 'processing') {
        continue;
      } else if (result.errorId !== 0) {
        throw new Error(`CAPTCHA solve failed: ${result.errorDescription}`);
      }
    }

    throw new Error('CAPTCHA solve timeout');
  }

  /**
   * Make HTTP request to CAPTCHA service
   */
  private async makeRequest(url: string, data: any, options: any = {}): Promise<string> {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        body: typeof data === 'string' ? data : JSON.stringify(data),
      });

      const text = await response.text();
      return text;
    } catch (error: any) {
      throw new Error(`HTTP request failed: ${error.message}`);
    }
  }

  /**
   * Report incorrectly solved CAPTCHA (for refund)
   */
  public async reportIncorrect(captchaId: string): Promise<boolean> {
    if (!this.isConfigured()) {
      return false;
    }

    try {
      if (this.provider === '2captcha') {
        const reportData = {
          key: this.apiKey,
          action: 'reportbad',
          id: captchaId,
        };
        await this.makeRequest(`${this.baseUrl}/res.php`, reportData);
        Logger.info(`[CaptchaSolver] Reported incorrect CAPTCHA: ${captchaId}`);
        return true;
      } else if (this.provider === 'anticaptcha') {
        const reportData = {
          clientKey: this.apiKey,
          taskId: parseInt(captchaId),
        };
        await this.makeRequest(`${this.baseUrl}/reportIncorrectRecaptcha`, reportData);
        Logger.info(`[CaptchaSolver] Reported incorrect CAPTCHA: ${captchaId}`);
        return true;
      }

      return false;
    } catch (error: any) {
      Logger.error(`[CaptchaSolver] Failed to report incorrect CAPTCHA: ${error.message}`);
      return false;
    }
  }

  /**
   * Get account balance
   */
  public async getBalance(): Promise<number> {
    if (!this.isConfigured()) {
      return 0;
    }

    try {
      if (this.provider === '2captcha') {
        const balanceData = {
          key: this.apiKey,
          action: 'getbalance',
          json: 1,
        };
        const response = await this.makeRequest(`${this.baseUrl}/res.php`, balanceData);
        const result = JSON.parse(response);
        return parseFloat(result.request || '0');
      } else if (this.provider === 'anticaptcha') {
        const balanceData = {
          clientKey: this.apiKey,
        };
        const response = await this.makeRequest(`${this.baseUrl}/getBalance`, balanceData);
        const result = JSON.parse(response);
        return parseFloat(result.balance || '0');
      }

      return 0;
    } catch (error: any) {
      Logger.error(`[CaptchaSolver] Failed to get balance: ${error.message}`);
      return 0;
    }
  }
}