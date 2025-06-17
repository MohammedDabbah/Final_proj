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
        <Text style={[styles.messageText, isMe ? styles.myMessageText : styles.theirMessageText]}>
          {item.content}
        </Text>
        <Text style={[styles.timestamp, isMe ? styles.myTimestamp : styles.theirTimestamp]}>
          {moment(item.timestamp).format('LT')}
        </Text>
        {isMe && isLast && item.seen && (
          <View style={styles.seenContainer}>
            <Icon name="check-circle" size={12} color="#4CAF50" />
            <Text style={styles.seenText}>Seen</Text>
          </View>
        )}
      </View>
    );
  };

  if (!recipientId || !recipientRole) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centered}>
          <View style={styles.errorContainer}>
            <Icon name="exclamation-triangle" size={48} color="#6B5ECD" />
            <Text style={styles.errorTitle}>Connection Issue</Text>
            <Text style={styles.errorText}>
              Recipient info is missing. Please go back and try again.
            </Text>
          </View>
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
        <View style={styles.chatBackground}>
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderItem}
            keyExtractor={(item) => item._id}
            contentContainerStyle={styles.messagesContainer}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
            showsVerticalScrollIndicator={false}
          />
        </View>

        <View style={styles.inputContainer}>
          <View style={styles.inputWrapper}>
            <TextInput
              value={content}
              onChangeText={setContent}
              placeholder="Type a message..."
              placeholderTextColor="#9CA3AF"
              style={styles.input}
              multiline
              maxLength={500}
            />
            <TouchableOpacity
              onPress={sendMessage}
              style={[styles.sendButton, sending && styles.sendButtonDisabled]}
              disabled={sending}
            >
              {sending ? (
                <Icon name="clock-o" size={18} color="#FFFFFF" />
              ) : (
                <Icon name="send" size={16} color="#FFFFFF" />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#6B5ECD',
  },
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  chatBackground: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  errorContainer: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 32,
    shadowColor: '#6B5ECD',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  messagesContainer: {
    padding: 20,
    paddingBottom: 100,
  },
  messageBubble: {
    borderRadius: 20,
    marginVertical: 4,
    maxWidth: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  myMessage: {
    backgroundColor: '#6B5ECD',
    alignSelf: 'flex-end',
    marginLeft: 60,
    borderBottomRightRadius: 6,
    padding: 16,
  },
  theirMessage: {
    backgroundColor: '#FFFFFF',
    alignSelf: 'flex-start',
    marginRight: 60,
    borderBottomLeftRadius: 6,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '500',
  },
  myMessageText: {
    color: '#FFFFFF',
  },
  theirMessageText: {
    color: '#1F2937',
  },
  timestamp: {
    fontSize: 12,
    marginTop: 8,
    fontWeight: '500',
  },
  myTimestamp: {
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'right',
  },
  theirTimestamp: {
    color: '#9CA3AF',
    textAlign: 'left',
  },
  seenContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    justifyContent: 'flex-end',
  },
  seenText: {
    fontSize: 12,
    color: '#4CAF50',
    marginLeft: 4,
    fontWeight: '600',
  },
  inputContainer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 5,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#F9FAFB',
    borderRadius: 25,
    paddingHorizontal: 4,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    maxHeight: 100,
    color: '#1F2937',
    fontWeight: '500',
  },
  sendButton: {
    backgroundColor: '#6B5ECD',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
    shadowColor: '#6B5ECD',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  sendButtonDisabled: {
    backgroundColor: '#9CA3AF',
    shadowOpacity: 0.1,
  },
});

export default MessageScreen;