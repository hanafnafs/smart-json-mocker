/**
 * Fetch Interceptor for Smart JSON Mocker
 * Wraps fetch to automatically fill null/empty values in API responses
 */

import type { SmartMocker } from '../core/mocker';
import type { InterceptorConfig, FillOptions } from '../types';

export type SmartFetch = (
  input: RequestInfo | URL,
  init?: RequestInit
) => Promise<Response>;

/**
 * Create a fetch wrapper that automatically fills null/empty values
 */
export function createFetchWrapper(
  mocker: SmartMocker,
  config: InterceptorConfig = { enabled: true }
): SmartFetch {
  return async function smartFetch(
    input: RequestInfo | URL,
    init?: RequestInit
  ): Promise<Response> {
    const response = await fetch(input, init);

    if (!config.enabled) {
      return response;
    }

    // Get URL string
    const url = typeof input === 'string' 
      ? input 
      : input instanceof URL 
        ? input.toString() 
        : input.url;

    // Check URL patterns
    if (config.urlPatterns && config.urlPatterns.length > 0) {
      const matches = config.urlPatterns.some(pattern => {
        if (typeof pattern === 'string') {
          return url.includes(pattern);
        }
        return pattern.test(url);
      });

      if (!matches) {
        return response;
      }
    }

    // Check excluded patterns
    if (config.excludePatterns && config.excludePatterns.length > 0) {
      const excluded = config.excludePatterns.some(pattern => {
        if (typeof pattern === 'string') {
          return url.includes(pattern);
        }
        return pattern.test(url);
      });

      if (excluded) {
        return response;
      }
    }

    // Check HTTP method
    if (config.methods && config.methods.length > 0) {
      const method = (init?.method || 'GET').toUpperCase() as 
        'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

      if (!config.methods.includes(method)) {
        return response;
      }
    }

    // Check content type
    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      return response;
    }

    // Clone response to read body
    const cloned = response.clone();

    try {
      const data = await cloned.json();

      if (typeof data === 'object' && data !== null) {
        const filled = await mocker.fill(data, config.fillOptions);

        // Create new response with filled data
        return new Response(JSON.stringify(filled), {
          status: response.status,
          statusText: response.statusText,
          headers: response.headers,
        });
      }
    } catch {
      // Not JSON or parse error, return original
    }

    return response;
  };
}

/**
 * Monkey-patch global fetch with smart mocker
 * Use with caution in production!
 */
export function patchGlobalFetch(
  mocker: SmartMocker,
  config: InterceptorConfig = { enabled: true }
): () => void {
  const originalFetch = globalThis.fetch;
  const smartFetch = createFetchWrapper(mocker, config);

  globalThis.fetch = smartFetch;

  // Return restore function
  return () => {
    globalThis.fetch = originalFetch;
  };
}

/**
 * Helper to create fetch wrapper with options
 */
export function setupFetchWrapper(
  mocker: SmartMocker,
  options?: {
    /** URL patterns to intercept */
    urlPatterns?: (string | RegExp)[];
    /** URL patterns to exclude */
    excludePatterns?: (string | RegExp)[];
    /** HTTP methods to intercept */
    methods?: ('GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE')[];
    /** Fill options */
    fillOptions?: FillOptions;
  }
): SmartFetch {
  return createFetchWrapper(mocker, {
    enabled: true,
    urlPatterns: options?.urlPatterns,
    excludePatterns: options?.excludePatterns,
    methods: options?.methods,
    fillOptions: options?.fillOptions,
  });
}
