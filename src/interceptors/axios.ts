/**
 * Axios Interceptor for Smart JSON Mocker
 * Automatically fills null/empty values in API responses
 */

import type { SmartMocker } from '../core/mocker';
import type { InterceptorConfig, FillOptions } from '../types';

// Type for Axios instance (we don't want to import axios directly)
interface AxiosInstance {
  interceptors: {
    response: {
      use: (
        onFulfilled?: (value: unknown) => unknown | Promise<unknown>,
        onRejected?: (error: unknown) => unknown
      ) => number;
      eject: (id: number) => void;
    };
  };
}

interface AxiosResponse {
  data: unknown;
  status: number;
  statusText: string;
  headers: Record<string, string>;
  config: {
    url?: string;
    method?: string;
  };
}

export interface SmartAxiosInterceptor {
  /** Interceptor ID for removal */
  id: number;
  /** Remove the interceptor */
  eject: () => void;
}

/**
 * Create an Axios interceptor that automatically fills null/empty values
 */
export function createAxiosInterceptor(
  axios: AxiosInstance,
  mocker: SmartMocker,
  config: InterceptorConfig = { enabled: true }
): SmartAxiosInterceptor {
  const interceptorId = axios.interceptors.response.use(
    async (response: unknown) => {
      const res = response as AxiosResponse;
      
      if (!config.enabled) {
        return response;
      }

      // Check URL patterns
      const url = res.config.url || '';
      
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
        const method = (res.config.method || 'GET').toUpperCase() as 
          'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
        
        if (!config.methods.includes(method)) {
          return response;
        }
      }

      // Fill the response data
      if (res.data && typeof res.data === 'object') {
        try {
          res.data = await mocker.fill(res.data as object, config.fillOptions);
        } catch (error) {
          console.warn('[SmartMocker] Failed to fill response:', error);
        }
      }

      return response;
    },
    (error: unknown) => {
      return Promise.reject(error);
    }
  );

  return {
    id: interceptorId,
    eject: () => axios.interceptors.response.eject(interceptorId),
  };
}

/**
 * Helper to setup Axios interceptor with mocker instance
 */
export function setupAxiosInterceptor(
  axios: AxiosInstance,
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
): SmartAxiosInterceptor {
  return createAxiosInterceptor(axios, mocker, {
    enabled: true,
    urlPatterns: options?.urlPatterns,
    excludePatterns: options?.excludePatterns,
    methods: options?.methods,
    fillOptions: options?.fillOptions,
  });
}
