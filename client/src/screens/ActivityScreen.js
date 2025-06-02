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
    activities.length === 0 ? (
      <Text style={styles.noTasks}>No tasks assigned yet.</Text>
    ) : (
      activities.map((activity) => (
        <TouchableOpacity
          key={activity._id}
          style={styles.mainCard}
          onPress={() => setCurrentActivity(activity)}
        >
          <View style={styles.iconCircle}>
            <Icon name="book" size={20} color="#fff" />
          </View>
          <Text style={styles.mainCardTitle}>{activity.title}</Text>
          <Text style={styles.descriptionText}>{activity.description}</Text>
        </TouchableOpacity>
      ))
    )
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
      <>
      {currentActivity.tasks.map((task, index) => (
        <View key={index} style={styles.taskCard}>
          <Text style={styles.taskPrompt}>Task {index + 1}: {task.prompt}</Text>

          <Text style={{ marginTop: 10, fontWeight: 'bold' }}>Your answer:</Text>
          <Text style={{ color: '#333' }}>
            {currentActivity.responses?.[index] || '—'}
          </Text>

          <Text style={{ marginTop: 10, fontWeight: 'bold' }}>Feedback:</Text>
          <Text style={{ color: '#666' }}>
            {currentActivity.feedback?.[index] || 'No feedback yet.'}
          </Text>
        </View>
      ))}

      <TouchableOpacity
            style={[styles.sideButton, styles.skipButton,{marginLeft:'20',marginBottom:'20'}]}
            onPress={() => {
              setCurrentActivity(null);
              setCurrentTaskIndex(0);
            }}
          >
            <Text style={styles.buttonText}>Back to Activities</Text>
          </TouchableOpacity>
            </>
    );
  }

  return (
    <View style={styles.descriptionContainer}>
      <Text style={styles.descriptionTitle}>
        Task {currentTaskIndex + 1} of {currentActivity.tasks.length}
      </Text>

      <View style={styles.taskCard}>
        <Text style={styles.taskPrompt}>{task.prompt}</Text>

        {currentActivity.skill === 'writing' && (
          <TextInput
            style={styles.answerInput}
            placeholder="Your answer"
            value={answers[activityId]?.[currentTaskIndex] || ''}
            onChangeText={(text) => handleInputChange(activityId, currentTaskIndex, text)}
          />
        )}
      </View>

      {currentActivity.type === 'word' && (
        <View style={{ marginTop: 10, padding: 10, backgroundColor: '#f4f4f4', borderRadius: 8 }}>
          <Text style={{ fontWeight: '600', marginBottom: 6 }}>Definition:</Text>
          <Text>{task.expectedAnswer || '—'}</Text>
        </View>
      )}

      {currentActivity.skill === 'reading' && (
        <>
          <View style={{
            backgroundColor: '#F4F4F4',
            borderRadius: 12,
            padding: 12,
            marginTop: 12,
          }}>
            <Text style={{ fontWeight: 'bold', marginBottom: 4 }}>AI Transcription</Text>
            <Text style={{ color: '#555' }}>
              {answers[activityId]?.[currentTaskIndex] || 'No transcription yet.'}
            </Text>
          </View>

          <View style={{ marginTop: 30 }}>
            <View style={styles.sideBySideButtons}>
              <TouchableOpacity
                style={[styles.sideButton, isRecording ? styles.stopRecordButton : styles.recordButton]}
                onPress={isRecording ? stopRecording : startRecording}
              >
                <Text style={styles.buttonText}>
                  {isRecording ? 'Stop Recording' : 'Start Recording'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.sideButton, { backgroundColor: 'red' }]}
                onPress={deleteRecording}
              >
                <Text style={styles.audioButtonText}>Delete</Text>
                <Icon name="trash" size={16} color="#fff" style={styles.buttonIcon} />
              </TouchableOpacity>
            </View>

            {audioUri && (
              <TouchableOpacity
                style={[styles.audioButton, !audioUri && { opacity: 0.6 }]}
                onPress={async () => {
                  if (!audioUri) return;
                  try {
                    const { sound } = await Audio.Sound.createAsync({ uri: audioUri });
                    await sound.playAsync();
                  } catch (e) {
                    console.error('Playback failed:', e);
                    Alert.alert('Error', 'Could not play recording.');
                  }
                }}
                disabled={!audioUri}
              >
                <Text style={styles.audioButtonText}>Play Recording</Text>
                <Icon name="play" size={16} color="#fff" style={styles.buttonIcon} />
              </TouchableOpacity>
            )}
          </View>
        </>
      )}

      <View style={styles.sideBySideButtons}>
        {currentTaskIndex > 0 ? (
          <TouchableOpacity
            style={[styles.sideButton, styles.skipButton]}
            onPress={() => setCurrentTaskIndex((prev) => prev - 1)}
          >
            <Text style={styles.buttonText}>Previous</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.sideButton, styles.skipButton]}
            onPress={() => {
              setCurrentActivity(null);
              setCurrentTaskIndex(0);
            }}
          >
            <Text style={styles.buttonText}>Back to Activities</Text>
          </TouchableOpacity>
        )}

        {currentTaskIndex < currentActivity.tasks.length - 1 ? (
          <TouchableOpacity
            style={[
              styles.sideButton,
              styles.recordButton,
              { opacity: shouldDisableNext() ? 0.2 : 1 },
              { backgroundColor: 'blue' },
            ]}
            disabled={shouldDisableNext()}
            onPress={() => {
              if (shouldDisableNext()) {
                Alert.alert('Incomplete', 'Complete the task before continuing.');
              } else {
                setCurrentTaskIndex((prev) => prev + 1);
              }
            }}
          >
            <Text style={styles.buttonText}>Next</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.sideButton, styles.audioButton]}
            onPress={() => handleSubmitAnswers(currentActivity._id)}
          >
            <Text style={styles.audioButtonText}>Submit</Text>
            <Icon name="send" size={16} color="#fff" style={styles.buttonIcon} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

  return loading ? (
    <View style={styles.loaderContainer}>
      <ActivityIndicator size="large" color="#B052F7" />
    </View>
  ) : (
    <ScrollView style={styles.container}>
      <View style={styles.decorativeCirclesContainer}>
        <View style={styles.decorativeCircle1} />
        <View style={styles.decorativeCircle2} />
        <View style={styles.decorativeCircle3} />
      </View>
      {currentActivity ? renderCurrentTask() : renderActivityList()}
    </ScrollView>
  );
};



