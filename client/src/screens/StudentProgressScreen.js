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
          <ActivityIndicator size="large" color="#6B5ECD" />
          <Text style={styles.loadingText}>Loading student progress...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !progress) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.errorContainer}>
          <Icon name="exclamation-triangle" size={40} color="#F44336" />
          <Text style={styles.errorText}>{error || 'No progress data available'}</Text>
          <TouchableOpacity onPress={fetchStudentProgress} style={styles.retryButton}>
            <Icon name="refresh" size={16} color="#FFFFFF" style={styles.retryIcon} />
            <Text style={styles.retryText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const p = progress.progress;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Student Progress</Text>
        </View>

        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Level Card */}
          <View style={styles.levelCard}>
            <View style={styles.levelContent}>
              <View style={styles.levelIconContainer}>
                <Icon name="trophy" size={24} color="#6B5ECD" />
              </View>
              <View style={styles.levelInfo}>
                <Text style={styles.levelLabel}>Current Level</Text>
                <Text style={styles.levelValue}>{progress.userLevel || 'Beginner'}</Text>
              </View>
            </View>
          </View>

          {/* Progress Cards Section */}
          <View style={styles.progressSection}>
            <Text style={styles.sectionTitle}>Practice Areas</Text>
            
            {/* Word Practice Card */}
            <View style={styles.statCard}>
              <View style={styles.statHeader}>
                <View style={styles.statTitleContainer}>
                  <Icon name="pencil" size={18} color="#6B5ECD" style={styles.statIcon} />
                  <Text style={styles.statTitle}>Word Practice</Text>
                </View>
              </View>
              
              <View style={styles.statsGrid}>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{p.writing.wordPractice.gamesPlayed}</Text>
                  <Text style={styles.statLabel}>Games Played</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{p.writing.wordPractice.totalWords}</Text>
                  <Text style={styles.statLabel}>Total Words</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{p.writing.wordPractice.correctWords}</Text>
                  <Text style={styles.statLabel}>Correct Words</Text>
                </View>
              </View>
              
              <View style={styles.accuracySection}>
                <View style={styles.accuracyHeader}>
                  <Text style={styles.accuracyLabel}>Accuracy Rate</Text>
                  <Text style={styles.accuracyPercentage}>
                    {calculatePercentage(
                      p.writing.wordPractice.correctWords,
                      p.writing.wordPractice.totalWords || 1
                    )}%
                  </Text>
                </View>
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
              </View>
            </View>

            {/* Sentence Practice Card */}
            <View style={styles.statCard}>
              <View style={styles.statHeader}>
                <View style={styles.statTitleContainer}>
                  <Icon name="file-text" size={18} color="#6B5ECD" style={styles.statIcon} />
                  <Text style={styles.statTitle}>Sentence Practice</Text>
                </View>
              </View>
              
              <View style={styles.statsGrid}>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{p.writing.sentencePractice.gamesPlayed}</Text>
                  <Text style={styles.statLabel}>Games Played</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{p.writing.sentencePractice.totalSentences}</Text>
                  <Text style={styles.statLabel}>Total Sentences</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{p.writing.sentencePractice.correctSentences}</Text>
                  <Text style={styles.statLabel}>Correct Sentences</Text>
                </View>
              </View>
              
              <View style={styles.accuracySection}>
                <View style={styles.accuracyHeader}>
                  <Text style={styles.accuracyLabel}>Accuracy Rate</Text>
                  <Text style={styles.accuracyPercentage}>
                    {calculatePercentage(
                      p.writing.sentencePractice.correctSentences,
                      p.writing.sentencePractice.totalSentences || 1
                    )}%
                  </Text>
                </View>
                <View style={styles.progressBarContainer}>
                  <View
                    style={[
                      styles.progressBar,
                      {
                        width: `${calculatePercentage(
                          p.writing.sentencePractice.correctSentences,
                          p.writing.sentencePractice.totalSentences || 1
                        )}%`,
                      },
                    ]}
                  />
                </View>
              </View>
            </View>

            {/* Word Reading Card */}
            {p.reading?.wordReading && (
              <View style={styles.statCard}>
                <View style={styles.statHeader}>
                  <View style={styles.statTitleContainer}>
                    <Icon name="volume-up" size={18} color="#6B5ECD" style={styles.statIcon} />
                    <Text style={styles.statTitle}>Word Reading</Text>
                  </View>
                </View>
                
                <View style={styles.statsGrid}>
                  <View style={styles.statItem}>
                    <Text style={styles.statValue}>{p.reading.wordReading.sessionsCompleted || 0}</Text>
                    <Text style={styles.statLabel}>Sessions</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={styles.statValue}>{p.reading.wordReading.totalWords || 0}</Text>
                    <Text style={styles.statLabel}>Total Words</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={styles.statValue}>{p.reading.wordReading.correctPronunciations || 0}</Text>
                    <Text style={styles.statLabel}>Correct</Text>
                  </View>
                </View>
                
                <View style={styles.accuracySection}>
                  <View style={styles.accuracyHeader}>
                    <Text style={styles.accuracyLabel}>Accuracy Rate</Text>
                    <Text style={styles.accuracyPercentage}>
                      {calculatePercentage(
                        p.reading.wordReading.correctPronunciations || 0,
                        p.reading.wordReading.totalWords || 1
                      )}%
                    </Text>
                  </View>
                  <View style={styles.progressBarContainer}>
                    <View
                      style={[
                        styles.progressBar,
                        {
                          width: `${calculatePercentage(
                            p.reading.wordReading.correctPronunciations || 0,
                            p.reading.wordReading.totalWords || 1
                          )}%`,
                        },
                      ]}
                    />
                  </View>
                </View>
              </View>
            )}

            {/* Sentence Reading Card */}
            {p.reading?.sentenceReading && (
              <View style={styles.statCard}>
                <View style={styles.statHeader}>
                  <View style={styles.statTitleContainer}>
                    <Icon name="microphone" size={18} color="#6B5ECD" style={styles.statIcon} />
                    <Text style={styles.statTitle}>Sentence Reading</Text>
                  </View>
                </View>
                
                <View style={styles.statsGrid}>
                  <View style={styles.statItem}>
                    <Text style={styles.statValue}>{p.reading.sentenceReading.sessionsCompleted || 0}</Text>
                    <Text style={styles.statLabel}>Sessions</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={styles.statValue}>{p.reading.sentenceReading.totalSentences || 0}</Text>
                    <Text style={styles.statLabel}>Total Sentences</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={styles.statValue}>{p.reading.sentenceReading.correctPronunciations || 0}</Text>
                    <Text style={styles.statLabel}>Correct</Text>
                  </View>
                </View>
                
                <View style={styles.accuracySection}>
                  <View style={styles.accuracyHeader}>
                    <Text style={styles.accuracyLabel}>Accuracy Rate</Text>
                    <Text style={styles.accuracyPercentage}>
                      {calculatePercentage(
                        p.reading.sentenceReading.correctPronunciations || 0,
                        p.reading.sentenceReading.totalSentences || 1
                      )}%
                    </Text>
                  </View>
                  <View style={styles.progressBarContainer}>
                    <View
                      style={[
                        styles.progressBar,
                        {
                          width: `${calculatePercentage(
                            p.reading.sentenceReading.correctPronunciations || 0,
                            p.reading.sentenceReading.totalSentences || 1
                          )}%`,
                        },
                      ]}
                    />
                  </View>
                </View>
              </View>
            )}
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  container: {
    flex: 1,
    paddingTop: 50,
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  errorText: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    marginVertical: 20,
    lineHeight: 24,
  },
  retryButton: {
    backgroundColor: '#6B5ECD',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryIcon: {
    marginRight: 8,
  },
  retryText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 40,
  },
  levelCard: {
    backgroundColor: '#F8F6FF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 32,
    borderLeftWidth: 4,
    borderLeftColor: '#6B5ECD',
  },
  levelContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  levelIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  levelInfo: {
    flex: 1,
  },
  levelLabel: {
    fontSize: 14,
    color: '#666666',
    fontWeight: '500',
    marginBottom: 4,
  },
  levelValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#6B5ECD',
    textTransform: 'capitalize',
  },
  progressSection: {
    gap: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 8,
  },
  statCard: {
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    padding: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#6B5ECD',
  },
  statHeader: {
    marginBottom: 20,
  },
  statTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statIcon: {
    marginRight: 12,
  },
  statTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#6B5ECD',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666666',
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 16,
  },
  accuracySection: {
    marginTop: 8,
  },
  accuracyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  accuracyLabel: {
    fontSize: 14,
    color: '#666666',
    fontWeight: '500',
  },
  accuracyPercentage: {
    fontSize: 16,
    fontWeight: '700',
    color: '#6B5ECD',
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: '#E8E8E8',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#6B5ECD',
    borderRadius: 4,
  },
});

export default StudentProgressScreen;