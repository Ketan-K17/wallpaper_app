import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Dimensions, RefreshControl } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');
const itemWidth = (width - 30) / 2;

// Mock wallpaper data
const mockWallpapers = [
  { id: '1', url: 'https://picsum.photos/400/600?random=1', title: 'Abstract Art', downloads: 1200 },
  { id: '2', url: 'https://picsum.photos/400/600?random=2', title: 'Nature View', downloads: 890 },
  { id: '3', url: 'https://picsum.photos/400/600?random=3', title: 'City Lights', downloads: 1567 },
  { id: '4', url: 'https://picsum.photos/400/600?random=4', title: 'Ocean Waves', downloads: 2340 },
  { id: '5', url: 'https://picsum.photos/400/600?random=5', title: 'Mountain Peak', downloads: 978 },
  { id: '6', url: 'https://picsum.photos/400/600?random=6', title: 'Cosmic Space', downloads: 1456 },
  { id: '7', url: 'https://picsum.photos/400/600?random=7', title: 'Forest Path', downloads: 823 },
  { id: '8', url: 'https://picsum.photos/400/600?random=8', title: 'Desert Sunset', downloads: 1834 },
];

interface WallpaperItemProps {
  item: any;
  onPress: () => void;
}

const WallpaperItem: React.FC<WallpaperItemProps> = ({ item, onPress }) => (
  <TouchableOpacity style={styles.wallpaperItem} onPress={onPress}>
    <Image
      source={{ uri: item.url }}
      style={styles.wallpaperImage}
      contentFit="cover"
    />
    <LinearGradient
      colors={['transparent', 'rgba(0,0,0,0.8)']}
      style={styles.overlay}
    >
      <Text style={styles.wallpaperTitle} numberOfLines={1}>
        {item.title}
      </Text>
      <Text style={styles.downloadCount}>
        {item.downloads} downloads
      </Text>
    </LinearGradient>
  </TouchableOpacity>
);

export default function HomeScreen() {
  const [wallpapers, setWallpapers] = useState(mockWallpapers);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  const onRefresh = async () => {
    setRefreshing(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshing(false);
  };

  const handleWallpaperPress = (wallpaper: any) => {
    router.push({
      pathname: '/wallpaper/[id]',
      params: { 
        id: wallpaper.id,
        url: wallpaper.url,
        title: wallpaper.title,
        downloads: wallpaper.downloads
      }
    });
  };

  const renderWallpaper = ({ item }: { item: any }) => (
    <WallpaperItem
      item={item}
      onPress={() => handleWallpaperPress(item)}
    />
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Beautiful Wallpapers</Text>
        <Text style={styles.headerSubtitle}>Discover amazing backgrounds</Text>
      </View>
      
      <FlatList
        data={wallpapers}
        renderItem={renderWallpaper}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    paddingHorizontal: 15,
    paddingVertical: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#6c757d',
  },
  list: {
    padding: 15,
  },
  wallpaperItem: {
    width: itemWidth,
    height: itemWidth * 1.6,
    marginRight: 15,
    marginBottom: 15,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  wallpaperImage: {
    width: '100%',
    height: '100%',
  },
  overlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 12,
  },
  wallpaperTitle: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  downloadCount: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
  },
});