const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
    paddingTop: 40,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noTasks: {
    textAlign: 'center',
    marginTop: 80,
    fontSize: 18,
    color: '#999',
  },
  mainCard: {
    backgroundColor: '#6C63FF',
    borderRadius: 20,
    marginHorizontal: 20,
    marginVertical: 10,
    padding: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#4B47C2',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    top: -24,
    left: 20,
    elevation: 4,
  },
  mainCardTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 10,
    marginTop: 20,
  },
  descriptionText: {
    color: '#E5E5E5',
    fontSize: 15,
  },
  descriptionContainer: {
    marginHorizontal: 20,
    marginTop: 60,
  },
  descriptionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  taskCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    elevation: 3,
  },
  taskPrompt: {
    fontSize: 17,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  answerInput: {
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    backgroundColor: '#F2F2F2',
  },
  audioButton: {
    backgroundColor: '#6C63FF',
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 12,
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
  },
  audioButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonIcon: {
    marginLeft: 8,
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 30,
  },
  recordButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 14,
    borderRadius: 12,
    width: '48%',
    alignItems: 'center',
  },
  stopRecordButton: {
    backgroundColor: '#FF4D4D',
    paddingVertical: 14,
    borderRadius: 12,
    width: '48%',
    alignItems: 'center',
  },
  skipButton: {
    backgroundColor: '#999999',
    paddingVertical: 14,
    borderRadius: 12,
    width: '48%',
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  decorativeCirclesContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 150,
  },
  decorativeCircle1: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#FDCB6E',
    top: 10,
    right: 20,
    opacity: 0.7,
  },
  decorativeCircle2: {
    position: 'absolute',
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#74B9FF',
    top: 60,
    right: 90,
    opacity: 0.5,
  },
  decorativeCircle3: {
    position: 'absolute',
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#E17055',
    top: 40,
    right: 60,
    opacity: 0.7,
  },
  sideBySideButtons: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  gap: 10,
  marginTop: 20,
},
sideButton: {
  flex: 1,
  paddingVertical: 14,
  borderRadius: 12,
  alignItems: 'center',
  flexDirection: 'row',
  justifyContent: 'center',
},

});

export default ActivityScreen;
