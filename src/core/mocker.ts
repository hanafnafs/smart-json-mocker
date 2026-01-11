/**
 * Smart JSON Mocker - Main Class
 * AI-powered JSON mock data generator
 */

import type {
  SmartMockerConfig,
  FillOptions,
  GenerateOptions,
  FieldOverrides,
  FieldOverrideValue,
  FieldInfo,
  AIResponse,
  InterceptorConfig,
  AxiosInterceptor,
  FetchWrapper,
} from '../types';
import { GeminiProvider } from '../providers';
import { CacheManager } from './cache';
import {
  deepClone,
  extractEmptyFields,
  setNestedValue,
  retry,
} from '../utils';

export class SmartMocker {
  private config: SmartMockerConfig;
  private geminiProvider?: GeminiProvider;
  private cacheManager: CacheManager;
  private overrides: FieldOverrides = {};
  private debug: boolean;

  constructor(config: SmartMockerConfig) {
    this.config = config;
    this.debug = config.debug ?? false;
    this.overrides = config.overrides ?? {};

    // Initialize AI provider if configured
    if (config.ai.provider === 'gemini' && config.ai.apiKey) {
      this.geminiProvider = new GeminiProvider({
        apiKey: config.ai.apiKey,
        model: config.ai.model,
        timeout: config.ai.timeout,
      });
    } else {
      throw new Error('AI provider configuration is required. Please provide a valid Gemini API key.');
    }

    // Initialize cache
    this.cacheManager = new CacheManager(config.cache);
  }

  /**
   * Fill null/empty values in an object with realistic mock data
   */
  async fill<T extends object>(obj: T, options: FillOptions = {}): Promise<T> {
    const cloned = deepClone(obj);
    const mergedOverrides = { ...this.overrides, ...options.overrides };

    // Extract fields that need filling
    let fields = extractEmptyFields(cloned as Record<string, unknown>);

    // Filter fields based on options
    if (options.nullOnly) {
      fields = fields.filter(f => f.isNull);
    }
    if (options.undefinedOnly) {
      fields = fields.filter(f => f.isUndefined);
    }
    if (options.emptyStringsOnly) {
      fields = fields.filter(f => typeof f.value === 'string' && f.value === '');
    }

    if (fields.length === 0) {
      this.log('No fields to fill');
      return cloned;
    }

    this.log(`Found ${fields.length} fields to fill:`, fields.map(f => f.path));

    // Generate values using AI
    const aiResult = await this.generateWithAI(fields, options.context, mergedOverrides);
    
    if (aiResult.success && aiResult.data) {
      for (const [path, value] of Object.entries(aiResult.data)) {
        setNestedValue(cloned as Record<string, unknown>, path, value);
      }
    }

    return cloned;
  }

  /**
   * Generate mock data from a schema/interface
   */
  async generate<T = unknown>(
    schema: string | object,
    options: GenerateOptions = {}
  ): Promise<T> {
    const mergedOverrides = { ...this.overrides, ...options.overrides };

    if (!this.geminiProvider) {
      throw new Error('AI provider not configured. Please provide a valid Gemini API key.');
    }

    const result = await retry(
      () => this.geminiProvider!.generateFromSchema(schema, 1, options.context),
      this.config.ai.maxRetries ?? 3
    );

    if (result.success && result.data) {
      return this.applyOverrides(result.data, mergedOverrides) as T;
    }

    throw new Error('Failed to generate mock data');
  }

  /**
   * Generate multiple mock objects
   */
  async generateMany<T = unknown>(
    schema: string | object,
    count: number,
    options: GenerateOptions = {}
  ): Promise<T[]> {
    const mergedOverrides = { ...this.overrides, ...options.overrides };

    if (!this.geminiProvider) {
      throw new Error('AI provider not configured. Please provide a valid Gemini API key.');
    }

    const result = await retry(
      () => this.geminiProvider!.generateFromSchema(schema, count, options.context),
      this.config.ai.maxRetries ?? 3
    );

    if (result.success && result.data) {
      const data = Array.isArray(result.data) ? result.data : [result.data];
      return data.map(item => this.applyOverrides(item, mergedOverrides)) as T[];
    }

    throw new Error('Failed to generate mock data');
  }

  /**
   * Add a custom field override
   */
  addOverride(key: string, value: FieldOverrideValue): void {
    this.overrides[key] = value;
  }

  /**
   * Remove a custom field override
   */
  removeOverride(key: string): void {
    delete this.overrides[key];
  }

