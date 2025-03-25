import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  Alert,
  Modal,
  Animated 
} from 'react-native';
import * as Speech from 'expo-speech';
import { Audio } from 'expo-av';
import aiApi from "../../api/aiApi";
import { AI_API_KEY } from '../../api/config';

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

  // Render Mode Selection
  const renderModeSelection = () => (
    <View style={styles.modeSelectionContainer}>
      <Text style={styles.title}>Improve Reading</Text>
      <TouchableOpacity 
        style={styles.modeButton} 
        onPress={startWordMode}
      >
        <Text style={styles.buttonText}>Practice Words</Text>
      </TouchableOpacity>
      <TouchableOpacity 
        style={styles.modeButton} 
        onPress={startSentenceMode}
      >
        <Text style={styles.buttonText}>Practice Sentences</Text>
      </TouchableOpacity>
    </View>
  );

  // Render Practice Screen
  const renderPracticeScreen = () => {
    const currentItem = mode === 'word' ? words[currentIndex] : sentences[currentIndex];

    return (
      <View style={styles.practiceContainer}>
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

        <Text style={styles.modeTitle}>
          {mode === 'word' ? 'Word Practice' : 'Sentence Practice'}
        </Text>
        
        {/* Audio Playback Button */}
        <TouchableOpacity 
          style={styles.audioButton} 
          onPress={playCurrentItemAudio}
          disabled={isAudioPlaying}
        >
          <Text style={styles.audioButtonText}>
            {isAudioPlaying ? 'Playing...' : 'Listen to Item'}
          </Text>
        </TouchableOpacity>

        <Text style={styles.currentItem}>{currentItem}</Text>
        
        {transcription ? (
          <View style={styles.transcriptionContainer}>
            <Text style={styles.transcriptionText}>You said: {transcription}</Text>
            <Text style={[
              styles.accuracyText, 
              { color: isCorrect ? 'green' : 'red' }
            ]}>
              {isCorrect !== null && (isCorrect ? '✓ Correct' : '✗ Incorrect')}
            </Text>
          </View>
        ) : null}

        <View style={styles.actionButtonsContainer}>
          {!isRecording ? (
            <TouchableOpacity 
              style={styles.recordButton} 
              onPress={startRecording}
            >
              <Text style={styles.buttonText}>Start Recording</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity 
              style={styles.stopRecordButton} 
              onPress={stopRecording}
            >
              <Text style={styles.buttonText}>Stop Recording</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity 
            style={styles.skipButton} 
            onPress={skipCurrentItem}
            disabled={isRecording}
          >
            <Text style={styles.buttonText}>Skip</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity 
          style={styles.resetButton} 
          onPress={resetGame}
        >
          <Text style={styles.buttonText}>Back to Modes</Text>
        </TouchableOpacity>
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
          <Text style={styles.modalTitle}>Congratulations!</Text>
          <Text style={styles.modalText}>
            You've completed the {mode} practice!
          </Text>
          <Text style={styles.modalSubtext}>
            Skipped Items: {skippedItems}
          </Text>
          <TouchableOpacity 
            style={styles.modalButton} 
            onPress={resetGame}
          >
            <Text style={styles.buttonText}>Play Again</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={styles.container}>
      {!mode ? renderModeSelection() : renderPracticeScreen()}
      {renderGameCompletedModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
  },
  modeSelectionContainer: {
    width: '80%',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 30,
    color: '#333',
  },
  modeButton: {
    backgroundColor: '#5352ed',
    padding: 15,
    borderRadius: 10,
    width: '100%',
    alignItems: 'center',
    marginBottom: 20,
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  practiceContainer: {
    width: '90%',
    alignItems: 'center',
  },
  progressContainer: {
    width: '100%',
    height: 10,
    backgroundColor: '#e0e0e0',
    borderRadius: 5,
    marginBottom: 20,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#5352ed',
    borderRadius: 5,
  },
  modeTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  audioButton: {
    backgroundColor: '#5352ed',
    padding: 10,
    borderRadius: 10,
    marginBottom: 20,
    width: '80%',
    alignItems: 'center',
  },
  audioButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  currentItem: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  transcriptionContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  transcriptionText: {
    fontSize: 16,
    marginBottom: 10,
  },
  accuracyText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '80%',
    marginTop: 20,
  },
  recordButton: {
    backgroundColor: '#4CAF50',
    padding: 10,
    borderRadius: 10,
    width: '45%',
    alignItems: 'center',
  },
  stopRecordButton: {
    backgroundColor: '#f44336',
    padding: 10,
    borderRadius: 10,
    width: '45%',
    alignItems: 'center',
  },
  skipButton: {
    backgroundColor: '#ff6b6b',
    padding: 10,
    borderRadius: 10,
    width: '45%',
    alignItems: 'center',
  },
  resetButton: {
    backgroundColor: '#2196F3',
    padding: 10,
    borderRadius: 10,
    width: '80%',
    alignItems: 'center',
    marginTop: 20,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
    width: '80%',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  modalText: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 20,
  },
  modalSubtext: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
  },
  modalButton: {
    backgroundColor: '#5352ed',
    padding: 10,
    borderRadius: 10,
    width: '100%',
    alignItems: 'center',
  },
});

export default ImproveReadingScreen;