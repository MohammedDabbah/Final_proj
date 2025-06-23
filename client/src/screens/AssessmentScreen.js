import React, { useState, useContext } from 'react';
import { View, Text, TextInput, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Audio } from 'expo-av';
import aiApi from "../../api/aiApi"; // Import AI API setup
import serverApi from '../../api/serverApi';
import { AuthContext } from '../../Auth/AuthContext';
import { AI_API_KEY } from '../../api/config';
import FontAwesome from 'react-native-vector-icons/FontAwesome'; // Import FontAwesome library

const AssessmentScreen = ({ route, navigation }) => {
    const { questions } = route.params;
    const { user } = useContext(AuthContext); // Access user data from AuthContext
    const [responses, setResponses] = useState({});
    const [currentRecording, setCurrentRecording] = useState(null); // Stores the active recording object
    const [recordingIndex, setRecordingIndex] = useState(null); // Tracks which question is being recorded
    const [audioUri, setAudioUri] = useState({}); // Stores recorded file URIs
    const [loading, setLoading] = useState(false);
    const [permissionResponse, requestPermission] = Audio.usePermissions();

    // Start recording function
    const startRecording = async (index) => {
        try {
            if (!permissionResponse || permissionResponse.status !== 'granted') {
                alert("Please grant microphone permissions.");
                await requestPermission();
            }

            // If there's an active recording, stop it before starting a new one
            if (currentRecording) {
                await stopRecording();
            }

            await Audio.setAudioModeAsync({
                allowsRecordingIOS: true,
                playsInSilentModeIOS: true,
            });

            const { recording } = await Audio.Recording.createAsync(
                Audio.RecordingOptionsPresets.HIGH_QUALITY
            );

            setCurrentRecording(recording);
            setRecordingIndex(index);

        } catch (error) {
            console.error("❌ Error starting recording:", error);
            alert("Failed to start recording.");
        }
    };

    // Stop recording function
    const stopRecording = async () => {
        try {
            if (!currentRecording) {
                console.warn("⚠ No active recording to stop.");
                return;
            }

            await currentRecording.stopAndUnloadAsync();
            const uri = currentRecording.getURI();
            setAudioUri(prev => ({ ...prev, [recordingIndex]: uri }));
            setCurrentRecording(null);
            setRecordingIndex(null);

        } catch (error) {
            console.error("❌ Error stopping recording:", error);
        }
    };

    // Play recording function
    const playRecording = async (index) => {
        try {
            if (!audioUri[index]) {
                alert("No recording found!");
                return;
            }

            const { sound } = await Audio.Sound.createAsync({ uri: audioUri[index] });
            await sound.playAsync();
        } catch (error) {
            console.error("❌ Error playing audio:", error);
        }
    };

    // Delete recording function
    const deleteRecording = (index) => {
        setAudioUri(prev => {
            const newAudioUri = { ...prev };
            delete newAudioUri[index]; // Remove the specific recording URI for this index
            return newAudioUri;
        });
    };

    // Handle submit function
    const handleSubmit = async () => {
        setLoading(true);
        let speechEvaluations = [];
        let readingEvaluations = [];
        let totalScore = 0;
        let totalQuestions = 0;

        try {
            // Reading Responses
            for (const index in responses) {
                const userAnswer = responses[index];

                try {
                    const gptReadingResponse = await aiApi.post("/chat/completions", {
                        model: "gpt-4",
                        messages: [
                            { role: "system", content: "Evaluate reading comprehension. Provide a score (0-10) and feedback." },
                            { role: "user", content: userAnswer }
                        ],
                        temperature: 0.7,
                        max_tokens: 500,
                    });

                    const feedback = gptReadingResponse.data.choices[0].message.content;
                    const score = parseFloat(feedback.match(/\d+/)?.[0] || 0);

                    totalScore += score;
                    totalQuestions++;

                    readingEvaluations.push({ questionIndex: index, userAnswer, feedback, score });

                } catch (error) {
                    console.error("❌ Error evaluating reading:", error.response?.data || error);
                    alert("Reading evaluation failed.");
                    readingEvaluations.push({ questionIndex: index, error: "Reading evaluation failed." });
                }
            }

            // Speech Responses
            for (const index in audioUri) {
                const uri = audioUri[index];

                try {
                    const formData = new FormData();
                    formData.append("file", {
                        uri: uri,
                        type: "audio/m4a",
                        name: `speech_recording_${index}.m4a`,
                    });
                    formData.append("model", "whisper-1");
                    formData.append("language", "en");

                    const whisperResponse = await aiApi.post("/audio/transcriptions", formData, {
                        headers: {
                            "Authorization": `Bearer ${AI_API_KEY}`,
                            "Content-Type": "multipart/form-data",
                        },
                    });

                    const transcript = whisperResponse.data.text;

                    const gptSpeechResponse = await aiApi.post("/chat/completions", {
                        model: "gpt-4",
                        messages: [
                            { role: "system", content: "Evaluate pronunciation, fluency, and grammar. Provide a score (0-10) and feedback." },
                            { role: "user", content: transcript }
                        ],
                        temperature: 0.7,
                        max_tokens: 500,
                    });

                    const feedback = gptSpeechResponse.data.choices[0].message.content;
                    const score = parseFloat(feedback.match(/\d+/)?.[0] || 0);

                    totalScore += score;
                    totalQuestions++;

                    speechEvaluations.push({ questionIndex: index, transcript, feedback, score });

                } catch (error) {
                    console.error("❌ Error evaluating speech:", error.response?.data || error);
                    alert("Speech evaluation failed.");
                    speechEvaluations.push({ questionIndex: index, error: "Speech evaluation failed." });
                }
            }

            const averageScore = totalQuestions > 0 ? (totalScore / totalQuestions).toFixed(2) : 0;

            try {
                await serverApi.post("/userLevel-update", {
                    user,
                    score: averageScore
                }, { withCredentials: true });
            } catch (error) {
                console.error("❌ Error updating user level:", error.response?.data || error);
                alert("Failed to update user level.");
            }

            navigation.navigate("ResultsScreen", { 
                readingEvaluations: readingEvaluations || [], 
                speechEvaluations: speechEvaluations || [], 
                averageScore: averageScore || 0
            });

        } catch (error) {
            console.error("❌ Unexpected Error:", error);
            alert("An unexpected error occurred. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScrollView style={styles.container}>
            <Text style={styles.header}>Level Assessment</Text>

            {questions.map((question, index) => (
                <View key={index} style={styles.questionContainer}>
                    <Text style={styles.questionType}>{question.type.toUpperCase()}</Text>

                    {/* Reading Questions */}
                    {question.type === "reading" && question.prompt && (
                        <>
                            <Text style={styles.passage}>{question.prompt.passage}</Text>
                            <Text style={styles.question}>{question.prompt.question}</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Type your answer..."
                                value={responses[index] || ""}
                                onChangeText={(text) => setResponses({ ...responses, [index]: text })}
                            />
                        </>
                    )}

                    {/* Speaking Questions */}
                    {question.type === "speaking" && (
                        <>
                            <Text style={styles.question}>{question.prompt}</Text>
                            {audioUri[index] ? (
                                <>
                                    <TouchableOpacity style={styles.playButton} onPress={() => playRecording(index)}>
                                        <FontAwesome name="play-circle" size={24} color="#fff" />
                                        <Text style={styles.buttonText}>Play Recording</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity style={styles.deleteButton} onPress={() => deleteRecording(index)}>
                                        <FontAwesome name="trash" size={24} color="#fff" />
                                        <Text style={styles.buttonText}>Delete Recording</Text>
                                    </TouchableOpacity>
                                </>
                            ) : (
                                <TouchableOpacity
                                    style={recordingIndex === index ? styles.stopButton : styles.startButton}
                                    onPress={() => recordingIndex === index ? stopRecording() : startRecording(index)}
                                >
                                    <FontAwesome name={recordingIndex === index ? "stop-circle" : "microphone"} size={24} color="#fff" />
                                    <Text style={styles.buttonText}>
                                        {recordingIndex === index ? "Stop Recording" : "Start Recording"}
                                    </Text>
                                </TouchableOpacity>
                            )}
                        </>
                    )}
                </View>
            ))}

            {loading ? (
                <ActivityIndicator size="large" color="#6B5ECD" />
            ) : (
                <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
                    <Text style={styles.submitText}>Submit Assessment</Text>
                </TouchableOpacity>
            )}
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8F6FF',
        paddingHorizontal: 20,
        paddingTop: 20,
    },
    header: {
        fontSize: 28,
        fontWeight: '800',
        color: '#6B5ECD',
        textAlign: 'center',
        marginBottom: 24,
        letterSpacing: 1,
    },
    questionContainer: {
        backgroundColor: '#FFFFFF',
        padding: 20,
        borderRadius: 20,
        marginBottom: 20,
        borderWidth: 2,
        borderColor: '#F0EBFF',
        shadowColor: '#6B5ECD',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 6,
    },
    questionType: {
        fontSize: 16,
        fontWeight: '700',
        color: '#6B5ECD',
        marginBottom: 10,
    },
    question: {
        fontSize: 16,
        color: '#333',
        fontWeight: '600',
        marginBottom: 8,
    },
    passage: {
        fontSize: 14,
        color: '#6B5ECD',
        backgroundColor: '#F0EBFF',
        padding: 12,
        borderRadius: 12,
        marginBottom: 10,
        fontWeight: '500',
    },
    input: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        borderWidth: 2,
        borderColor: '#F0EBFF',
        paddingVertical: 14,
        paddingHorizontal: 16,
        fontSize: 16,
        fontWeight: '600',
        color: '#6B5ECD',
        shadowColor: '#6B5ECD',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    startButton: {
        backgroundColor: '#28a745', // Green for Start Recording
        paddingVertical: 14,
        borderRadius: 16,
        alignItems: 'center',
        marginTop: 12,
        flexDirection: 'row',
        justifyContent: 'center',
        shadowColor: '#28a745',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 6,
        elevation: 5,
    },
    stopButton: {
        backgroundColor: '#dc3545', // Red for Stop Recording
        paddingVertical: 14,
        borderRadius: 16,
        alignItems: 'center',
        marginTop: 12,
        flexDirection: 'row',
        justifyContent: 'center',
        shadowColor: '#dc3545',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 6,
        elevation: 5,
    },
    playButton: {
        backgroundColor: '#6B5ECD',
        paddingVertical: 14,
        borderRadius: 16,
        alignItems: 'center',
        marginTop: 12,
        flexDirection: 'row',
        justifyContent: 'center',
        shadowColor: '#6B5ECD',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
        elevation: 5,
    },
    deleteButton: {
        backgroundColor: '#dc3545', // Red for delete button
        paddingVertical: 14,
        borderRadius: 16,
        alignItems: 'center',
        marginTop: 12,
        flexDirection: 'row',
        justifyContent: 'center',
        shadowColor: '#dc3545',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 6,
        elevation: 5,
    },
    buttonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
        marginLeft: 8,
    },
    submitButton: {
        backgroundColor: '#6B5ECD',
        paddingVertical: 16,
        borderRadius: 20,
        alignItems: 'center',
        marginTop: 30,
        marginBottom: 40,
        shadowColor: '#6B5ECD',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 8,
    },
    submitText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '800',
        letterSpacing: 0.5,
    },
});

export default AssessmentScreen;
