import React, { useContext, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import serverApi from '../../api/serverApi';
import { AuthContext } from "../../Auth/AuthContext";
import { CommonActions } from '@react-navigation/native';
import aiApi from "../../api/aiApi"; // Import AI API setup

const LevelSelectionScreen = ({ navigation }) => {
    const { user, updateUser } = useContext(AuthContext);
    const [loading, setLoading] = useState(false);

    const handleTakeQuiz = async () => {
        setLoading(true);
        try {
            const response = await aiApi.post(
                '/chat/completions',
                {
                    model: "gpt-4",
                    messages: [
                        { 
                            role: "system",
                            content: `Generate 6 English assessment questions with 3 different levels:
                            - 2 questions for each level (beginner, intermediate, advanced).
                            - Each level should include:
                              1. A reading comprehension question (with a short passage).
                              2. A speaking question.
    
                            Return the response in JSON format:
                            {
                                "questions": [
                                    { "level": "beginner", "type": "reading", "prompt": { "passage": "...", "question": "..." } },
                                    { "level": "beginner", "type": "speaking", "prompt": "..." },
                                    
                                    { "level": "intermediate", "type": "reading", "prompt": { "passage": "...", "question": "..." } },
                                    { "level": "intermediate", "type": "speaking", "prompt": "..." },
    
                                    { "level": "advanced", "type": "reading", "prompt": { "passage": "...", "question": "..." } },
                                    { "level": "advanced", "type": "speaking", "prompt": "..." }
                                ]
                            }`
                        }
                    ],
                    temperature: 0.7,
                    max_tokens: 700
                },
            );
    
            const responseData = response.data.choices[0].message.content;
            const parsedData = JSON.parse(responseData);
    
            console.log("✅ Generated Questions:", parsedData);
    
            // ✅ Send ONLY the `questions` array
            navigation.navigate('AssessmentScreen', { questions: parsedData.questions });
    
        } catch (error) {
            console.error("❌ Error fetching assessment questions:", error.response?.data || error);
            alert("Failed to generate assessment questions. Please try again.");
        } finally {
            setLoading(false);
        }
    };
    
    const handleSkipQuiz = async () => {
        try {
            // ✅ Ensure userLevel updates properly
            const response = await serverApi.post('/userLevel-update', { user, score: 0 }, { withCredentials: true });
    
            console.log("✅ User Level Updated:", response.data);
    
            // ✅ Update AuthContext so PrivateNavigator re-renders
            updateUser({ evaluate: true });
    
            // ✅ Use `setTimeout` to delay navigation slightly
            setTimeout(() => {
                console.log("🔄 Navigating to Home...");
                navigation.dispatch(
                    CommonActions.reset({
                        index: 0,
                        routes: [{ name: user?.role === 'teacher' ? 'TeacherHome' : 'StudentHome' }],
                    })
                );
            }, 500);
        } catch (err) {
            console.error("❌ Error updating user level:", err);
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.header}>Welcome!</Text>
            <Text style={styles.subHeader}>
                Would you like to take a quiz to determine your level, or start as a beginner?
            </Text>

            {loading ? (
                <ActivityIndicator size="large" color="#6B5ECD" />
            ) : (
                <>
                    <TouchableOpacity style={styles.button} onPress={handleTakeQuiz}>
                        <Text style={styles.buttonText}>Take Level Assessment</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={[styles.button, styles.skipButton]} onPress={handleSkipQuiz}>
                        <Text style={styles.buttonText}>Continue as Beginner</Text>
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
        paddingHorizontal: 20,
        paddingTop: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    header: {
        fontSize: 30,
        fontWeight: '700',
        color: '#6B5ECD',
        marginBottom: 15,
        textAlign: 'center',
    },
    subHeader: {
        fontSize: 18,
        color: '#555',
        textAlign: 'center',
        marginBottom: 40,
        paddingHorizontal: 30,
        lineHeight: 24,
    },
    button: {
        backgroundColor: '#6B5ECD',
        paddingVertical: 15,
        paddingHorizontal: 40,
        borderRadius: 25,
        marginBottom: 15,
        width: '90%',
        alignItems: 'center',
        shadowColor: '#6B5ECD',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
        elevation: 6,
    },
    skipButton: {
        backgroundColor: '#FF8C69',
    },
    buttonText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '700',
        textAlign: 'center',
    },
});

export default LevelSelectionScreen;
