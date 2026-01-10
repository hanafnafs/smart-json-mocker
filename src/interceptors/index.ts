/**
 * Interceptors Index
 */

export { 
  createAxiosInterceptor, 
  setupAxiosInterceptor,
  type SmartAxiosInterceptor 
} from './axios';

export { 
  createFetchWrapper, 
  patchGlobalFetch, 
  setupFetchWrapper,
  type SmartFetch 
} from './fetch';
