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
          <View style={styles.loadingIconContainer}>
            <ActivityIndicator size="large" color="#6B5ECD" />
          </View>
          <Text style={styles.loadingText}>Loading your progress...</Text>
          <Text style={styles.loadingSubtext}>Analyzing your learning journey</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.errorContainer}>
          <View style={styles.errorIconContainer}>
            <Icon name="exclamation-triangle" size={48} color="#6B5ECD" />
          </View>
          <Text style={styles.errorTitle}>Unable to Load Progress</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchProgress}>
            <Icon name="refresh" size={16} color="#FFFFFF" />
            <Text style={styles.retryText}>Try Again</Text>
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
          <View style={styles.noDataIconContainer}>
            <Icon name="chart-line" size={64} color="#6B5ECD" />
          </View>
          <Text style={styles.noDataTitle}>Start Your Learning Journey</Text>
          <Text style={styles.noDataText}>Complete activities to track your progress and see amazing insights about your learning!</Text>
          <TouchableOpacity style={styles.startButton} onPress={() => navigation.goBack()}>
            <Icon name="play" size={16} color="#FFFFFF" />
            <Text style={styles.startButtonText}>Start Learning</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>My Progress</Text>
          <Text style={styles.headerSubtitle}>Track your learning journey</Text>
        </View>
        
        {/* Level Card */}
        <View style={styles.levelCard}>
          <View style={styles.levelInfo}>
            <Text style={styles.levelLabel}>Current Level</Text>
            <Text style={styles.levelValue}>{progress.userLevel || 'Beginner'}</Text>
            <Text style={styles.levelDescription}>Keep up the great work!</Text>
          </View>
          <View style={styles.trophyContainer}>
            <Icon name="trophy" size={40} color="#FFB800" />
          </View>
        </View>
        
        {/* Tab Navigation */}
        <View style={styles.tabContainer}>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'writing' && styles.activeTab]}
            onPress={() => setActiveTab('writing')}
          >
            <Icon name="pencil" size={16} color={activeTab === 'writing' ? '#FFFFFF' : '#6B7280'} />
            <Text style={[styles.tabText, activeTab === 'writing' && styles.activeTabText]}>Writing</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'reading' && styles.activeTab]}
            onPress={() => setActiveTab('reading')}
          >
            <Icon name="book" size={16} color={activeTab === 'reading' ? '#FFFFFF' : '#6B7280'} />
            <Text style={[styles.tabText, activeTab === 'reading' && styles.activeTabText]}>Reading</Text>
          </TouchableOpacity>
        </View>
        
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {activeTab === 'writing' ? (
            // Writing Tab Content
            <View>
              {/* Word Practice Stats */}
              <View style={styles.statCard}>
                <View style={styles.statHeader}>
                  <View style={styles.statTitleContainer}>
                    <View style={styles.statIconContainer}>
                      <Icon name="pencil" size={20} color="#6B5ECD" />
                    </View>
                    <Text style={styles.statTitle}>Word Practice</Text>
                  </View>
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
                
                <View style={styles.accuracySection}>
                  <Text style={styles.accuracyLabel}>Accuracy Rate</Text>
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
              </View>
              
              {/* Sentence Practice Stats */}
              <View style={styles.statCard}>
                <View style={styles.statHeader}>
                  <View style={styles.statTitleContainer}>
                    <View style={styles.statIconContainer}>
                      <Icon name="file-text-o" size={20} color="#6B5ECD" />
                    </View>
                    <Text style={styles.statTitle}>Sentence Practice</Text>
                  </View>
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
                
                <View style={styles.accuracySection}>
                  <Text style={styles.accuracyLabel}>Accuracy Rate</Text>
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
            </View>
          ) : (
            // Reading Tab Content
            <View>
              {/* Word Reading Stats */}
              <View style={styles.statCard}>
                <View style={styles.statHeader}>
                  <View style={styles.statTitleContainer}>
                    <View style={styles.statIconContainer}>
                      <Icon name="microphone" size={20} color="#6B5ECD" />
                    </View>
                    <Text style={styles.statTitle}>Word Reading</Text>
                  </View>
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
                
                <View style={styles.accuracySection}>
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
              </View>
              
              {/* Sentence Reading Stats */}
              <View style={styles.statCard}>
                <View style={styles.statHeader}>
                  <View style={styles.statTitleContainer}>
                    <View style={styles.statIconContainer}>
                      <Icon name="headphones" size={20} color="#6B5ECD" />
                    </View>
                    <Text style={styles.statTitle}>Sentence Reading</Text>
                  </View>
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
                
                <View style={styles.accuracySection}>
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
            </View>
          )}
          <View style={styles.bottomSpacing} />
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  container: {
    flex: 1,
  },
  header: {
    backgroundColor: '#6B5ECD',
    paddingVertical: 24,
    paddingHorizontal: 20,
    alignItems: 'center',
    shadowColor: '#6B5ECD',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
  },
  levelCard: {
    backgroundColor: '#FFFFFF',
    margin: 20,
    padding: 20,
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#6B5ECD',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 1,
    borderColor: '#F0EBFF',
  },
  levelInfo: {
    flex: 1,
  },
  levelLabel: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
    marginBottom: 4,
  },
  levelValue: {
    fontSize: 28,
    fontWeight: '700',
    color: '#6B5ECD',
    textTransform: 'capitalize',
    marginBottom: 4,
  },
  levelDescription: {
    fontSize: 14,
    color: '#10B981',
    fontWeight: '600',
  },
  trophyContainer: {
    width: 72,
    height: 72,
    borderRadius: 16,
    backgroundColor: '#FFF8E1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 12,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeTab: {
    backgroundColor: '#6B5ECD',
    shadowColor: '#6B5ECD',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  tabText: {
    fontWeight: '600',
    color: '#6B7280',
    marginLeft: 8,
    fontSize: 14,
  },
  activeTabText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  statCard: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  statHeader: {
    marginBottom: 20,
  },
  statTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#F0EBFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  statTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  stat: {
    alignItems: 'center',
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    paddingVertical: 16,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#6B5ECD',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  accuracySection: {
    marginTop: 8,
  },
  accuracyLabel: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '600',
    marginBottom: 8,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    marginBottom: 8,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#6B5ECD',
    borderRadius: 4,
  },
  accuracyValue: {
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'right',
    color: '#6B5ECD',
  },

  // Loading State
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  loadingIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F0EBFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  loadingText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  loadingSubtext: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },

  // Error State
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  errorIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  errorText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6B5ECD',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    shadowColor: '#6B5ECD',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  retryText: {
    color: '#FFFFFF',
    fontWeight: '600',
    marginLeft: 8,
    fontSize: 16,
  },

  // No Data State
  noDataContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  noDataIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#F0EBFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 3,
    borderColor: '#E5DEFF',
  },
  noDataTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
    textAlign: 'center',
  },
  noDataText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6B5ECD',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 20,
    shadowColor: '#6B5ECD',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  startButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  bottomSpacing: {
    height: 40,
  },
});

export default ProgressScreen;