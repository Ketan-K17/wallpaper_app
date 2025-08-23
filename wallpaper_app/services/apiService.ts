/**
 * API Service for communicating with the AI Wallpaper Generator backend
 */

const API_BASE_URL = __DEV__ 
  ? 'http://192.168.101.79:8000'  // Development - replace YOUR_COMPUTER_IP with actual IP
  : 'https://your-production-api.com';  // Production

export interface GenerationRequest {
  description: string;
  genre?: string;
  art_style?: string;
  user_id?: string;
}

export interface GenerationResponse {
  generation_id: string;
  status: string;
  message: string;
}

export interface GenerationStatus {
  generation_id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  image_url?: string;
  error_message?: string;
  created_at: string;
  completed_at?: string;
}

export interface RecentGeneration {
  generation_id: string;
  status: string;
  image_url: string;
  created_at: string;
  completed_at: string;
}

class ApiService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = API_BASE_URL;
  }

  /**
   * Start a new wallpaper generation
   */
  async generateWallpaper(request: GenerationRequest): Promise<GenerationResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }));
        throw new Error(errorData.detail || `HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error starting generation:', error);
      throw error;
    }
  }

  /**
   * Get the status of a generation request
   */
  async getGenerationStatus(generationId: string): Promise<GenerationStatus> {
    try {
      const response = await fetch(`${this.baseUrl}/status/${generationId}`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }));
        throw new Error(errorData.detail || `HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting generation status:', error);
      throw error;
    }
  }

  /**
   * Get the download URL for a completed wallpaper
   */
  getDownloadUrl(generationId: string): string {
    return `${this.baseUrl}/download/${generationId}`;
  }

  /**
   * Get the image URL for displaying in the app
   */
  getImageUrl(imageUrl: string): string {
    if (imageUrl.startsWith('http')) {
      return imageUrl;
    }
    return `${this.baseUrl}${imageUrl}`;
  }

  /**
   * Download a wallpaper file
   */
  async downloadWallpaper(generationId: string): Promise<Blob> {
    try {
      const response = await fetch(this.getDownloadUrl(generationId));

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      return await response.blob();
    } catch (error) {
      console.error('Error downloading wallpaper:', error);
      throw error;
    }
  }

  /**
   * Get recent completed generations for showcase
   */
  async getRecentGenerations(limit: number = 10): Promise<RecentGeneration[]> {
    try {
      const response = await fetch(`${this.baseUrl}/recent?limit=${limit}`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }));
        throw new Error(errorData.detail || `HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting recent generations:', error);
      throw error;
    }
  }

  /**
   * Check if the API server is healthy
   */
  async checkHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/health`, {
        method: 'GET',
      });

      return response.ok;
    } catch (error) {
      console.error('API health check failed:', error);
      return false;
    }
  }

  /**
   * Poll generation status until completion
   */
  async pollGenerationStatus(
    generationId: string,
    onProgress?: (status: GenerationStatus) => void,
    pollInterval: number = 2000, // 2 seconds
    maxPollTime: number = 300000 // 5 minutes
  ): Promise<GenerationStatus> {
    const startTime = Date.now();

    return new Promise((resolve, reject) => {
      const poll = async () => {
        try {
          const status = await this.getGenerationStatus(generationId);
          
          if (onProgress) {
            onProgress(status);
          }

          if (status.status === 'completed') {
            resolve(status);
            return;
          }

          if (status.status === 'failed') {
            reject(new Error(status.error_message || 'Generation failed'));
            return;
          }

          // Check if we've exceeded max poll time
          if (Date.now() - startTime > maxPollTime) {
            reject(new Error('Generation timeout'));
            return;
          }

          // Continue polling
          setTimeout(poll, pollInterval);
        } catch (error) {
          reject(error);
        }
      };

      // Start polling
      poll();
    });
  }
}

// Export singleton instance
export const apiService = new ApiService();
