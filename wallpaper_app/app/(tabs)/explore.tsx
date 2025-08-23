import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, FlatList } from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const categories = [
  { id: '1', name: 'Nature', icon: 'leaf-outline', count: 1245 },
  { id: '2', name: 'Abstract', icon: 'color-palette-outline', count: 987 },
  { id: '3', name: 'Architecture', icon: 'business-outline', count: 654 },
  { id: '4', name: 'Space', icon: 'planet-outline', count: 432 },
  { id: '5', name: 'Animals', icon: 'paw-outline', count: 789 },
  { id: '6', name: 'Technology', icon: 'hardware-chip-outline', count: 567 },
  { id: '7', name: 'Minimalist', icon: 'square-outline', count: 834 },
  { id: '8', name: 'Dark', icon: 'moon-outline', count: 923 },
];

const featured = [
  { id: '1', title: 'Editor\'s Choice', subtitle: 'Handpicked by our team', image: 'https://picsum.photos/400/200?random=10' },
  { id: '2', title: 'Trending Now', subtitle: 'Most popular this week', image: 'https://picsum.photos/400/200?random=11' },
  { id: '3', title: 'New Arrivals', subtitle: 'Fresh wallpapers daily', image: 'https://picsum.photos/400/200?random=12' },
];

export default function ExploreScreen() {
  const [selectedCategory, setSelectedCategory] = useState('');

  const CategoryItem = ({ category }: { category: any }) => (
    <TouchableOpacity 
      style={[
        styles.categoryItem,
        selectedCategory === category.id && styles.categoryItemSelected
      ]}
      onPress={() => setSelectedCategory(category.id)}
    >
      <View style={styles.categoryIcon}>
        <Ionicons 
          name={category.icon as any} 
          size={24} 
          color={selectedCategory === category.id ? '#667eea' : '#6c757d'} 
        />
      </View>
      <Text style={[
        styles.categoryName,
        selectedCategory === category.id && styles.categoryNameSelected
      ]}>
        {category.name}
      </Text>
      <Text style={styles.categoryCount}>{category.count}</Text>
    </TouchableOpacity>
  );

  const FeaturedItem = ({ item }: { item: any }) => (
    <TouchableOpacity style={styles.featuredItem}>
      <Image
        source={{ uri: item.image }}
        style={styles.featuredImage}
        contentFit="cover"
      />
      <View style={styles.featuredContent}>
        <Text style={styles.featuredTitle}>{item.title}</Text>
        <Text style={styles.featuredSubtitle}>{item.subtitle}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Explore</Text>
          <Text style={styles.headerSubtitle}>Discover wallpapers by category</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Featured Collections</Text>
          <FlatList
            data={featured}
            renderItem={FeaturedItem}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.featuredList}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Categories</Text>
          <View style={styles.categoriesGrid}>
            {categories.map((category) => (
              <CategoryItem key={category.id} category={category} />
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Popular Tags</Text>
          <View style={styles.tagsContainer}>
            {['Aesthetic', 'Dark Mode', '4K', 'Minimal', 'Colorful', 'Vintage', 'Gradient', 'Black & White'].map((tag) => (
              <TouchableOpacity key={tag} style={styles.tag}>
                <Text style={styles.tagText}>#{tag}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
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
  section: {
    marginVertical: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 15,
    paddingHorizontal: 15,
  },
  featuredList: {
    paddingHorizontal: 15,
  },
  featuredItem: {
    width: 200,
    marginRight: 15,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  featuredImage: {
    width: '100%',
    height: 100,
  },
  featuredContent: {
    padding: 12,
  },
  featuredTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 4,
  },
  featuredSubtitle: {
    fontSize: 14,
    color: '#6c757d',
  },
  categoriesGrid: {
    paddingHorizontal: 15,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginBottom: 12,
    backgroundColor: 'white',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  categoryItemSelected: {
    backgroundColor: '#f8f9ff',
    borderWidth: 1,
    borderColor: '#667eea',
  },
  categoryIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  categoryName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: '#2c3e50',
  },
  categoryNameSelected: {
    color: '#667eea',
  },
  categoryCount: {
    fontSize: 14,
    color: '#6c757d',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 15,
  },
  tag: {
    backgroundColor: '#e9ecef',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginRight: 10,
    marginBottom: 10,
  },
  tagText: {
    fontSize: 14,
    color: '#495057',
    fontWeight: '500',
  },
});