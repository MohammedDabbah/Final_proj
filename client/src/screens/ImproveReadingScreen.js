import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  Alert,
  Modal,
  Animated,
  SafeAreaView
} from 'react-native';
import * as Speech from 'expo-speech';
import { Audio } from 'expo-av';
import aiApi from "../../api/aiApi";
import { AI_API_KEY } from '../../api/config';
import serverApi from "../../api/serverApi";
import Icon from 'react-native-vector-icons/Feather';

const ImproveReadingScreen = () => {
  // State Management
  const [mode, setMode] = useState(null);
  const [words, setWords] = useState([]);
  const [sentences, setSentences] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [recording, setRecording] = useState(null);
  const [transcription, setTranscription] = useState('');
  const [isCorrect, setIsCorrect] = useState(null);
  const [gameCompleted, setGameCompleted] = useState(false);
  const [progressAnimation] = useState(new Animated.Value(0));
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [skippedItems, setSkippedItems] = useState(0);

  // All existing functions remain the same...
  // fetchWords, fetchSentences, playCurrentItemAudio, startRecording, 
  // stopRecording, transcribeAudio, checkAccuracy, skipCurrentItem, 
  // moveToNextItem, startWordMode, startSentenceMode, resetGame, 
  // updateWordReadingProgress, updateSentenceReadingProgress

  // Fetch Words with Strict GPT-3.5 Generation
  const fetchWords = async () => {
    try {
      const response = await aiApi.post('/chat/completions', {
        model: "gpt-3.5-turbo",
        messages: [
          { 
            role: "system", 
            content: "Generate a JSON array of 10 simple, educational words for children aged 7-12. Ensure the words are varied, age-appropriate, and can be easily pronounced." 
          },
          { 
            role: "user", 
            content: "Please generate the words now. Respond ONLY with a valid JSON array of words." 
          }
        ],
        response_format: { type: "json_object" }
      });

      const content = response.data.choices[0].message.content;
      const parsedWords = JSON.parse(content).words;
      
      if (!Array.isArray(parsedWords) || parsedWords.length === 0) {
        throw new Error('Invalid word list generated');
      }

      setWords(parsedWords);
      setCurrentIndex(0);
    } catch (error) {
      console.error('Word Fetch Error:', error);
      Alert.alert('Error', 'Failed to generate words. Please try again.');
      setMode(null);
    }
  };

  // Fetch Sentences with Strict GPT-3.5 Generation
  const fetchSentences = async () => {
    try {
      const response = await aiApi.post('/chat/completions', {
        model: "gpt-3.5-turbo",
        messages: [
          { 
            role: "system", 
            content: "Generate a JSON array of 10 educational sentences suitable for children aged 7-12. Ensure the sentences are clear, informative, and use age-appropriate vocabulary." 
          },
          { 
            role: "user", 
            content: "Please generate the sentences now. Respond ONLY with a valid JSON array of sentences." 
          }
        ],
        response_format: { type: "json_object" }
      });

      const content = response.data.choices[0].message.content;
      const parsedSentences = JSON.parse(content).sentences;
      
      if (!Array.isArray(parsedSentences) || parsedSentences.length === 0) {
        throw new Error('Invalid sentence list generated');
      }

      setSentences(parsedSentences);
      setCurrentIndex(0);
    } catch (error) {
      console.error('Sentence Fetch Error:', error);
      Alert.alert('Error', 'Failed to generate sentences. Please try again.');
      setMode(null);
    }
  };

  // Play Audio for Current Item
  const playCurrentItemAudio = () => {
    try {
      // Stop any ongoing speech
      Speech.stop();
      
      // Get current item
      const currentItem = mode === 'word' ? words[currentIndex] : sentences[currentIndex];
      
      // Set audio playing state
      setIsAudioPlaying(true);
      
      // Speak the item
      Speech.speak(currentItem, {
        onDone: () => {
          setIsAudioPlaying(false);
        }
      });
    } catch (error) {
      console.error('Audio Playback Error:', error);
      Alert.alert('Error', 'Could not play audio.');
      setIsAudioPlaying(false);
    }
  };

  // Start Audio Recording
  const startRecording = async () => {
    try {
      if (recording) {
        await recording.stopAndUnloadAsync();
        setRecording(null);
      }
  
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Microphone access is needed to record.');
        return;
      }
  
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
      });
  
      const recordingObject = new Audio.Recording();
      await recordingObject.prepareToRecordAsync(Audio.RECORDING_OPTIONS_PRESET_HIGH_QUALITY);
      await recordingObject.startAsync();
  
      setRecording(recordingObject);
      setIsRecording(true);
    } catch (error) {
      console.error('Recording Start Error:', error);
      Alert.alert('Error', `Could not start recording: ${error.message}`);
    }
  };

  // Stop Recording and Transcribe
  const stopRecording = async () => {
    try {
      if (!recording) return;
  
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
  
      setRecording(null);
      setIsRecording(false);
  
      if (!uri) {
        Alert.alert("Error", "Recording file is missing.");
        return;
      }
  
      await transcribeAudio(uri);
    } catch (error) {
      console.error("Recording Stop Error:", error);
      Alert.alert("Error", "Could not stop recording.");
    }
  };

  // Transcribe Audio
  const transcribeAudio = async (audioUri) => {
    try {
      const formData = new FormData();
      formData.append("file", {
        uri: audioUri,
        type: "audio/m4a",
        name: "recording.m4a",
      });
      formData.append("model", "whisper-1");
  
      const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${AI_API_KEY}`,
          "Content-Type": "multipart/form-data",
        },
        body: formData,
      });
  
      const data = await response.json();
      if (data.text) {
        setTranscription(data.text.toLowerCase().trim());
        checkAccuracy(data.text.toLowerCase().trim());
      } else {
        console.error("No transcription returned.");
        Alert.alert("Error", "No transcription available.");
      }
    } catch (error) {
      console.error("Transcription Error:", error);
      Alert.alert("Error", "Failed to transcribe audio.");
    }
  };

  // Improved Transcription Accuracy Check
  const checkAccuracy = (transcribedText) => {
    const currentItem = mode === 'word' ? words[currentIndex] : sentences[currentIndex];
    
    // Remove punctuation and special characters, convert to lowercase
    const cleanTranscription = transcribedText
      .toLowerCase()
      .replace(/[!@#$%^&*(),.?":{}|<>]/g, '')
      .trim();
    
    const cleanCurrentItem = currentItem
      .toLowerCase()
      .replace(/[!@#$%^&*(),.?":{}|<>]/g, '')
      .trim();

    const isItemCorrect = cleanTranscription === cleanCurrentItem;

    setIsCorrect(isItemCorrect);

    if (isItemCorrect) {
      // Move to next item or complete game
      moveToNextItem();
    }
  };

  // Skip Current Item
  const skipCurrentItem = () => {
    // Increment skipped items counter
    setSkippedItems(prev => prev + 1);

    // Move to next item
    moveToNextItem();
  };

  // Common method to move to next item
  const moveToNextItem = () => {
    if (currentIndex < 9) {
      setTimeout(() => {
        setCurrentIndex(prev => prev + 1);
        setIsCorrect(null);
        setTranscription('');
      }, 1500);
    } else {
      // Game completed
      setGameCompleted(true);
    }
  };

  // Animate Progress
  useEffect(() => {
    Animated.timing(progressAnimation, {
      toValue: (currentIndex + 1) / 10,
      duration: 500,
      useNativeDriver: false
    }).start();
  }, [currentIndex]);

  // Mode Selection Handlers
  const startWordMode = () => {
    setMode('word');
    fetchWords();
  };

  const startSentenceMode = () => {
    setMode('sentence');
    fetchSentences();
  };

  // Reset Game
  const resetGame = () => {
    // If the game was completed, update the progress
    if (gameCompleted) {
      const totalItems = currentIndex + 1;
      const correctItems = totalItems - skippedItems;
      
      if (mode === 'word') {
        updateWordReadingProgress({
          totalWords: totalItems,
          correctPronunciations: correctItems
        });
      } else {
        updateSentenceReadingProgress({
          totalSentences: totalItems,
          correctPronunciations: correctItems
        });
      }
    }
    // Stop any ongoing speech
    Speech.stop();
    
    setMode(null);
    setCurrentIndex(0);
    setGameCompleted(false);
    setIsCorrect(null);
    setTranscription('');
    setIsAudioPlaying(false);
    setSkippedItems(0);  // Reset skipped items counter
  };

  // Update progress for both word and sentence modes
  const updateWordReadingProgress = async (gameStats) => {
    try {
      const response = await serverApi.post('/api/progress/reading/wordReading', {
        totalWords: gameStats.totalWords,
        correctPronunciations: gameStats.correctPronunciations
      });
      
      console.log('Word reading progress updated:', response.data);
    } catch (error) {
      console.error('Error updating progress:', error);
    }
  };
  
  const updateSentenceReadingProgress = async (gameStats) => {
    try {
      const response = await serverApi.post('/api/progress/reading/sentenceReading', {
        totalSentences: gameStats.totalSentences,
        correctPronunciations: gameStats.correctPronunciations
      });
      
      console.log('Sentence reading progress updated:', response.data);
    } catch (error) {
      console.error('Error updating progress:', error);
    }
  };

  // New render function for mode selection with card design
  const renderModeSelection = () => (
    <>
      {/* Decorative background elements */}
      <View style={styles.decorativeCirclesContainer}>
        <View style={styles.decorativeCircle1} />
        <View style={styles.decorativeCircle2} />
        <View style={styles.decorativeCircle3} />
      </View>
      
      {/* Main content card */}
      <View style={styles.mainCard}>
        <View style={styles.iconCircle}>
          <Icon name="book-open" size={24} color="white" />
        </View>
        <Text style={styles.mainCardTitle}>Improving Your Reading</Text>
      </View>
      
      {/* Description section */}
      <View style={styles.descriptionContainer}>
        <Text style={styles.descriptionTitle}>Description</Text>
        <Text style={styles.descriptionText}>
          Reading is a fundamental skill that opens doors to knowledge and imagination.
          Regular practice helps develop pronunciation, comprehension, and vocabulary.
          Through these exercises, you can enhance your reading fluency and confidence.
          This tool provides structured practice for both word pronunciation and
          sentence reading.
        </Text>
      </View>
      
      {/* Bottom action cards */}
      <View style={styles.bottomSection}>
        <TouchableOpacity 
          style={styles.actionCard}
          onPress={startWordMode}
        >
          <View style={styles.iconContainer}>
            <Icon name="type" size={24} color="black" />
          </View>
          <Text style={styles.actionCardText}>Words Practice</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.actionCard} 
          onPress={startSentenceMode}
        >
          <View style={styles.iconContainer}>
            <Icon name="align-left" size={24} color="black" />
          </View>
          <Text style={styles.actionCardText}>Sentences Practice</Text>
        </TouchableOpacity>
      </View>
    </>
  );

  // Render Practice Screen (keeps existing functionality)
  const renderPracticeScreen = () => {
    const currentItem = mode === 'word' ? words[currentIndex] : sentences[currentIndex];

    return (
      <View style={styles.practiceContainer}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Reading Practice</Text>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={resetGame}
          >
            <Icon name="arrow-left" size={24} color="white" />
          </TouchableOpacity>
        </View>
        
        {/* Info Card */}
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <Icon name="book" size={16} color="#B052F7" />
              <Text style={styles.infoLabel}>Mode</Text>
              <Text style={styles.infoValue}>{mode === 'word' ? 'Words' : 'Sentences'}</Text>
            </View>
            
            <View style={styles.infoItem}>
              <Icon name="flag" size={16} color="#B052F7" />
              <Text style={styles.infoLabel}>Progress</Text>
              <Text style={styles.infoValue}>{currentIndex + 1}/10</Text>
            </View>
            
            <View style={styles.infoItem}>
              <Icon name="skip-forward" size={16} color="#B052F7" />
              <Text style={styles.infoLabel}>Skipped</Text>
              <Text style={styles.infoValue}>{skippedItems}</Text>
            </View>
          </View>
        </View>

        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <Animated.View 
            style={[
              styles.progressBar, 
              { 
                width: progressAnimation.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0%', '100%']
                }) 
              }
            ]} 
          />
        </View>
        
        {/* Audio Playback Button */}
        <TouchableOpacity 
          style={styles.audioButton} 
          onPress={playCurrentItemAudio}
          disabled={isAudioPlaying}
        >
          <Text style={styles.audioButtonText}>
            {isAudioPlaying ? 'Playing...' : 'Listen to Item'}
          </Text>
          <Icon 
            name={isAudioPlaying ? "volume-2" : "play"} 
            size={18} 
            color="white" 
            style={styles.buttonIcon}
          />
        </TouchableOpacity>

        {/* Current Item */}
        <View style={styles.currentItemContainer}>
          <Text style={styles.currentItem}>{currentItem}</Text>
        </View>
        
        {/* Transcription Container */}
        {transcription ? (
          <View style={styles.transcriptionContainer}>
            <Text style={styles.transcriptionText}>
              <Icon name="message-circle" size={16} color="#666" style={{marginRight: 6}} />
              You said: {transcription}
            </Text>
            <Text style={[
              styles.accuracyText, 
              { color: isCorrect ? '#4CAF50' : '#f44336' }
            ]}>
              {isCorrect !== null && (
                isCorrect 
                  ? <><Icon name="check-circle" size={18} color="#4CAF50" /> Correct</> 
                  : <><Icon name="x-circle" size={18} color="#f44336" /> Incorrect</>
              )}
            </Text>
          </View>
        ) : null}

        {/* Action Buttons */}
        <View style={styles.actionButtonsContainer}>
          {!isRecording ? (
            <TouchableOpacity 
              style={styles.recordButton} 
              onPress={startRecording}
            >
              <Text style={styles.buttonText}>Start Recording</Text>
              <Icon name="mic" size={20} color="white" style={styles.buttonIcon} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity 
              style={styles.stopRecordButton} 
              onPress={stopRecording}
            >
              <Text style={styles.buttonText}>Stop Recording</Text>
              <Icon name="square" size={20} color="white" style={styles.buttonIcon} />
            </TouchableOpacity>
          )}

          <TouchableOpacity 
            style={styles.skipButton} 
            onPress={skipCurrentItem}
            disabled={isRecording}
          >
            <Text style={styles.buttonText}>Skip</Text>
            <Icon name="skip-forward" size={20} color="white" style={styles.buttonIcon} />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // Render Game Completed Modal
  const renderGameCompletedModal = () => (
    <Modal
      visible={gameCompleted}
      transparent={true}
      animationType="slide"
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.completedIconContainer}>
            <Icon name="award" size={50} color="#B052F7" />
          </View>
          <Text style={styles.modalTitle}>Congratulations!</Text>
          <Text style={styles.modalText}>
            You've completed the {mode} practice!
          </Text>
          <Text style={styles.modalSubtext}>
            <Icon name="skip-forward" size={16} color="#666" style={{marginRight: 8}} />
            Skipped Items: {skippedItems}
          </Text>
          <TouchableOpacity 
            style={styles.modalButton} 
            onPress={() => {
              // Add progress tracking before resetting
              const totalItems = 10; // Assuming 10 items total
              const correctItems = totalItems - skippedItems;
              
              if (mode === 'word') {
                updateWordReadingProgress({
                  totalWords: totalItems,
                  correctPronunciations: correctItems
                });
              } else {
                updateSentenceReadingProgress({
                  totalSentences: totalItems,
                  correctPronunciations: correctItems
                });
              }
              
              resetGame();
            }}
          >
            <Text style={styles.buttonText}>Play Again</Text>
            <Icon name="refresh-cw" size={20} color="white" style={styles.buttonIcon} />
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.container}>
      {!mode ? renderModeSelection() : renderPracticeScreen()}
      {renderGameCompletedModal()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f8',
  },
  // Decorative elements (from ImprovingWritingScreen)
  decorativeCirclesContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 200,
    overflow: 'visible',
    zIndex: 1,
  },
  decorativeCircle1: {
    position: 'absolute',
    top: 20,
    right: 20,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#F8D568', // Yellow circle
    opacity: 2,
    zIndex: 1,
  },
  decorativeCircle2: {
    position: 'absolute',
    top: 30,
    right: 100,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#5454CE', // Purple circle (changed to match our theme)
    zIndex: 1,
  },
  decorativeCircle3: {
    position: 'absolute',
    top: 20,
    right: 70,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#F29CB1', // Pink circle
    opacity: 1,
    zIndex: 3,
  },
  mainCard: {
    marginTop: 80,
    marginHorizontal: 20,
    height: 160,
    backgroundColor: '#5454CE', // Changed to our purple color
    borderRadius: 20,
    padding: 20,
    shadowColor: '#080707',
    justifyContent: 'flex-end',
    zIndex: 6,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  iconCircle: {
    position: 'absolute',
    top: -20,
    left: 20,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#5454CE', // Changed to our purple color
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#080707',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 5,
  },
  mainCardTitle: {
    color: 'white',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 30,
  },
  descriptionContainer: {
    marginTop: 30,
    marginHorizontal: 20,
  },
  descriptionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  descriptionText: {
    fontSize: 15,
    lineHeight: 22,
    color: '#444',
  },
  bottomSection: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#5454CE', // Changed to our purple color
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 20,
    paddingBottom: 30,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 15,
    marginBottom: 15,
    height: 70,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  iconContainer: {
    width: 60,
    height: '100%',
    backgroundColor: '#FFF0D9', // Light beige
    borderTopLeftRadius: 15,
    borderBottomLeftRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionCardText: {
    marginLeft: 15,
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  
  // Practice screen styles (keep from previous design but adjust colors)
  practiceContainer: {
    width: '100%',
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  header: {
    backgroundColor: '#B052F7',
    paddingVertical: 20,
    alignItems: 'center',
    width: '100%',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    flexDirection: 'row',
    justifyContent: 'center',
    position: 'relative',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    marginBottom: 16,
  },
  backButton: {
    position: 'absolute',
    left: 20,
    top: '50%',
    transform: [{ translateY: -12 }],
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  infoCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 15,
    width: '90%',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoItem: {
    alignItems: 'center',
    padding: 10,
  },
  infoLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  progressContainer: {
    width: '90%',
    height: 10,
    backgroundColor: '#e0e0e0',
    borderRadius: 5,
    marginBottom: 20,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#B052F7',
    borderRadius: 5,
  },
  audioButton: {
    backgroundColor: '#B052F7',
    padding: 12,
    borderRadius: 12,
    marginBottom: 20,
    width: '80%',
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  audioButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  buttonIcon: {
    marginLeft: 8,
  },
  currentItemContainer: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    width: '90%',
    minHeight: 100,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
  },
  currentItem: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#333',
  },
  transcriptionContainer: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    width: '90%',
    alignItems: 'center',
    marginBottom: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  transcriptionText: {
    fontSize: 16,
    marginBottom: 10,
    color: '#555',
  },
  accuracyText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '90%',
    marginTop: 10,
  },
  recordButton: {
    backgroundColor: '#4CAF50',
    padding: 15,
    borderRadius: 12,
    width: '48%',
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  stopRecordButton: {
    backgroundColor: '#f44336',
    padding: 15,
    borderRadius: 12,
    width: '48%',
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  skipButton: {
    backgroundColor: '#ff6b6b',
    padding: 15,
    borderRadius: 12,
    width: '48%',
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    width: '80%',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
  },
  completedIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(176, 82, 247, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  modalText: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 20,
    color: '#555',
  },
  modalSubtext: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
  },
  modalButton: {
    backgroundColor: '#B052F7',
    padding: 15,
    borderRadius: 12,
    width: '100%',
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
});
export default ImproveReadingScreen;