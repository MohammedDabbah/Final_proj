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
    }, [level, numQuestions, words]);

    // Select words based on level
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

    // Function to select random words
    const getRandomWords = (wordsArray, count) => {
        return wordsArray.sort(() => 0.5 - Math.random()).slice(0, count).map(obj => obj.word);
    };

    // Fetch definitions from Merriam-Webster API
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

    // Generate quiz questions
    const generateQuiz = async () => {
        setLoading(true);
    
        let selectedWords;
        if (words && words.length > 0) {
            selectedWords = words; // Use the words from previous mistakes
        } else {
            const wordsList = getWordsByLevel();
            selectedWords = getRandomWords(wordsList, numQuestions);
        }
    
        const definitions = await fetchDefinitions(selectedWords);
    
        const quizQuestions = selectedWords.map((word) => {
            const correctDefinition = definitions[word] || 'No definition';
            const wrongOptions = Object.values(definitions)
                .filter((def) => def !== correctDefinition)
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
            console.log("Raw mistakes before formatting:", updatedMistakes);
    
            // ✅ Ensure the mistakes are sent as objects
            const formattedMistakes = updatedMistakes.map(word => ({
                word,
                definition: "No definition available" // Placeholder if needed
            }));
    
            console.log("Formatted mistakes being sent:", formattedMistakes);
    
            const response = await serverApi.post("/update-unknown-words", {
                unknownWords: formattedMistakes, 
            }, { withCredentials: true });
    
            if (response.status === 200) {
                console.log("Updated user mistakes successfully!");
            }
        } catch (error) {
            console.error("Error saving unknown words:", error);
            console.log("Server response:", error.response?.data);
        }
    };
    
    
    
    

    // Handle answer selection
    const handleAnswer = async (selectedAnswer) => {
        const currentQuestion = questions[currentQuestionIndex];
        const isCorrect = selectedAnswer === currentQuestion.correctDefinition;
    
        if (!isCorrect) {
            setUnknownWords(prev => [...prev, { word: currentQuestion.word, definition: currentQuestion.correctDefinition }]);
        } else if (words) {
            // Remove correct word from mistakes
            const updatedMistakes = unknownWords.filter(w => w.word !== currentQuestion.word);
            setUnknownWords(updatedMistakes);
    
            // Update the backend with new mistake list
            await updateUserMistakes(updatedMistakes);
        }
    
        setScore(prevScore => prevScore + (isCorrect ? 1 : 0));
    
        Alert.alert(
            isCorrect ? 'Correct!' : 'Wrong!',
            isCorrect ? 'Well done! 🎉' : `The correct answer was: "${currentQuestion.correctDefinition}"`,
            [{ text: 'Next', onPress: nextQuestion }]
        );
    };
    
    

    // Save unknown words to the backend
    const saveUnknownWords = async () => {
        try {
            const response = await serverApi.post("/unknown-words", {
                unknownWords, 
            }, { withCredentials: true });

            if (response.status === 200) {
                console.log("Unknown words saved successfully!");
            }
        } catch (error) {
            console.error("Error saving unknown words:", error);
        }
    };

    // Move to next question or finish quiz
    const nextQuestion = async () => {
        if (currentQuestionIndex < numQuestions - 1) {
            setCurrentQuestionIndex(prevIndex => prevIndex + 1);
        } else {
            if (unknownWords.length > 0) {
                await saveUnknownWords();
            }
            Alert.alert('Quiz Completed!', `Your score: ${score}/${numQuestions}`, [
                { text: 'OK', onPress: () => onQuizComplete(score) }
            ]);
        }
    };

    if (loading) return <ActivityIndicator size="large" color="#6B5ECD" />;

    return (
        <View style={styles.container}>
            <Text style={styles.headerText}>Word: {questions[currentQuestionIndex].word}</Text>
            <Text style={styles.questionText}>Choose the correct definition:</Text>
            {questions[currentQuestionIndex].options.map((option, index) => (
                <TouchableOpacity key={index} style={styles.optionButton} onPress={() => handleAnswer(option)}>
                    <Text style={styles.optionText}>{option}</Text>
                </TouchableOpacity>
            ))}
            <Text style={styles.scoreText}>Score: {score}/{numQuestions}</Text>
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
    headerText: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#6B5ECD',
        marginBottom: 10,
    },
    scoreText: {
        fontSize: 18,
        color: '#333',
        fontWeight: '600',
        marginTop: 20,
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
});

export default QuizComponent;
