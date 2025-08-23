import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

const genre_suggestions = [
  'Nature',
  'Infrastructure',
  'Still life',
  'Sports',
  'Cars',
];

const art_style_suggestions = [
  'Comics',
  'Anime',
  'Realistic',
  'Hazy',
  'Pencil',
];

export default function GenerateScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [prompt, setPrompt] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('');
  const [selectedArtStyle, setSelectedArtStyle] = useState('');
  const [generating, setGenerating] = useState(false);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      Alert.alert('Error', 'Please enter a description for your wallpaper');
      return;
    }

    setGenerating(true);
    
    // Simulate generation process
    setTimeout(() => {
      setGenerating(false);
      Alert.alert('Success', 'Your wallpaper has been generated! Check your gallery.');
    }, 3000);
  };

  const renderSuggestionChips = (suggestions: string[], selected: string, onSelect: (item: string) => void) => (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipContainer}>
      {suggestions.map((item) => (
        <TouchableOpacity
          key={item}
          style={[
            styles.chip,
            {
              backgroundColor: selected === item ? colors.primary : colors.card,
              borderColor: colors.border,
            },
          ]}
          onPress={() => onSelect(selected === item ? '' : item)}
        >
          <Text
            style={[
              styles.chipText,
              {
                color: selected === item ? '#FFFFFF' : colors.text,
              },
            ]}
          >
            {item}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'} />
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>Generate Wallpaper</Text>
          <Text style={[styles.subtitle, { color: colors.placeholder }]}>
            Create custom wallpapers with AI
          </Text>
        </View>

        {/* Genre Selection */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Genre</Text>
          <Text style={[styles.sectionSubtitle, { color: colors.placeholder }]}>
            Choose a subject category (optional)
          </Text>
          {renderSuggestionChips(genre_suggestions, selectedGenre, setSelectedGenre)}
        </View>

        {/* Art Style Selection */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Art Style</Text>
          <Text style={[styles.sectionSubtitle, { color: colors.placeholder }]}>
            Select an artistic style (optional)
          </Text>
          {renderSuggestionChips(art_style_suggestions, selectedArtStyle, setSelectedArtStyle)}
        </View>

        {/* Prompt Input */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Description</Text>
          <TextInput
            style={[
              styles.promptInput,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                color: colors.text,
              },
            ]}
            placeholder="Describe your dream wallpaper... (e.g., 'A serene mountain landscape at sunset')"
            placeholderTextColor={colors.placeholder}
            value={prompt}
            onChangeText={setPrompt}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>
      </ScrollView>

      {/* Generate Button */}
      <View style={styles.buttonContainer}>
        <LinearGradient
          colors={[colors.primary, colors.secondary]}
          style={styles.generateButton}
        >
          <TouchableOpacity
            style={styles.generateButtonInner}
            onPress={handleGenerate}
            disabled={generating}
          >
            <Text style={styles.generateButtonText}>
              {generating ? '✨ Generating...' : '🎨 Generate Wallpaper'}
            </Text>
          </TouchableOpacity>
        </LinearGradient>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 50,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  header: {
    marginBottom: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    marginBottom: 16,
  },
  promptInput: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    fontSize: 16,
    minHeight: 100,
  },
  chipContainer: {
    marginTop: 8,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 12,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 14,
    fontWeight: '500',
  },

  buttonContainer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    paddingTop: 20,
  },
  generateButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  generateButtonInner: {
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
  },
  generateButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
});
