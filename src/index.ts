/**
 * Smart JSON Mocker
 * AI-powered JSON mock data generator
 * 
 * @packageDocumentation
 * @module smart-json-mocker
 */

// Core exports
export { SmartMocker, createSmartMocker } from './core';

// Provider exports
export { GeminiProvider } from './providers';

// Interceptor exports
export {
  createAxiosInterceptor,
  setupAxiosInterceptor,
  createFetchWrapper,
  patchGlobalFetch,
  setupFetchWrapper,
} from './interceptors';

// Type exports
export type {
  // Config types
  SmartMockerConfig,
  AIConfig,
  AIProvider,
  CacheConfig,
  
  // Override types
  FieldOverrides,
  FieldOverrideValue,
  FieldOverrideConfig,
  
  // Options types
  MockOptions,
  FillOptions,
  GenerateOptions,
  
  // Interceptor types
  InterceptorConfig,
  AxiosInterceptor,
  FetchWrapper,
  
  
  // Internal types (for advanced usage)
  FieldInfo,
  AIResponse,
  AIPromptContext,
} from './types';

// Utility exports (for advanced usage)
export {
  deepClone,
  extractEmptyFields,
  setNestedValue,
  getNestedValue,
  isNullish,
  isEmpty,
  randomInt,
  randomFrom,
  generateUUID,
} from './utils';

// ============================================
// Convenience Functions
// ============================================

import { SmartMocker, createSmartMocker } from './core';
import type { SmartMockerConfig, FillOptions, GenerateOptions } from './types';

let defaultInstance: SmartMocker | null = null;

/**
 * Initialize the default SmartMocker instance
 */
export function init(config: SmartMockerConfig): SmartMocker {
  defaultInstance = createSmartMocker(config);
  return defaultInstance;
}

/**
 * Get the default SmartMocker instance
 */
export function getInstance(): SmartMocker {
  if (!defaultInstance) {
    throw new Error(
      'SmartMocker not initialized. Call init() first or use createSmartMocker().'
    );
  }
  return defaultInstance;
}

/**
 * Fill null/empty values in an object using the default instance
 */
export async function fill<T extends object>(
  obj: T,
  options?: FillOptions
): Promise<T> {
  return getInstance().fill(obj, options);
}

/**
 * Generate mock data from a schema using the default instance
 */
export async function generate<T = unknown>(
  schema: string | object,
  options?: GenerateOptions
): Promise<T> {
  return getInstance().generate<T>(schema, options);
}

/**
 * Generate multiple mock objects using the default instance
 */
export async function generateMany<T = unknown>(
  schema: string | object,
  count: number,
  options?: GenerateOptions
): Promise<T[]> {
  return getInstance().generateMany<T>(schema, count, options);
}

/**
 * Generate JSON from TypeScript interface definition using the default instance
 */
export async function generateFromInterface<T = unknown>(
  interfaceDefinition: string,
  context?: string,
  options?: GenerateOptions
): Promise<T> {
  return getInstance().generateFromInterface<T>(interfaceDefinition, context, options);
}

/**
 * Generate multiple JSON objects from TypeScript interface definition using the default instance
 */
export async function generateManyFromInterface<T = unknown>(
  interfaceDefinition: string,
  count: number,
  context?: string,
  options?: GenerateOptions
): Promise<T[]> {
  return getInstance().generateManyFromInterface<T>(interfaceDefinition, count, context, options);
}

// ============================================
// Quick Setup Helper
// ============================================

/**
 * Quick setup with minimal configuration
 * @param apiKey - Google Gemini API key (required)
 */
export function quickSetup(apiKey: string): SmartMocker {
  if (!apiKey) {
    throw new Error('API key is required for AI-powered mock data generation');
  }
  return init({
    ai: {
      provider: 'gemini',
      apiKey,
    },
    cache: {
      enabled: true,
      persist: true,
    },
  });
}
