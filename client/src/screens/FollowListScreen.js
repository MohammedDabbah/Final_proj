import React, { useContext, useEffect, useState } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import FollowCard from '../components/FollowCard';
import serverApi from '../../api/serverApi';
import { AuthContext } from '../../Auth/AuthContext';

const FollowListScreen = ({ route }) => {
  const type = route?.params?.type || 'teacher';
  const { user } = useContext(AuthContext);

  const [email, setEmail] = useState('');
  const [searching, setSearching] = useState(false);
  const [person, setPerson] = useState(null);
  const [personFollowing, setPersonFollowing] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [followingList, setFollowingList] = useState([]);
  const [loadingFollowing, setLoadingFollowing] = useState(true);

  const refreshFollowingList = async () => {
    try {
      const res = await serverApi.get('/api/follow/following', {
        withCredentials: true,
      });
  
      const freshList = (res.data.following || []).map(p => ({ ...p }));
  
      // 🔁 Match searched person and update their followers list in case they changed
      if (person) {
        const matchIndex = freshList.findIndex(p => p._id === person._id);
        if (matchIndex !== -1) {
          setPerson(freshList[matchIndex]); // this ensures search card also updates
        }
      }
  
      setFollowingList(freshList);
    } catch (err) {
      console.error('Error refreshing follow list:', err);
    }
  };
  

  useEffect(() => {
    const fetchFollowing = async () => {
      setLoadingFollowing(true);
      await refreshFollowingList();
      setLoadingFollowing(false);
    };

    fetchFollowing();
  }, []);

  const handleSearch = async () => {
    if (!email) return;

    setSearching(true);
    setNotFound(false);
    setPerson(null);
    setPersonFollowing(false);

    try {
      const res = await serverApi.get(`/api/follow/search?email=${email}&type=${type}`, {
        withCredentials: true,
      });

      const personData = res.data?.person;

      if (personData) {
        const isFollowed = Array.isArray(personData.Followers) &&
          personData.Followers.some(follower => {
            const id = typeof follower === 'string' ? follower : follower._id;
            return id?.toString() === user._id?.toString();
          });

        setPerson(personData);
        setPersonFollowing(isFollowed);
      } else {
        setNotFound(true);
      }
    } catch (err) {
      if (err.response?.status === 404) {
        setNotFound(true);
      } else {
        console.error('Unexpected error:', err);
      }
    } finally {
      setSearching(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior="padding">
      <Text style={styles.header}>Search {type === 'teacher' ? 'Teacher' : 'User'} by Email</Text>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.input}
          placeholder="Enter email..."
          placeholderTextColor="#aaa"
          value={email}
          onChangeText={setEmail}
          onSubmitEditing={handleSearch}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <TouchableOpacity onPress={handleSearch}>
          <Icon name="search" size={20} color="#B052F7" style={styles.searchIcon} />
        </TouchableOpacity>
      </View>

      {searching && <ActivityIndicator style={{ marginTop: 20 }} />}
      {notFound && !searching && (
        <Text style={styles.notFound}>No {type} found with that email.</Text>
      )}

      {person && (
        <View style={{ marginVertical: 10 }}>
          <FollowCard
            person={person}
            isFollowing={personFollowing}
            onFollowChange={(newStatus) => {
              setPersonFollowing(newStatus);
              refreshFollowingList(); // keep list updated
            }}
          />
        </View>
      )}

      <Text style={styles.subHeader}>You're Following</Text>
      {loadingFollowing ? (
        <ActivityIndicator />
      ) : (
        <FlatList
          data={followingList}
          keyExtractor={(item) => item._id}
          renderItem={({ item, index }) => (
          <FollowItem
            person={item}
            userId={user._id}
            onFollowChange={(newStatus) => {
              const updatedList = [...followingList];
              if (newStatus) {
                updatedList[index].Followers = [...(updatedList[index].Followers || []), user._id];
              } else {
                updatedList[index].Followers = updatedList[index].Followers?.filter(f => {
                  const id = typeof f === 'string' ? f : f._id;
                  return id?.toString() !== user._id?.toString();
                }) || [];
              }
              setFollowingList(updatedList);
            }}
          />
        )}
          ListEmptyComponent={<Text style={styles.emptyText}>You’re not following anyone yet.</Text>}
        />
      )}
    </KeyboardAvoidingView>
  );
};

// ✅ Stateless FollowItem — always fresh isFollowing
const FollowItem = ({ person, userId, onFollowChange }) => {
  const isFollowing = Array.isArray(person.Followers) &&
    person.Followers.some(follower => {
      const id = typeof follower === 'string' ? follower : follower._id;
      return id?.toString() === userId?.toString();
    });

  return (
    <FollowCard
      person={person}
      isFollowing={isFollowing}
      onFollowChange={onFollowChange}
    />
  );
};


const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#F8F6FF',
  },
  header: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  subHeader: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 30,
    marginBottom: 10,
    color: '#555',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderColor: '#ddd',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingRight: 10,
    color: '#333',
  },
  searchIcon: {
    paddingLeft: 5,
  },
  notFound: {
    marginTop: 20,
    color: '#B00020',
    fontSize: 16,
    textAlign: 'center',
  },
  emptyText: {
    textAlign: 'center',
    color: '#777',
    marginTop: 20,
  },
});

export default FollowListScreen;
