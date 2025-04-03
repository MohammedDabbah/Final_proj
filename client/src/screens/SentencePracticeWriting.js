import React, { useState, useEffect, useRef } from 'react';
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

  // Generate a batch of 10 sentences for the current round
  const generateSentenceBatch = async () => {
    try {
      // Initial request with clear instructions
      const response = await aiApi.post('/chat/completions', {
        model: 'gpt-3.5-turbo',
        messages: [
          { 
            role: 'system', 
            content: 'You are a helpful assistant that provides exactly 10 educational sentences for children. Respond with only a JSON array of sentences.' 
          },
          { 
            role: 'user', 
            content: 'Create 10 short, simple, educational sentences suitable for children aged 7-12. Each sentence should teach something about the world, science, or general knowledge. Respond only with a JSON array of strings.' 
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
              content: 'You provide educational content for children. Respond with exactly 10 simple sentences as a JSON array. Nothing else.' 
            },
            { 
              role: 'user', 
              content: 'Write 10 educational facts as complete sentences for elementary school children. Each sentence should be simple and teach something interesting.' 
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
        Alert.alert("Out of attempts", `The correct sentence was:\n"${currentSentence}"`);
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
        `You've completed round ${round} with a score of ${score}.\n\nWould you like to play another round?`,
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
            hintMessage = `The sentence should start with "${correctWords[0]}".`;
          } else {
            hintMessage = `After "${correctWords[i-1]}", the next word should be "${correctWords[i]}".`;
          }
          break;
        }
      }
    }
    
    if (hintMessage === "") {
      hintMessage = "Check the word order. Something isn't right.";
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
      <Text style={styles.welcomeTitle}>Sentence Memory Game</Text>
      <Text style={styles.instructions}>
        Memorize the sentence that appears, then recreate it from the word bank.
        Each round has 10 sentences.
        You have 3 attempts for each sentence.
      </Text>
      <TouchableOpacity style={styles.startButton} onPress={startGame}>
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
      <Text style={styles.timeLeftText}>{timeLeft}s</Text>
      <Animated.View style={[styles.sentenceCard, { opacity: fadeAnimation }]}>
        <Text style={styles.sentence}>{currentSentence}</Text>
      </Animated.View>
      <Text style={styles.memorizeText}>Memorize this sentence!</Text>
    </View>
  );

  const renderArrangingWords = () => (
    <View style={styles.contentContainer}>
      {/* Area for arranged words */}
      <Text style={styles.sectionLabel}>Arrange the sentence:</Text>
      <View style={styles.arrangedArea}>
        <View style={styles.wordContainer}>
          {arrangedWords.map((word) => (
            <TouchableOpacity
              key={word.id}
              style={styles.arrangedWord}
              onPress={() => moveWordToBank(word)}
            >
              <Text style={styles.wordText}>{word.text}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Word bank area */}
      <Text style={styles.sectionLabel}>Word Bank:</Text>
      <View style={styles.wordBankArea}>
        <View style={styles.wordContainer}>
          {wordBank.map((word) => (
            <TouchableOpacity
              key={word.id}
              style={styles.bankWord}
              onPress={() => moveWordToArranged(word)}
            >
              <Text style={styles.wordText}>{word.text}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
      
      {/* Action buttons */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[
            styles.primaryButton, 
            arrangedWords.length === 0 && styles.disabledButton
          ]}
          onPress={handleCheckSentence}
          disabled={arrangedWords.length === 0}
        >
          <Text style={styles.primaryButtonText}>Check</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderCompletedScreen = () => (
    <View style={styles.contentContainer}>
      <Text style={styles.completedTitle}>Game Completed!</Text>
      <Text style={styles.completedScore}>Final Score: {score}</Text>
      <Text style={styles.completedRound}>Rounds Completed: {round}</Text>
      <TouchableOpacity style={styles.startButton} onPress={startGame}>
        <Text style={styles.startButtonText}>Play Again</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header with game info */}
        <View style={styles.header}>
          <Text style={styles.title}>Memory Game</Text>
        </View>
        
        {/* Game info area */}
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Round</Text>
              <Text style={styles.infoValue}>{round}</Text>
            </View>
            
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Sentence</Text>
              <Text style={styles.infoValue}>{sentenceIndex + 1}/10</Text>
            </View>
            
            {gameState === 'arranging' && (
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Attempt</Text>
                <Text style={styles.infoValue}>{attempts + 1}/3</Text>
              </View>
            )}
            
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Score</Text>
              <Text style={styles.infoValue}>{score}</Text>
            </View>
          </View>
        </View>
        
        {/* Dynamic content based on game state */}
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
    padding: 16,
  },
  header: {
    backgroundColor: '#5B54D4',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  infoCard: {
    backgroundColor: '#FCE5CA',
    borderRadius: 16,
    padding: 12,
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoItem: {
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 12,
    color: '#5B54D4',
    fontWeight: '600',
  },
  infoValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#5B54D4',
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#5B54D4',
    textAlign: 'center',
    marginBottom: 24,
  },
  instructions: {
    fontSize: 16,
    color: '#333333',
    textAlign: 'center',
    marginBottom: 40,
    paddingHorizontal: 20,
    lineHeight: 24,
  },
  startButton: {
    backgroundColor: '#5B54D4',
    paddingVertical: 16,
    paddingHorizontal: 40,
    borderRadius: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  startButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  countdownText: {
    fontSize: 80,
    fontWeight: 'bold',
    color: '#5B54D4',
  },
  countdownLabel: {
    fontSize: 22,
    color: '#333333',
    marginTop: 12,
  },
  timeLeftText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#5B54D4',
    marginBottom: 16,
  },
  sentenceCard: {
    backgroundColor: '#FCE5CA',
    borderRadius: 16,
    padding: 20,
    marginVertical: 24,
    width: '90%',
    minHeight: 100,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  sentence: {
    fontSize: 20,
    lineHeight: 30,
    textAlign: 'center',
    color: '#333333',
    fontWeight: '500',
  },
  memorizeText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#5B54D4',
    marginTop: 16,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#5B54D4',
    alignSelf: 'flex-start',
    marginLeft: 8,
    marginBottom: 4,
    marginTop: 16,
  },
  arrangedArea: {
    backgroundColor: '#FCE5CA',
    borderRadius: 16,
    padding: 16,
    width: '100%',
    minHeight: 100,
  },
  wordBankArea: {
    backgroundColor: '#FCE5CA',
    borderRadius: 16,
    padding: 16,
    width: '100%',
    minHeight: 120,
    marginVertical: 16,
  },
  wordContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  bankWord: {
    backgroundColor: '#5B54D4',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    margin: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  arrangedWord: {
    backgroundColor: '#5B54D4',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    margin: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  wordText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  buttonContainer: {
    marginTop: 16,
    width: '100%',
  },
  primaryButton: {
    backgroundColor: '#5B54D4',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    width: '100%',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  disabledButton: {
    backgroundColor: '#A8A6E5',
  },
  completedTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#5B54D4',
    marginBottom: 24,
  },
  completedScore: {
    fontSize: 22,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 12,
  },
  completedRound: {
    fontSize: 18,
    color: '#333333',
    marginBottom: 40,
  },
});

export default SentencePuzzleGame;



