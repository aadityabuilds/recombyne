import axios from 'axios';
import { isValidUrl } from '../server/config/security';

// Create a secure axios instance with default configuration
const secureAxios = axios.create({
  // Disable support for URLS in request data to prevent SSRF
  transformRequest: [(data, headers) => {
    if (data && typeof data === 'object') {
      // Deep check for URLs in request data
      const hasUrl = JSON.stringify(data).match(/(https?:\/\/[^\s]+)/g);
      if (hasUrl) {
        // Validate each URL
        const validUrls = hasUrl.every(url => isValidUrl(url.replace(/["']/g, '')));
        if (!validUrls) {
          throw new Error('Invalid URL detected in request data');
        }
      }
    }
    return data;
  }, ...axios.defaults.transformRequest],

  // Validate URLs in request configuration
  beforeRedirect: (options, { headers }) => {
    if (!isValidUrl(options.url)) {
      throw new Error('Invalid redirect URL');
    }
  },

  // Security headers
  headers: {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block'
  },

  // Additional security settings
  maxRedirects: 5, // Limit redirects
  timeout: 10000,  // 10 second timeout
  withCredentials: false // Don't send credentials by default
});

// Add request interceptor for URL validation
secureAxios.interceptors.request.use(
  config => {
    // Validate the request URL
    if (!isValidUrl(config.url)) {
      throw new Error('Invalid request URL');
    }
    
    // Ensure absolute URLs are not exposing sensitive information
    if (config.params) {
      Object.keys(config.params).forEach(key => {
        if (typeof config.params[key] === 'string' && 
            (config.params[key].includes('http://') || config.params[key].includes('https://'))) {
          if (!isValidUrl(config.params[key])) {
            throw new Error('Invalid URL in request parameters');
          }
        }
      });
    }
    
    return config;
  },
  error => Promise.reject(error)
);

// Add response interceptor for additional security checks
secureAxios.interceptors.response.use(
  response => {
    // Validate any URLs in the response data
    if (response.data && typeof response.data === 'object') {
      const responseStr = JSON.stringify(response.data);
      const urls = responseStr.match(/(https?:\/\/[^\s]+)/g);
      if (urls) {
        const validUrls = urls.every(url => isValidUrl(url.replace(/["']/g, '')));
        if (!validUrls) {
          throw new Error('Invalid URL detected in response data');
        }
      }
    }
    return response;
  },
  error => Promise.reject(error)
);

export default secureAxios; 