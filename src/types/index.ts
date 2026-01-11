/**
 * Smart JSON Mocker - Type Definitions
 */

// ============================================
// Configuration Types
// ============================================

export type AIProvider = 'gemini';

export interface AIConfig {
  /** AI provider to use */
  provider: AIProvider;
  /** API key for the provider (required) */
  apiKey: string;
  /** Model to use (optional, defaults to best free option) */
  model?: string;
  /** Fallback providers if primary fails */
  fallback?: AIProvider[];
  /** Maximum retries on failure */
  maxRetries?: number;
  /** Request timeout in milliseconds */
  timeout?: number;
}

export interface CacheConfig {
  /** Enable caching */
  enabled: boolean;
  /** Persist cache to storage */
  persist?: boolean;
  /** Time to live in seconds */
  ttl?: number;
  /** Storage key prefix */
  prefix?: string;
}

export interface SmartMockerConfig {
  /** AI configuration */
  ai: AIConfig;
  /** Cache configuration */
  cache?: CacheConfig;
  /** Custom field overrides */
  overrides?: FieldOverrides;
  /** Enable debug logging */
  debug?: boolean;
  /** Locale for generated data */
  locale?: string;
}

// ============================================
// Field Override Types
// ============================================

export type FieldOverrideValue = 
  | string 
  | number 
  | boolean 
  | null 
  | (() => unknown)
  | FieldOverrideConfig;

export interface FieldOverrideConfig {
  /** Static value to use */
  value?: unknown;
  /** Generator function */
  generator?: () => unknown;
  /** Enum values to pick from */
  enum?: unknown[];
  /** Min value for numbers */
  min?: number;
  /** Max value for numbers */
  max?: number;
  /** Length for strings/arrays */
  length?: number;
}

export interface FieldOverrides {
  [key: string]: FieldOverrideValue;
}

// ============================================
// Mock Generation Types
// ============================================

export interface MockOptions {
  /** Number of items to generate (for arrays) */
  count?: number;
  /** Fields to exclude from mocking */
  exclude?: string[];
  /** Only mock these fields */
  include?: string[];
  /** Deep mock nested objects */
  deep?: boolean;
  /** Custom context to help AI understand the data */
  context?: string;
  /** Field-level overrides for this specific call */
  overrides?: FieldOverrides;
}

export interface FillOptions {
  /** Only fill null values */
  nullOnly?: boolean;
  /** Only fill undefined values */
  undefinedOnly?: boolean;
  /** Only fill empty strings */
  emptyStringsOnly?: boolean;
  /** Fill empty arrays */
  fillEmptyArrays?: boolean;
  /** Number of items for empty arrays */
  arrayLength?: number;
  /** Custom context to help AI */
  context?: string;
  /** Field-level overrides */
  overrides?: FieldOverrides;
}

export interface GenerateOptions extends MockOptions {
  /** TypeScript interface/type as string for reference */
  schema?: string;
}

// ============================================
// Internal Types
// ============================================

export interface FieldInfo {
  key: string;
  path: string;
  value: unknown;
  type: string;
  parentKey?: string;
  isNull: boolean;
  isEmpty: boolean;
  isUndefined: boolean;
}

export interface GeneratedValue {
  path: string;
  value: unknown;
}

export interface AIPromptContext {
  fields: FieldInfo[];
  context?: string;
  locale?: string;
  overrides?: FieldOverrides;
}

export interface AIResponse {
  success: boolean;
  data?: Record<string, unknown>;
  error?: string;
}

export interface CacheEntry {
  value: unknown;
  timestamp: number;
  ttl: number;
}


// ============================================
// Interceptor Types
// ============================================

export interface InterceptorConfig {
  /** Enable the interceptor */
  enabled: boolean;
  /** URL patterns to intercept */
  urlPatterns?: (string | RegExp)[];
  /** URL patterns to exclude */
  excludePatterns?: (string | RegExp)[];
  /** Only intercept specific HTTP methods */
  methods?: ('GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE')[];
  /** Fill options for intercepted responses */
  fillOptions?: FillOptions;
}

// ============================================
// Public API Types
// ============================================

export interface SmartMocker {
  /** Fill null/empty values in an object */
  fill<T extends object>(obj: T, options?: FillOptions): Promise<T>;
  
  /** Generate mock data from a schema/interface */
  generate<T = unknown>(schema: string | object, options?: GenerateOptions): Promise<T>;
  
  /** Generate array of mock data */
  generateMany<T = unknown>(schema: string | object, count: number, options?: GenerateOptions): Promise<T[]>;
  
  /** Add custom field overrides */
  addOverride(key: string, value: FieldOverrideValue): void;
  
  /** Remove custom field override */
  removeOverride(key: string): void;
  
  /** Clear all caches */
  clearCache(): void;
  
  /** Create axios interceptor */
  createAxiosInterceptor(config?: InterceptorConfig): AxiosInterceptor;
  
  /** Create fetch wrapper */
  createFetchWrapper(config?: InterceptorConfig): FetchWrapper;
}

export interface AxiosInterceptor {
  /** Interceptor ID for removal */
  id: number;
  /** Remove the interceptor */
  eject: () => void;
}

export type FetchWrapper = (
  input: RequestInfo | URL,
  init?: RequestInit
) => Promise<Response>;
