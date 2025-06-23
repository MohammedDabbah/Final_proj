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

      // Sort followers based on chatList timestamp (most recent first)
      const sortedFollowers = [...followersData].sort((a, b) => {
        const chatA = chatList[a._id];
        const chatB = chatList[b._id];

        const timeA = chatA?.timestamp ? new Date(chatA.timestamp).getTime() : 0;
        const timeB = chatB?.timestamp ? new Date(chatB.timestamp).getTime() : 0;

        return timeB - timeA; // recent first
      });

      setFollowers(sortedFollowers);
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
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {(item.FName || 'U').charAt(0).toUpperCase()}
          </Text>
        </View>
        
        <View style={styles.info}>
          <View style={styles.nameRow}>
            <Text style={styles.name}>{fullName}</Text>
          </View>
          <Text style={styles.email}>{email}</Text>
          {/* <Text style={styles.role}>{role === 'teacher' ? 'Teacher' : 'Student'}</Text> */}
        </View>
        
        <View style={styles.rightSection}>
          {hasUnread && (
            <View style={styles.newBadge}>
              <Text style={styles.newBadgeText}>New</Text>
            </View>
          )}
          <Icon name="chevron-right" size={16} color="#9CA3AF" />
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#6B5ECD" />
          <Text style={styles.loadingText}>Loading contacts...</Text>
        </View>
      ) : followers.length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.emptyTitle}>No contacts</Text>
          <Text style={styles.emptyText}>You haven't connected with anyone yet</Text>
        </View>
      ) : (
        <FlatList
          data={followers}
          keyExtractor={(item, index) => item._id?.toString() || index.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6B7280',
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    backgroundColor: '#FFFFFF',
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
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  info: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
  },
  email: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 2,
  },
  role: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  newBadge: {
    backgroundColor: '#9CA3AF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginRight: 8,
  },
  newBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
  },
});

export default MessageListScreen;