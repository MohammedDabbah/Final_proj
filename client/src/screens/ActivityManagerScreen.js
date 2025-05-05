import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Modal,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Audio } from 'expo-av';
import axios from 'axios';
import NetInfo from '@react-native-community/netinfo';
import * as FileSystem from 'expo-file-system';
import { AI_API_KEY } from '../../api/config';
import serverApi from '../../api/serverApi';
import merriamApi from "../../api/merriamApi";

const { width } = Dimensions.get('window');

// Configuration constants

const ActivityManagerScreen = ({ navigation }) => {
  // State for activity list and filtering
  const [activities, setActivities] = useState([]);
  const [filteredActivities, setFilteredActivities] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState(null);
  const [isOffline, setIsOffline] = useState(false);

  // State for activity creation modal
  const [modalVisible, setModalVisible] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [activityName, setActivityName] = useState('');
  const [activityDescription, setActivityDescription] = useState('');
  const [selectedType, setSelectedType] = useState(null);
  const [quizType, setQuizType] = useState(null);
  const [contentItems, setContentItems] = useState([]);
  const [currentItem, setCurrentItem] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [editActivityId, setEditActivityId] = useState(null);
  
  // State for API interactions
  const [isRecording, setIsRecording] = useState(false);
  const [recordingObject, setRecordingObject] = useState(null);
  const [transcribedText, setTranscribedText] = useState('');
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isGeneratingImages, setIsGeneratingImages] = useState(false);

  // Animation references
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(width)).current;

  // Initialize and check network status
  useEffect(() => {
    // Set up network status listener
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsOffline(!state.isConnected);
      if (state.isConnected) {
        syncActivities();
      }
    });

    // Start animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
      }),
    ]).start();

    // Load activities
    loadActivities();

    // Cleanup
    return () => {
      unsubscribe();
    };
  }, []);

  // Filter activities when search or filter changes
  useEffect(() => {
    filterActivities();
  }, [searchTerm, filterType, activities]);

  // Filter activities based on search term and filter type
  const filterActivities = () => {
    // Get properly formatted activities
    let filtered = [...activities].map(activity => formatActivityItems(activity));
    
    // Apply type filter
    if (filterType !== 'all') {
      if (filterType === 'reading' || filterType === 'writing') {
        filtered = filtered.filter(activity => 
          activity.type === 'quiz' && activity.quizType === filterType
        );
      } else {
        filtered = filtered.filter(activity => activity.type === filterType);
      }
    }
    
    // Apply search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(activity => 
        activity.name.toLowerCase().includes(searchLower) || 
        (activity.description && activity.description.toLowerCase().includes(searchLower))
      );
    }
    
    setFilteredActivities(filtered);
  };

  // Load activities from the server
  const loadActivities = async () => {
    try {
      setLoading(true);
      
      // Try to fetch from server
      const response = await serverApi.get('/api/activities');
      
      // Process the activities to parse stringified items
      const processedActivities = response.data.map(activity => {
        if (activity.items && Array.isArray(activity.items)) {
          // Parse each stringified item back to an object
          activity.items = activity.items.map(item => {
            if (typeof item === 'string') {
              try {
                return JSON.parse(item);
              } catch (e) {
                // If parsing fails, return as is
                return item;
              }
            }
            return item;
          });
        }
        return activity;
      });
      
      setActivities(processedActivities);
      
      // Save to AsyncStorage for offline use
      await AsyncStorage.setItem('activities', JSON.stringify(processedActivities));
      setLastSyncTime(new Date());
      await AsyncStorage.setItem('lastSyncTime', JSON.stringify(new Date()));
      
      setLoading(false);
    } catch (error) {
      console.error('Error loading activities from server:', error);
      
      // Try to load from AsyncStorage as fallback
      try {
        const cached = await AsyncStorage.getItem('activities');
        if (cached) {
          setActivities(JSON.parse(cached));
        }
        
        const lastSync = await AsyncStorage.getItem('lastSyncTime');
        if (lastSync) {
          setLastSyncTime(new Date(JSON.parse(lastSync)));
        }
      } catch (storageError) {
        console.error('Error loading from AsyncStorage:', storageError);
      }
      
      setLoading(false);
    }
  };

  // Refresh activities
  const handleRefresh = () => {
    setRefreshing(true);
    loadActivities()
      .finally(() => setRefreshing(false));
  };

  // Sync activities with remote server if available
  const syncActivities = async () => {
    try {
      const pendingSync = await AsyncStorage.getItem('pendingSyncActivities');
      const pendingActivities = pendingSync ? JSON.parse(pendingSync) : [];
      
      if (pendingActivities.length === 0) {
        return;
      }
      
      console.log(`Syncing ${pendingActivities.length} activities`);      
      // For each pending activity, send to server
      let syncedCount = 0;
      for (const activity of pendingActivities) {
        // Process the activity for sync
        const activityToSync = { ...activity };
        
        // Stringify items if they're not already strings
        if (activityToSync.items && Array.isArray(activityToSync.items)) {
          activityToSync.items = activityToSync.items.map(item => 
            typeof item === 'string' ? item : JSON.stringify(item)
          );
        }
        
        const method = activity.id && !activity._id.startsWith('temp') ? 'put' : 'post';
        const url = method === 'put'
        `/api/activities/${activity._id}`
        `/api/activities`

        
        try {
          await serverApi[method](url, activityToSync);
          syncedCount++;
        } catch (syncError) {
            console.error(`Error syncing activity ${activity.name}:`, syncError);

        }
      }
      
      // Clear pending sync queue after sync attempts
      await AsyncStorage.setItem('pendingSyncActivities', JSON.stringify([]));
      
      // Reload activities from server
      await loadActivities();
      
      Alert.alert('Sync Complete', `${syncedCount} of ${pendingActivities.length} activities synchronized`);
    } catch (error) {
      console.error('Error syncing activities:', error);
      Alert.alert('Sync Error', 'Failed to sync activities. Please try again.');
    }
  };
  
  // Save activity to server and local storage
  const saveActivity = async (activity) => {
    try {
      // Create a copy of the activity to avoid modifying the original
      const activityToSave = {
        ...activity,
        lastEdited: new Date().toISOString()
      };
      
      // IMPORTANT FIX: Convert objects to strings for the items array
      if (activityToSave.items && Array.isArray(activityToSave.items)) {
        activityToSave.items = activityToSave.items.map(item => 
          JSON.stringify(item)
        );
      }
      
      if (editMode && editActivityId) {
        activityToSave._id = editActivityId;
      }
      
      console.log('Saving activity with stringified items:', JSON.stringify(activityToSave, null, 2));
      
      // Try to save to server
      const netState = await NetInfo.fetch();
      
      if (netState.isConnected) {
        // If online, save directly to server
        const method = editMode ? 'put' : 'post';
        const url = editMode 
        `/api/activities/${activity._id}`
          `/api/activities`
        
        const response = await serverApi[method](url, activityToSave);
        console.log('Server response:', response.data);
        
        // Refresh activities list
        await loadActivities();
        return true;
      } else {
        // If offline, save to local storage and pending sync queue
        const currentActivities = [...activities];
        
        if (editMode && editActivityId) {
          // Update existing
          const index = currentActivities.findIndex(a => a._id === editActivityId);
          if (index !== -1) {
            currentActivities[index] = activityToSave;
          }
        } else {
          // Create new with temporary ID
          activityToSave._id = `temp_${Date.now()}`;
        currentActivities.push(activityToSave);
        }
        
        // Update local state and storage
        setActivities(currentActivities);
        await AsyncStorage.setItem('activities', JSON.stringify(currentActivities));
        
        // Add to pending sync queue
        const pendingSync = await AsyncStorage.getItem('pendingSyncActivities');
        const pendingActivities = pendingSync ? JSON.parse(pendingSync) : [];
        pendingActivities.push(activityToSave);
        await AsyncStorage.setItem('pendingSyncActivities', JSON.stringify(pendingActivities));
        
        Alert.alert('Saved Offline', 'Activity saved locally and will sync when online');
        return true;
      }
    } catch (error) {
      console.error('Error saving activity:', error);
      Alert.alert('Error', 'Failed to save activity: ' + (error.response?.data?.message || error.message));
      return false;
    }
  };

  // Delete activity
  const deleteActivity = async (activityId) => {
    try {
      const netState = await NetInfo.fetch();
      
      if (netState.isConnected) {
        // If online, delete from server
        await serverApi.delete(`/api/activities/${activityId}`);      }
      
      // Update local state regardless of connectivity
      const updatedActivities = activities.filter(a => a._id !== activityId);
      setActivities(updatedActivities);
      await AsyncStorage.setItem('activities', JSON.stringify(updatedActivities));
      
      // If offline, add to pending deletes
      if (!netState.isConnected) {
        const pendingDeletes = await AsyncStorage.getItem('pendingDeleteActivities');
        const deleteIds = pendingDeletes ? JSON.parse(pendingDeletes) : [];
        deleteIds.push(activityId);
        await AsyncStorage.setItem('pendingDeleteActivities', JSON.stringify(deleteIds));
      }
      
      return true;
    } catch (error) {
      console.error('Error deleting activity:', error);
      Alert.alert('Error', 'Failed to delete activity: ' + (error.response?.data?.message || error.message));
      return false;
    }
  };
  
  // Reset modal state
  const resetModalState = () => {
    setModalVisible(false);
    setCurrentStep(1);
    setActivityName('');
    setActivityDescription('');
    setSelectedType(null);
    setQuizType(null);
    setContentItems([]);
    setCurrentItem('');
    setTranscribedText('');
    setEditMode(false);
    setEditActivityId(null);
  };

  // Open modal for creating new activity
  const handleCreateActivity = () => {
    resetModalState();
    setModalVisible(true);
  };

  // Open modal for editing activity
  const handleEditActivity = (activity) => {
    // Format the activity before setting edit mode
    const formattedActivity = formatActivityItems(activity);
    
    setEditMode(true);
    setEditActivityId(formattedActivity._id);
    setActivityName(formattedActivity.name);
    setActivityDescription(formattedActivity.description || '');
    setSelectedType(formattedActivity.type);
    setQuizType(formattedActivity.quizType || null);
    setContentItems(formattedActivity.items || []);
    setCurrentStep(1);
    setModalVisible(true);
  };

  // Handle deleting activity with confirmation
  const handleDeleteActivity = (activityId, activityName) => {
    Alert.alert(
      'Delete Activity',
      `Are you sure you want to delete "${activityName}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => deleteActivity(activityId)
        }
      ]
    );
  };

  // Handle next step in activity creation
  const handleNextStep = () => {
    if (currentStep === 1) {
      if (!selectedType) {
        Alert.alert('Missing Information', 'Please select an activity type');
        return;
      }
      setCurrentStep(2);
    } else if (currentStep === 2) {
      if (!activityName.trim()) {
        Alert.alert('Missing Information', 'Please enter an activity name');
        return;
      }
      
      if (selectedType === 'quiz' && !quizType) {
        Alert.alert('Missing Information', 'Please select a quiz type');
        return;
      }
      
      setCurrentStep(3);
    } else if (currentStep === 3) {
      if (contentItems.length === 0) {
        Alert.alert('Missing Content', 'Please add at least one item');
        return;
      }
      
      finalizeActivity();
    }
  };

  // Handle previous step in activity creation
  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    } else {
      Alert.alert(
        'Cancel Creation',
        'Are you sure you want to cancel?',
        [
          { text: 'No', style: 'cancel' },
          { 
            text: 'Yes', 
            onPress: resetModalState
          }
        ]
      );
    }
  };

  // Finalize and save activity
  const finalizeActivity = async () => {
    const activity = {
      name: activityName,
      description: activityDescription,
      type: selectedType,
      quizType: selectedType === 'quiz' ? quizType : null,
      items: contentItems
    };
    
    const success = await saveActivity(activity);
    
    if (success) {
        Alert.alert(
            'Success', 
            `Activity ${editMode ? 'updated' : 'created'} successfully!`,
            [{ text: 'OK', onPress: resetModalState }]
          );
    }
  };

  // Audio recording functions for reading quiz
  const startRecording = async () => {
    try {
      await Audio.requestPermissionsAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });
      
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      
      setRecordingObject(recording);
      setIsRecording(true);
    } catch (error) {
      console.error('Failed to start recording:', error);
      Alert.alert('Error', 'Failed to start recording');
    }
  };

  const stopRecording = async () => {
    try {
      setIsRecording(false);
      await recordingObject.stopAndUnloadAsync();
      const uri = recordingObject.getURI();
      setRecordingObject(null);
      
      if (uri) {
        transcribeAudio(uri);
      }
    } catch (error) {
      console.error('Failed to stop recording:', error);
      Alert.alert('Error', 'Failed to stop recording');
      setIsRecording(false);
      setRecordingObject(null);
    }
  };

  // Transcribe audio with OpenAI Whisper API
  const transcribeAudio = async (audioUri) => {
    setIsTranscribing(true);
    
    try {
      const fileInfo = await FileSystem.getInfoAsync(audioUri);
      
      const formData = new FormData();
      formData.append('file', {
        uri: audioUri,
        type: 'audio/m4a',
        name: 'recording.m4a',
      });
      formData.append('model', 'whisper-1');
      
      const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
        'Authorization': `Bearer ${AI_API_KEY}`,        },
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Transcription failed');
      }
      
      const data = await response.json();
      setTranscribedText(data.text);
    } catch (error) {
      console.error('Error transcribing audio:', error);
      Alert.alert('Error', 'Failed to transcribe audio: ' + error.message);
      // Fallback for development/testing
      setTranscribedText("This is a simulated transcription since the API call failed.");
    } finally {
      setIsTranscribing(false);
    }
  };

  // Generate images with DALL-E for matching activities
  const generateImages = async () => {
    setIsGeneratingImages(true);
    
    try {
      // Copy current items
      const updatedItems = [...contentItems];
      
      // Process each word
      for (let i = 0; i < updatedItems.length; i++) {
        const item = updatedItems[i];
        
        // Skip if already has image
        if (item.imageUrl) continue;
        
        // Call DALL-E API for realistic images
        const response = await fetch('https://api.openai.com/v1/images/generations', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${AI_API_KEY}`,

          },
          body: JSON.stringify({
            prompt: `A realistic photograph of a ${item.text || item.word}. High-quality, detailed image showing the object or concept clearly.`,
            n: 1,
            size: '512x512',
          }),
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error?.message || 'Image generation failed');
        }
        
        const data = await response.json();
        
        if (data.data && data.data[0].url) {
          updatedItems[i] = {
            ...item,
            imageUrl: data.data[0].url,
          };
          
          // Update state to show progress
          setContentItems([...updatedItems]);
        }
      }
    } catch (error) {
      console.error('Error generating images:', error);
      Alert.alert('Error', 'Failed to generate images: ' + error.message);
      
      // Fallback with placeholder images for development/testing
      const updatedItems = [...contentItems];
      for (let i = 0; i < updatedItems.length; i++) {
        if (!updatedItems[i].imageUrl) {
          updatedItems[i] = {
            ...updatedItems[i],
            imageUrl: `https://picsum.photos/seed/${updatedItems[i].text || updatedItems[i].word}/512/512`,          };
        }
      }
      setContentItems(updatedItems);
    } finally {
      setIsGeneratingImages(false);
    }
  };

  // Format activity items
  const formatActivityItems = (activity) => {
    if (!activity) return activity;
    
    const formattedActivity = { ...activity };
    
    if (formattedActivity.items && Array.isArray(formattedActivity.items)) {
      // Convert strings to objects when displaying
      formattedActivity.items = formattedActivity.items.map(item => {
        if (typeof item === 'string') {
          try {
            return JSON.parse(item);
          } catch (e) {
            return { text: item }; // Fallback if parsing fails
          }
        }
        return item;
      });
    }
    
    return formattedActivity;
  };

  // Render activity type selection step
  const renderTypeSelection = () => (
    <View style={styles.modalContent}>
      <Text style={styles.modalTitle}>Select Activity Type</Text>
      
      {[
        { id: 'quiz', title: 'Quiz', icon: 'question-circle', description: 'Reading or writing questions' },
        { id: 'matching', title: 'Matching', icon: 'exchange', description: 'Match words with AI images' },
      ].map((type) => (
        <TouchableOpacity
          key={type.id}
          style={[
            styles.typeCard,
            selectedType === type.id && styles.selectedTypeCard,
          ]}
          onPress={() => setSelectedType(type.id)}
        >
          <Icon 
            name={type.icon} 
            size={24} 
            color={selectedType === type.id ? '#fff' : '#B052F7'} 
          />
          <View style={styles.typeTextContainer}>
            <Text style={[
              styles.typeTitle,
              selectedType === type.id && styles.selectedTypeText,
            ]}>
              {type.title}
            </Text>
            <Text style={[
              styles.typeDescription,
              selectedType === type.id && styles.selectedTypeText,
            ]}>
              {type.description}
            </Text>
          </View>
          {selectedType === type.id && (
            <Icon name="check" size={18} color="#fff" style={styles.checkIcon} />
          )}
        </TouchableOpacity>
      ))}
    </View>
  );

  // Render activity details form
  const renderDetailsForm = () => (
    <View style={styles.modalContent}>
      <Text style={styles.modalTitle}>Activity Details</Text>
      
      <Text style={styles.inputLabel}>Activity Name</Text>
      <TextInput
        style={styles.input}
        value={activityName}
        onChangeText={setActivityName}
        placeholder="Give your activity a name"
        placeholderTextColor="#999"
      />
      
      <Text style={styles.inputLabel}>Description (Optional)</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        value={activityDescription}
        onChangeText={setActivityDescription}
        placeholder="Describe the activity"
        placeholderTextColor="#999"
        multiline
        numberOfLines={4}
      />
      
      {selectedType === 'quiz' && (
        <View style={styles.quizTypeContainer}>
          <Text style={styles.inputLabel}>Quiz Type</Text>
          <View style={styles.quizTypeOptions}>
            <TouchableOpacity 
              style={[
                styles.quizTypeOption, 
                quizType === 'reading' && styles.selectedQuizType
              ]}
              onPress={() => setQuizType('reading')}
            >
              <Icon 
                name="headphones" 
                size={20} 
                color={quizType === 'reading' ? '#fff' : '#B052F7'} 
              />
              <Text style={[
                styles.quizTypeText,
                quizType === 'reading' && styles.selectedQuizTypeText
              ]}>
                Reading Quiz
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[
                styles.quizTypeOption, 
                quizType === 'writing' && styles.selectedQuizType
              ]}
              onPress={() => setQuizType('writing')}
            >
              <Icon 
                name="pencil" 
                size={20} 
                color={quizType === 'writing' ? '#fff' : '#B052F7'} 
              />
              <Text style={[
                styles.quizTypeText,
                quizType === 'writing' && styles.selectedQuizTypeText
              ]}>
                Writing Quiz
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );

  // Render content creation step - Quiz type
  const renderQuizContent = () => (
    <View style={styles.modalContent}>
      <Text style={styles.modalTitle}>
        {quizType === 'reading' ? 'Reading Quiz Content' : 'Writing Quiz Content'}
      </Text>
      
      {quizType === 'reading' && (
        <View style={styles.recordingContainer}>
          <Text style={styles.inputLabel}>Record Audio for Transcription</Text>
          <TouchableOpacity 
            style={[
              styles.recordButton,
              isRecording && styles.recordingActive
            ]}
            onPress={isRecording ? stopRecording : startRecording}
            disabled={isTranscribing}
          >
            <Icon 
              name={isRecording ? "stop-circle" : "microphone"} 
              size={24} 
              color="#fff" 
            />
            <Text style={styles.recordButtonText}>
              {isRecording ? "Stop Recording" : "Start Recording"}
            </Text>
          </TouchableOpacity>
          
          {isRecording && (
            <Text style={styles.recordingText}>Recording in progress...</Text>
          )}
          
          {isTranscribing && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#B052F7" />
              <Text style={styles.loadingText}>Transcribing audio...</Text>
            </View>
          )}
          
          {transcribedText && (
            <View style={styles.transcriptionResult}>
              <Text style={styles.transcriptionTitle}>Transcription:</Text>
              <Text style={styles.transcriptionText}>{transcribedText}</Text>
              <TouchableOpacity 
                style={styles.addTranscriptionButton}
                onPress={() => {
                  setContentItems([
                    ...contentItems, 
                    { 
                      id: Date.now().toString(),
                      type: 'transcription', 
                      text: transcribedText 
                    }
                  ]);
                  setTranscribedText('');
                }}
              >
                <Text style={styles.addButtonText}>Add Transcription</Text>
              </TouchableOpacity>
            </View>
          )}
          
          <Text style={styles.dividerText}>OR</Text>
        </View>
      )}
      
      <Text style={styles.inputLabel}>
        Add {quizType === 'reading' ? 'Words/Sentences to Read' : 'Writing Prompts'}
      </Text>
      
      <View style={styles.addItemContainer}>
        <TextInput
          style={styles.itemInput}
          value={currentItem}
          onChangeText={setCurrentItem}
          placeholder={`Enter ${quizType === 'reading' ? 'word or sentence' : 'writing prompt'}...`}
                    placeholderTextColor="#999"
        />
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => {
            if (currentItem.trim()) {
              setContentItems([
                ...contentItems, 
                { 
                  id: Date.now().toString(),
                  type: quizType,
                  text: currentItem, 
                  word: currentItem
                }
              ]);
              setCurrentItem('');
            }
          }}
        >
          <Icon name="plus" size={16} color="#fff" />
        </TouchableOpacity>
      </View>
      
      {contentItems.length > 0 && renderContentItemsList()}
    </View>
  );

  // Render content creation step - Matching type
  const renderMatchingContent = () => (
    <View style={styles.modalContent}>
      <Text style={styles.modalTitle}>Matching Activity Content</Text>
      <Text style={styles.helpText}>
        Add words that will be matched with AI-generated images
      </Text>
      
      <View style={styles.addItemContainer}>
        <TextInput
          style={styles.itemInput}
          value={currentItem}
          onChangeText={setCurrentItem}
          placeholder="Enter a word..."
          placeholderTextColor="#999"
        />
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => {
            if (currentItem.trim()) {
              setContentItems([
                ...contentItems, 
                { 
                  id: Date.now().toString(),
                  text: currentItem,
                  word: currentItem,
                  imageUrl: null
                }
              ]);
              setCurrentItem('');
            }
          }}
        >
          <Icon name="plus" size={16} color="#fff" />
        </TouchableOpacity>
      </View>
      
      {contentItems.length > 0 && (
        <View style={styles.itemsList}>
          {contentItems.map((item, index) => (
            <View key={item.id || index} style={styles.matchingItemCard}>
              <View style={styles.matchingItemTextContainer}>
                <Text style={styles.itemText}>{item.text || item.word}</Text>
              </View>
              
              {item.imageUrl && (
                <Image 
                  source={{ uri: item.imageUrl }} 
                  style={styles.matchingItemImage} 
                  resizeMode="cover"
                />
              )}
              
              <TouchableOpacity 
                style={styles.removeButton}
                onPress={() => {
                  const updatedItems = contentItems.filter((_, i) => i !== index);
                  setContentItems(updatedItems);
                }}
              >
                <Icon name="times" size={16} color="#FF6B6B" />
              </TouchableOpacity>
            </View>
          ))}
          
          <TouchableOpacity 
            style={[
              styles.generateImagesButton,
              isGeneratingImages && styles.generatingImages
            ]}
            onPress={generateImages}
            disabled={isGeneratingImages || contentItems.length === 0}
          >
            {isGeneratingImages ? (
              <View style={styles.buttonWithLoader}>
                <ActivityIndicator size="small" color="#fff" />
                <Text style={styles.generateImagesButtonText}>Generating Images...</Text>
              </View>
            ) : (
              <View style={styles.buttonWithIcon}>
                <Icon name="image" size={16} color="#fff" />
                <Text style={styles.generateImagesButtonText}>Generate Images with AI</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  // Render content items list for quiz types
  const renderContentItemsList = () => (
    <View style={styles.itemsList}>
      <Text style={styles.itemsListTitle}>Added Items:</Text>
      {contentItems.map((item, index) => (
        <View key={item.id || index} style={styles.itemCard}>
          <View style={styles.itemIconContainer}>
            <Icon 
              name={item.type === 'transcription' ? 'microphone' : item.type === 'reading' ? 'headphones' : 'pencil'} 
              size={16} 
              color="#B052F7" 
            />
          </View>
          <Text style={styles.itemText} numberOfLines={2}>{item.text}</Text>
          <TouchableOpacity 
            style={styles.removeButton}
            onPress={() => {
              const updatedItems = contentItems.filter((_, i) => i !== index);
              setContentItems(updatedItems);
            }}
          >
            <Icon name="times" size={16} color="#FF6B6B" />
          </TouchableOpacity>
        </View>
      ))}
    </View>
  );

  // Render content creation step based on activity type
  const renderContentCreation = () => {
    if (selectedType === 'quiz') {
      return renderQuizContent();
    } else if (selectedType === 'matching') {
      return renderMatchingContent();
    }
    return null;
  };

  // Get activity icon based on type
  const getActivityIcon = (type, quizType) => {
    switch (type) {
      case 'quiz':
        return quizType === 'reading' ? 'headphones' : 'pencil';
      case 'matching':
        return 'exchange';
      default:
        return 'file-text-o';
    }
  };

  // Get activity type color
  const getActivityTypeColor = (type) => {
    switch (type) {
      case 'quiz':
        return '#FF6B81';
      case 'matching':
        return '#6B5ECD';
      default:
        return '#B052F7';
    }
  };

  // Get activity type display text
  const getActivityTypeText = (type, quizType) => {
    if (type === 'quiz') {
      return quizType === 'reading' ? 'Reading Quiz' : 'Writing Quiz';
    }
    return type.charAt(0).toUpperCase() + type.slice(1).replace('-', ' ');
  };

  // Format relative time
  const formatRelativeTime = (dateString) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInHours = Math.abs(now - date) / 36e5; // hours
    
    if (diffInHours < 1) {
      return 'just now';
    } else if (diffInHours < 24) {
        return `${Math.floor(diffInHours)} hours ago`;
            } else {
      return date.toLocaleDateString();
    }
  };

  // Render activity item
  const renderActivityItem = ({ item }) => {
    // Format the activity before rendering
    const formattedActivity = formatActivityItems(item);
    
    return (
      <View style={styles.activityCard}>
        <View style={[styles.activityIconContainer, { backgroundColor: getActivityTypeColor(formattedActivity.type) }]}>
          <Icon name={getActivityIcon(formattedActivity.type, formattedActivity.quizType)} size={24} color="#fff" />
        </View>
        
        <View style={styles.activityInfo}>
          <Text style={styles.activityName}>{formattedActivity.name}</Text>
          <Text style={styles.activityType}>
            {getActivityTypeText(formattedActivity.type, formattedActivity.quizType)}
          </Text>
          <Text style={styles.activityMeta}>
            {formattedActivity.items?.length || 0} items • Edited {formatRelativeTime(formattedActivity.lastEdited)}
          </Text>
        </View>
        
        <View style={styles.activityActions}>
          <TouchableOpacity 
            style={styles.activityActionButton}
            onPress={() => navigation.navigate('ActivityDetailScreen', { activityId: formattedActivity._id })}
          >
            <Icon name="eye" size={20} color="#666" />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.activityActionButton}
            onPress={() => handleEditActivity(formattedActivity)}
          >
            <Icon name="edit" size={20} color="#666" />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.activityActionButton}
            onPress={() => handleDeleteActivity(formattedActivity._id, formattedActivity.name)}
          >
            <Icon name="trash" size={20} color="#666" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // Render activity statistics
  const renderStatistics = () => {
    const quizCount = activities.filter(a => a.type === 'quiz').length;
    const matchingCount = activities.filter(a => a.type === 'matching').length;
    
    return (
      <View style={styles.statisticsContainer}>
        <View style={styles.statisticsItem}>
          <Text style={styles.statisticsNumber}>{activities.length}</Text>
          <Text style={styles.statisticsLabel}>Total</Text>
        </View>
        
        <View style={styles.statisticsItem}>
          <Text style={styles.statisticsNumber}>{quizCount}</Text>
          <Text style={styles.statisticsLabel}>Quizzes</Text>
        </View>
        
        <View style={styles.statisticsItem}>
          <Text style={styles.statisticsNumber}>{matchingCount}</Text>
          <Text style={styles.statisticsLabel}>Matching</Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <Animated.View style={[
        styles.header,
        { opacity: fadeAnim, transform: [{ translateX: slideAnim }] }
      ]}>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Activities</Text>
          {isOffline && (
            <View style={styles.offlineIndicator}>
              <Icon name="wifi" size={12} color="#fff" />
              <Text style={styles.offlineText}>Offline</Text>
            </View>
          )}
        </View>
        <TouchableOpacity 
  style={styles.addButton}
  onPress={handleCreateActivity}
>
  <Icon name="plus" size={20} color="#FFFFFF" />
</TouchableOpacity>
      </Animated.View>
      
      {/* Activity Filter */}
      <View style={styles.filterContainer}>
        <View style={styles.searchContainer}>
          <Icon name="search" size={16} color="#999" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            value={searchTerm}
            onChangeText={setSearchTerm}
            placeholder="Search activities..."
            placeholderTextColor="#999"
          />
        </View>
        
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          style={styles.filterTabs}
          contentContainerStyle={styles.filterTabsContent}
        >
          {['all', 'quiz', 'reading', 'writing', 'matching'].map((type) => (
            <TouchableOpacity
              key={type}
              style={[styles.filterTab, filterType === type && styles.activeFilterTab]}
              onPress={() => setFilterType(type)}
            >
              <Text style={[styles.filterTabText, filterType === type && styles.activeFilterTabText]}>
                {type === 'all' ? 'All Types' : 
                  type === 'reading' ? 'Reading Quizzes' :
                  type === 'writing' ? 'Writing Quizzes' :
                  type.charAt(0).toUpperCase() + type.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
      
      {/* Activity Statistics */}
      {!loading && activities.length > 0 && renderStatistics()}
      
      {/* Activity List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#B052F7" />
          <Text style={styles.loadingText}>Loading activities...</Text>
        </View>
      ) : activities.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Icon name="folder-open" size={60} color="#ccc" />
          <Text style={styles.emptyText}>No activities yet</Text>
          <Text style={styles.emptySubtext}>
            Tap the + button to create your first activity
          </Text>
          <TouchableOpacity 
            style={styles.createButton}
            onPress={handleCreateActivity}
          >
            <Text style={styles.createButtonText}>Create Activity</Text>
          </TouchableOpacity>
        </View>
      ) : filteredActivities.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Icon name="search" size={60} color="#ccc" />
          <Text style={styles.emptyText}>No matching activities</Text>
          <Text style={styles.emptySubtext}>
            Try different search terms or filters
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredActivities}
          renderItem={renderActivityItem}
          keyExtractor={item => item._id}
          contentContainerStyle={styles.activitiesList}
          showsVerticalScrollIndicator={false}
          refreshing={refreshing}
          onRefresh={handleRefresh}
        />
      )}
      
      {/* Last sync info */}
      {lastSyncTime && (
        <View style={styles.syncInfoContainer}>
          <Icon name="refresh" size={12} color="#999" />
          <Text style={styles.syncInfoText}>
            Last synced: {formatRelativeTime(lastSyncTime)}
          </Text>
        </View>
      )}
      
      {/* Create/Edit Activity Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={false}
        onRequestClose={() => {
          Alert.alert(
            'Cancel',
            'Are you sure you want to cancel? Your changes will be lost.',
            [
              { text: 'Continue Editing', style: 'cancel' },
              { text: 'Discard', onPress: resetModalState }
            ]
          );
        }}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalContainer}
        >
          <View style={styles.modalHeader}>
            <TouchableOpacity 
              style={styles.modalBackButton}
              onPress={handlePrevStep}
            >
              <Icon name="arrow-left" size={20} color="#333" />
            </TouchableOpacity>
            <Text style={styles.modalHeaderTitle}>
              {editMode ? 'Edit Activity' : 'Create Activity'}
            </Text>
            <View style={styles.stepIndicator}>
              <View style={[styles.stepDot, currentStep >= 1 && styles.activeStepDot]} />
              <View style={[styles.stepDot, currentStep >= 2 && styles.activeStepDot]} />
              <View style={[styles.stepDot, currentStep >= 3 && styles.activeStepDot]} />
            </View>
          </View>
          
          <ScrollView style={styles.modalScrollView}>
            {currentStep === 1 ? renderTypeSelection() : 
             currentStep === 2 ? renderDetailsForm() : 
             renderContentCreation()}
          </ScrollView>
          
          <View style={styles.modalFooter}>
            <TouchableOpacity 
              style={styles.nextButton}
              onPress={handleNextStep}
            >
              <Text style={styles.nextButtonText}>
                {currentStep === 3 ? (editMode ? 'Update Activity' : 'Create Activity') : 'Next'}
              </Text>
              <Icon name={currentStep === 3 ? 'check' : 'arrow-right'} size={16} color="#fff" style={styles.nextButtonIcon} />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F6FF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
  },
  offlineIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginLeft: 10,
  },
  offlineText: {
    fontSize: 10,
    color: '#fff',
    marginLeft: 4,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#B052F7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterContainer: {
    padding: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    paddingHorizontal: 10,
    marginBottom: 10,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 16,
    color: '#333',
  },
  filterTabs: {
    flexGrow: 0,
  },
  filterTabsContent: {
    paddingRight: 20,
  },
  filterTab: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    marginRight: 8,
  },
  activeFilterTab: {
    backgroundColor: '#B052F7',
  },
  filterTabText: {
    fontSize: 14,
    color: '#666',
  },
  activeFilterTabText: {
    color: '#fff',
    fontWeight: '600',
  },
  statisticsContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 15,
    marginHorizontal: 15,
    marginTop: 15,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  statisticsItem: {
    flex: 1,
    alignItems: 'center',
  },
  statisticsNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  statisticsLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 20,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 30,
  },
  createButton: {
    backgroundColor: '#B052F7',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  activitiesList: {
    padding: 15,
  },
  activityCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  activityIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  activityInfo: {
    flex: 1,
  },
  activityName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  activityType: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  activityMeta: {
    fontSize: 12,
    color: '#888',
  },
  activityActions: {
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  activityActionButton: {
    padding: 8,
  },
  syncInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    backgroundColor: '#f5f5f5',
  },
  syncInfoText: {
    fontSize: 12,
    color: '#999',
    marginLeft: 5,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#F8F6FF',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalBackButton: {
    padding: 8,
  },
  modalHeaderTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  stepIndicator: {
    flexDirection: 'row',
  },
  stepDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ddd',
    marginHorizontal: 4,
  },
  activeStepDot: {
    backgroundColor: '#B052F7',
  },
  modalScrollView: {
    flex: 1,
  },
  modalContent: {
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  modalFooter: {
    padding: 20,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  nextButton: {
    backgroundColor: '#B052F7',
    borderRadius: 10,
    padding: 15,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  nextButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  nextButtonIcon: {
    marginLeft: 10,
  },
  typeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  selectedTypeCard: {
    backgroundColor: '#B052F7',
    borderColor: '#B052F7',
  },
  typeTextContainer: {
    flex: 1,
    marginLeft: 15,
  },
  typeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  typeDescription: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  selectedTypeText: {
    color: '#fff',
  },
  checkIcon: {
    marginLeft: 10,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    marginTop: 15,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  quizTypeContainer: {
    marginTop: 20,
  },
  quizTypeOptions: {
    flexDirection: 'row',
    marginTop: 8,
  },
  quizTypeOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginHorizontal: 5,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  selectedQuizType: {
    backgroundColor: '#B052F7',
    borderColor: '#B052F7',
  },
  quizTypeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginLeft: 8,
  },
  selectedQuizTypeText: {
    color: '#fff',
  },
  recordingContainer: {
    marginBottom: 20,
  },
  recordButton: {
    backgroundColor: '#B052F7',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
  },
  recordingActive: {
    backgroundColor: '#FF6B6B',
  },
  recordButtonText: {
    color: '#fff',
    fontWeight: '600',
    marginLeft: 8,
  },
  recordingText: {
    color: '#FF6B6B',
    fontSize: 14,
    marginTop: 8,
    fontStyle: 'italic',
  },
  transcriptionResult: {
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    padding: 12,
    marginTop: 15,
  },
  transcriptionTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 5,
  },
  transcriptionText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  addTranscriptionButton: {
    backgroundColor: '#B052F7',
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  dividerText: {
    textAlign: 'center',
    fontSize: 14,
    color: '#666',
    marginVertical: 15,
    fontWeight: '600',
  },
  helpText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
  },
  addItemContainer: {
    flexDirection: 'row',
    marginBottom: 15,
  },
  itemInput: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    marginRight: 10,
  },
  addButton: {
    backgroundColor: '#B052F7',
    borderRadius: 8,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemsList: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 15,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  itemsListTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    borderRadius: 6,
    padding: 12,
    marginBottom: 8,
  },
  itemIconContainer: {
    marginRight: 10,
  },
  itemText: {
    flex: 1,
    fontSize: 14,
    color: '#333',
  },
  removeButton: {
    padding: 5,
  },
  matchingItemCard: {
    backgroundColor: '#f9f9f9',
    borderRadius: 6,
    marginBottom: 8,
    overflow: 'hidden',
  },
  matchingItemTextContainer: {
    padding: 12,
  },
  matchingItemImage: {
    width: '100%',
    height: 150,
  },
  definitionItemCard: {
    backgroundColor: '#f9f9f9',
    borderRadius: 6,
    padding: 12,
    marginBottom: 8,
  },
  definitionWord: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  definitionContainer: {
    marginTop: 8,
  },
  definitionDivider: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  definitionText: {
    fontSize: 14,
    color: '#333',
    fontStyle: 'italic',
  },
  generateImagesButton: {
    backgroundColor: '#B052F7',
    borderRadius: 8,
    padding: 12,
    marginTop: 15,
  },
  generatingImages: {
    backgroundColor: '#999',
  },
  generateImagesButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  dictionaryLookupButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    padding: 12,
    marginTop: 15,
  },
  fetchingDefinitions: {
    backgroundColor: '#999',
  },
  dictionaryLookupButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  buttonWithLoader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default ActivityManagerScreen;