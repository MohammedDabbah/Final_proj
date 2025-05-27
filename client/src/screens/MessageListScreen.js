import React, { useContext, useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import { AuthContext } from '../../Auth/AuthContext';
import serverApi from '../../api/serverApi';

const MessageListScreen = ({ navigation }) => {
  const { user } = useContext(AuthContext);
  const [followers, setFollowers] = useState([]);
  const [chatMeta, setChatMeta] = useState({});
  const [loading, setLoading] = useState(true);

  // Fetch followers
  const fetchFollowers = async () => {
    try {
      const res = await serverApi.get('/api/follow/following', {
        withCredentials: true,
      });
      return res.data.following || [];
    } catch (err) {
      console.error('Error fetching followers:', err);
      return [];
    }
  };

  // Fetch unread chat info
  const fetchChatMeta = async () => {
    try {
      const res = await serverApi.get('/api/messages/chat-list', {
        withCredentials: true,
      });
      const meta = {};
      res.data.forEach(chat => {
        meta[chat.id] = chat;
      });
      return meta;
    } catch (err) {
      console.error('Error fetching chat list:', err);
      return {};
    }
  };

  useEffect(() => {
    let interval;

    const loadData = async () => {
      const [followersData, chatList] = await Promise.all([
        fetchFollowers(),
        fetchChatMeta(),
      ]);
      setFollowers(followersData);
      setChatMeta(chatList);
      setLoading(false);
    };

    loadData();
    interval = setInterval(loadData, 5000); // update every 5s

    return () => clearInterval(interval); // cleanup on unmount
  }, []);

  const renderItem = ({ item }) => {
    const fullName = `${item.FName || 'Unnamed'} ${item.LName || ''}`;
    const email = item.Email || 'No email';
    const role = item.role || 'user';
    const chat = chatMeta[item._id];
    const hasUnread =
    chat &&
    !chat.seen &&                  // the last message hasn't been seen
    chat.senderId === item._id;    // it was sent by *them*, not me


    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() =>
          navigation.navigate('MessageScreen', {
            recipientId: item._id,
            recipientRole: role,
          })
        }
      >
        <View style={styles.info}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={styles.name}>{fullName}</Text>
            {hasUnread &&  <View style={styles.newBadge}>
          <Text style={styles.badgeText}>New</Text>
        </View>}
          </View>
          <Text style={styles.email}>{email}</Text>
        </View>
        <Icon name="envelope" size={20} color="#B052F7" />
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Text style={styles.header}>Message Your Followers</Text>
      {loading ? (
        <ActivityIndicator size="large" color="#B052F7" />
      ) : followers.length === 0 ? (
        <Text style={styles.empty}>No followers found.</Text>
      ) : (
        <FlatList
          data={followers}
          keyExtractor={(item, index) => item._id?.toString() || index.toString()}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  header: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
    color: '#3D2C8D',
    marginTop: 10,
  },
  card: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    elevation: 2,
    alignItems: 'center',
  },
  info: {
    flex: 1,
    paddingRight: 10,
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
  },
  email: {
    fontSize: 14,
    color: '#777',
    marginTop: 2,
  },
  empty: {
    textAlign: 'center',
    marginTop: 40,
    fontSize: 16,
    color: '#999',
  },
  unreadDot: {
    width: 8,
    height: 8,
    backgroundColor: 'red',
    borderRadius: 4,
    marginLeft: 6,
  },
  newBadge: {
  backgroundColor: '#FF3B30',
  paddingVertical: 2,
  paddingHorizontal: 8,
  borderRadius: 10,
  marginLeft: 10,
},
badgeText: {
  color: 'white',
  fontSize: 12,
  fontWeight: 'bold',
},
});

export default MessageListScreen;
