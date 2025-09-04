/**
 * Application configuration settings
 */

export const Config = {
  api: {
    baseUrl: __DEV__ 
      ? 'https://wallpaperapp-production.up.railway.app'  // Development - Changed port to 8000
      : 'https://wallpaperapp-production.up.railway.app',  // Production
  },
} as const;