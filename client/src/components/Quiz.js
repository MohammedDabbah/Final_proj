import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import merriamApi from '../../api/merriamApi';
import serverApi from '../../api/serverApi';
import beginnerWords from '../../Json/beginner_words.json';
import intermediateWords from '../../Json/intermediate_words.json';
import advancedWords from '../../Json/advanced_words.json';

const QuizComponent = ({ level, numQuestions, onQuizComplete, words }) => {
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(true);
  const [unknownWords, setUnknownWords] = useState([]);

  useEffect(() => {
    generateQuiz();
    console.log(numQuestions);
  }, [level, numQuestions]);

  const getWordsByLevel = () => {
    switch (level) {
      case 'beginner':
        return beginnerWords;
      case 'intermediate':
        return intermediateWords;
      case 'advanced':
        return advancedWords;
      default:
        return beginnerWords;
    }
  };

  const getRandomWords = (wordsArray, count) => {
    return wordsArray
      .sort(() => 0.5 - Math.random())
      .slice(0, count)
      .map(obj => obj.word);
  };

  const fetchDefinitions = async (words) => {
    const fetchedDefinitions = {};
    for (const word of words) {
      try {
        const response = await merriamApi.get(`/${word}`);
        if (response.data.length > 0 && response.data[0].shortdef) {
          fetchedDefinitions[word] = response.data[0].shortdef[0];
        } else {
          fetchedDefinitions[word] = 'No definition found';
        }
      } catch (error) {
        fetchedDefinitions[word] = 'Error fetching definition';
      }
    }
    return fetchedDefinitions;
  };

const generateQuiz = async () => {
  setLoading(true);

  let selectedWords;
  if (words && words.length > 0) {
    selectedWords = words.map(w => (typeof w === 'string' ? w : w.word));
  } else {
    const wordsList = words && words.length > 0
  ? words.map(w => typeof w === 'string' ? { word: w } : w)
  : getWordsByLevel();

    selectedWords = level === 'mistakes'
  ? wordsList.map(w => w.word)  // use all provided words
  : getRandomWords(wordsList, numQuestions);

  }

  const definitions = await fetchDefinitions(selectedWords);

  // Filter only valid definitions
  const validWords = selectedWords.filter(
    word =>
      definitions[word] !== 'Error fetching definition' &&
      definitions[word] !== 'No definition found'
  ).slice(0, level === 'mistakes' ? selectedWords.length : numQuestions);

  const quizQuestions = validWords.map(word => {
    const correctDefinition = definitions[word];

    const uniqueWrongOptions = [...new Set(
      Object.values(definitions).filter(
        def =>
          def !== correctDefinition &&
          def !== 'Error fetching definition' &&
          def !== 'No definition found'
      )
    )].sort(() => 0.5 - Math.random()).slice(0, 2);

    const options = [...uniqueWrongOptions, correctDefinition].sort(() => 0.5 - Math.random());

    return { word, correctDefinition, options };
  });

  setQuestions(quizQuestions);
  setLoading(false);
};


  const updateUserMistakes = async (updatedMistakes) => {
    try {
      const formattedMistakes = updatedMistakes.map(({ word, definition }) => ({ word, definition }));
      await serverApi.post('/update-unknown-words', {
        unknownWords: formattedMistakes
      }, { withCredentials: true });
    } catch (error) {
      console.error('Error updating user mistakes:', error);
    }
  };

const handleAnswer = (selectedAnswer) => {
  const currentQuestion = questions[currentQuestionIndex];
  const isCorrect = selectedAnswer === currentQuestion.correctDefinition;

  // Update local copy instead of relying on async setState
  let updatedUnknownWords = [...unknownWords];

  if (!isCorrect) {
    updatedUnknownWords.push({
      word: currentQuestion.word,
      definition: currentQuestion.correctDefinition
    });
  } else if (words) {
    updatedUnknownWords = updatedUnknownWords.filter(w => w.word !== currentQuestion.word);
  }

  Alert.alert(
    isCorrect ? 'Correct!' : 'Wrong!',
    isCorrect ? 'Well done! 🎉' : `The correct answer was: "${currentQuestion.correctDefinition}"`,
    [{
      text: 'Next',
      onPress: () => nextQuestion(isCorrect, updatedUnknownWords)
    }]
  );

  // Set new state for consistency (for next round)
  setUnknownWords(updatedUnknownWords);
};




  const saveUnknownWords = async () => {
    try {
      await serverApi.post('/unknown-words', {
        unknownWords
      }, { withCredentials: true });
    } catch (error) {
      console.error('Error saving unknown words:', error);
    }
  };

const nextQuestion = async (isCorrect, updatedUnknownWords) => {
  if (isCorrect) {
    setScore(prev => prev + 1);
  }

  if (words) {
    await updateUserMistakes(updatedUnknownWords);
  }

  if (currentQuestionIndex < questions.length - 1) {
    setCurrentQuestionIndex(prev => prev + 1);
  } else {
    if (updatedUnknownWords.length > 0) {
      await serverApi.post('/unknown-words', {
        unknownWords: updatedUnknownWords
      }, { withCredentials: true });
    }

    const finalScore = isCorrect ? score + 1 : score;
    Alert.alert('Quiz Completed!', `Your score: ${finalScore}/${questions.length}`, [
      { text: 'OK', onPress: () => onQuizComplete(finalScore) }
    ]);
  }
};




  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6B5ECD" />
        <Text style={styles.loadingText}>Loading quiz...</Text>
      </View>
    );
  }

  const current = questions[currentQuestionIndex];
  const progressPercentage = ((currentQuestionIndex + 1) / questions.length) * 100;

  return (
    <View style={styles.container}>
      {/* Simple Header */}
      <View style={styles.header}>
        <Text style={styles.questionNumber}>
          {currentQuestionIndex + 1}/{questions.length}
        </Text>
        <Text style={styles.score}>{score} points</Text>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressBar}>
        <View style={[styles.progress, { width: `${progressPercentage}%` }]} />
      </View>

      {/* Word */}
      <View style={styles.wordSection}>
        <Text style={styles.word}>{current.word}</Text>
        <Text style={styles.instruction}>Choose the correct definition</Text>
      </View>

      {/* Options */}
      <View style={styles.optionsSection}>
        {current.options.map((option, index) => (
          <TouchableOpacity 
            key={index} 
            style={styles.option} 
            onPress={() => handleAnswer(option)}
            activeOpacity={0.7}
          >
            <Text style={styles.optionText}>{option}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 24,
    paddingTop: 60,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666666',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  questionNumber: {
    fontSize: 16,
    color: '#666666',
    fontWeight: '500',
  },
  score: {
    fontSize: 16,
    color: '#6B5ECD',
    fontWeight: '600',
  },
  progressBar: {
    height: 4,
    backgroundColor: '#F0F0F0',
    borderRadius: 2,
    marginBottom: 40,
  },
  progress: {
    height: '100%',
    backgroundColor: '#6B5ECD',
    borderRadius: 2,
  },
  wordSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  word: {
    fontSize: 42,
    fontWeight: '700',
    color: '#6B5ECD',
    marginBottom: 12,
    textAlign: 'center',
  },
  instruction: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
  },
  optionsSection: {
    flex: 1,
  },
  option: {
    backgroundColor: '#F8F8F8',
    padding: 20,
    borderRadius: 8,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#6B5ECD',
  },
  optionText: {
    fontSize: 16,
    color: '#333333',
    lineHeight: 22,
  },
});

export default QuizComponent;