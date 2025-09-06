import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Dimensions,
  StatusBar,
  ScrollView,
  Share,
  ActivityIndicator,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import * as MediaLibrary from 'expo-media-library';
import * as FileSystem from 'expo-file-system';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { apiService, GenerationStatus } from '@/services/apiService';

const { width, height } = Dimensions.get('window');

type WallpaperData = GenerationStatus & {
  title?: string;
  subtitle?: string;
  description?: string;
};

// Fallback data for demo wallpapers
const fallbackWallpapers: { [key: string]: WallpaperData } = {
  'fallback-1': {
    generation_id: 'fallback-1',
    status: 'completed',
    image_url: 'https://images.unsplash.com/photo-1557672172-298e090bd0f1?w=400&h=800&fit=crop',
    progress: 100,
    created_at: new Date().toISOString(),
    completed_at: new Date().toISOString(),
    title: 'Get Started',
    subtitle: 'Demo Wallpaper',
    description: 'This is a demo wallpaper. Generate your own custom AI wallpapers using the Generate tab!',
  },
};

export default function WallpaperDetailScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { id } = useLocalSearchParams();
  const [wallpaper, setWallpaper] = useState<WallpaperData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [liked, setLiked] = useState(false);

  useEffect(() => {
    fetchWallpaperData();
  }, [id]);

  const fetchWallpaperData = async () => {
    if (!id || typeof id !== 'string') {
      setError('Invalid wallpaper ID');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Check if it's a fallback wallpaper
      if (id.startsWith('fallback-')) {
        const fallbackData = fallbackWallpapers[id];
        if (fallbackData) {
          setWallpaper(fallbackData);
        } else {
          setError('Wallpaper not found');
        }
        setLoading(false);
        return;
      }

      // Fetch real wallpaper data
      const generationStatus = await apiService.getGenerationStatus(id);
      
      if (generationStatus.status !== 'completed') {
        setError('Wallpaper is not ready yet');
        setLoading(false);
        return;
      }

      // Transform the data for display
      const wallpaperData: WallpaperData = {
        ...generationStatus,
        title: `AI Wallpaper ${id.slice(-6)}`,
        subtitle: new Date(generationStatus.created_at).toLocaleDateString(),
        description: 'Custom AI-generated wallpaper created just for you.',
      };

      setWallpaper(wallpaperData);
    } catch (err) {
      console.error('Error fetching wallpaper:', err);
      setError('Failed to load wallpaper');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.text }]}>Loading wallpaper...</Text>
      </View>
    );
  }

  if (error || !wallpaper) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.text }]}>
          {error || 'Wallpaper not found'}
        </Text>
        <TouchableOpacity 
          style={[styles.retryButton, { backgroundColor: colors.primary }]}
          onPress={fetchWallpaperData}
        >
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleDownload = async () => {
    if (!wallpaper) return;

    try {
      setDownloading(true);

      // Request permissions
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant permission to save wallpapers');
        return;
      }

      // Determine download URL
      let downloadUrl: string;
      if (wallpaper.generation_id.startsWith('fallback-')) {
        // For fallback wallpapers, use the direct URL
        if (wallpaper.image_url) {
          downloadUrl = wallpaper.image_url;
        } else {
          setError('Image URL is not available');
          return;
        }
      } else {
        // For generated wallpapers, use the API download endpoint
        downloadUrl = apiService.getDownloadUrl(wallpaper.generation_id);
      }

      // Download the image
      const fileUri = FileSystem.documentDirectory + `wallpaper_${wallpaper.generation_id}.png`;
      const downloadResult = await FileSystem.downloadAsync(downloadUrl, fileUri);

      // Save to media library
      await MediaLibrary.saveToLibraryAsync(downloadResult.uri);

      Alert.alert('Success', 'Wallpaper saved to your gallery!');
    } catch (error) {
      Alert.alert('Error', 'Failed to download wallpaper');
      console.error('Download error:', error);
    } finally {
      setDownloading(false);
    }
  };

  const handleShare = async () => {
    if (!wallpaper) return;
    
    try {
      const imageUrl = wallpaper.generation_id.startsWith('fallback-') 
        ? wallpaper.image_url 
        : apiService.getImageUrl(wallpaper.image_url || '');
        
      await Share.share({
        message: `Check out this amazing AI wallpaper: ${wallpaper.title || 'Custom AI Wallpaper'}`,
        url: imageUrl || '',
      });
    } catch (error) {
      console.error('Share error:', error);
    }
  };

  const handleLike = () => {
    setLiked(!liked);
  };

  const goBack = () => {
    router.back();
  };

  const getImageUrl = () => {
    if (!wallpaper) return '';
    return wallpaper.generation_id.startsWith('fallback-') 
      ? wallpaper.image_url 
      : apiService.getImageUrl(wallpaper.image_url || '');
  };

  const getCreatedDate = () => {
    if (!wallpaper?.created_at) return 'Unknown';
    return new Date(wallpaper.created_at).toLocaleDateString();
  };

  const getCreatedTime = () => {
    if (!wallpaper?.created_at) return 'Unknown';
    return new Date(wallpaper.created_at).toLocaleTimeString('en-IN', {
      timeZone: 'Asia/Kolkata',
    });
  };
  

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" />
      
      {/* Wallpaper Image */}
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: getImageUrl() }}
          style={styles.wallpaperImage}
          contentFit="cover"
          placeholder="🖼️"
        />
        
        {/* Overlay Gradient */}
        <LinearGradient
          colors={['transparent', 'transparent', 'rgba(0,0,0,0.8)']}
          style={styles.overlay}
        />

        {/* Back Button */}
        <TouchableOpacity style={styles.backButton} onPress={goBack}>
          <View style={[styles.iconButton, { backgroundColor: 'rgba(0,0,0,0.3)' }]}>
            <Text style={styles.backIcon}>←</Text>
          </View>
        </TouchableOpacity>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.actionButton} onPress={handleLike}>
            <View style={[styles.iconButton, { backgroundColor: 'rgba(0,0,0,0.3)' }]}>
              <Text style={[styles.actionIcon, { color: liked ? colors.primary : '#FFFFFF' }]}>
                ♥
              </Text>
            </View>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionButton} onPress={handleShare}>
            <View style={[styles.iconButton, { backgroundColor: 'rgba(0,0,0,0.3)' }]}>
              <Text style={styles.actionIcon}>↗</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>
            {wallpaper.description || 'AI Wallpaper'}
          </Text>
          <Text style={[styles.author, { color: colors.placeholder }]}>
            {wallpaper.subtitle || 'Generated by AI'}
          </Text>
        </View>

        {/* Stats */}
        <View style={styles.stats}>
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: colors.text }]}>
              {getCreatedDate()}
            </Text>
            <Text style={[styles.statLabel, { color: colors.placeholder }]}>Created</Text>
          </View>
          
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: colors.text }]}>
              {getCreatedTime()}
            </Text>
            <Text style={[styles.statLabel, { color: colors.placeholder }]}>Time</Text>
          </View>
          
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: colors.text }]}>
              2K
            </Text>
            <Text style={[styles.statLabel, { color: colors.placeholder }]}>Resolution</Text>
          </View>
        </View>

        {/* Category */}
        <View style={styles.categoryContainer}>
          <View style={[styles.categoryTag, { backgroundColor: colors.primary }]}>
            <Text style={styles.categoryText}>
              {wallpaper.generation_id.startsWith('fallback-') ? 'Demo' : 'AI Generated'}
            </Text>
          </View>
        </View>

        {/* Download Button */}
        <LinearGradient
          colors={[colors.primary, colors.secondary]}
          style={styles.downloadButton}
        >
          <TouchableOpacity
            style={styles.downloadButtonInner}
            onPress={handleDownload}
            disabled={downloading}
          >
            <Text style={styles.downloadButtonText}>
              {downloading ? 'Downloading...' : '⬇ Download Wallpaper'}
            </Text>
          </TouchableOpacity>
        </LinearGradient>

        {/* Additional Info */}
        <View style={styles.infoSection}>
          <Text style={[styles.infoTitle, { color: colors.text }]}>About this wallpaper</Text>
          <Text style={[styles.infoText, { color: colors.placeholder }]}>
            {wallpaper.description || 'AI-generated wallpaper created with advanced machine learning algorithms. Perfect for your device with high-quality resolution and unique artistic style.'}
          </Text>
          
          {wallpaper.generation_id && !wallpaper.generation_id.startsWith('fallback-') && (
            <View style={styles.generationInfo}>
              <Text style={[styles.generationLabel, { color: colors.placeholder }]}>
                Generation ID:
              </Text>
              <Text style={[styles.generationId, { color: colors.text }]}>
                {wallpaper.generation_id}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  imageContainer: {
    height: height * 0.6,
    position: 'relative',
  },
  wallpaperImage: {
    width: '100%',
    height: '100%',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 2,
  },
  actionButtons: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 2,
  },
  actionButton: {
    marginBottom: 12,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backIcon: {
    fontSize: 20,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  actionIcon: {
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    marginTop: -20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  author: {
    fontSize: 16,
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 24,
    paddingVertical: 20,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
  },
  categoryContainer: {
    marginBottom: 32,
  },
  categoryTag: {
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  categoryText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  downloadButton: {
    borderRadius: 12,
    marginBottom: 32,
    overflow: 'hidden',
  },
  downloadButtonInner: {
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
  },
  downloadButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  infoSection: {
    marginBottom: 40,
  },
  infoTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 16,
    lineHeight: 24,
  },
  errorText: {
    fontSize: 18,
    textAlign: 'center',
    marginTop: 100,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  retryButton: {
    marginTop: 20,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  generationInfo: {
    marginTop: 16,
    padding: 12,
    backgroundColor: 'rgba(128, 128, 128, 0.1)',
    borderRadius: 8,
  },
  generationLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  generationId: {
    fontSize: 14,
    fontFamily: 'monospace',
  },
});
