import React, { useState, useEffect, useRef, useContext } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
} from 'react-native';
import moment from 'moment';
import Icon from 'react-native-vector-icons/FontAwesome';
import serverApi from '../../api/serverApi';
import { AuthContext } from '../../Auth/AuthContext';

const MessageScreen = ({ route }) => {
  const { user } = useContext(AuthContext);
  const { recipientId, recipientRole } = route?.params || {};

  const [messages, setMessages] = useState([]);
  const [content, setContent] = useState('');
  const [sending, setSending] = useState(false);
  const flatListRef = useRef();

  // Fetch messages and mark as seen
  const fetchMessages = async () => {
    if (!recipientId || !recipientRole) return;
    try {
      const res = await serverApi.get(`/api/messages/conversation/${recipientId}`, {
        withCredentials: true,
      });
      setMessages(res.data);

      await serverApi.patch(`/api/messages/seen/${recipientId}`, null, {
        withCredentials: true,
      });
    } catch (err) {
      console.error('Error fetching messages:', err);
    }
  };

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 5000);
    return () => clearInterval(interval);
  }, [messages]);

  const sendMessage = async () => {
    if (!content.trim() || sending) return;

    setSending(true);
    try {
      const newMsg = {
        sender: { id: user._id, role: user.role },
        receiver: { id: recipientId, role: recipientRole },
        content,
      };

      await serverApi.post('/api/messages/send', newMsg, {
        withCredentials: true,
      });

      setContent('');
      await fetchMessages();
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (err) {
      console.error('Error sending message:', err);
    } finally {
      setSending(false);
    }
  };

  const renderItem = ({ item, index }) => {
    const isMe = item.sender.id === user._id;
    const isLast = index === messages.length - 1;
    return (
      <View style={[styles.messageBubble, isMe ? styles.myMessage : styles.theirMessage]}>
        <Text style={styles.messageText}>{item.content}</Text>
        <Text style={styles.timestamp}>{moment(item.timestamp).format('LT')}</Text>
        {isMe && isLast && item.seen && (
          <Text style={styles.seenText}>✓ Seen</Text>
        )}
      </View>
    );
  };

  if (!recipientId || !recipientRole) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centered}>
          <Text style={{ color: '#B00020', fontSize: 16, textAlign: 'center' }}>
            Recipient info is missing. Please go back and try again.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={90}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderItem}
          keyExtractor={(item) => item._id}
          contentContainerStyle={{ padding: 16 }}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        />

        <View style={styles.inputContainer}>
          <TextInput
            value={content}
            onChangeText={setContent}
            placeholder="Type a message..."
            style={styles.input}
            multiline
          />
          <TouchableOpacity
            onPress={sendMessage}
            style={[styles.sendButton, sending && { opacity: 0.5 }]}
            disabled={sending}
          >
            <Icon name="send" size={18} color="#fff" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
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
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messageBubble: {
    padding: 10,
    borderRadius: 10,
    marginVertical: 4,
    maxWidth: '80%',
  },
  myMessage: {
    backgroundColor: '#B052F7',
    alignSelf: 'flex-end',
  },
  theirMessage: {
    backgroundColor: '#7D8587',
    alignSelf: 'flex-start',
  },
  messageText: {
    color: '#fff',
  },
  timestamp: {
    fontSize: 10,
    color: '#eee',
    marginTop: 4,
    textAlign: 'right',
  },
  seenText: {
    fontSize: 10,
    color: '#ccc',
    marginTop: 2,
    textAlign: 'right',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#fff',
    borderTopColor: '#ddd',
    borderTopWidth: 1,
  },
  input: {
    flex: 1,
    backgroundColor: '#F0F0F0',
    borderRadius: 20,
    paddingHorizontal: 16,
    fontSize: 16,
    marginRight: 8,
  },
  sendButton: {
    backgroundColor: '#B052F7',
    borderRadius: 20,
    padding: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default MessageScreen;
