import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  SafeAreaView,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import serverApi from '../../api/serverApi';
import aiApi from '../../api/aiApi';

const ActivityScreen = () => {
  const [activities, setActivities] = useState([]);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [currentActivity, setCurrentActivity] = useState(null);
  const [currentTaskIndex, setCurrentTaskIndex] = useState(0);
  const [recording, setRecording] = useState(null);
  const [audioUri, setAudioUri] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [hasMicPermission, setHasMicPermission] = useState(false);

  useEffect(() => {
    const requestPermission = async () => {
        const { status } = await Audio.requestPermissionsAsync();
        setHasMicPermission(status === 'granted');
    };
    requestPermission();
    }, []);

  // Fetch activities on mount
  useEffect(() => {
    const fetchActivities = async () => {
      try {
        const res = await serverApi.get('/api/activities/student', { withCredentials: true });
        setActivities(res.data);
      } catch (err) {
        console.error('Error fetching student activities:', err);
        Alert.alert('Error', 'Could not load activities.');
      } finally {
        setLoading(false);
      }
    };

    fetchActivities();
  }, []);

  // ========================
  // Audio Recording Handlers
  // ========================

 const startRecording = async () => {
  try {
    if (!hasMicPermission) {
      Alert.alert("Permission Required", "Microphone access is needed to record.");
      return;
    }

    if (recording) {
      await recording.stopAndUnloadAsync();
      setRecording(null);
    }

    await Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      playsInSilentModeIOS: true,
      shouldDuckAndroid: true,
    });

    const recordingObject = new Audio.Recording();
    await recordingObject.prepareToRecordAsync(Audio.RECORDING_OPTIONS_PRESET_HIGH_QUALITY);
    await recordingObject.startAsync();

    setRecording(recordingObject);
    setIsRecording(true);
  } catch (error) {
    console.error("Recording Start Error:", error);
    Alert.alert("Error", `Could not start recording: ${error.message}`);
  }
};

const stopRecording = async () => {
  try {
    if (!recording) return;

    await recording.stopAndUnloadAsync();
    const uri = recording.getURI();

    setRecording(null);
    setIsRecording(false);

    if (!uri) {
      Alert.alert("Error", "Recording file is missing.");
      return;
    }

    setAudioUri(uri); // make sure this is set before AI call
    await sendAudioToAI(uri);
  } catch (error) {
    console.error("Recording Stop Error:", error);
    Alert.alert("Error", "Could not stop recording.");
  }
};

const deleteRecording = async () => {
  try {
    if (audioUri) {
      await FileSystem.deleteAsync(audioUri, { idempotent: true });
      setAudioUri(null);
    }
  } catch (err) {
    console.error("Failed to delete audio:", err);
  }
};

