import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  TextInput,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { apiService, RecentGeneration } from '@/services/apiService';

const { width } = Dimensions.get('window');
const ITEM_WIDTH = (width - 60) / 2;

// Fallback data for when no generated wallpapers exist yet
const fallbackWallpapers = [
  {
    generation_id: 'fallback-1',
    status: 'completed',
    image_url: 'https://images.unsplash.com/photo-1557672172-298e090bd0f1?w=400&h=800&fit=crop',
    created_at: new Date().toISOString(),
    completed_at: new Date().toISOString(),
    title: 'Get Started',
    subtitle: 'Generate your first AI wallpaper',
  },
];

const categories = ['All', 'Recent', 'Generated', 'AI Created'];

type WallpaperItem = RecentGeneration & {
  title?: string;
  subtitle?: string;
};

export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [searchText, setSearchText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [wallpapers, setWallpapers] = useState<WallpaperItem[]>([]);
  const [filteredWallpapers, setFilteredWallpapers] = useState<WallpaperItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchWallpapers = async () => {
    try {
      setError(null);
      const recentGenerations = await apiService.getRecentGenerations(selectedCategory === 'All' ? undefined : 20);
      
      if (recentGenerations.length === 0) {
        // Show fallback if no wallpapers generated yet
        setWallpapers(fallbackWallpapers);
        setFilteredWallpapers(fallbackWallpapers);
      } else {
        // Transform data and add display info
        const transformedWallpapers = recentGenerations.map((item, index) => ({
          ...item,
          title: `AI Wallpaper #${recentGenerations.length - index}`,
          subtitle: new Date(item.created_at).toLocaleDateString(),
        }));
        
        setWallpapers(transformedWallpapers);
        setFilteredWallpapers(transformedWallpapers);
      }
    } catch (err) {
      console.error('Error fetching wallpapers:', err);
      setError('Failed to load wallpapers');
      // Show fallback data on error
      setWallpapers(fallbackWallpapers);
      setFilteredWallpapers(fallbackWallpapers);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchWallpapers();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchWallpapers();
  };

  const filterWallpapers = (category: string, search: string) => {
    let filtered = wallpapers;
    
    // For now, we'll skip category filtering since all are AI generated
    // Could add categories based on generation params in the future
    
    if (search) {
      filtered = filtered.filter(item => 
        item.title?.toLowerCase().includes(search.toLowerCase()) ||
        item.subtitle?.toLowerCase().includes(search.toLowerCase()) ||
        item.generation_id.toLowerCase().includes(search.toLowerCase())
      );
    }
    
    setFilteredWallpapers(filtered);
  };

  const handleCategorySelect = (category: string) => {
    setSelectedCategory(category);
    setLoading(true);
    fetchWallpapers();
  };

  const handleSearch = (text: string) => {
    setSearchText(text);
    filterWallpapers(selectedCategory, text);
  };

  const openWallpaper = (generationId: string) => {
    router.push(`/wallpaper/${generationId}`);
  };

  const goToGenerate = () => {
    router.push('/(tabs)/generate');
  };

  const renderWallpaper = ({ item }: { item: WallpaperItem }) => {
    const imageUrl = item.generation_id.startsWith('fallback-') 
      ? item.image_url 
      : apiService.getImageUrl(item.image_url);
    
    return (
      <TouchableOpacity
        style={[styles.wallpaperItem, { backgroundColor: colors.card }]}
        onPress={() => openWallpaper(item.generation_id)}
      >
        <Image
          source={{ uri: imageUrl }}
          style={styles.wallpaperImage}
          contentFit="cover"
          placeholder="🖼️"
        />
        {item.generation_id.startsWith('fallback-') && (
          <View style={[styles.fallbackBadge, { backgroundColor: colors.primary }]}>
            <Text style={styles.fallbackText}>★</Text>
          </View>
        )}
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.8)']}
          style={styles.wallpaperOverlay}
        >
          <View style={styles.wallpaperInfo}>
            <Text style={styles.wallpaperTitle} numberOfLines={1}>
              {item.description || 'AI Wallpaper'}
            </Text>
            <Text style={styles.wallpaperAuthor} numberOfLines={1}>
              {item.subtitle || 'Generated by AI'}
            </Text>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  const renderCategory = ({ item }: { item: string }) => (
    <TouchableOpacity
      style={[
        styles.categoryItem,
        {
          backgroundColor: selectedCategory === item ? colors.primary : 'transparent',
          borderColor: selectedCategory === item ? 'transparent' : colors.border,
        },
      ]}
      onPress={() => handleCategorySelect(item)}
    >
      <Text
        style={[
          styles.categoryText,
          {
            color: selectedCategory === item ? '#FFFFFF' : colors.text,
          },
        ]}
      >
        {item}
      </Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.text }]}>Loading wallpapers...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'} />
      
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.title, { color: colors.text }]}>AI Wallpapers</Text>
          {error && (
            <Text style={[styles.errorText, { color: colors.accent }]}>
              {error}
            </Text>
          )}
        </View>
        <TouchableOpacity style={[styles.profileButton, { backgroundColor: colors.primary }]}>
          <Text style={styles.profileIcon}>👤</Text>
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={[styles.searchContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.searchIcon, { color: colors.placeholder }]}>🔍</Text>
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder="Search your wallpapers..."
          placeholderTextColor={colors.placeholder}
          value={searchText}
          onChangeText={handleSearch}
        />
      </View>

      {/* Create Your Own Panel */}
      <TouchableOpacity style={[styles.createPanel, { backgroundColor: colors.primary }]} onPress={goToGenerate}>
        <LinearGradient
          colors={[colors.primary, colors.secondary]}
          style={styles.createPanelGradient}
        >
          <View style={styles.createPanelContent}>
            <Text style={styles.createPanelIcon}>✨</Text>
            <View style={styles.createPanelText}>
              <Text style={styles.createPanelTitle}>Create Your Own!</Text>
              <Text style={styles.createPanelSubtitle}>Generate custom wallpapers with AI</Text>
            </View>
            <Text style={styles.createPanelArrow}>→</Text>
          </View>
        </LinearGradient>
      </TouchableOpacity>

      {/* Categories */}
      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={categories}
        renderItem={renderCategory}
        keyExtractor={(item) => item}
        contentContainerStyle={styles.categoriesContainer}
      />

      {/* Wallpapers Grid */}
      <FlatList
        data={filteredWallpapers}
        renderItem={renderWallpaper}
        keyExtractor={(item) => item.generation_id}
        numColumns={2}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.wallpapersContainer}
        columnWrapperStyle={styles.wallpaperRow}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: colors.text }]}>
              No wallpapers found
            </Text>
            <Text style={[styles.emptySubtext, { color: colors.placeholder }]}>
              Pull to refresh or generate your first wallpaper
            </Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 50,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  greeting: {
    fontSize: 16,
    marginBottom: 4,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  profileButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileIcon: {
    fontSize: 20,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 16,
    paddingHorizontal: 16,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
  },
  searchIcon: {
    fontSize: 18,
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  createPanel: {
    marginHorizontal: 20,
    marginBottom: 24,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  createPanelGradient: {
    padding: 20,
  },
  createPanelContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  createPanelIcon: {
    fontSize: 32,
    marginRight: 16,
  },
  createPanelText: {
    flex: 1,
  },
  createPanelTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  createPanelSubtitle: {
    color: '#FFFFFF',
    fontSize: 14,
    opacity: 0.9,
  },
  createPanelArrow: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
  },
  categoriesContainer: {
    paddingHorizontal: 20,
    marginBottom: 24,
    height: 36,
  },
  categoryItem: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    height: 36,
    marginRight: 12,
    borderRadius: 18,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '600',
    opacity: 1, // Ensure full opacity
    textShadowColor: 'rgba(0, 0, 0, 0.1)', // Add slight shadow for better visibility
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  wallpapersContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 100,
  },
  wallpaperRow: {
    justifyContent: 'space-between',
  },
  wallpaperItem: {
    width: ITEM_WIDTH,
    height: ITEM_WIDTH * 1.6,
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  wallpaperImage: {
    width: '100%',
    height: '100%',
  },
  premiumBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    zIndex: 1,
  },
  premiumText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  wallpaperOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '40%',
    justifyContent: 'flex-end',
  },
  wallpaperInfo: {
    padding: 12,
  },
  wallpaperTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  wallpaperAuthor: {
    color: '#CCCCCC',
    fontSize: 12,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  errorText: {
    fontSize: 12,
    marginTop: 2,
  },
  fallbackBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    zIndex: 1,
  },
  fallbackText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
  },
});
