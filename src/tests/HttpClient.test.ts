import { jest } from '@jest/globals';
import { HttpClient, HttpError } from '../core/HttpClient.js';

describe('HttpClient Unit Tests', () => {
  let client: HttpClient;
  let originalFetch: any;

  beforeAll(() => {
    client = new HttpClient();
    originalFetch = global.fetch;
  });

  afterAll(() => {
    global.fetch = originalFetch;
  });

  beforeEach(() => {
    jest.restoreAllMocks();
  });

  it('should execute a successful GET request', async () => {
    const mockResponse = {
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({ ok: true }),
      text: async () => '{"ok": true}',
    };
    global.fetch = (jest.fn() as any).mockResolvedValue(mockResponse);

    const res = await client.request('https://api.test/get', { method: 'GET', retries: 1 });
    expect(res.status).toBe(200);
    expect(res.data).toEqual({ ok: true });
  });

  it('should execute a successful POST request with object body', async () => {
    const mockResponse = {
      ok: true,
      status: 201,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({ created: true }),
      text: async () => '{"created": true}',
    };
    global.fetch = (jest.fn() as any).mockResolvedValue(mockResponse);

    const res = await client.request('https://api.test/post', {
      method: 'POST',
      body: { name: 'test' },
      retries: 1,
    });
    expect(res.status).toBe(201);
    expect(res.data).toEqual({ created: true });
  });

  it('should execute a successful POST request with string body', async () => {
    const mockResponse = {
      ok: true,
      status: 200,
      headers: new Headers(),
      text: async () => 'text-response',
    };
    global.fetch = (jest.fn() as any).mockResolvedValue(mockResponse);

    const res = await client.request('https://api.test/post-string', {
      method: 'POST',
      body: 'plain-text',
      retries: 1,
    });
    expect(res.data).toBe('text-response');
  });

  it('should fail immediately on client 400 error without retrying', async () => {
    const mockResponse = {
      ok: false,
      status: 404,
      statusText: 'Not Found',
      headers: new Headers(),
    };
    global.fetch = (jest.fn() as any).mockResolvedValue(mockResponse);

    await expect(client.request('https://api.test/404', { retries: 2 })).rejects.toThrow(HttpError);
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it('should retry on 500 error or rate limit 429 and succeed eventually', async () => {
    const mockFailResponse = {
      ok: false,
      status: 500,
      statusText: 'Internal Error',
      headers: new Headers(),
    };
    const mockSuccessResponse = {
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({ retryOk: true }),
      text: async () => '{"retryOk": true}',
    };

    global.fetch = (jest.fn() as any)
      .mockResolvedValueOnce(mockFailResponse)
      .mockResolvedValueOnce(mockSuccessResponse);

    const res = await client.request('https://api.test/retry', { retries: 3, backoffMs: 1 });
    expect(res.status).toBe(200);
    expect(res.data).toEqual({ retryOk: true });
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  it('should abort fetch on timeout', async () => {
    global.fetch = (jest.fn() as any).mockImplementation(async () => {
      throw new DOMException('The user aborted a request.', 'AbortError');
    });

    await expect(client.request('https://api.test/timeout', { timeoutMs: 1, retries: 1 })).rejects.toThrow(/aborted/i);
  });

  it('should wrap generic fetch exceptions in a generic error message', async () => {
    global.fetch = (jest.fn() as any).mockRejectedValue(new Error('DNS lookup failed'));
    await expect(client.request('https://api.test/dns-fail', { retries: 1 })).rejects.toThrow('DNS lookup failed');
  });
});
