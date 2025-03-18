import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { CommonActions, useNavigation } from "@react-navigation/native";

const ResultsScreen = ({ route}) => {
    const { readingEvaluations = [], speechEvaluations = [], averageScore = 0 } = route.params || {};
    const navigation = useNavigation();
    

    // 🎯 Determine Level Based on Score
    let userLevel = "Beginner";
    if (averageScore >= 7) {
        userLevel = "Advanced";
    } else if (averageScore >= 4) {
        userLevel = "Intermediate";
    }

    return (
        <ScrollView style={styles.container}>
            <Text style={styles.header}>Assessment Results</Text>
            <TouchableOpacity onPress={()=>{
                 navigation.dispatch(
                    CommonActions.reset({
                    index: 0,
                    routes: [{ name: 'Home' }]
                    }
            ))
            }}>
            <View style={styles.levelContainer}>
                <Text style={styles.levelText}>🏆 Your Level: {userLevel}</Text>
                <Text style={styles.feedback}>press to continue </Text>
            </View>
            </TouchableOpacity>

            {/* ✅ Display Writing (Reading) Evaluations */}
            <Text style={styles.sectionHeader}>📝 Reading Evaluation</Text>
            {readingEvaluations.length > 0 ? (
                readingEvaluations.map((item, index) => (
                    <View key={index} style={styles.card}>
                        <Text style={styles.question}>Q{item.questionIndex + 1}: {item.userAnswer}</Text>
                        <Text style={styles.feedback}>🗒 Feedback: {item.feedback}</Text>
                        <Text style={styles.score}>🎯 Score: {item.score}/10</Text>
                    </View>
                ))
            ) : (
                <Text style={styles.noDataText}>No reading evaluations available.</Text>
            )}

            {/* ✅ Display Speaking Evaluations */}
            <Text style={styles.sectionHeader}>🎤 Speaking Evaluation</Text>
            {speechEvaluations.length > 0 ? (
                speechEvaluations.map((item, index) => (
                    <View key={index} style={styles.card}>
                        <Text style={styles.question}>Q{item.questionIndex + 1}: {item.transcript || "No transcript available"}</Text>
                        <Text style={styles.feedback}>🗒 Feedback: {item.feedback}</Text>
                        <Text style={[styles.score, item.score === 0 ? styles.lowScore : {}]}>
                            🎯 Score: {item.score}/10
                        </Text>
                    </View>
                ))
            ) : (
                <Text style={styles.noDataText}>No speaking evaluations available.</Text>
            )}

        </ScrollView>
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
        textAlign: 'center',
        marginBottom: 20,
    },
    levelContainer: {
        backgroundColor: '#6B5ECD',
        padding: 15,
        borderRadius: 10,
        marginBottom: 20,
        alignItems: 'center',
    },
    levelText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#FFF',
    },
    sectionHeader: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#444',
        marginTop: 20,
        marginBottom: 10,
    },
    card: {
        backgroundColor: '#fff',
        padding: 15,
        borderRadius: 10,
        marginBottom: 15,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    question: {
        fontSize: 16,
        color: '#222',
        fontWeight: 'bold',
    },
    feedback: {
        fontSize: 14,
        color: '#555',
        marginTop: 5,
    },
    score: {
        fontSize: 14,
        color: '#222',
        marginTop: 5,
        fontWeight: 'bold',
    },
    lowScore: {
        color: '#FF0000', // Highlight low scores in red
    },
    noDataText: {
        fontSize: 14,
        color: '#777',
        textAlign: 'center',
        marginBottom: 10,
    },
});

export default ResultsScreen;
