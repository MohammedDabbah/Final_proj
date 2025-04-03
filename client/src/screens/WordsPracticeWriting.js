import React, { useState, useEffect, useRef } from 'react';
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
import axios from 'axios';
import serverApi from "../../api/serverApi";
import Icon from 'react-native-vector-icons/Feather'; // Assuming you already have this

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

  // Fetch a batch of 10 words from OpenAI API
  const fetchWordBatch = async () => {
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
            content: "Give me 10 random words for a memory game for children aged 7-12. Respond only with a JSON array." 
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
              content: "Provide 10 words for a children's memory game. Words should be appropriate for ages 7-12." 
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
        <Icon name="book" size={50} color="#B052F7" />
      </View>
      <Text style={styles.welcomeTitle}>Word Memory Game</Text>
      <Text style={styles.instructions}>
        Memorize the word shown on screen.
        After a few seconds, the word will disappear.
        Spell the word from memory using the letters provided.
        Each round has 10 words.
        You have 3 attempts for each word.
      </Text>
      <TouchableOpacity 
        style={styles.startButton} 
        onPress={startGame}
        disabled={isLoading}
      >
        <Text style={styles.startButtonText}>
          {isLoading ? "Loading..." : "Start Game"}
        </Text>
        {!isLoading && <Icon name="play" size={20} color="white" style={styles.buttonIcon} />}
      </TouchableOpacity>
    </View>
  );

  const renderGameScreen = () => (
    <View style={styles.contentContainer}>
      <View style={styles.wordPromptContainer}>
        <Text style={styles.wordPrompt}>
          {isWordVisible 
            ? `Memorize this word: (${countdownValue})` 
            : ""}
        </Text>
        
        {isWordVisible ? (
          <View style={styles.wordCard}>
            <Text style={styles.word}>{currentWord}</Text>
          </View>
        ) : (
          <View style={styles.hiddenWordContainer}>
            <Icon name="eye-off" size={24} color="#B052F7" />
            <Text style={styles.hiddenWordText}>Word is hidden</Text>
          </View>
        )}
      </View>

      {/* Input display area - only show when word is hidden */}
      {!isWordVisible && (
        <>
          <View style={styles.inputContainer}>
            <Text style={styles.input}>{userInput}</Text>
            
            {/* Backspace button */}
            {userInput.length > 0 && (
              <TouchableOpacity style={styles.backspaceButton} onPress={removeLastLetter}>
                <Icon name="delete" size={20} color="white" />
              </TouchableOpacity>
            )}
          </View>

          {/* Alphabet bank */}
          <Text style={styles.sectionLabel}>Letter Bank:</Text>
          <View style={styles.alphabetBank}>
            {alphabetBank.map((letter) => (
              <TouchableOpacity 
                key={letter.id} 
                style={styles.letterButton}
                onPress={() => addLetterToInput(letter)}
              >
                <Text style={styles.letterText}>{letter.text}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Action buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={styles.secondaryButton} 
              onPress={resetWord}
            >
              <Text style={styles.secondaryButtonText}>Reset</Text>
              <Icon name="refresh-cw" size={16} color="#B052F7" style={styles.secondaryButtonIcon} />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[
                styles.primaryButton, 
                userInput.length === 0 && styles.disabledButton
              ]} 
              onPress={checkWord}
              disabled={userInput.length === 0}
            >
              <Text style={styles.primaryButtonText}>Check</Text>
              <Icon name="check" size={16} color="white" style={styles.buttonIcon} />
            </TouchableOpacity>
          </View>
        </>
      )}

      {/* Feedback message */}
      {feedback !== '' && (
        <View style={[
          styles.feedbackContainer,
          feedback.includes("Correct") ? styles.successFeedback : 
          feedback.includes("correct word") ? styles.failureFeedback : 
          styles.neutralFeedback
        ]}>
          <Text style={styles.feedbackText}>
            {feedback.includes("Correct") && <Icon name="check-circle" size={20} color="#4CAF50" />}
            {feedback.includes("correct word") && <Icon name="x-circle" size={20} color="#F44336" />}
            {' '}{feedback}
          </Text>
        </View>
      )}
    </View>
  );

  const renderCompletedScreen = () => (
    <View style={styles.contentContainer}>
      <View style={styles.completedIconContainer}>
        <Icon name="award" size={80} color="#B052F7" />
      </View>
      <Text style={styles.completedTitle}>Game Completed!</Text>
      <Text style={styles.completedScore}>Final Score: {score}</Text>
      <Text style={styles.completedRound}>Rounds Completed: {round}</Text>
      
      <TouchableOpacity 
        style={styles.startButton} 
        onPress={() => {
          // Update progress if not already updated
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
      >
        <Text style={styles.startButtonText}>Play Again</Text>
        <Icon name="refresh-cw" size={20} color="white" style={styles.buttonIcon} />
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
              <Icon name="flag" size={16} color="#B052F7" />
              <Text style={styles.infoLabel}>Round</Text>
              <Text style={styles.infoValue}>{round}</Text>
            </View>
            
            {gameState === 'inProgress' && (
              <View style={styles.infoItem}>
                <Icon name="book-open" size={16} color="#B052F7" />
                <Text style={styles.infoLabel}>Word</Text>
                <Text style={styles.infoValue}>{wordIndex + 1}/10</Text>
              </View>
            )}
            
            {gameState === 'inProgress' && (
              <View style={styles.infoItem}>
                <Icon name="repeat" size={16} color="#B052F7" />
                <Text style={styles.infoLabel}>Attempt</Text>
                <Text style={styles.infoValue}>{attempts + 1}/3</Text>
              </View>
            )}
            
            <View style={styles.infoItem}>
              <Icon name="star" size={16} color="#B052F7" />
              <Text style={styles.infoLabel}>Score</Text>
              <Text style={styles.infoValue}>{score}</Text>
            </View>
          </View>
        </View>
        
        {/* Dynamic content based on game state */}
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
    backgroundColor: '#F8F8FF',
  },
  container: {
    flex: 1,
  },
  header: {
    backgroundColor: '#B052F7',
    paddingVertical: 20,
    alignItems: 'center',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  infoCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 15,
    margin: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
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
  contentContainer: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(176, 82, 247, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 24,
  },
  instructions: {
    fontSize: 16,
    color: '#555',
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 24,
  },
  startButton: {
    width: '80%',
    height: 56,
    borderRadius: 12,
    backgroundColor: '#B052F7',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  startButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  buttonIcon: {
    marginLeft: 8,
  },
  wordPromptContainer: {
    alignItems: 'center',
    marginBottom: 24,
    width: '100%',
  },
  wordPrompt: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#B052F7',
    marginBottom: 16,
  },
  wordCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    minWidth: '80%',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
  },
  word: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
  },
  hiddenWordContainer: {
    backgroundColor: '#F0F0F0',
    borderRadius: 16,
    padding: 20,
    minWidth: '80%',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    flexDirection: 'row',
  },
  hiddenWordText: {
    fontSize: 18,
    color: '#666',
    marginLeft: 8,
  },
  inputContainer: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    width: '90%',
    minHeight: 70,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    position: 'relative',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  input: {
    fontSize: 24,
    color: '#333',
    letterSpacing: 2,
    fontWeight: '500',
    textAlign: 'center',
  },
  backspaceButton: {
    position: 'absolute',
    right: 12,
    top: '50%',
    marginTop: -18,
    width: 36,
    height: 36,
    backgroundColor: '#B052F7',
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    alignSelf: 'flex-start',
    marginLeft: 20,
    marginBottom: 8,
  },
  alphabetBank: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    width: '90%',
    minHeight: 120,
    marginVertical: 8,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  letterButton: {
    backgroundColor: '#B052F7',
    width: 44,
    height: 44,
    borderRadius: 12,
    margin: 6,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  letterText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '90%',
    marginTop: 16,
  },
  primaryButton: {
    flex: 1,
    height: 56,
    marginLeft: 8,
    borderRadius: 12,
    backgroundColor: '#B052F7',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: 'white',
    height: 56,
    borderRadius: 12,
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  secondaryButtonText: {
    color: '#B052F7',
    fontSize: 18,
    fontWeight: 'bold',
  },
  secondaryButtonIcon: {
    marginLeft: 8,
  },
  disabledButton: {
    backgroundColor: '#D0D0D0',
    opacity: 0.7,
  },
  feedbackContainer: {
    marginTop: 24,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    width: '90%',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  successFeedback: {
    backgroundColor: '#E8F5E9',
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  failureFeedback: {
    backgroundColor: '#FFEBEE',
    borderLeftWidth: 4,
    borderLeftColor: '#F44336',
  },
  neutralFeedback: {
    backgroundColor: '#F5F5F5',
    borderLeftWidth: 4,
    borderLeftColor: '#9E9E9E',
  },
  feedbackText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'left',
    color: '#333',
  },
  completedIconContainer: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(176, 82, 247, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  completedTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 24,
  },
  completedScore: {
    fontSize: 22,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  completedRound: {
    fontSize: 18,
    color: '#666',
    marginBottom: 40,
  },
});

export default WordPracticeGame;