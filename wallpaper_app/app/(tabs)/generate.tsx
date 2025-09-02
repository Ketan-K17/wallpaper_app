import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Alert,
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { apiService, GenerationStatus } from '@/services/apiService';

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
  const [generationProgress, setGenerationProgress] = useState(0);
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [currentGenerationId, setCurrentGenerationId] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      Alert.alert('Error', 'Please enter a description for your wallpaper');
      return;
    }

    try {
      setGenerating(true);
      setGenerationProgress(0);
      setShowProgressModal(true);

      // Start generation
      const response = await apiService.generateWallpaper({
        description: prompt,
        genre: selectedGenre || undefined,
        art_style: selectedArtStyle || undefined,
      });

      setCurrentGenerationId(response.generation_id);

      // Poll for completion
      await apiService.pollGenerationStatus(
        response.generation_id,
        (status: GenerationStatus) => {
          setGenerationProgress(status.progress);
        }
      );

      // Success
      setShowProgressModal(false);
      setGenerating(false);
      
      Alert.alert(
        'Success!', 
        'Your wallpaper has been generated successfully!',
        [
          {
            text: 'View Wallpaper',
            onPress: () => {
              // Navigate to a wallpaper view screen or gallery
              router.push('/(tabs)');
            }
          },
          { text: 'Generate Another', style: 'cancel' }
        ]
      );

      // Reset form
      setPrompt('');
      setSelectedGenre('');
      setSelectedArtStyle('');
      setCurrentGenerationId(null);

    } catch (error) {
      setGenerating(false);
      setShowProgressModal(false);
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      Alert.alert('Generation Failed', errorMessage);
      
      console.error('Generation error:', error);
    }
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

      {/* Progress Modal */}
      <Modal
        visible={showProgressModal}
        transparent={true}
        animationType="fade"
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              Generating Your Wallpaper
            </Text>
            
            <View style={styles.progressContainer}>
              <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
                <View 
                  style={[
                    styles.progressFill, 
                    { 
                      backgroundColor: colors.primary,
                      width: `${generationProgress}%`
                    }
                  ]} 
                />
              </View>
              <Text style={[styles.progressText, { color: colors.placeholder }]}>
                {generationProgress}%
              </Text>
            </View>

            <Text style={[styles.modalSubtitle, { color: colors.placeholder }]}>
              {generationProgress < 30 && 'Preparing your request...'}
              {generationProgress >= 30 && generationProgress < 70 && 'AI is working its magic...'}
              {generationProgress >= 70 && generationProgress < 100 && 'Almost done, adding final touches...'}
              {generationProgress === 100 && 'Finalizing your wallpaper...'}
            </Text>

            <View style={styles.generatingIcon}>
              <Text style={styles.sparkles}>✨</Text>
            </View>
          </View>
        </View>
      </Modal>
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '80%',
    padding: 32,
    borderRadius: 20,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 16,
  },
  progressContainer: {
    width: '100%',
    alignItems: 'center',
  },
  progressBar: {
    width: '100%',
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 12,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 18,
    fontWeight: '600',
  },
  generatingIcon: {
    marginTop: 24,
  },
  sparkles: {
    fontSize: 32,
  },
});
