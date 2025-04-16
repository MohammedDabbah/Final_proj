import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import serverApi from '../../api/serverApi';
import Icon from 'react-native-vector-icons/FontAwesome';

const StudentProgressScreen = ({ route }) => {
  const { studentId } = route.params;
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStudentProgress = async () => {
    try {
      setLoading(true);
      const response = await serverApi.get(`/api/progress/${studentId}`, {
        withCredentials: true,
      });
      setProgress(response.data);
    } catch (err) {
      console.error('Error fetching student progress:', err);
      setError('Failed to load progress data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudentProgress();
  }, []);

  const calculatePercentage = (correct, total) => {
    if (!total || total === 0) return 0;
    return ((correct / total) * 100).toFixed(1);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#B052F7" />
          <Text style={styles.loadingText}>Loading student's progress...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !progress) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error || 'No progress data'}</Text>
          <TouchableOpacity onPress={fetchStudentProgress} style={styles.retryButton}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const p = progress.progress;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={{ paddingBottom: 20 }}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Student Progress</Text>
        </View>

        <View style={styles.levelCard}>
          <View style={styles.levelInfo}>
            <Text style={styles.levelLabel}>Level</Text>
            <Text style={styles.levelValue}>{progress.userLevel || 'Beginner'}</Text>
          </View>
          <Icon name="trophy" size={30} color="#FFD700" />
        </View>

        {/* Word Practice */}
        <View style={styles.statCard}>
          <View style={styles.statHeader}>
            <Text style={styles.statTitle}>Word Practice</Text>
            <Icon name="pencil" size={20} color="#B052F7" />
          </View>
          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Text style={styles.statValue}>{p.writing.wordPractice.gamesPlayed}</Text>
              <Text style={styles.statLabel}>Games</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statValue}>{p.writing.wordPractice.totalWords}</Text>
              <Text style={styles.statLabel}>Words</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statValue}>{p.writing.wordPractice.correctWords}</Text>
              <Text style={styles.statLabel}>Correct</Text>
            </View>
          </View>
          <Text style={styles.accuracyLabel}>Accuracy</Text>
          <View style={styles.progressBarContainer}>
            <View
              style={[
                styles.progressBar,
                {
                  width: `${calculatePercentage(
                    p.writing.wordPractice.correctWords,
                    p.writing.wordPractice.totalWords || 1
                  )}%`,
                },
              ]}
            />
          </View>
          <Text style={styles.accuracyValue}>
            {calculatePercentage(
              p.writing.wordPractice.correctWords,
              p.writing.wordPractice.totalWords || 1
            )}%
          </Text>
        </View>

        {/* Add more statCards here for Sentence Practice, Word Reading, Sentence Reading */}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#FF6B6B',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#B052F7',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryText: {
    color: 'white',
    fontWeight: 'bold',
  },
  header: {
    backgroundColor: '#B052F7',
    paddingVertical: 16,
    alignItems: 'center',
    elevation: 4,
    marginBottom: 8,
    borderRadius: 12,
    marginHorizontal: 16,
    marginTop:10,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  levelCard: {
    backgroundColor: 'white',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    elevation: 2,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  levelInfo: {
    flex: 1,
  },
  levelLabel: {
    fontSize: 14,
    color: '#666',
  },
  levelValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#B052F7',
    textTransform: 'capitalize',
  },
  statCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    marginHorizontal: 16,
    elevation: 2,
  },
  statHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  statTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  stat: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#B052F7',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  accuracyLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  progressBarContainer: {
    height: 12,
    backgroundColor: '#E0E0E0',
    borderRadius: 6,
    marginBottom: 4,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#B052F7',
    borderRadius: 6,
  },
  accuracyValue: {
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'right',
    color: '#333',
  },
});

export default StudentProgressScreen;
