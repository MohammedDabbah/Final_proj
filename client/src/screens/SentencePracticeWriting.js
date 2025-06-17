import React, { useState, useEffect, useRef, useContext } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  Animated, 
  Alert, 
  StyleSheet,
  SafeAreaView,
  Dimensions
} from 'react-native';
import aiApi from "../../api/aiApi";
import serverApi from "../../api/serverApi";
const { width } = Dimensions.get('window');
import Icon from 'react-native-vector-icons/Feather';
import { AuthContext } from '../../Auth/AuthContext';

const removePunctuation = (sentence) => {
  return sentence.replace(/[.,!?;:()'"-]/g, '').trim().toLowerCase();
};

const SentencePuzzleGame = () => {
  // Game state
  const [gameState, setGameState] = useState('init'); // 'init', 'countdown', 'showing', 'arranging', 'completed'
  const [round, setRound] = useState(1);
  const [sentenceIndex, setSentenceIndex] = useState(0);
  const [sentences, setSentences] = useState([]);
  const [currentSentence, setCurrentSentence] = useState('');
  const [wordBank, setWordBank] = useState([]);
  const [arrangedWords, setArrangedWords] = useState([]);
  const [attempts, setAttempts] = useState(0);
  const [score, setScore] = useState(0);
  const [countdownValue, setCountdownValue] = useState(3);
  const [timeLeft, setTimeLeft] = useState(10);
  const [fadeAnimation] = useState(new Animated.Value(1));
  const countdownTimer = useRef(null);
  const sentenceTimer = useRef(null);
  const {user} = useContext(AuthContext)

  // Generate a batch of 10 sentences for the current round
  const generateSentenceBatch = async () => {
    try {
      // Initial request with clear instructions
      const response = await aiApi.post('/chat/completions', {
        model: 'gpt-3.5-turbo',
        messages: [
          { 
            role: 'system', 
            content: `You are a helpful assistant that provides exactly 10 educational sentences for ${user.userLevel}. Respond with only a JSON array of sentences.` 
          },
          { 
            role: 'user', 
            content: `Create 10 short, simple, educational sentences suitable for ${user.userLevel}. Each sentence should teach something about the world, science, or general knowledge. Respond only with a JSON array of strings.` 
          }
        ],
        max_tokens: 500,
      });
  
      const content = response.data.choices[0].message.content;
      let sentenceArray = [];
      
      try {
        // Try to find and parse any JSON array in the response
        const jsonMatch = content.match(/\[[\s\S]*\]/);
        
        if (jsonMatch) {
          sentenceArray = JSON.parse(jsonMatch[0]);
        } else {
          // If no JSON array found, try to extract sentences by line breaks
          sentenceArray = content.split('\n')
            .filter(line => line.trim().length > 0)
            .map(line => line.replace(/^\d+\.\s*/, '').trim())
            .filter(sentence => sentence.length > 5);
        }
      } catch (e) {
        // If parsing failed, try to extract sentences by periods
        sentenceArray = content.split('.')
          .map(sentence => sentence.trim())
          .filter(sentence => sentence.length > 5 && sentence.match(/[A-Za-z]/))
          .map(sentence => sentence + '.');
      }
  
      // If we still don't have enough sentences, retry the API call
      if (sentenceArray.length < 10) {
        // Try one more time with even more explicit instructions
        const retryResponse = await aiApi.post('/chat/completions', {
          model: 'gpt-3.5-turbo',
          messages: [
            { 
              role: 'system', 
              content: `You provide educational content for ${user.userLevel}. Respond with exactly 10 simple sentences as a JSON array. Nothing else.` 
            },
            { 
              role: 'user', 
              content: `Write 10 educational facts as complete sentences for ${user.userLevel}'s school. Each sentence should be simple and teach something interesting.` 
            }
          ],
          max_tokens: 500,
        });
        
        const retryContent = retryResponse.data.choices[0].message.content;
        
        try {
          const retryMatch = retryContent.match(/\[[\s\S]*\]/);
          if (retryMatch) {
            sentenceArray = JSON.parse(retryMatch[0]);
          } else {
            sentenceArray = retryContent.split('\n')
              .filter(line => line.trim().length > 0)
              .map(line => line.replace(/^\d+\.\s*/, '').trim())
              .filter(sentence => sentence.length > 5);
          }
        } catch (e) {
          // Try to extract by periods if parsing failed
          sentenceArray = retryContent.split('.')
            .map(sentence => sentence.trim())
            .filter(sentence => sentence.length > 5 && sentence.match(/[A-Za-z]/))
            .map(sentence => sentence + '.');
        }
      }
      
      // Take only the first 10 sentences if we have more
      sentenceArray = sentenceArray.slice(0, 10);
      
      // If we don't have enough sentences, throw an error to be caught
      if (sentenceArray.length < 10) {
        throw new Error("Could not generate 10 valid sentences from AI");
      }
  
      setSentences(sentenceArray);
      return sentenceArray;
    } catch (error) {
      console.error("Error generating sentences: ", error);
      Alert.alert("Error", "Failed to generate sentences from AI. Please try again later.");
      
      // Return empty array instead of backup sentences
      setSentences([]);
      return [];
    }
  };

  // Prepare the current sentence for play
  const prepareSentence = (sentence) => {
    setCurrentSentence(sentence);
    
    // Create a shuffled word bank
    const words = sentence.split(' ').map(word => ({
      text: word,
      id: Math.random().toString(),
    }));
    
    // Shuffle the words
    const shuffled = [...words].sort(() => Math.random() - 0.5);
    setWordBank(shuffled);
    
    // Initialize empty arranged words
    setArrangedWords([]);
  };

  // Start a new game
  const startGame = async () => {
    setScore(0);
    setRound(1);
    setSentenceIndex(0);
    const newSentences = await generateSentenceBatch();
    startCountdown(newSentences[0]);
  };

  // Start the countdown for showing a sentence
  const startCountdown = (sentence) => {
    setGameState('countdown');
    setCountdownValue(3);
    prepareSentence(sentence);

    countdownTimer.current = setInterval(() => {
      setCountdownValue(prev => {
        if (prev <= 1) {
          clearInterval(countdownTimer.current);
          showSentence();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Show the sentence for 10 seconds
  const showSentence = () => {
    setGameState('showing');
    setTimeLeft(10);
    fadeAnimation.setValue(1);

    sentenceTimer.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(sentenceTimer.current);
          Animated.timing(fadeAnimation, {
            toValue: 0,
            duration: 500,
            useNativeDriver: true,
          }).start(() => {
            setGameState('arranging');
          });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Handle checking the arranged sentence
  const handleCheckSentence = () => {
    const userSentence = arrangedWords.map(word => word.text).join(' ');
    const normalizedUserSentence = removePunctuation(userSentence);
    const normalizedGeneratedSentence = removePunctuation(currentSentence);

    if (normalizedUserSentence === normalizedGeneratedSentence) {
      // Correct answer - award points based on attempts
      const pointsEarned = 4 - attempts;
      const newScore = score + pointsEarned;
      setScore(newScore);
      Alert.alert("Great job!", `You did it!\nYou earned ${pointsEarned} points!`);      
      // Move to next sentence or complete round
      moveToNextSentence();
    } else {
      // Wrong answer - increment attempts and provide hint
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);

      if (newAttempts >= 3) {
        // Used all attempts - show correct answer and move on
        Alert.alert("Out of attempts", `The correct sentence was:"${currentSentence}"`);
        moveToNextSentence();
      } else {
        // Provide hint based on current arrangement
        provideHint(userSentence, currentSentence);
      }
    }
  };

  // Move to the next sentence or complete round
  const moveToNextSentence = () => {
    const nextIndex = sentenceIndex + 1;
    
    if (nextIndex >= 10) {
      // Round completed
      // Calculate stats for progress tracking
      const correctSentences = Math.floor(score / 4); // Adjust based on your scoring logic
      const gameStats = {
        totalSentences: 10,
        correctSentences: correctSentences,
        score: score
      };
      
      // Update progress
      updateProgress(gameStats);
      
      Alert.alert(
        "Round Completed!", 
        `You have completed round ${round} with a score of ${score}.\n\nWould you like to play another round?`,
        [
          { 
            text: "Yes", 
            onPress: async () => {
              const newRound = round + 1;
              setRound(newRound);
              setSentenceIndex(0);
              setAttempts(0);
              const newSentences = await generateSentenceBatch();
              startCountdown(newSentences[0]);
            }
          },
          {
            text: "No",
            onPress: () => setGameState('completed')
          }
        ]
      );
    } else {
      // Move to next sentence
      setSentenceIndex(nextIndex);
      setAttempts(0);
      startCountdown(sentences[nextIndex]);
    }
  };

  // Provide hints based on current arrangement
  const provideHint = (userSentence, correctSentence) => {
    const userWords = userSentence.split(' ');
    const correctWords = correctSentence.split(' ');
    
    // Find the first misplaced word
    let hintMessage = "";
    
    if (userWords.length < correctWords.length) {
      hintMessage = "Your sentence is too short. Add more words.";
    } else {
      // Check for first incorrect position
      for (let i = 0; i < userWords.length; i++) {
        if (i >= correctWords.length || userWords[i] !== correctWords[i]) {
          if (i === 0) {
            hintMessage = `After "${correctWords[i-1]}", the next word should be "${correctWords[i]}".`;
          } else {
            hintMessage = `After "${correctWords[i-1]}", the next word should be "${correctWords[i]}".`;
          }
          break;
        }
      }
    }
    
    if (hintMessage === "") {
      hintMessage = "Check the word order. Something is not right.";
    }
    
    Alert.alert(`Attempt ${attempts + 1}/3`, hintMessage);
  };

  // Handle moving a word from word bank to arranged area
  const moveWordToArranged = (word) => {
    setWordBank(prev => prev.filter(w => w.id !== word.id));
    setArrangedWords(prev => [...prev, word]);
  };

  // Handle moving a word from arranged area back to word bank
  const moveWordToBank = (word) => {
    setArrangedWords(prev => prev.filter(w => w.id !== word.id));
    setWordBank(prev => [...prev, word]);
  };

  // Clean up timers when component unmounts
  useEffect(() => {
    return () => {
      if (countdownTimer.current) clearInterval(countdownTimer.current);
      if (sentenceTimer.current) clearInterval(sentenceTimer.current);
    };
  }, []);

  // updateProgress function
  const updateProgress = async (gameStats) => {
    try {
      const response = await serverApi.post('/api/progress/writing/sentencePractice', {
        totalSentences: gameStats.totalSentences,
        correctSentences: gameStats.correctSentences,
        score: gameStats.score
      });
      
      console.log('Progress updated:', response.data);
    } catch (error) {
      console.error('Error updating progress:', error);
    }
  };

// Render functions for different game states
const renderInitScreen = () => (
  <View style={styles.contentContainer}>
    <View style={styles.logoContainer}>
      <Icon name="book-open" size={40} color="#6B5ECD" />
    </View>
    <Text style={styles.welcomeTitle}>Sentence Memory Game</Text>
    <Text style={styles.instructions}>
      Memorize the sentence that appears, then recreate it from the word bank.
      Each round has 10 sentences with 3 attempts each.
    </Text>
    <TouchableOpacity 
      style={styles.startButton} 
      onPress={startGame}
      activeOpacity={0.8}
    >
      <Text style={styles.startButtonText}>Start Game</Text>
    </TouchableOpacity>
  </View>
);

const renderCountdown = () => (
  <View style={styles.contentContainer}>
    <Text style={styles.countdownText}>{countdownValue}</Text>
    <Text style={styles.countdownLabel}>Get Ready!</Text>
  </View>
);

const renderShowingSentence = () => (
  <View style={styles.contentContainer}>
    <Text style={styles.timeLeftText}>{timeLeft}s remaining</Text>
    <Animated.View style={[styles.sentenceCard, { opacity: fadeAnimation }]}>
      <Text style={styles.sentence}>{currentSentence}</Text>
    </Animated.View>
    <Text style={styles.memorizeText}>Memorize this sentence!</Text>
  </View>
);

const renderArrangingWords = () => (
  <View style={styles.contentContainer}>
    {/* Area for arranged words */}
    <Text style={styles.sectionLabel}>Your sentence:</Text>
    <View style={styles.arrangedArea}>
      <View style={styles.wordContainer}>
        {arrangedWords.length === 0 ? (
          <Text style={styles.placeholderText}>Tap words below to build your sentence</Text>
        ) : (
          arrangedWords.map((word) => (
            <TouchableOpacity
              key={word.id}
              style={styles.arrangedWord}
              onPress={() => moveWordToBank(word)}
              activeOpacity={0.7}
            >
              <Text style={styles.wordText}>{word.text}</Text>
            </TouchableOpacity>
          ))
        )}
      </View>
    </View>

    {/* Word bank area */}
    <Text style={styles.sectionLabel}>Available words:</Text>
    <View style={styles.wordBankArea}>
      <View style={styles.wordContainer}>
        {wordBank.map((word) => (
          <TouchableOpacity
            key={word.id}
            style={styles.bankWord}
            onPress={() => moveWordToArranged(word)}
            activeOpacity={0.7}
          >
            <Text style={styles.wordText}>{word.text}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
    
    {/* Action buttons */}
    <View style={styles.buttonContainer}>
      <TouchableOpacity
        style={styles.secondaryButton}
        onPress={() => {
          setArrangedWords([]);
          setWordBank(currentSentence.split(' ').map(word => ({
            text: word,
            id: Math.random().toString(),
          })).sort(() => Math.random() - 0.5));
        }}
        activeOpacity={0.8}
      >
        <Text style={styles.secondaryButtonText}>Reset</Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[
          styles.primaryButton, 
          arrangedWords.length === 0 && styles.disabledButton
        ]}
        onPress={handleCheckSentence}
        disabled={arrangedWords.length === 0}
        activeOpacity={0.8}
      >
        <Text style={styles.primaryButtonText}>Submit</Text>
      </TouchableOpacity>
    </View>
  </View>
);

const renderCompletedScreen = () => (
  <View style={styles.contentContainer}>
    <View style={styles.completedContainer}>
      <Icon name="award" size={60} color="#6B5ECD" />
      <Text style={styles.completedTitle}>Game Complete!</Text>
      <Text style={styles.completedScore}>Final Score: {score}</Text>
      <Text style={styles.completedRound}>Rounds: {round}</Text>
    </View>
    
    <TouchableOpacity 
      style={styles.startButton} 
      onPress={startGame}
      activeOpacity={0.8}
    >
      <Text style={styles.startButtonText}>Play Again</Text>
    </TouchableOpacity>
  </View>
);

return (
  <SafeAreaView style={styles.safeArea}>
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Sentence Memory Game</Text>
      </View>
      
      {/* Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Round</Text>
          <Text style={styles.statValue}>{round}</Text>
        </View>
        
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Sentence</Text>
          <Text style={styles.statValue}>{sentenceIndex + 1}/10</Text>
        </View>
        
        {gameState === 'arranging' && (
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Attempt</Text>
            <Text style={styles.statValue}>{attempts + 1}/3</Text>
          </View>
        )}
        
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Score</Text>
          <Text style={styles.statValue}>{score}</Text>
        </View>
      </View>
      
      {/* Content */}
      {gameState === 'init' && renderInitScreen()}
      {gameState === 'countdown' && renderCountdown()}
      {gameState === 'showing' && renderShowingSentence()}
      {gameState === 'arranging' && renderArrangingWords()}
      {gameState === 'completed' && renderCompletedScreen()}
    </View>
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
    paddingTop: 50,
  },
  header: {
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#6B5ECD',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 20,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 13,
    color: '#666666',
    fontWeight: '500',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 18,
    color: '#6B5ECD',
    fontWeight: '700',
  },
  contentContainer: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F8F6FF',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 32,
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#333333',
    textAlign: 'center',
    marginBottom: 16,
  },
  instructions: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 40,
  },
  startButton: {
    backgroundColor: '#6B5ECD',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 24,
  },
  startButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  countdownText: {
    fontSize: 72,
    fontWeight: '700',
    color: '#6B5ECD',
    textAlign: 'center',
  },
  countdownLabel: {
    fontSize: 20,
    color: '#666666',
    textAlign: 'center',
    marginTop: 16,
  },
  timeLeftText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6B5ECD',
    textAlign: 'center',
    marginBottom: 20,
  },
  sentenceCard: {
    backgroundColor: '#F8F6FF',
    borderRadius: 12,
    padding: 24,
    marginVertical: 20,
    minHeight: 120,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sentence: {
    fontSize: 18,
    lineHeight: 28,
    textAlign: 'center',
    color: '#333333',
    fontWeight: '500',
  },
  memorizeText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#666666',
    textAlign: 'center',
    marginTop: 16,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666666',
    marginBottom: 12,
  },
  arrangedArea: {
    backgroundColor: '#F8F8F8',
    borderRadius: 8,
    padding: 16,
    minHeight: 80,
    marginBottom: 24,
  },
  wordBankArea: {
    backgroundColor: '#F8F8F8',
    borderRadius: 8,
    padding: 16,
    minHeight: 100,
    marginBottom: 24,
  },
  wordContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    color: '#999999',
    fontSize: 14,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  bankWord: {
    backgroundColor: '#6B5ECD',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    margin: 4,
  },
  arrangedWord: {
    backgroundColor: '#6B5ECD',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    margin: 4,
  },
  wordText: {
    color: '#FFFFFF',
    fontWeight: '500',
    fontSize: 15,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: '#6B5ECD',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: '#F8F8F8',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#666666',
    fontSize: 16,
    fontWeight: '500',
  },
  disabledButton: {
    backgroundColor: '#E0E0E0',
  },
  completedContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  completedTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333333',
    marginTop: 16,
    marginBottom: 8,
  },
  completedScore: {
    fontSize: 20,
    fontWeight: '600',
    color: '#6B5ECD',
    marginBottom: 4,
  },
  completedRound: {
    fontSize: 16,
    color: '#666666',
  },
});   

export default SentencePuzzleGame;