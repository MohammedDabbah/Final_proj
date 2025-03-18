import React, { useState ,useContext } from 'react';
import { View, Text, TextInput, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Audio } from 'expo-av';
import aiApi from "../../api/aiApi"; // Import AI API setup
import serverApi from '../../api/serverApi';
import { AuthContext } from '../../Auth/AuthContext';
import { AI_API_KEY } from '../../api/config';


const AssessmentScreen = ({ route, navigation }) => {
    const { questions } = route.params;
    const { user } = useContext(AuthContext); // Access user data from AuthContext
    const [responses, setResponses] = useState({});
    const [currentRecording, setCurrentRecording] = useState(null); // Stores the active recording object
    const [recordingIndex, setRecordingIndex] = useState(null); // Tracks which question is being recorded
    const [audioUri, setAudioUri] = useState({}); // Stores recorded file URIs
    const [loading, setLoading] = useState(false);
    const [permissionResponse, requestPermission] = Audio.usePermissions();

    // ✅ FIXED: `currentRecording` now correctly stores the actual recording object
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

            console.log(`🎤 Starting recording for question ${index}...`);
            const { recording } = await Audio.Recording.createAsync(
                Audio.RecordingOptionsPresets.HIGH_QUALITY
            );

            setCurrentRecording(recording); // ✅ Store the recording object
            setRecordingIndex(index); // ✅ Store which question is being recorded

        } catch (error) {
            console.error("❌ Error starting recording:", error);
            alert("Failed to start recording.");
        }
    };

    const stopRecording = async () => {
        try {
            if (!currentRecording) {
                console.warn("⚠ No active recording to stop.");
                return;
            }

            console.log(`🛑 Stopping recording...`);
            await currentRecording.stopAndUnloadAsync();
            const uri = currentRecording.getURI();
            console.log(`✅ Recording stopped and stored at ${uri}`);

            setAudioUri(prev => ({ ...prev, [recordingIndex]: uri })); // ✅ Store the URI for the correct question
            setCurrentRecording(null); // ✅ Reset the recording object
            setRecordingIndex(null); // ✅ Clear recording index

        } catch (error) {
            console.error("❌ Error stopping recording:", error);
        }
    };

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

    const handleSubmit = async () => {
        setLoading(true);
        let speechEvaluations = [];
        let readingEvaluations = [];
        let totalScore = 0;
        let totalQuestions = 0;
    
        try {
            // ✅ Process Reading Responses
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
                    alert("Reading evaluation failed. Try again.");
                    readingEvaluations.push({ questionIndex: index, error: "Reading evaluation failed." });
                }
            }
    
            // ✅ Process Speech Responses (as before)
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
    
                    const whisperResponse = await aiApi.post("/audio/transcriptions", formData, {
                        headers: {
                            "Authorization": `Bearer ${AI_API_KEY}`,
                            "Content-Type": "multipart/form-data",
                        },
                    });
    
                    const transcript = whisperResponse.data.text;
                    console.log("✅ Transcription success:", transcript);
    
                    // 🎙 Evaluate Speech
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
    
            // 🎯 Calculate Average Score
            const averageScore = totalQuestions > 0 ? (totalScore / totalQuestions).toFixed(2) : 0;
    
            // ✅ Send to Backend Even if Partial Evaluations Succeeded
            try {
                await serverApi.post("/userLevel-update", {
                    user,
                    score: averageScore
                }, { withCredentials: true });
            } catch (error) {
                console.error("❌ Error updating user level:", error.response?.data || error);
                alert("Failed to update user level.");
            }
    
            // ✅ Navigate to ResultsScreen
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

                   {/* ✅ Fixed Reading Questions (Passage + Input) */}
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

                   {/* ✅ Speaking Questions */}
                   {question.type === "speaking" && (
                        <>
                            <Text style={styles.question}>{question.prompt}</Text>
                            {audioUri[index] ? (
                                <TouchableOpacity style={styles.playButton} onPress={() => playRecording(index)}>
                                    <Text style={styles.buttonText}>🎧 Play Recording</Text>
                                </TouchableOpacity>
                            ) : (
                                <TouchableOpacity
                                    style={styles.recordButton}
                                    onPress={() => recordingIndex === index ? stopRecording() : startRecording(index)}
                                >
                                    <Text style={styles.buttonText}>
                                        {recordingIndex === index ? "🛑 Stop Recording" : "🎤 Start Recording"}
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
        fontSize: 24,
        fontWeight: 'bold',
        color: '#6B5ECD',
        textAlign: 'center',
        marginBottom: 20,
    },
    questionContainer: {
        backgroundColor: '#fff',
        padding: 15,
        borderRadius: 10,
        marginBottom: 10,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    questionType: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#6B5ECD',
    },
    input: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 8,
        padding: 10,
        marginTop: 10,
        backgroundColor: '#fff',
    },
    recordButton: {
        backgroundColor: '#FF8C69',
        paddingVertical: 12,
        borderRadius: 10,
        alignItems: 'center',
        marginTop: 10,
    },
    playButton: {
        backgroundColor: '#6B5ECD',
        paddingVertical: 12,
        borderRadius: 10,
        alignItems: 'center',
        marginTop: 10,
    },
    buttonText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
    submitButton: {
        backgroundColor: '#6B5ECD',
        paddingVertical: 15,
        borderRadius: 10,
        alignItems: 'center',
        marginTop: 20,
        marginBottom: 30,
    },
    submitText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
});

export default AssessmentScreen;
