/**
 * Application configuration settings
 */

export const Config = {
  api: {
    baseUrl: __DEV__ 
      ? 'http://172.16.3.105:8000'  // Development
      : 'https://wallpaperapp-production.up.railway.app',  // Production
  },
} as const;