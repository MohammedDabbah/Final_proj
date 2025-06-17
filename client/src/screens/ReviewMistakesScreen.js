import React, { useEffect, useState, useContext } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import serverApi from '../../api/serverApi';
import { AuthContext } from '../../Auth/AuthContext';
import { CommonActions } from '@react-navigation/native';

const ReviewMistakesScreen = ({ navigation }) => {
    const { user } = useContext(AuthContext);
    const [wrongAnswers, setWrongAnswers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchWrongAnswers();
    }, []);

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

    const startQuizWithMistakes = () => {
        if (wrongAnswers.length === 0) {
            Alert.alert('No Mistakes', 'You do not have any mistakes to review.');
            return;
        }

        navigation.navigate('Quiz', {
            level: 'mistakes',
            words: wrongAnswers.map(item => item.word),
        });
    };

    const goToHome = () => {
        navigation.dispatch(
            CommonActions.reset({
                index: 0,
                routes: [{ name: 'StudentHome' }],
            })
        );
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#6B5ECD" />
                <Text style={styles.loadingText}>Loading your mistakes...</Text>
            </View>
        );
    }

    const renderMistakeItem = ({ item, index }) => (
        <View style={styles.mistakeCard}>
            <View style={styles.mistakeHeader}>
                <Text style={styles.mistakeWord}>{item.word}</Text>
                <Text style={styles.mistakeNumber}>#{index + 1}</Text>
            </View>
            <Text style={styles.mistakeDefinition}>{item.definition}</Text>
        </View>
    );

    return (
        <View style={styles.container}>
            {/* Header Section */}
            <View style={styles.headerSection}>
                <Text style={styles.title}>Review Mistakes</Text>
                <Text style={styles.subtitle}>
                    {wrongAnswers.length === 0 
                        ? "No mistakes to review" 
                        : wrongAnswers.length + " word" + (wrongAnswers.length !== 1 ? "s" : "") + " to practice"
                    }
                </Text>
            </View>

            {/* Content Section */}
            <View style={styles.contentSection}>
                {wrongAnswers.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyStateTitle}>Perfect! 🎉</Text>
                        <Text style={styles.emptyStateText}>
                            You have not made any mistakes yet.{"\n"}
                            Keep up the great work!
                        </Text>
                    </View>
                ) : (
                    <>
                        <View style={styles.statsBar}>
                            <Text style={styles.statsText}>Words to review</Text>
                            <Text style={styles.statsNumber}>{wrongAnswers.length}</Text>
                        </View>

                        <FlatList
                            data={wrongAnswers}
                            keyExtractor={(item, index) => index.toString()}
                            renderItem={renderMistakeItem}
                            showsVerticalScrollIndicator={false}
                            contentContainerStyle={styles.listContainer}
                        />
                    </>
                )}
            </View>

            {/* Actions Section */}
            <View style={styles.actionsSection}>
                {wrongAnswers.length > 0 && (
                    <TouchableOpacity 
                        style={styles.primaryButton} 
                        onPress={startQuizWithMistakes}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.primaryButtonText}>Practice These Words</Text>
                    </TouchableOpacity>
                )}
                
                <TouchableOpacity 
                    style={styles.secondaryButton} 
                    onPress={goToHome}
                    activeOpacity={0.8}
                >
                    <Text style={styles.secondaryButtonText}>Back to Home</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
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
    headerSection: {
        paddingHorizontal: 24,
        paddingBottom: 24,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    title: {
        fontSize: 28,
        fontWeight: '700',
        color: '#333333',
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 16,
        color: '#666666',
    },
    contentSection: {
        flex: 1,
        paddingHorizontal: 24,
        paddingTop: 24,
    },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingBottom: 100,
    },
    emptyStateTitle: {
        fontSize: 24,
        fontWeight: '700',
        color: '#6B5ECD',
        marginBottom: 12,
    },
    emptyStateText: {
        fontSize: 16,
        color: '#666666',
        textAlign: 'center',
        lineHeight: 24,
    },
    statsBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    statsText: {
        fontSize: 16,
        color: '#666666',
        fontWeight: '500',
    },
    statsNumber: {
        fontSize: 20,
        color: '#6B5ECD',
        fontWeight: '700',
    },
    listContainer: {
        paddingBottom: 20,
    },
    mistakeCard: {
        backgroundColor: '#F8F8F8',
        padding: 20,
        borderRadius: 8,
        marginBottom: 12,
        borderLeftWidth: 4,
        borderLeftColor: '#6B5ECD',
    },
    mistakeHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    mistakeWord: {
        fontSize: 20,
        fontWeight: '700',
        color: '#333333',
        flex: 1,
    },
    mistakeNumber: {
        fontSize: 14,
        color: '#6B5ECD',
        fontWeight: '600',
    },
    mistakeDefinition: {
        fontSize: 16,
        color: '#666666',
        lineHeight: 22,
    },
    actionsSection: {
        padding: 24,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: '#F0F0F0',
    },
    primaryButton: {
        backgroundColor: '#6B5ECD',
        paddingVertical: 16,
        borderRadius: 8,
        alignItems: 'center',
        marginBottom: 12,
    },
    primaryButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
    secondaryButton: {
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
});

export default ReviewMistakesScreen;