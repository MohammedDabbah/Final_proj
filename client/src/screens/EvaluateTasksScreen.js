import React, { useEffect, useState } from 'react';
import {
  View, Text, TextInput, ScrollView,
  StyleSheet, TouchableOpacity, ActivityIndicator, Alert
} from 'react-native';
import serverApi from '../../api/serverApi';

const EvaluateTasksScreen = ({ route }) => {
  const [answers, setAnswers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [feedbacks, setFeedbacks] = useState({}); // { answerId: { taskIndex: feedback } }
  const { activityId } = route.params;
  const [submittedFeedbacks, setSubmittedFeedbacks] = useState({}); 

  useEffect(() => {
    const fetchAnswers = async () => {
      try {
        const res = await serverApi.get(`/api/activities/${activityId}/answers`, { withCredentials: true });
        setAnswers(res.data);
        const initialFeedbacks = {};
        res.data.forEach((answer) => {
          initialFeedbacks[answer._id] = {};
          answer.responses.forEach((resp) => {
            if (resp.feedback) {
              initialFeedbacks[answer._id][resp.taskIndex] = resp.feedback;
            }
          });
        });
        setFeedbacks(initialFeedbacks);
      } catch (err) {
        console.error(err);
        Alert.alert('Error', 'Could not load answers.');
      } finally {
        setLoading(false);
      }
    };
    fetchAnswers();
  }, []);

  const handleFeedbackChange = (answerId, taskIndex, text) => {
    setFeedbacks(prev => ({
      ...prev,
      [answerId]: {
        ...(prev[answerId] || {}),
        [taskIndex]: text
      }
    }));
  };

  const submitFeedback = async (answerId) => {
    const feedbackData = feedbacks[answerId] || {};
    const hasText = Object.values(feedbackData).some(val => val && val.trim());
    if (!hasText) {
      Alert.alert('Empty Feedback', 'Please enter at least one feedback item.');
      return;
    }

    try {
      await serverApi.patch(`/api/activities/${answerId}/feedback`, { feedbacks: feedbackData }, { withCredentials: true });
      setSubmittedFeedbacks((prev) => ({ ...prev, [answerId]: true }));
      Alert.alert('Success', 'Feedback saved.');
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Failed to save feedback.');
    }
  };
  if (loading) return <ActivityIndicator size="large" style={{ marginTop: 50 }} />;
  if (!loading && answers.length === 0) {
  return (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>No answers submitted for this activity yet.</Text>
    </View>
  );
}

  return (
    <ScrollView style={styles.container}>
      {answers.map(answer => (
        <View key={answer._id} style={styles.answerCard}>
          <Text style={styles.studentName}>
            {answer.studentId.FName} {answer.studentId.LName}
          </Text>
          {answer.responses.map((resp, i) => (
            <View key={i} style={styles.taskBlock}>
              <Text style={styles.taskLabel}>Task {resp.taskIndex + 1}</Text>
              <Text style={styles.responseText}>Response: {resp.response}</Text>
              <TextInput
                style={styles.feedbackInput}
                placeholder="Enter feedback"
                value={feedbacks[answer._id]?.[resp.taskIndex] || ''}
                onChangeText={(text) => handleFeedbackChange(answer._id, resp.taskIndex, text)}
              />
            </View>
          ))}
          <TouchableOpacity
            style={[styles.submitButton, submittedFeedbacks[answer._id] && { backgroundColor: '#999' }]}
            onPress={() => submitFeedback(answer._id)}
            disabled={submittedFeedbacks[answer._id]}
          >
            <Text style={styles.buttonText}>
              {submittedFeedbacks[answer._id] ? 'Submitted' : 'Submit Feedback'}
            </Text>
          </TouchableOpacity>

        </View>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { padding: 16, backgroundColor: '#f9f9f9' },
  answerCard: {
    backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 20, elevation: 2
  },
  studentName: { fontSize: 18, fontWeight: 'bold', marginBottom: 12 },
  taskBlock: { marginBottom: 16 },
  taskLabel: { fontWeight: '600', marginBottom: 4 },
  responseText: { marginBottom: 6, color: '#333' },
  feedbackInput: {
    backgroundColor: '#eef', padding: 10, borderRadius: 8,
    borderWidth: 1, borderColor: '#ccc'
  },
  submitButton: {
    backgroundColor: '#6B5ECD', padding: 12, marginTop: 10,
    borderRadius: 10, alignItems: 'center'
  },
  buttonText: { color: '#fff', fontWeight: 'bold' },
  emptyContainer: {
  flex: 1,
  justifyContent: 'center',
  alignItems: 'center',
  marginTop: 80,
},
emptyText: {
  fontSize: 16,
  color: '#999',
},

});

export default EvaluateTasksScreen;
