import React, { useState } from 'react';
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
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

const { width } = Dimensions.get('window');
const ITEM_WIDTH = (width - 60) / 2;

// Mock wallpaper data
const wallpapers = [
  {
    id: '1',
    title: 'Abstract Orange',
    author: 'Design Studio',
    url: 'https://images.unsplash.com/photo-1557672172-298e090bd0f1?w=400&h=800&fit=crop',
    category: 'Abstract',
    premium: false,
  },
  {
    id: '2',
    title: 'Dark Minimal',
    author: 'Creative Team',
    url: 'https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=400&h=800&fit=crop',
    category: 'Minimal',
    premium: true,
  },
  {
    id: '3',
    title: 'Gradient Flow',
    author: 'Art Collective',
    url: 'https://images.unsplash.com/photo-1557264305-7e2764da873b?w=400&h=800&fit=crop',
    category: 'Gradient',
    premium: false,
  },
  {
    id: '4',
    title: 'Nature Beauty',
    author: 'Nature Photos',
    url: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400&h=800&fit=crop',
    category: 'Nature',
    premium: false,
  },
  {
    id: '5',
    title: 'Urban Night',
    author: 'City Lights',
    url: 'https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=400&h=800&fit=crop',
    category: 'Urban',
    premium: true,
  },
  {
    id: '6',
    title: 'Ocean Waves',
    author: 'Sea Life',
    url: 'https://images.unsplash.com/photo-1505142468610-359e7d316be0?w=400&h=800&fit=crop',
    category: 'Nature',
    premium: false,
  },
];

const categories = ['All', 'Abstract', 'Minimal', 'Gradient', 'Nature', 'Urban'];

export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [searchText, setSearchText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [filteredWallpapers, setFilteredWallpapers] = useState(wallpapers);

  const filterWallpapers = (category: string, search: string) => {
    let filtered = wallpapers;
    
    if (category !== 'All') {
      filtered = filtered.filter(item => item.category === category);
    }
    
    if (search) {
      filtered = filtered.filter(item => 
        item.title.toLowerCase().includes(search.toLowerCase()) ||
        item.author.toLowerCase().includes(search.toLowerCase())
      );
    }
    
    setFilteredWallpapers(filtered);
  };

  const handleCategorySelect = (category: string) => {
    setSelectedCategory(category);
    filterWallpapers(category, searchText);
  };

  const handleSearch = (text: string) => {
    setSearchText(text);
    filterWallpapers(selectedCategory, text);
  };

  const openWallpaper = (id: string) => {
    router.push(`/wallpaper/${id}`);
  };

  const renderWallpaper = ({ item }: { item: typeof wallpapers[0] }) => (
    <TouchableOpacity
      style={[styles.wallpaperItem, { backgroundColor: colors.card }]}
      onPress={() => openWallpaper(item.id)}
    >
      <Image
        source={{ uri: item.url }}
        style={styles.wallpaperImage}
        contentFit="cover"
      />
      {item.premium && (
        <View style={[styles.premiumBadge, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumText}>PRO</Text>
        </View>
      )}
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.8)']}
        style={styles.wallpaperOverlay}
      >
        <View style={styles.wallpaperInfo}>
          <Text style={styles.wallpaperTitle} numberOfLines={1}>
            {item.title}
          </Text>
          <Text style={styles.wallpaperAuthor} numberOfLines={1}>
            {item.author}
          </Text>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );

  const renderCategory = ({ item }: { item: string }) => (
    <TouchableOpacity
      style={[
        styles.categoryItem,
        {
          backgroundColor: selectedCategory === item ? colors.primary : colors.card,
          borderColor: colors.border,
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

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'} />
      
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.greeting, { color: colors.placeholder }]}>Hello there!</Text>
          <Text style={[styles.title, { color: colors.text }]}>Discover Wallpapers</Text>
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
          placeholder="Search wallpapers..."
          placeholderTextColor={colors.placeholder}
          value={searchText}
          onChangeText={handleSearch}
        />
      </View>

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
        keyExtractor={(item) => item.id}
        numColumns={2}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.wallpapersContainer}
        columnWrapperStyle={styles.wallpaperRow}
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
    marginBottom: 20,
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
  categoriesContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  categoryItem: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginRight: 12,
    borderRadius: 20,
    borderWidth: 1,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '600',
  },
  wallpapersContainer: {
    paddingHorizontal: 20,
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
});
