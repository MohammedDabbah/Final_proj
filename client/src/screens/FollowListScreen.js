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
  SafeAreaView,
  ScrollView,
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
  const [inputFocused, setInputFocused] = useState(false);

  const refreshFollowingList = async () => {
    try {
      const res = await serverApi.get('/api/follow/following', {
        withCredentials: true,
      });
  
      const freshList = (res.data.following || []).map(p => ({
        ...p,
        isFollowing: true,
      }));
      setFollowingList(freshList);
  
      if (person?._id) {
        const matchIndex = freshList.findIndex(p => p._id === person._id);
        if (matchIndex !== -1) {
          setPerson(freshList[matchIndex]);
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
    if (!email.trim()) return;

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

  const clearSearch = () => {
    setEmail('');
    setPerson(null);
    setNotFound(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header Section */}
        <View style={styles.headerSection}>
          <View style={styles.headerIcon}>
            <Icon name={type === 'teacher' ? 'graduation-cap' : 'users'} size={24} color="#6B5ECD" />
          </View>
          <Text style={styles.headerTitle}>Find {type === 'teacher' ? 'Teachers' : 'People'}</Text>
          {/* <Text style={styles.headerSubtitle}>Connect with educators and learners</Text> */}
        </View>

        {/* Search Section */}
        <View style={styles.searchSection}>
          <Text style={styles.searchLabel}>Search by Email Address</Text>
          <View style={[styles.searchContainer, inputFocused && styles.searchContainerFocused]}>
            <Icon name="envelope" size={16} color="#6B5ECD" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder={`Enter ${type} email address...`}
              placeholderTextColor="#9CA3AF"
              value={email}
              onChangeText={setEmail}
              onSubmitEditing={handleSearch}
              onFocus={() => setInputFocused(true)}
              onBlur={() => setInputFocused(false)}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
            {email && (
              <TouchableOpacity onPress={clearSearch} style={styles.clearButton}>
                <Icon name="times-circle" size={16} color="#9CA3AF" />
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity 
            style={[styles.searchButton, (!email.trim() || searching) && styles.searchButtonDisabled]} 
            onPress={handleSearch}
            disabled={!email.trim() || searching}
          >
            {searching ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Icon name="search" size={16} color="#FFFFFF" />
                <Text style={styles.searchButtonText}>Search</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Search Results Section */}
        {notFound && !searching && (
          <View style={styles.notFoundContainer}>
            <Icon name="exclamation-circle" size={48} color="#6B5ECD" />
            <Text style={styles.notFoundTitle}>No {type} found</Text>
            <Text style={styles.notFoundText}>
              We couldn't find a {type} with that email address. 
              Please check the spelling and try again.
            </Text>
          </View>
        )}

        {person && (
          <View style={styles.searchResultSection}>
            <View style={styles.searchResultHeader}>
              <Icon name="check-circle" size={20} color="#10B981" />
              <Text style={styles.searchResultTitle}>Found!</Text>
            </View>
            <FollowCard
              person={person}
              isFollowing={personFollowing}
              onFollowChange={(newStatus) => {
                setPersonFollowing(newStatus);
                refreshFollowingList();
              }}
            />
          </View>
        )}

        {/* Following List Section */}
        <View style={styles.followingSection}>
          <View style={styles.followingSectionHeader}>
            <View style={styles.followingHeaderLeft}>
              <Icon name="heart" size={20} color="#6B5ECD" />
              <Text style={styles.followingSectionTitle}>Following</Text>
            </View>
            <View style={styles.followingCount}>
              <Text style={styles.followingCountText}>{followingList.length}</Text>
            </View>
          </View>

          {loadingFollowing ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#6B5ECD" />
              <Text style={styles.loadingText}>Loading your connections...</Text>
            </View>
          ) : followingList.length > 0 ? (
            <FlatList
              data={followingList}
              keyExtractor={(item) => item._id}
              renderItem={({ item, index }) => (
                <FollowCard
                  person={item}
                  isFollowing={item.isFollowing}
                  onFollowChange={(newStatus) => {
                    const updatedList = [...followingList];
                    updatedList[index].isFollowing = newStatus;
                    setFollowingList(updatedList);
                  }}
                />
              )}
              scrollEnabled={false}
              showsVerticalScrollIndicator={false}
            />
          ) : (
            <View style={styles.emptyContainer}>
              <Icon name="users" size={64} color="#D1D5DB" />
              <Text style={styles.emptyTitle}>No connections yet</Text>
              <Text style={styles.emptyText}>
                Start building your learning network by searching for {type === 'teacher' ? 'teachers' : 'people'} above!
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },

  // Header Section
  headerSection: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 24,
    borderRadius: 20,
    padding: 24,
    shadowColor: '#6B5ECD',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 2,
    borderColor: '#F0EBFF',
  },
  headerIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#F0EBFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#6B5ECD',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#6B5ECD',
    marginBottom: 8,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#8B7BC8',
    textAlign: 'center',
    fontWeight: '500',
  },

  // Search Section
  searchSection: {
    marginHorizontal: 20,
    marginBottom: 24,
  },
  searchLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 4,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    shadowColor: '#6B5ECD',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  searchContainerFocused: {
    borderColor: '#6B5ECD',
    shadowOpacity: 0.15,
    elevation: 6,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 14,
    color: '#374151',
    fontWeight: '500',
  },
  clearButton: {
    padding: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
  },
  searchButton: {
    backgroundColor: '#6B5ECD',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 24,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#6B5ECD',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  searchButtonDisabled: {
    backgroundColor: '#9CA3AF',
    shadowOpacity: 0.1,
  },
  searchButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },

  // Search Results
  notFoundContainer: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 32,
    marginBottom: 24,
    borderWidth: 2,
    borderColor: '#FEE2E2',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  notFoundTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },
  notFoundText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
  },

  searchResultSection: {
    marginHorizontal: 20,
    marginBottom: 24,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
    borderColor: '#D1FAE5',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  searchResultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  searchResultTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#059669',
    marginLeft: 8,
  },

  // Following Section
  followingSection: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
  followingSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 2,
    borderColor: '#F0EBFF',
  },
  followingHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  followingSectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#6B5ECD',
    marginLeft: 8,
  },
  followingCount: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#6B5ECD',
    justifyContent: 'center',
    alignItems: 'center',
  },
  followingCountText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },

  // Loading and Empty States
  loadingContainer: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },
  emptyContainer: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
  },
});

export default FollowListScreen;