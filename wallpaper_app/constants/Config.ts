/**
 * Application configuration settings
 */

export const Config = {
  api: {
    baseUrl: __DEV__ 
      ? 'http://192.168.101.79:8000'  // Development - Changed port to 8000
      : 'https://wallpaperapp-production.up.railway.app',  // Production
  },
} as const;