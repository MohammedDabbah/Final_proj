import React, { useContext, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { AuthContext } from '../../Auth/AuthContext';
import serverApi from '../../api/serverApi';

const FollowCard = ({ person, isFollowing, onFollowChange }) => {
  const { user } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);

  const toggleFollow = async () => {
    try {
      setLoading(true);
      const isUser = user.role === 'user';
      const isTeacher = user.role === 'teacher';
      const endpoint = isFollowing ? 'unfollow' : 'follow';

      const body = {
        ...(isUser ? { teacherId: person._id } : {}),
        ...(isTeacher ? { studentId: person._id } : {}),
      };

      await serverApi.post(`/api/follow/${endpoint}`, body, {
        withCredentials: true,
      });

      // optional: update person.Followers locally if you want to
      if (onFollowChange) onFollowChange(!isFollowing);
    } catch (err) {
      console.error('Follow toggle error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Text style={styles.name}>
          {person.FName} {person.LName}
        </Text>
        {isFollowing && (
          <Text style={styles.followingTag}>✔ Following</Text>
        )}
      </View>

      <Text style={styles.email}>{person.Email}</Text>

      <TouchableOpacity
        style={[styles.button, isFollowing ? styles.unfollow : styles.follow]}
        onPress={toggleFollow}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? '...' : isFollowing ? 'Unfollow' : 'Follow'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  name: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  followingTag: {
    marginLeft: 8,
    color: '#6B5ECD',
    fontSize: 12,
    fontWeight: '600',
  },
  email: {
    color: '#777',
    marginTop: 4,
  },
  button: {
    marginTop: 10,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  follow: {
    backgroundColor: '#6B5ECD',
  },
  unfollow: {
    backgroundColor: '#999',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default FollowCard;
