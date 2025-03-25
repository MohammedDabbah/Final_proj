import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  TextInput, 
  StyleSheet,
  SafeAreaView,
  Alert
} from 'react-native';
import aiApi from "../../api/aiApi";

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

  // Render functions for different game states
  const renderInitScreen = () => (
    <View style={styles.contentContainer}>
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
          <Text style={styles.word}>{currentWord}</Text>
        ) : (
          <View style={styles.hiddenWordContainer}>
            
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
                <Text style={styles.backspaceText}>←</Text>
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
          <Text style={styles.feedbackText}>{feedback}</Text>
        </View>
      )}
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
            
            {gameState === 'inProgress' && (
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Word</Text>
                <Text style={styles.infoValue}>{wordIndex + 1}/10</Text>
              </View>
            )}
            
            {gameState === 'inProgress' && (
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
    alignItems: 'center',
    paddingVertical: 16,
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
  wordPromptContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  wordPrompt: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#5B54D4',
    marginBottom: 8,
  },
  word: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333333',
  },
  hiddenWordContainer: {
    // backgroundColor: '#F0F0F0',
    // borderRadius: 12,
    // padding: 16,
    // marginTop: 8,
  },
  hiddenWordText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#666666',
    letterSpacing: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    backgroundColor: '#FCE5CA',
    borderRadius: 16,
    padding: 16,
    width: '90%',
    minHeight: 70,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    position: 'relative',
  },
  input: {
    fontSize: 24,
    color: '#333333',
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
    backgroundColor: '#5B54D4',
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backspaceText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#5B54D4',
    alignSelf: 'flex-start',
    marginLeft: 20,
    marginBottom: 4,
  },
  alphabetBank: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    backgroundColor: '#FCE5CA',
    borderRadius: 16,
    padding: 16,
    width: '90%',
    minHeight: 120,
    marginVertical: 8,
  },
  letterButton: {
    backgroundColor: '#5B54D4',
    width: 44,
    height: 44,
    borderRadius: 12,
    margin: 6,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
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
    backgroundColor: '#5B54D4',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    flex: 1,
    marginLeft: 8,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  secondaryButton: {
    backgroundColor: '#E8E8E8',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  secondaryButtonText: {
    color: '#5B54D4',
    fontSize: 18,
    fontWeight: 'bold',
  },
  disabledButton: {
    backgroundColor: '#A8A6E5',
  },
  feedbackContainer: {
    marginTop: 24,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    width: '90%',
  },
  successFeedback: {
    backgroundColor: '#E0F7E0',
    borderColor: '#71C771',
    borderWidth: 1,
  },
  failureFeedback: {
    backgroundColor: '#FFE8E8',
    borderColor: '#FF8585',
    borderWidth: 1,
  },
  neutralFeedback: {
    backgroundColor: '#F0F0F0',
    borderColor: '#BBBBBB',
    borderWidth: 1,
  },
  feedbackText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
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

export default WordPracticeGame;