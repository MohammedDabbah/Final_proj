// screens/ProgressScreen.js
import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  ActivityIndicator,
  SafeAreaView,
  TouchableOpacity
} from 'react-native';
import serverApi from "../../api/serverApi";
import Icon from 'react-native-vector-icons/FontAwesome';

const ProgressScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(null);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('writing'); // 'writing' or 'reading'

  // Fetch progress data when screen loads
  useEffect(() => {
    fetchProgress();
  }, []);

  const fetchProgress = async () => {
    try {
      setLoading(true);
      
      const response = await serverApi.get('/api/progress');
      
      setProgress(response.data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching progress:', err);
      setError('Failed to load progress data');
      setLoading(false);
    }
  };

  const calculatePercentage = (value, total) => {
    if (!total || total === 0) return 0;
    return (value / total * 100).toFixed(1);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#B052F7" />
          <Text style={styles.loadingText}>Loading progress data...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchProgress}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // If no progress data yet
  if (!progress || !progress.progress) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>My Progress</Text>
        </View>
        <View style={styles.noDataContainer}>
          <Icon name="chart-line" size={50} color="#D3D3D3" />
          <Text style={styles.noDataText}>No progress data yet</Text>
          <Text style={styles.noDataSubtext}>Complete games to see your progress</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>My Progress</Text>
        </View>
        
        {/* Level Card */}
        <View style={styles.levelCard}>
          <View style={styles.levelInfo}>
            <Text style={styles.levelLabel}>Your Level</Text>
            <Text style={styles.levelValue}>{progress.userLevel || 'Beginner'}</Text>
          </View>
          <Icon name="trophy" size={40} color="#FFD700" />
        </View>
        
        {/* Tab Navigation */}
        <View style={styles.tabContainer}>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'writing' && styles.activeTab]}
            onPress={() => setActiveTab('writing')}
          >
            <Text style={[styles.tabText, activeTab === 'writing' && styles.activeTabText]}>Writing</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'reading' && styles.activeTab]}
            onPress={() => setActiveTab('reading')}
          >
            <Text style={[styles.tabText, activeTab === 'reading' && styles.activeTabText]}>Reading</Text>
          </TouchableOpacity>
        </View>
        
        <ScrollView style={styles.scrollView}>
          {activeTab === 'writing' ? (
            // Writing Tab Content
            <View>
              {/* Word Practice Stats */}
              <View style={styles.statCard}>
                <View style={styles.statHeader}>
                  <Text style={styles.statTitle}>Word Practice</Text>
                  <Icon name="pencil" size={20} color="#B052F7" />
                </View>
                
                <View style={styles.statsRow}>
                  <View style={styles.stat}>
                    <Text style={styles.statValue}>{progress.progress.writing.wordPractice.gamesPlayed || 0}</Text>
                    <Text style={styles.statLabel}>Games</Text>
                  </View>
                  <View style={styles.stat}>
                    <Text style={styles.statValue}>{progress.progress.writing.wordPractice.totalWords || 0}</Text>
                    <Text style={styles.statLabel}>Words</Text>
                  </View>
                  <View style={styles.stat}>
                    <Text style={styles.statValue}>{progress.progress.writing.wordPractice.highScore || 0}</Text>
                    <Text style={styles.statLabel}>High Score</Text>
                  </View>
                </View>
                
                <Text style={styles.accuracyLabel}>Accuracy</Text>
                <View style={styles.progressBarContainer}>
                  <View 
                    style={[
                      styles.progressBar, 
                      { 
                        width: `${calculatePercentage(
                          progress.progress.writing.wordPractice.correctWords || 0,
                          progress.progress.writing.wordPractice.totalWords || 1
                        )}%` 
                      }
                    ]} 
                  />
                </View>
                <Text style={styles.accuracyValue}>
                  {calculatePercentage(
                    progress.progress.writing.wordPractice.correctWords || 0,
                    progress.progress.writing.wordPractice.totalWords || 1
                  )}%
                </Text>
              </View>
              
              {/* Sentence Practice Stats */}
              <View style={styles.statCard}>
                <View style={styles.statHeader}>
                  <Text style={styles.statTitle}>Sentence Practice</Text>
                  <Icon name="file-text-o" size={20} color="#B052F7" />
                </View>
                
                <View style={styles.statsRow}>
                  <View style={styles.stat}>
                    <Text style={styles.statValue}>{progress.progress.writing.sentencePractice.gamesPlayed || 0}</Text>
                    <Text style={styles.statLabel}>Games</Text>
                  </View>
                  <View style={styles.stat}>
                    <Text style={styles.statValue}>{progress.progress.writing.sentencePractice.totalSentences || 0}</Text>
                    <Text style={styles.statLabel}>Sentences</Text>
                  </View>
                  <View style={styles.stat}>
                    <Text style={styles.statValue}>{progress.progress.writing.sentencePractice.highScore || 0}</Text>
                    <Text style={styles.statLabel}>High Score</Text>
                  </View>
                </View>
                
                <Text style={styles.accuracyLabel}>Accuracy</Text>
                <View style={styles.progressBarContainer}>
                  <View 
                    style={[
                      styles.progressBar, 
                      { 
                        width: `${calculatePercentage(
                          progress.progress.writing.sentencePractice.correctSentences || 0,
                          progress.progress.writing.sentencePractice.totalSentences || 1
                        )}%` 
                      }
                    ]} 
                  />
                </View>
                <Text style={styles.accuracyValue}>
                  {calculatePercentage(
                    progress.progress.writing.sentencePractice.correctSentences || 0,
                    progress.progress.writing.sentencePractice.totalSentences || 1
                  )}%
                </Text>
              </View>
            </View>
          ) : (
            // Reading Tab Content
            <View>
              {/* Word Reading Stats */}
              <View style={styles.statCard}>
                <View style={styles.statHeader}>
                  <Text style={styles.statTitle}>Word Reading</Text>
                  <Icon name="microphone" size={20} color="#B052F7" />
                </View>
                
                <View style={styles.statsRow}>
                  <View style={styles.stat}>
                    <Text style={styles.statValue}>{progress.progress.reading.wordReading.gamesPlayed || 0}</Text>
                    <Text style={styles.statLabel}>Games</Text>
                  </View>
                  <View style={styles.stat}>
                    <Text style={styles.statValue}>{progress.progress.reading.wordReading.totalWords || 0}</Text>
                    <Text style={styles.statLabel}>Words</Text>
                  </View>
                  <View style={styles.stat}>
                    <Text style={styles.statValue}>{progress.progress.reading.wordReading.correctPronunciations || 0}</Text>
                    <Text style={styles.statLabel}>Correct</Text>
                  </View>
                </View>
                
                <Text style={styles.accuracyLabel}>Pronunciation Accuracy</Text>
                <View style={styles.progressBarContainer}>
                  <View 
                    style={[
                      styles.progressBar, 
                      { 
                        width: `${calculatePercentage(
                          progress.progress.reading.wordReading.correctPronunciations || 0,
                          progress.progress.reading.wordReading.totalWords || 1
                        )}%` 
                      }
                    ]} 
                  />
                </View>
                <Text style={styles.accuracyValue}>
                  {calculatePercentage(
                    progress.progress.reading.wordReading.correctPronunciations || 0,
                    progress.progress.reading.wordReading.totalWords || 1
                  )}%
                </Text>
              </View>
              
              {/* Sentence Reading Stats */}
              <View style={styles.statCard}>
                <View style={styles.statHeader}>
                  <Text style={styles.statTitle}>Sentence Reading</Text>
                  <Icon name="headphones" size={20} color="#B052F7" />
                </View>
                
                <View style={styles.statsRow}>
                  <View style={styles.stat}>
                    <Text style={styles.statValue}>{progress.progress.reading.sentenceReading.gamesPlayed || 0}</Text>
                    <Text style={styles.statLabel}>Games</Text>
                  </View>
                  <View style={styles.stat}>
                    <Text style={styles.statValue}>{progress.progress.reading.sentenceReading.totalSentences || 0}</Text>
                    <Text style={styles.statLabel}>Sentences</Text>
                  </View>
                  <View style={styles.stat}>
                    <Text style={styles.statValue}>{progress.progress.reading.sentenceReading.correctPronunciations || 0}</Text>
                    <Text style={styles.statLabel}>Correct</Text>
                  </View>
                </View>
                
                <Text style={styles.accuracyLabel}>Pronunciation Accuracy</Text>
                <View style={styles.progressBarContainer}>
                  <View 
                    style={[
                      styles.progressBar, 
                      { 
                        width: `${calculatePercentage(
                          progress.progress.reading.sentenceReading.correctPronunciations || 0,
                          progress.progress.reading.sentenceReading.totalSentences || 1
                        )}%` 
                      }
                    ]} 
                  />
                </View>
                <Text style={styles.accuracyValue}>
                  {calculatePercentage(
                    progress.progress.reading.sentenceReading.correctPronunciations || 0,
                    progress.progress.reading.sentenceReading.totalSentences || 1
                  )}%
                </Text>
              </View>
            </View>
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  container: {
    flex: 1,
  },
  header: {
    backgroundColor: '#B052F7',
    paddingVertical: 16,
    alignItems: 'center',
    elevation: 4,
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
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 2,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: '#F2E7FF',
    borderBottomWidth: 3,
    borderBottomColor: '#B052F7',
  },
  tabText: {
    fontWeight: '600',
    color: '#666',
  },
  activeTabText: {
    color: '#B052F7',
    fontWeight: 'bold',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 16,
  },
  statCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
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
  noDataContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  noDataText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
  },
  noDataSubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
  }
});

export default ProgressScreen;