  /**
   * Get all overrides
   */
  getOverrides(): FieldOverrides {
    return { ...this.overrides };
  }

  /**
   * Clear all caches
   */
  clearCache(): void {
    this.cacheManager.clear();
  }

  /**
   * Create an Axios interceptor
   */
  createAxiosInterceptor(_config: InterceptorConfig = { enabled: true }): AxiosInterceptor {
    // This will be implemented in the interceptors module
    // For now, return a placeholder
    return {
      id: -1,
      eject: () => {},
    };
  }

  /**
   * Create a fetch wrapper
   */
  createFetchWrapper(config: InterceptorConfig = { enabled: true }): FetchWrapper {
    const self = this;

    return async function smartFetch(
      input: RequestInfo | URL,
      init?: RequestInit
    ): Promise<Response> {
      const response = await fetch(input, init);
      
      if (!config.enabled) {
        return response;
      }

      // Check if URL matches patterns
      const url = typeof input === 'string' ? input : input.toString();
      if (config.urlPatterns && !config.urlPatterns.some(p => 
        typeof p === 'string' ? url.includes(p) : p.test(url)
      )) {
        return response;
      }

      // Check if URL is excluded
      if (config.excludePatterns && config.excludePatterns.some(p =>
        typeof p === 'string' ? url.includes(p) : p.test(url)
      )) {
        return response;
      }

      // Clone response to read body
      const cloned = response.clone();
      
      try {
        const data = await cloned.json();
        
        if (typeof data === 'object' && data !== null) {
          const filled = await self.fill(data, config.fillOptions);
          
          // Create new response with filled data
          return new Response(JSON.stringify(filled), {
            status: response.status,
            statusText: response.statusText,
            headers: response.headers,
          });
        }
      } catch {
        // Not JSON, return original
      }

      return response;
    };
  }

  /**
   * Generate values using AI provider
   */
  private async generateWithAI(
    fields: FieldInfo[],
    context?: string,
    overrides?: FieldOverrides
  ): Promise<AIResponse> {
    // Check cache first
    const cacheKey = this.cacheManager.generateKey(fields);
    const cached = this.cacheManager.get(cacheKey);
    
    if (cached) {
      this.log('Using cached result');
      return { success: true, data: cached as Record<string, unknown> };
    }

    if (!this.geminiProvider) {
      throw new Error('AI provider not configured. Please provide a valid Gemini API key.');
    }

    this.log('Generating with Gemini AI');
    
    const result = await retry(
      () => this.geminiProvider!.generateForFields(fields, context, overrides),
      this.config.ai.maxRetries ?? 3
    );

    if (result.success && result.data) {
      // Cache the result
      this.cacheManager.set(cacheKey, result.data);
      return result;
    }

    throw new Error('Failed to generate data with AI provider');
  }

  /**
   * Apply overrides to generated data
   */
  private applyOverrides(
    data: Record<string, unknown>,
    overrides: FieldOverrides
  ): Record<string, unknown> {
    const result = deepClone(data);

    for (const [key, override] of Object.entries(overrides)) {
      if (key in result || this.hasNestedKey(result, key)) {
        const value = this.resolveOverride(override);
        if (key.includes('.')) {
          setNestedValue(result, key, value);
        } else {
          result[key] = value;
        }
      }
    }

    return result;
  }

  /**
   * Check if object has a nested key
   */
  private hasNestedKey(obj: Record<string, unknown>, key: string): boolean {
    const keys = Object.keys(obj);
    for (const k of keys) {
      if (k === key) return true;
      const value = obj[k];
      if (typeof value === 'object' && value !== null) {
        if (this.hasNestedKey(value as Record<string, unknown>, key)) {
          return true;
        }
      }
    }
    return false;
  }

  /**
   * Resolve an override value
   */
  private resolveOverride(override: FieldOverrideValue): unknown {
    if (typeof override === 'function') {
      return override();
    }

    if (typeof override === 'object' && override !== null) {
      if ('generator' in override && typeof override.generator === 'function') {
        return override.generator();
      }
      if ('value' in override) {
        return override.value;
      }
      if ('enum' in override && Array.isArray(override.enum)) {
        return override.enum[Math.floor(Math.random() * override.enum.length)];
      }
    }

    return override;
  }

  /**
   * Log debug messages
   */
  private log(...args: unknown[]): void {
    if (this.debug) {
      console.log('[SmartMocker]', ...args);
    }
  }
}

/**
 * Create a SmartMocker instance
 */
export function createSmartMocker(config: SmartMockerConfig): SmartMocker {
  return new SmartMocker(config);
}
