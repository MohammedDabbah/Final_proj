import React, { useEffect, useState, useContext } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import serverApi from '../../api/serverApi';
import { AuthContext } from '../../Auth/AuthContext';
import Icon from 'react-native-vector-icons/FontAwesome';

const StudentListScreen = ({ navigation }) => {
  const { user } = useContext(AuthContext);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchFollowers = async () => {
    try {
      const res = await serverApi.get('/api/follow/following', {
        withCredentials: true,
      });
      setStudents(res.data.following || []);
    } catch (err) {
      console.error('Error fetching students:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFollowers();
  }, []);

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() =>
        navigation.navigate('StudentProgressScreen', { studentId: item._id })
      }
    >
      <View style={styles.cardContent}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {item.FName.charAt(0)}{item.LName.charAt(0)}
          </Text>
        </View>
        <View style={styles.studentInfo}>
          <Text style={styles.name}>
            {item.FName} {item.LName}
          </Text>
          <Text style={styles.email}>{item.Email}</Text>
          <View style={styles.levelContainer}>
            <Text style={styles.level}>Level {item.userLevel}</Text>
          </View>
        </View>
      </View>
      <Icon name="chevron-right" size={16} color="#C4C4C4" />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.header}>My Students</Text>
        <Text style={styles.subtitle}>
          {students.length} student{students.length !== 1 ? 's' : ''} following you
        </Text>
      </View>
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6B5ECD" />
          <Text style={styles.loadingText}>Loading students...</Text>
        </View>
      ) : students.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Icon name="users" size={48} color="#E0E0E0" />
          <Text style={styles.emptyTitle}>No Students Yet</Text>
          <Text style={styles.emptySubtitle}>
            Students will appear here when they start following you
          </Text>
        </View>
      ) : (
        <FlatList
          data={students}
          keyExtractor={item => item._id.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  headerContainer: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 24,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  header: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B5ECD',
    fontWeight: '500',
  },
  listContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 20,
    paddingHorizontal: 20,
    borderRadius: 16,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#6B5ECD',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F5F5F5',
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#6B5ECD',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  studentInfo: {
    flex: 1,
  },
  name: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    color: '#757575',
    marginBottom: 6,
  },
  levelContainer: {
    alignSelf: 'flex-start',
  },
  level: {
    fontSize: 12,
    color: '#6B5ECD',
    backgroundColor: '#F3F1FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    fontWeight: '600',
    overflow: 'hidden',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#757575',
    marginTop: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1A1A1A',
    marginTop: 24,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#757575',
    textAlign: 'center',
    lineHeight: 22,
  },
}); 

export default StudentListScreen;
