import React, { useState, useEffect, useRef } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Animated, SafeAreaView, StatusBar, Image, ScrollView } from "react-native";
import { Audio } from "expo-av";
import merriamApi from "../../api/merriamApi";
import Icon from "react-native-vector-icons/FontAwesome";
import { AI_API_KEY } from '../../api/config';

const DictionaryScreen = ({ route, navigation }) => {
  // Destructure word from route.params
  const { initialWord } = route.params;
  const [word, setWord] = useState(initialWord || "");
  const [definition, setDefinition] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [imageUrl, setImageUrl] = useState(null);
  const [imageLoading, setImageLoading] = useState(false);
  const [focusedInput, setFocusedInput] = useState(false);
  
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Customize the navigation header
  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: true,
      headerTitle: '',
      headerStyle: {
        backgroundColor: '#FFFFFF',
        elevation: 0,
        shadowOpacity: 0,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
      },
      headerTintColor: '#6B5ECD',
      headerBackTitleVisible: false,
      headerLeftContainerStyle: {
        paddingLeft: 20,
      },
    });
  }, [navigation]);

  useEffect(() => {
    if (initialWord) {
      console.log(initialWord);
      fetchWordData(initialWord);
    }
    
    // Fade in animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, [initialWord]);

  const generateWordImage = async (wordToGenerate) => {
    try {
      setImageLoading(true);
      
      if (!AI_API_KEY) {
        console.error("OpenAI API key not found in config");
        setImageLoading(false);
        return;
      }
      
      // Enhanced prompt for realistic, real-world images perfect for children's learning
const prompt = `A real, high-resolution photo of only the object: ${wordToGenerate}. No background distractions. The object must be fully visible, centered, and photographed in real life with a DSLR or mirrorless camera. Sharp focus, real texture, natural colors. Absolutely no illustrations, no digital art, no AI-generated painting — just a true photographic image of the object as it appears in the real world.`;
      
      const response = await fetch('https://api.openai.com/v1/images/generations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${AI_API_KEY}`
        },
        body: JSON.stringify({
          prompt: prompt,
          n: 1,
          size: "1024x1024",
          model: "dall-e-3",
          style: "natural",
          quality: "hd"
        })
      });
      
      const data = await response.json();
      
      if (data.data && data.data[0]) {
        setImageUrl(data.data[0].url);
      } else {
        console.error("No image generated:", data);
      }
      
    } catch (err) {
      console.error("Error generating image:", err);
    } finally {
      setImageLoading(false);
    }
  };

  const fetchWordData = async (wordToFetch) => {
    if (!wordToFetch.trim()) {
      alert("Please enter a word!");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setDefinition(null);
      setAudioUrl(null);
      setImageUrl(null);

      // Fetch word data from the API
      const response = await merriamApi.get(`/${wordToFetch}`);
      const data = response.data;

      if (data.length === 0 || !data[0].shortdef) {
        setError("No definitions found for this word.");
      } else {
        setDefinition(data[0].shortdef);

        // Extract audio URL if available
        const audioKey = data[0]?.hwi?.prs[0]?.sound?.audio;
        if (audioKey) {
          const audioFileUrl = `https://media.merriam-webster.com/audio/prons/en/us/mp3/${audioKey[0]}/${audioKey}.mp3`;
          setAudioUrl(audioFileUrl);
        }

        // Generate AI image for the word
        generateWordImage(wordToFetch);
      }
    } catch (err) {
      console.error("Error fetching word data:", err);
      setError("Failed to fetch the word data. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const playAudio = async () => {
    if (!audioUrl) return;
    try {
      const sound = new Audio.Sound();
      await sound.loadAsync({ uri: audioUrl });
      await sound.playAsync();
    } catch (err) {
      console.error("Error playing audio:", err);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        
        {/* Header Section */}
        <Animated.View style={[styles.headerSection, { opacity: fadeAnim }]}>
          <View style={styles.headerIcon}>
            <Icon name="book" size={28} color="#6B5ECD" />
          </View>
          <Text style={styles.title}>Dictionary</Text>
          <Text style={styles.subtitle}>Learn new words with fun pictures! </Text>
        </Animated.View>

        {/* Search Section */}
        <Animated.View style={[styles.searchSection, { opacity: fadeAnim }]}>
          <View style={[styles.inputContainer, focusedInput && styles.inputContainerFocused]}>
            <Icon name="search" size={18} color="#6B5ECD" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Enter a word to search..."
              value={word}
              onChangeText={setWord}
              onFocus={() => setFocusedInput(true)}
              onBlur={() => setFocusedInput(false)}
              placeholderTextColor="#A0A0A0"
            />
            {word && (
              <TouchableOpacity onPress={() => setWord('')} style={styles.clearButton}>
                <Icon name="times-circle" size={16} color="#C0C0C0" />
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity 
            style={[styles.searchButton, loading && styles.searchButtonDisabled]} 
            onPress={() => fetchWordData(word)}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Icon name="search" size={16} color="#FFFFFF" />
                <Text style={styles.searchButtonText}>Search</Text>
              </>
            )}
          </TouchableOpacity>
        </Animated.View>

        {/* Error Message */}
        {error && (
          <Animated.View style={[styles.errorContainer, { opacity: fadeAnim }]}>
            <Icon name="exclamation-triangle" size={20} color="#FF6B6B" />
            <Text style={styles.errorText}>{error}</Text>
          </Animated.View>
        )}

        {/* Results Section */}
        {definition && (
          <Animated.View style={[styles.resultsCard, { opacity: fadeAnim }]}>
            
            {/* Word Header */}
            <View style={styles.wordHeader}>
              <Text style={styles.wordTitle}>{word.toLowerCase()}</Text>
              {audioUrl && (
                <TouchableOpacity style={styles.audioButton} onPress={playAudio}>
                  <Icon name="play" size={16} color="#FFFFFF" />
                </TouchableOpacity>
              )}
            </View>

            {/* Definitions Section - Show First */}
            <View style={styles.definitionsSection}>
              <View style={styles.definitionsHeader}>
                <Icon name="list" size={16} color="#6B5ECD" />
                <Text style={styles.definitionsTitle}>Definitions</Text>
                {/* <View style={styles.definitionCount}>
                  <Text style={styles.definitionCountText}>{definition.length}</Text>
                </View> */}
              </View>

              {definition.map((def, index) => (
                <View key={index} style={styles.definitionItem}>
                  <View style={styles.definitionNumber}>
                    <Text style={styles.definitionNumberText}>{index + 1}</Text>
                  </View>
                  <Text style={styles.definitionText}>{def}</Text>
                </View>
              ))}
            </View>

            {/* AI Generated Image - Show After Definitions */}
            <View style={styles.imageSection}>
              <View style={styles.imageSectionHeader}>
                <Icon name="camera" size={18} color="#6B5ECD" />
                <Text style={styles.imageSectionTitle}>Fun Picture! </Text>
                {imageLoading && <ActivityIndicator size="small" color="#6B5ECD" />}
              </View>
              
              {imageLoading ? (
                <View style={styles.imageLoadingContainer}>
                  <Icon name="magic" size={40} color="#6B5ECD" />
                  <Text style={styles.imageLoadingText}>Making a fun picture! </Text>
                </View>
              ) : imageUrl ? (
                <View style={styles.imageContainer}>
                  <Image source={{ uri: imageUrl }} style={styles.wordImage} />
                  <View style={styles.imageCaption}>
                    <Icon name="camera" size={12} color="#7F8C8D" />
                    <Text style={styles.imageCaptionText}>Real photo to help you learn!</Text>
                  </View>
                </View>
              ) : null}
            </View>

          </Animated.View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },

  // Header Section - Reduced padding and borders
  headerSection: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 20,
    padding: 20,
    shadowColor: '#6B5ECD',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#F0EBFF',
  },
  headerIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#F0EBFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#6B5ECD',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#6B5ECD',
    marginBottom: 8,
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 16,
    color: '#8B7BC8',
    textAlign: 'center',
    fontWeight: '600',
  },

  // Search Section - Reduced padding
  searchSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 4,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#F0EBFF',
    shadowColor: '#6B5ECD',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  inputContainerFocused: {
    borderColor: '#6B5ECD',
    backgroundColor: '#F8F6FF',
    shadowOpacity: 0.2,
    elevation: 6,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#6B5ECD',
    paddingVertical: 14,
    fontWeight: '600',
  },
  clearButton: {
    padding: 8,
    backgroundColor: '#F0EBFF',
    borderRadius: 12,
  },
  searchButton: {
    backgroundColor: '#6B5ECD',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 24,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#6B5ECD',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    borderWidth: 2,
    borderColor: '#8B7BC8',
  },
  searchButtonDisabled: {
    backgroundColor: '#B8A9D9',
    shadowOpacity: 0.15,
  },
  searchButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 8,
  },

  // Error Section
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF5F5',
    marginHorizontal: 20,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#FFCCCC',
  },
  errorText: {
    color: '#D32F2F',
    fontSize: 15,
    fontWeight: '500',
    marginLeft: 12,
    flex: 1,
  },

  // Results Card - Reduced borders and padding
  resultsCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    borderRadius: 20,
    marginBottom: 30,
    shadowColor: '#6B5ECD',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#F0EBFF',
  },

  // Word Header - Reduced padding
  wordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F0EBFF',
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E8E3F7',
  },
  wordTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#6B5ECD',
    textTransform: 'capitalize',
  },
  audioButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#6B5ECD',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#6B5ECD',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },

  // Image Section - Reduced padding and frames
  imageSection: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: '#FDFCFF',
  },
  imageSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  imageSectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#6B5ECD',
    marginLeft: 12,
    flex: 1,
  },
  imageLoadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    backgroundColor: '#F0EBFF',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#6B5ECD',
  },
  imageLoadingText: {
    marginTop: 15,
    fontSize: 16,
    color: '#6B5ECD',
    fontWeight: '700',
  },
  imageContainer: {
    alignItems: 'center',
  },
  wordImage: {
    width: 280,
    height: 200,
    borderRadius: 16,
    backgroundColor: '#F8F9FA',
    borderWidth: 3,
    borderColor: '#F0EBFF',
  },
  imageCaption: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    backgroundColor: '#F0EBFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  imageCaptionText: {
    fontSize: 12,
    color: '#6B5ECD',
    marginLeft: 6,
    fontWeight: '600',
  },

  // Definitions Section - Reduced padding and frames
  definitionsSection: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0EBFF',
    backgroundColor: '#FDFCFF',
  },
  definitionsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  definitionsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#6B5ECD',
    marginLeft: 12,
    flex: 1,
  },
  definitionCount: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#6B5ECD',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  definitionCountText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  definitionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0EBFF',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#6B5ECD',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  definitionNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#6B5ECD',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    marginTop: 2,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  definitionNumberText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  definitionText: {
    fontSize: 16,
    color: '#6B5ECD',
    lineHeight: 24,
    fontWeight: '500',
    flex: 1,
  },
});

export default DictionaryScreen;