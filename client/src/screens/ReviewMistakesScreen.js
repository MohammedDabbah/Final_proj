import React, { useEffect, useState, useContext } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import serverApi from '../../api/serverApi';
import { AuthContext } from '../../Auth/AuthContext';

const ReviewMistakesScreen = ({ navigation }) => {
    const { user } = useContext(AuthContext);
    const [wrongAnswers, setWrongAnswers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchWrongAnswers();
    }, []);

    // Fetch wrong answers from the backend
    const fetchWrongAnswers = async () => {
        try {
            const response = await serverApi.get('/unknown-words', { withCredentials: true });
            setWrongAnswers(response.data.unknownWords);
        } catch (error) {
            console.error('Error fetching wrong answers:', error);
        } finally {
            setLoading(false);
        }
    };

    // Start a new quiz with only the wrong answers
    const startQuizWithMistakes = () => {
        if (wrongAnswers.length === 0) {
            Alert.alert('No Mistakes', 'You don’t have any mistakes to review.');
            return;
        }
        
        navigation.navigate('Quiz', { level: 'mistakes', words: wrongAnswers.map(item => item.word) });
    };
    
    if (loading) return <ActivityIndicator size="large" color="#6B5ECD" style={{ flex: 1, justifyContent: 'center' }} />;

    return (
        <View style={styles.container}>
            <Text style={styles.header}>Review Your Mistakes</Text>
            {wrongAnswers.length === 0 ? (
                <Text style={styles.noMistakesText}>No mistakes to review! Great job! 🎉</Text>
            ) : (
                <>
                    <FlatList
                        data={wrongAnswers}
                        keyExtractor={(item, index) => index.toString()}
                        renderItem={({ item }) => (
                            <View style={styles.card}>
                                <Text style={styles.word}>{item.word}</Text>
                                <Text style={styles.definition}>{item.definition}</Text>
                            </View>
                        )}
                    />
                    <TouchableOpacity style={styles.quizButton} onPress={startQuizWithMistakes}>
                        <Text style={styles.quizButtonText}>Retry Quiz with Mistakes</Text>
                    </TouchableOpacity>
                </>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8F6FF',
        padding: 20,
    },
    header: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#6B5ECD',
        marginBottom: 15,
        textAlign: 'center',
    },
    noMistakesText: {
        fontSize: 18,
        color: '#333',
        textAlign: 'center',
        marginTop: 20,
    },
    card: {
        backgroundColor: '#fff',
        padding: 15,
        borderRadius: 10,
        marginBottom: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    word: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    definition: {
        fontSize: 16,
        color: '#555',
        marginTop: 5,
    },
    quizButton: {
        backgroundColor: '#6B5ECD',
        paddingVertical: 15,
        borderRadius: 10,
        marginTop: 20,
        alignItems: 'center',
    },
    quizButtonText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
});

export default ReviewMistakesScreen;
