import React, { useState } from 'react';
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
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import * as MediaLibrary from 'expo-media-library';
import * as FileSystem from 'expo-file-system';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

const { width, height } = Dimensions.get('window');

// Mock wallpaper data
const wallpapers = {
  '1': {
    id: '1',
    title: 'Abstract Orange',
    author: 'Design Studio',
    url: 'https://images.unsplash.com/photo-1557672172-298e090bd0f1?w=400&h=800&fit=crop',
    downloads: 1234,
    likes: 567,
    category: 'Abstract',
    resolution: '4K',
  },
  '2': {
    id: '2',
    title: 'Dark Minimal',
    author: 'Creative Team',
    url: 'https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=400&h=800&fit=crop',
    downloads: 2341,
    likes: 892,
    category: 'Minimal',
    resolution: '4K',
  },
  '3': {
    id: '3',
    title: 'Gradient Flow',
    author: 'Art Collective',
    url: 'https://images.unsplash.com/photo-1557264305-7e2764da873b?w=400&h=800&fit=crop',
    downloads: 3456,
    likes: 1234,
    category: 'Gradient',
    resolution: '4K',
  },
};

export default function WallpaperDetailScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { id } = useLocalSearchParams();
  const [downloading, setDownloading] = useState(false);
  const [liked, setLiked] = useState(false);

  const wallpaper = wallpapers[id as keyof typeof wallpapers];

  if (!wallpaper) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.text }]}>Wallpaper not found</Text>
      </View>
    );
  }

  const handleDownload = async () => {
    try {
      setDownloading(true);

      // Request permissions
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant permission to save wallpapers');
        return;
      }

      // Download the image
      const fileUri = FileSystem.documentDirectory + `wallpaper_${wallpaper.id}.jpg`;
      const downloadResult = await FileSystem.downloadAsync(wallpaper.url, fileUri);

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
    try {
      await Share.share({
        message: `Check out this amazing wallpaper: ${wallpaper.title}`,
        url: wallpaper.url,
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

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" />
      
      {/* Wallpaper Image */}
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: wallpaper.url }}
          style={styles.wallpaperImage}
          contentFit="cover"
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
          <Text style={[styles.title, { color: colors.text }]}>{wallpaper.title}</Text>
          <Text style={[styles.author, { color: colors.placeholder }]}>
            by {wallpaper.author}
          </Text>
        </View>

        {/* Stats */}
        <View style={styles.stats}>
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: colors.text }]}>
              {wallpaper.downloads.toLocaleString()}
            </Text>
            <Text style={[styles.statLabel, { color: colors.placeholder }]}>Downloads</Text>
          </View>
          
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: colors.text }]}>
              {wallpaper.likes.toLocaleString()}
            </Text>
            <Text style={[styles.statLabel, { color: colors.placeholder }]}>Likes</Text>
          </View>
          
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: colors.text }]}>
              {wallpaper.resolution}
            </Text>
            <Text style={[styles.statLabel, { color: colors.placeholder }]}>Resolution</Text>
          </View>
        </View>

        {/* Category */}
        <View style={styles.categoryContainer}>
          <View style={[styles.categoryTag, { backgroundColor: colors.primary }]}>
            <Text style={styles.categoryText}>{wallpaper.category}</Text>
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
            High-quality {wallpaper.resolution} wallpaper perfect for your device. 
            Created by talented artists and available for free download.
          </Text>
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
});
