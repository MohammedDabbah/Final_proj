import React, { useState, useEffect, useRef, useContext } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  TextInput, 
  StyleSheet,
  SafeAreaView,
  Alert,
} from 'react-native';
import aiApi from "../../api/aiApi";
import serverApi from "../../api/serverApi";
import Icon from 'react-native-vector-icons/Feather'; // Assuming you already have this
import { AuthContext } from '../../Auth/AuthContext';

const WordPracticeGame = () => {
  // Game state
  const [currentWord, setCurrentWord] = useState('');
  const [alphabetBank, setAlphabetBank] = useState([]);
  const [userInput, setUserInput] = useState('');
  const [feedback, setFeedback] = useState('');
  const [gameState, setGameState] = useState('init'); // 'init', 'inProgress', 'completed'
  const [score, setScore] = useState(0);
  const [round, setRound] = useState(1);
  const [wordIndex, setWordIndex] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [wordList, setWordList] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isWordVisible, setIsWordVisible] = useState(true);
  const [countdownValue, setCountdownValue] = useState(3);
  const countdownTimerRef = useRef(null);
  const [progressUpdated, setProgressUpdated] = useState(false);
  const { user } = useContext(AuthContext);

  // Fetch a batch of 10 words from OpenAI API
  const fetchWordBatch = async () => {
    console.log(user.userLevel)
    setIsLoading(true);
    try {
      // Make the request with clear instructions for format
      const response = await aiApi.post('/chat/completions', {
        model: "gpt-3.5-turbo",
        messages: [
          { 
            role: "system", 
            content: "You are a helpful assistant. Always respond with exactly 10 words as a JSON array of strings. No explanations, just the array." 
          }, 
          { 
            role: "user", 
            content: `Give me 10 random words for a memory game for ${user.userLevel}. Respond only with a JSON array.` 
          }
        ],
        max_tokens: 250,
      });
  
      const content = response.data.choices[0].message.content;
      let wordArray = [];
      
      try {
        // Try to find and parse any JSON array in the response
        const jsonMatch = content.match(/\[[\s\S]*\]/);
        
        if (jsonMatch) {
          wordArray = JSON.parse(jsonMatch[0]);
        } else {
          // If no JSON array found, split by common delimiters
          wordArray = content.split(/[,\n]/)
            .map(word => word.trim().replace(/['"[\]]/g, ''))
            .filter(word => word && word.length > 0);
        }
      } catch (e) {
        // If parsing failed, extract any words from the text
        wordArray = content.split(/[,\s\n]/)
          .map(word => word.trim().replace(/[^a-zA-Z]/g, ''))
          .filter(word => word && word.length > 2)
          .slice(0, 10);
      }
  
      // If we still don't have enough words, retry the API call
      if (wordArray.length < 10) {
        // Try one more time with even more explicit instructions
        const retryResponse = await aiApi.post('/chat/completions', {
          model: "gpt-3.5-turbo",
          messages: [
            { 
              role: "system", 
              content: "You are a word provider. You must respond with exactly 10 simple English words as a JSON array. Example: [\"cat\", \"dog\", \"tree\", \"house\", \"book\", \"apple\", \"computer\", \"ocean\", \"mountain\", \"bicycle\"]" 
            }, 
            { 
              role: "user", 
              content: `Provide 10 words for a ${user.userLevel}'s memory game. Words should be appropriate.`
            }
          ],
          max_tokens: 250,
        });
        
        const retryContent = retryResponse.data.choices[0].message.content;
        
        try {
          const retryMatch = retryContent.match(/\[[\s\S]*\]/);
          if (retryMatch) {
            wordArray = JSON.parse(retryMatch[0]);
          } else {
            wordArray = retryContent.split(/[,\n]/)
              .map(word => word.trim().replace(/['"[\]]/g, ''))
              .filter(word => word && word.length > 0);
          }
        } catch (e) {
          // Just use whatever words we can extract
          wordArray = retryContent.split(/[,\s\n]/)
            .map(word => word.trim().replace(/[^a-zA-Z]/g, ''))
            .filter(word => word && word.length > 2);
        }
      }
      
      // Take only the first 10 words if we have more
      wordArray = wordArray.slice(0, 10);
      
      // If we still don't have enough, generate placeholder words based on the ones we have
      while (wordArray.length < 10) {
        // Create placeholder words based on existing words if possible
        if (wordArray.length > 0) {
          const baseWord = wordArray[wordArray.length % wordArray.length];
          wordArray.push(baseWord + (wordArray.length + 1));
        } else {
          wordArray.push(`word${wordArray.length + 1}`);
        }
      }
  
      setWordList(wordArray);
      return wordArray;
    } catch (error) {
      console.error("Error fetching words from OpenAI:", error);
      Alert.alert("Error", "There was an issue generating words. Please try again.");
      
      // Generate placeholder words instead of using predefined fallback words
      const generatedWords = [];
      for (let i = 0; i < 10; i++) {
        generatedWords.push(`word${i + 1}`);
      }
      
      setWordList(generatedWords);
      return generatedWords;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Generate an alphabet bank from the word
  const generateAlphabetBank = (word) => {
    // Create an array of letter objects with IDs
    const alphabets = word.split('').map(letter => ({
      text: letter,
      id: Math.random().toString(),
    }));
    
    // Shuffle the array
    const shuffled = [...alphabets].sort(() => Math.random() - 0.5);
    setAlphabetBank(shuffled);
  };

  // Start the countdown to hide the word
  const startWordCountdown = () => {
    setIsWordVisible(true);
    setCountdownValue(3);
    
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
    }
    
    countdownTimerRef.current = setInterval(() => {
      setCountdownValue(prev => {
        if (prev <= 1) {
          clearInterval(countdownTimerRef.current);
          setIsWordVisible(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Start the game
  const startGame = async () => {
    setScore(0);
    setRound(1);
    setWordIndex(0);
    setAttempts(0);
    setFeedback('');
    
    const words = await fetchWordBatch();
    setCurrentWord(words[0]);
    generateAlphabetBank(words[0]);
    setGameState('inProgress');
    
    // Show the word for a few seconds then hide it
    startWordCountdown();
  };

  // Check if the user's input matches the word
  const checkWord = () => {
    const newAttempts = attempts + 1;
    
    if (userInput.toLowerCase() === currentWord.toLowerCase()) {
      // Correct answer - award points based on attempts
      const pointsEarned = 4 - attempts;
      const newScore = score + pointsEarned;
      setScore(newScore);
      setFeedback(`Correct! +${pointsEarned} points`);
      setIsWordVisible(true); // Show the word when correct
      
      // Move to next word after a short delay
      setTimeout(() => {
        moveToNextWord();
      }, 1500);
    } else {
      setAttempts(newAttempts);
      
      if (newAttempts >= 3) {
        // Used all attempts - show correct answer and move on
        setIsWordVisible(true); // Show the word after all attempts used
        setFeedback(`The correct word was: ${currentWord}`);
        setTimeout(() => {
          moveToNextWord();
        }, 2000);
      } else {
        // Provide hint
        setFeedback(`Try again! (${newAttempts}/3)`);
      }
    }
  };

  // Move to the next word or complete round
  const moveToNextWord = () => {
    const nextIndex = wordIndex + 1;
    setUserInput('');
    setFeedback('');
    
    if (nextIndex >= 10) {
      // Round completed
      // Calculate stats for progress tracking
      const correctWords = Math.floor(score / 4); // Assuming max 4 points per word
      const gameStats = {
        totalWords: 10,
        correctWords: correctWords,
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
              setWordIndex(0);
              setAttempts(0);
              const newWords = await fetchWordBatch();
              setCurrentWord(newWords[0]);
              generateAlphabetBank(newWords[0]);
              startWordCountdown();
            }
          },
          {
            text: "No",
            onPress: () => setGameState('completed')
          }
        ]
      );
    } else {
      // Move to next word
      setWordIndex(nextIndex);
      setAttempts(0);
      setCurrentWord(wordList[nextIndex]);
      generateAlphabetBank(wordList[nextIndex]);
      startWordCountdown();
    }
  };

  // Add a letter from the alphabet bank to the input
  const addLetterToInput = (letter) => {
    setUserInput(userInput + letter.text);
    
    // Remove the letter from the alphabet bank
    setAlphabetBank(prev => prev.filter(l => l.id !== letter.id));
  };

  // Remove the last letter from the input and add it back to the alphabet bank
  const removeLastLetter = () => {
    if (userInput.length > 0) {
      const lastLetter = userInput[userInput.length - 1];
      setUserInput(userInput.slice(0, -1));
      
      // Add the letter back to the alphabet bank
      setAlphabetBank(prev => [
        ...prev, 
        { text: lastLetter, id: Math.random().toString() }
      ]);
    }
  };

  // Reset the current word attempt
  const resetWord = () => {
    setUserInput('');
    generateAlphabetBank(currentWord);
  };

  // Clean up on component unmount
  useEffect(() => {
    return () => {
      if (countdownTimerRef.current) {
        clearInterval(countdownTimerRef.current);
      }
    };
  }, []);
  
  // update progress
  const updateProgress = async (gameStats) => {
    try {
      const response = await serverApi.post('/api/progress/writing/wordPractice', {
        totalWords: gameStats.totalWords,
        correctWords: gameStats.correctWords, 
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
        <Icon name="book" size={40} color="#6B5ECD" />
      </View>
      <Text style={styles.welcomeTitle}>Word Memory Game</Text>
      <Text style={styles.instructions}>
        Memorize the word shown on screen. After a few seconds, the word will disappear. 
        Spell the word from memory using the letters provided.
      </Text>
      <TouchableOpacity 
        style={styles.startButton} 
        onPress={startGame}
        disabled={isLoading}
        activeOpacity={0.8}
      >
        <Text style={styles.startButtonText}>
          {isLoading ? "Loading..." : "Start Game"}
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderGameScreen = () => (
    <View style={styles.contentContainer}>
      <View style={styles.wordSection}>
        {isWordVisible ? (
          <>
            <Text style={styles.wordPrompt}>
              Memorize this word ({countdownValue}s)
            </Text>
            <View style={styles.wordCard}>
              <Text style={styles.word}>{currentWord}</Text>
            </View>
          </>
        ) : (
          <>
            <Text style={styles.wordPrompt}>Spell the word</Text>
            <View style={styles.inputCard}>
              <Text style={styles.userInput}>{userInput || "..."}</Text>
              {userInput.length > 0 && (
                <TouchableOpacity style={styles.backspaceButton} onPress={removeLastLetter}>
                  <Icon name="delete" size={18} color="#FFFFFF" />
                </TouchableOpacity>
              )}
            </View>
          </>
        )}
      </View>

      {!isWordVisible && (
        <>
          <View style={styles.lettersSection}>
            <Text style={styles.sectionLabel}>Available Letters</Text>
            <View style={styles.alphabetBank}>
              {alphabetBank.map((letter) => (
                <TouchableOpacity 
                  key={letter.id} 
                  style={styles.letterButton}
                  onPress={() => addLetterToInput(letter)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.letterText}>{letter.text}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.actionsSection}>
            <TouchableOpacity 
              style={styles.secondaryButton} 
              onPress={resetWord}
              activeOpacity={0.8}
            >
              <Text style={styles.secondaryButtonText}>Reset</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[
                styles.primaryButton, 
                userInput.length === 0 && styles.disabledButton
              ]} 
              onPress={checkWord}
              disabled={userInput.length === 0}
              activeOpacity={0.8}
            >
              <Text style={styles.primaryButtonText}>Submit</Text>
            </TouchableOpacity>
          </View>
        </>
      )}

      {feedback !== '' && (
        <View style={styles.feedbackSection}>
          <Text style={[
            styles.feedbackText,
            feedback.includes("Correct") && styles.successText,
            feedback.includes("correct word") && styles.errorText
          ]}>
            {feedback}
          </Text>
        </View>
      )}
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
        onPress={() => {
          if (!progressUpdated) {
            const correctWords = Math.floor(score / 4);
            updateProgress({
              totalWords: 10 * round,
              correctWords: correctWords,
              score: score
            });
          }
          startGame();
        }}
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
          <Text style={styles.title}>Memory Game</Text>
        </View>
        
        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Round</Text>
            <Text style={styles.statValue}>{round}</Text>
          </View>
          
          {gameState === 'inProgress' && (
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Word</Text>
              <Text style={styles.statValue}>{wordIndex + 1}/10</Text>
            </View>
          )}
          
          {gameState === 'inProgress' && (
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
        {gameState === 'inProgress' && renderGameScreen()}
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
    color: '#333333',
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
  wordSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  wordPrompt: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 20,
    textAlign: 'center',
  },
  wordCard: {
    backgroundColor: '#F8F6FF',
    paddingVertical: 24,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: 'center',
    minWidth: '80%',
  },
  word: {
    fontSize: 32,
    fontWeight: '700',
    color: '#6B5ECD',
    textAlign: 'center',
  },
  inputCard: {
    backgroundColor: '#F8F8F8',
    paddingVertical: 20,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    minWidth: '80%',
    minHeight: 60,
    justifyContent: 'center',
    position: 'relative',
  },
  userInput: {
    fontSize: 24,
    fontWeight: '600',
    color: '#333333',
    letterSpacing: 2,
    textAlign: 'center',
  },
  backspaceButton: {
    position: 'absolute',
    right: 12,
    backgroundColor: '#6B5ECD',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  lettersSection: {
    marginBottom: 32,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666666',
    marginBottom: 16,
    textAlign: 'center',
  },
  alphabetBank: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  letterButton: {
    backgroundColor: '#6B5ECD',
    width: 44,
    height: 44,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 4,
  },
  letterText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  actionsSection: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
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
  feedbackSection: {
    alignItems: 'center',
    marginTop: 20,
  },
  feedbackText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#666666',
    textAlign: 'center',
  },
  successText: {
    color: '#4CAF50',
  },
  errorText: {
    color: '#F44336',
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

export default WordPracticeGame;