// EvaluateActivityPicker.js
import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet, ScrollView } from 'react-native';
import serverApi from '../../api/serverApi';
import { RefreshControl } from 'react-native';

const EvaluateActivityPicker = ({ navigation }) => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        const res = await serverApi.get('/api/activities/teacher', { withCredentials: true });
        setActivities(res.data);
      } catch (err) {
        console.error(err);
        Alert.alert('Error', 'Could not load activities.');
      } finally {
        setLoading(false);
      }
    };
    fetchActivities();
  }, []);

  const fetchActivities = async () => {
    try {
      setRefreshing(true);
      const res = await serverApi.get('/api/activities/teacher', { withCredentials: true });
      setActivities(res.data);
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Could not load activities.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  if (loading) return <ActivityIndicator size="large" style={{ marginTop: 50 }} />;

  return (
    <ScrollView style={styles.container}
    refreshControl={
      <RefreshControl refreshing={refreshing} onRefresh={fetchActivities} />
    }>
      <Text style={styles.title}>Select an Activity to Evaluate</Text>
      {activities.length === 0 ? (
        <Text style={styles.emptyText}>No activities created yet.</Text>
      ) : (
        activities.map((activity) => (
          <TouchableOpacity
            key={activity._id}
            style={styles.card}
            onPress={() => navigation.navigate('EvaluateScreen', { activityId: activity._id })}
          >
            <Text style={styles.cardTitle}>{activity.title}</Text>
            <Text style={styles.cardSub}>{activity.description}</Text>
          </TouchableOpacity>
        ))
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { padding: 20 },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 20 },
  card: {
    backgroundColor: '#6B5ECD',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  cardTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  cardSub: { color: '#f0f0f0', marginTop: 6 },
  emptyText: {
  textAlign: 'center',
  color: '#666',
  fontSize: 16,
  marginTop: 40,
}

});

export default EvaluateActivityPicker;