// SEND AUDIO TO OPENAI WHISPER
const sendAudioToAI = async (uri) => {
  if (isSending) return;
  setIsSending(true);

  try {
    const formData = new FormData();
    formData.append("file", {
      uri,
      type: "audio/m4a",
      name: "recording.m4a",
    });
    formData.append("model", "whisper-1");
    formData.append("language", "en");  // Force English transcription ✅

    const res = await aiApi.post("/audio/transcriptions", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    if (res.data?.text) {
      setAnswers((prev) => ({
        ...prev,
        [currentActivity._id]: {
          ...(prev[currentActivity._id] || {}),
          [currentTaskIndex]: res.data.text,
        },
      }));
    } else {
      Alert.alert("Error", "No transcription received.");
    }
  } catch (err) {
    console.error("Transcription error:", err);
    Alert.alert("Error", "Failed to transcribe audio.");
  } finally {
    setIsSending(false);
  }
};

  // ========================
  // UI + Logic Helpers
  // ========================

  const handleInputChange = (activityId, taskIndex, text) => {
    setAnswers((prev) => ({
      ...prev,
      [activityId]: {
        ...(prev[activityId] || {}),
        [taskIndex]: text,
      },
    }));
  };

  const handleSubmitAnswers = async (activityId) => {
  const currentAnswers = answers[activityId] || {};
  const hasContent = Object.values(currentAnswers).some((val) => val?.trim());
  if (!hasContent) {
    Alert.alert('Empty', 'Please complete at least one task.');
    return;
  }

  try {
    await serverApi.post('/api/activities/answers', {
      activityId,
      responses: currentAnswers,
    }, { withCredentials: true });

    Alert.alert('Submitted!', 'Your answers have been saved.');
    setCurrentActivity(null);
    setCurrentTaskIndex(0);
    setAudioUri(null);
  } catch (err) {
    console.error('Submission error:', err);
    Alert.alert('Error', 'Could not submit answers.');
  }
};

  const shouldDisableNext = () => {
    const skill = currentActivity.skill;
    const val = answers[currentActivity._id]?.[currentTaskIndex];
    return skill === 'writing' ? !val?.trim() : skill === 'reading' ? !audioUri : false;
  };

  // ========================
  // Render Logic
  // ========================

  const renderActivityList = () => (
    <View style={styles.activitiesContainer}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Activities</Text>
      </View>
      
      {activities.length === 0 ? (
        <View style={styles.emptyState}>
          <Icon name="book" size={40} color="#CCCCCC" />
          <Text style={styles.emptyStateText}>No activities assigned yet</Text>
          <Text style={styles.emptyStateSubtext}>Check back later for new assignments</Text>
        </View>
      ) : (
        <ScrollView style={styles.activitiesList}>
          {activities.map((activity) => (
            <TouchableOpacity
              key={activity._id}
              style={styles.activityCard}
              onPress={() => setCurrentActivity(activity)}
              activeOpacity={0.8}
            >
              <View style={styles.activityIconContainer}>
                <Icon name="book" size={20} color="#6B5ECD" />
              </View>
              <View style={styles.activityContent}>
                <Text style={styles.activityTitle}>{activity.title}</Text>
                <Text style={styles.activityDescription}>{activity.description}</Text>
                <View style={styles.activityMeta}>
                  <View style={styles.activityBadge}>
                    <Text style={styles.activityBadgeText}>
                      {activity.type === 'word' ? 'Word Practice' : 'Sentence Practice'}
                    </Text>
                  </View>
                  <Text style={styles.activityTaskCount}>
                    {activity.tasks?.length || 0} tasks
                  </Text>
                </View>
              </View>
              <Icon name="chevron-right" size={16} color="#CCCCCC" />
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </View>
  );

   useEffect(() => {
      if (currentActivity && answers[currentActivity._id]) {
        const existing = answers[currentActivity._id][currentTaskIndex];
        setAudioUri(existing?.audioUri || null);
      }
    }, [currentTaskIndex, currentActivity]);

  const renderCurrentTask = () => {
    const task = currentActivity.tasks[currentTaskIndex];
    const activityId = currentActivity._id;
    const isSubmitted = currentActivity.alreadySubmitted;

    if (isSubmitted) {
      return (
        <View style={styles.taskContainer}>
          <View style={styles.taskHeader}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => {
                setCurrentActivity(null);
                setCurrentTaskIndex(0);
              }}
              activeOpacity={0.8}
            >
              <Icon name="arrow-left" size={16} color="#6B5ECD" />
            </TouchableOpacity>
            <Text style={styles.taskHeaderTitle}>Completed Activity</Text>
            <View style={styles.placeholder} />
          </View>

          <ScrollView style={styles.feedbackContainer}>
            {currentActivity.tasks.map((task, index) => (
              <View key={index} style={styles.feedbackCard}>
                <Text style={styles.feedbackTaskNumber}>Task {index + 1}</Text>
                <Text style={styles.feedbackPrompt}>{task.prompt}</Text>

                <View style={styles.feedbackSection}>
                  <Text style={styles.feedbackLabel}>Your Answer:</Text>
                  <Text style={styles.feedbackAnswer}>
                    {currentActivity.responses?.[index] || 'No answer provided'}
                  </Text>
                </View>

                <View style={styles.feedbackSection}>
                  <Text style={styles.feedbackLabel}>Feedback:</Text>
                  <Text style={styles.feedbackText}>
                    {currentActivity.feedback?.[index] || 'No feedback available yet'}
                  </Text>
                </View>
              </View>
            ))}
          </ScrollView>
        </View>
      );
    }

    return (
      <View style={styles.taskContainer}>
        <View style={styles.taskHeader}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => {
              setCurrentActivity(null);
              setCurrentTaskIndex(0);
            }}
            activeOpacity={0.8}
          >
            <Icon name="arrow-left" size={16} color="#6B5ECD" />
          </TouchableOpacity>
          <Text style={styles.taskHeaderTitle}>{currentActivity.title}</Text>
          <View style={styles.placeholder} />
        </View>

        <View style={styles.progressContainer}>
          <Text style={styles.progressText}>
            Task {currentTaskIndex + 1} of {currentActivity.tasks.length}
          </Text>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill, 
                { width: `${((currentTaskIndex + 1) / currentActivity.tasks.length) * 100}%` }
              ]} 
            />
          </View>
        </View>

        <ScrollView style={styles.taskContent}>
          <View style={styles.taskPromptCard}>
            <Text style={styles.taskPromptLabel}>Task Prompt</Text>
            <Text style={styles.taskPromptText}>{task.prompt}</Text>
          </View>

          {currentActivity.type === 'word' && task.expectedAnswer && (
            <View style={styles.definitionCard}>
              <Text style={styles.definitionLabel}>Definition</Text>
              <Text style={styles.definitionText}>{task.expectedAnswer}</Text>
            </View>
          )}

          {currentActivity.skill === 'writing' && (
            <View style={styles.inputCard}>
              <Text style={styles.inputLabel}>Your Answer</Text>
              <TextInput
                style={styles.answerInput}
                placeholder="Type your answer here..."
                placeholderTextColor="#999999"
                value={answers[activityId]?.[currentTaskIndex] || ''}
                onChangeText={(text) => handleInputChange(activityId, currentTaskIndex, text)}
                multiline
              />
            </View>
          )}

          {currentActivity.skill === 'reading' && (
            <>
              <View style={styles.transcriptionCard}>
                <Text style={styles.transcriptionLabel}>AI Transcription</Text>
                <Text style={styles.transcriptionText}>
                  {answers[activityId]?.[currentTaskIndex] || 'No transcription yet. Record your voice to see the text here.'}
                </Text>
              </View>

              <View style={styles.audioControlsContainer}>
                <View style={styles.recordingSection}>
                  <TouchableOpacity
                    style={[styles.recordButton, isRecording && styles.recordingButton]}
                    onPress={isRecording ? stopRecording : startRecording}
                    activeOpacity={0.8}
                  >
                    <Icon 
                      name={isRecording ? "stop" : "microphone"} 
                      size={16} 
                      color="#FFFFFF" 
                    />
                    <Text style={styles.recordButtonText}>
                      {isRecording ? 'Stop Recording' : 'Start Recording'}
                    </Text>
                  </TouchableOpacity>

                  {audioUri && (
                    <View style={styles.audioActions}>
                      <TouchableOpacity
                        style={styles.playButton}
                        onPress={async () => {
                          try {
                            const { sound } = await Audio.Sound.createAsync({ uri: audioUri });
                            await sound.playAsync();
                          } catch (e) {
                            console.error('Playback failed:', e);
                            Alert.alert('Error', 'Could not play recording.');
                          }
                        }}
                        activeOpacity={0.8}
                      >
                        <Icon name="play" size={14} color="#6B5ECD" />
                        <Text style={styles.playButtonText}>Play</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.deleteButton}
                        onPress={deleteRecording}
                        activeOpacity={0.8}
                      >
                        <Icon name="trash" size={14} color="#F44336" />
                        <Text style={styles.deleteButtonText}>Delete</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              </View>
            </>
          )}
        </ScrollView>

        <View style={styles.navigationContainer}>
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => {
              if (currentTaskIndex > 0) {
                setCurrentTaskIndex((prev) => prev - 1);
              } else {
                setCurrentActivity(null);
                setCurrentTaskIndex(0);
              }
            }}
            activeOpacity={0.8}
          >
            <Text style={styles.secondaryButtonText}>
              {currentTaskIndex > 0 ? 'Previous' : 'Back'}
            </Text>
          </TouchableOpacity>

          {currentTaskIndex < currentActivity.tasks.length - 1 ? (
            <TouchableOpacity
              style={[
                styles.primaryButton,
                shouldDisableNext() && styles.disabledButton
              ]}
              disabled={shouldDisableNext()}
              onPress={() => {
                if (shouldDisableNext()) {
                  Alert.alert('Incomplete', 'Complete the task before continuing.');
                } else {
                  setCurrentTaskIndex((prev) => prev + 1);
                }
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.primaryButtonText}>Next</Text>
              <Icon name="arrow-right" size={14} color="#FFFFFF" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.submitButton}
              onPress={() => handleSubmitAnswers(currentActivity._id)}
              activeOpacity={0.8}
            >
              <Icon name="check" size={14} color="#FFFFFF" />
              <Text style={styles.submitButtonText}>Submit</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6B5ECD" />
          <Text style={styles.loadingText}>Loading activities...</Text>
        </View>
      ) : (
        currentActivity ? renderCurrentTask() : renderActivityList()
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666666',
  },
  activitiesContainer: {
    flex: 1,
    paddingTop: 50,
  },
  header: {
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333333',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666666',
    marginTop: 16,
    textAlign: 'center',
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#999999',
    marginTop: 8,
    textAlign: 'center',
  },
  activitiesList: {
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  activityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#6B5ECD',
  },
  activityIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 4,
  },
  activityDescription: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 8,
    lineHeight: 20,
  },
  activityMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  activityBadge: {
    backgroundColor: '#6B5ECD',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  activityBadgeText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  activityTaskCount: {
    fontSize: 12,
    color: '#999999',
  },
  taskContainer: {
    flex: 1,
    paddingTop: 50,
  },
  taskHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  backButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F8F8F8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  taskHeaderTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
  },
  placeholder: {
    width: 32,
  },
  progressContainer: {
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  progressText: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 8,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#F0F0F0',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#6B5ECD',
    borderRadius: 2,
  },
  taskContent: {
    flex: 1,
    paddingHorizontal: 24,
  },
  taskPromptCard: {
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  taskPromptLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666666',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  taskPromptText: {
    fontSize: 16,
    color: '#333333',
    lineHeight: 24,
  },
  definitionCard: {
    backgroundColor: '#F0F8FF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#6B5ECD',
  },
  definitionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B5ECD',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  definitionText: {
    fontSize: 14,
    color: '#333333',
    lineHeight: 20,
  },
  inputCard: {
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666666',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  answerInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#333333',
    minHeight: 80,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  transcriptionCard: {
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  transcriptionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666666',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  transcriptionText: {
    fontSize: 14,
    color: '#333333',
    lineHeight: 20,
    fontStyle: 'italic',
  },
  audioControlsContainer: {
    marginBottom: 16,
  },
  recordingSection: {
    gap: 12,
  },
  recordButton: {
    backgroundColor: '#6B5ECD',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  recordingButton: {
    backgroundColor: '#F44336',
  },
  recordButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  audioActions: {
    flexDirection: 'row',
    gap: 8,
  },
  playButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8F8F8',
    paddingVertical: 10,
    borderRadius: 6,
    gap: 6,
  },
  playButtonText: {
    color: '#6B5ECD',
    fontSize: 14,
    fontWeight: '500',
  },
  deleteButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8F8F8',
    paddingVertical: 10,
    borderRadius: 6,
    gap: 6,
  },
  deleteButtonText: {
    color: '#F44336',
    fontSize: 14,
    fontWeight: '500',
  },
  navigationContainer: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingVertical: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  primaryButton: {
    flex: 1,
    backgroundColor: '#6B5ECD',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 6,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: '#F8F8F8',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
  },
  secondaryButtonText: {
    color: '#666666',
    fontSize: 14,
    fontWeight: '500',
  },
  submitButton: {
    flex: 1,
    backgroundColor: '#4CAF50',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 6,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  disabledButton: {
    backgroundColor: '#E0E0E0',
  },
  feedbackContainer: {
    flex: 1,
    paddingHorizontal: 24,
  },
  feedbackCard: {
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  feedbackTaskNumber: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B5ECD',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  feedbackPrompt: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 12,
  },
  feedbackSection: {
    marginBottom: 12,
  },
  feedbackLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666666',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  feedbackAnswer: {
    fontSize: 14,
    color: '#333333',
    lineHeight: 20,
  },
  feedbackText: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
    fontStyle: 'italic',
  },
});

export default ActivityScreen;