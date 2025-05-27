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
      const wordsList = getWordsByLevel();
      selectedWords = getRandomWords(wordsList, numQuestions);
    }

    const definitions = await fetchDefinitions(selectedWords);

    const quizQuestions = selectedWords.map(word => {
      const correctDefinition = definitions[word] || 'No definition';
      const wrongOptions = Object.values(definitions)
        .filter(def => def !== correctDefinition)
        .sort(() => 0.5 - Math.random())
        .slice(0, 2);

      const options = [...wrongOptions, correctDefinition].sort(() => 0.5 - Math.random());
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

  const handleAnswer = async (selectedAnswer) => {
    const currentQuestion = questions[currentQuestionIndex];
    const isCorrect = selectedAnswer === currentQuestion.correctDefinition;

    if (!isCorrect) {
      setUnknownWords(prev => [...prev, {
        word: currentQuestion.word,
        definition: currentQuestion.correctDefinition
      }]);
    } else if (words) {
      const updatedMistakes = unknownWords.filter(w => w.word !== currentQuestion.word);
      setUnknownWords(updatedMistakes);
      await updateUserMistakes(updatedMistakes);
    }

    setScore(prev => prev + (isCorrect ? 1 : 0));

    Alert.alert(
      isCorrect ? 'Correct!' : 'Wrong!',
      isCorrect ? 'Well done! 🎉' : `The correct answer was: "${currentQuestion.correctDefinition}"`,
      [{ text: 'Next', onPress: nextQuestion }]
    );
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

  const nextQuestion = async () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      if (unknownWords.length > 0) {
        await saveUnknownWords();
      }
      Alert.alert('Quiz Completed!', `Your score: ${score}/${questions.length}`, [
        { text: 'OK', onPress: () => onQuizComplete(score) }
      ]);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#6B5ECD" />
      </View>
    );
  }

  const current = questions[currentQuestionIndex];

  return (
    <View style={styles.container}>
      <Text style={styles.headerText}>Word: {current.word}</Text>
      <Text style={styles.questionText}>Choose the correct definition:</Text>
      {current.options.map((option, index) => (
        <TouchableOpacity key={index} style={styles.optionButton} onPress={() => handleAnswer(option)}>
          <Text style={styles.optionText}>{option}</Text>
        </TouchableOpacity>
      ))}
      <Text style={styles.scoreText}>Score: {score}/{questions.length}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F6FF',
    paddingHorizontal: 20,
    paddingTop: 40,
    alignItems: 'center',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#6B5ECD',
    marginBottom: 10,
  },
  questionText: {
    fontSize: 18,
    color: '#555',
    textAlign: 'center',
    marginBottom: 20,
  },
  optionButton: {
    backgroundColor: '#6B5ECD',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 15,
    marginBottom: 12,
    width: '100%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  optionText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  scoreText: {
    fontSize: 18,
    color: '#333',
    fontWeight: '600',
    marginTop: 20,
  },
});

export default QuizComponent;
