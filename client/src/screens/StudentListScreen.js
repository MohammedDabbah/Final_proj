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
      onPress={() => navigation.navigate('StudentProgressScreen', { studentId: item._id })}
    >
      <View>
        <Text style={styles.name}>{item.FName} {item.LName}</Text>
        <Text style={styles.email}>{item.Email}</Text>
        <Text style={styles.level}>Level: {item.userLevel}</Text>
      </View>
      <Icon name="angle-right" size={24} color="#B052F7" />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.header}>My Students</Text>
      {loading ? (
        <ActivityIndicator size="large" color="#B052F7" style={{ marginTop: 20 }} />
      ) : students.length === 0 ? (
        <Text style={styles.noStudents}>No students following you yet.</Text>
      ) : (
        <FlatList
          data={students}
          keyExtractor={(item) => item._id.toString()}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
    container: {
      flex: 1,
      paddingHorizontal: 20,
      paddingTop: 30,
      backgroundColor: '#F8F6FF',
    },
    header: {
      fontSize: 26,
      fontWeight: 'bold',
      color: '#3D2C8D',
      marginBottom: 16,
      textAlign: 'center',
      marginTop:10,
    },
    card: {
      backgroundColor: '#FFFFFF',
      paddingVertical: 16,
      paddingHorizontal: 20,
      borderRadius: 16,
      marginBottom: 14,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOpacity: 0.06,
      shadowOffset: { width: 0, height: 2 },
      shadowRadius: 6,
      elevation: 4,
    },
    name: {
      fontSize: 18,
      fontWeight: '700',
      color: '#2C2C2C',
    },
    email: {
      fontSize: 14,
      color: '#6F6F6F',
      marginTop: 4,
    },
    level: {
      fontSize: 13,
      color: '#9B59B6',
      marginTop: 2,
      fontWeight: '600',
    },
    noStudents: {
      fontSize: 16,
      color: '#999',
      textAlign: 'center',
      marginTop: 40,
    },
  });  

export default StudentListScreen;
