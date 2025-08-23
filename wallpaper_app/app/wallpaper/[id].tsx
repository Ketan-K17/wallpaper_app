import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Dimensions, Share } from 'react-native';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as MediaLibrary from 'expo-media-library';
import * as FileSystem from 'expo-file-system';

const { width, height } = Dimensions.get('window');

export default function WallpaperDetailScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const [downloading, setDownloading] = useState(false);

  const { id, url, title, downloads } = params;

  const downloadWallpaper = async () => {
    try {
      setDownloading(true);
      
      // Request permissions
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission required', 'Please grant permission to save wallpapers');
        return;
      }

      // Download the image
      const downloadResult = await FileSystem.downloadAsync(
        url as string,
        FileSystem.documentDirectory + `wallpaper_${id}.jpg`
      );

      // Save to media library
      await MediaLibrary.saveToLibraryAsync(downloadResult.uri);
      
      Alert.alert('Success', 'Wallpaper saved to your gallery!');
    } catch (error) {
      Alert.alert('Error', 'Failed to download wallpaper. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  const shareWallpaper = async () => {
    try {
      await Share.share({
        message: `Check out this amazing wallpaper: ${title}`,
        url: url as string,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: url as string }}
          style={styles.wallpaperImage}
          contentFit="cover"
        />
        
        <LinearGradient
          colors={['rgba(0,0,0,0.3)', 'transparent', 'rgba(0,0,0,0.7)']}
          style={styles.gradient}
        />

        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.shareButton}
          onPress={shareWallpaper}
        >
          <Ionicons name="share-outline" size={24} color="white" />
        </TouchableOpacity>

        <View style={styles.infoContainer}>
          <Text style={styles.wallpaperTitle}>{title}</Text>
          <Text style={styles.downloadCount}>
            {downloads} downloads
          </Text>
        </View>
      </View>

      <View style={styles.actionContainer}>
        <TouchableOpacity
          style={[styles.downloadButton, downloading && styles.downloadButtonDisabled]}
          onPress={downloadWallpaper}
          disabled={downloading}
        >
          <Ionicons 
            name={downloading ? "download-outline" : "download"} 
            size={24} 
            color="white" 
          />
          <Text style={styles.downloadButtonText}>
            {downloading ? 'Downloading...' : 'Download Wallpaper'}
          </Text>
        </TouchableOpacity>
        
        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.secondaryButton}>
            <Ionicons name="heart-outline" size={20} color="#667eea" />
            <Text style={styles.secondaryButtonText}>Favorite</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.secondaryButton}>
            <Ionicons name="folder-outline" size={20} color="#667eea" />
            <Text style={styles.secondaryButtonText}>Save to Collection</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  imageContainer: {
    flex: 1,
    position: 'relative',
  },
  wallpaperImage: {
    width: '100%',
    height: '100%',
  },
  gradient: {
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
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shareButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoContainer: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
  },
  wallpaperTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  downloadCount: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  actionContainer: {
    backgroundColor: 'white',
    paddingHorizontal: 20,
    paddingVertical: 30,
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    marginTop: -25,
  },
  downloadButton: {
    backgroundColor: '#667eea',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  downloadButtonDisabled: {
    opacity: 0.7,
  },
  downloadButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  secondaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#667eea',
    backgroundColor: 'rgba(102, 126, 234, 0.1)',
    marginHorizontal: 6,
  },
  secondaryButtonText: {
    color: '#667eea',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 6,
  },
});
