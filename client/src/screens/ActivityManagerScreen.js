import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  SafeAreaView,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import serverApi from '../../api/serverApi';
import aiApi from '../../api/aiApi'; // make sure the path is correct


const ActivityManagerScreen = () => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('word');
  const [skill, setSkill] = useState('reading');
  const [tasks, setTasks] = useState([{ prompt: '', expectedAnswer: '' }]);
  const [topic, setTopic] = useState('');
  const [loadingAI, setLoadingAI] = useState(false);
  const [targetLevel, setTargetLevel] = useState('beginner');
  const [eligibleStudents, setEligibleStudents] = useState([]);
  const [assignedTo, setAssignedTo] = useState([]);


  useEffect(() => {
    if (!targetLevel) return;

    const fetchFollowers = async () => {
      try {
        const res = await serverApi.get(`/api/follow/followers/by-level?level=${targetLevel}`, { withCredentials: true });
        setEligibleStudents(res.data.followers || []);
      } catch (err) {
        console.error('Error fetching eligible students', err);
      }
    };
    fetchFollowers();
  }, [targetLevel]);

  const addTask = () => {
    setTasks([...tasks, { prompt: '', expectedAnswer: '' }]);
  };

  const updateTask = (index, field, value) => {
    const updated = [...tasks];
    updated[index][field] = value;
    setTasks(updated);
  };

  const handleSubmit = async () => {
    try {
      await serverApi.post('/api/activities', {
        title,
        description,
        type,
        skill,
        tasks,
        targetLevel,
      },{withCredentials:true});
      Alert.alert('Success', 'Activity created!');
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Failed to create activity.');
    }
  };

  const removeTask = (index) => {
    const updated = [...tasks];
    updated.splice(index, 1);
    setTasks(updated);
  };

  const generateTasksWithAI = async () => {
  if (!type || !skill || !topic) {
    alert('Please choose type, skill, and enter a topic.');
    return;
  }

  const taskCount = type === 'word' ? 5 : 3;

  const systemMessage = {
    role: 'system',
    content: 'You are a helpful assistant for language teachers. Return ONLY a valid JSON array of tasks. Do NOT include explanations or text outside the JSON. Use "prompt" for all tasks. Use "expectedAnswer" only if the task type is "word".',
  };

  // Define the user prompt based on the task type and skill
  let taskInstruction = '';

  if (type === 'word') {
    taskInstruction = `Generate ${taskCount} vocabulary words with definitions for the topic "${topic}". Return a JSON array of objects like: [{ "prompt": "Word", "expectedAnswer": "Definition" }]`;
  } else if (type === 'sentence') {
    if (skill === 'reading' || skill === 'speech') {
      taskInstruction = `Generate ${taskCount} simple sentences related to the topic "${topic}" that a student should read or say aloud. Return JSON like: [{ "prompt": "The cat is on the roof." }]`;
    } else if (skill === 'writing') {
      taskInstruction = `Generate ${taskCount} questions or writing prompts about "${topic}" for students to answer in writing. Return JSON like: [{ "prompt": "Describe your last vacation." }]`;
    }
  }

  const userMessage = {
    role: 'user',
    content: taskInstruction + ` Ensure the tasks are appropriate for ${targetLevel} level students.`,
  };

  try {
    setLoadingAI(true);
    const res = await aiApi.post('/chat/completions', {
      model: 'gpt-3.5-turbo',
      messages: [systemMessage, userMessage],
    });

    const raw = res.data.choices[0].message.content;

    let parsed;
    try {
      parsed = JSON.parse(raw);

      // Clean up expectedAnswer if not needed
      if (type !== 'word') {
        parsed = parsed.map(({ prompt }) => ({ prompt }));
      }

      setTasks(parsed);
    } catch (err) {
      console.error('⚠️ Failed to parse AI response:', err.message);
      console.log('Raw output:', raw);
      alert('Could not parse AI response. Try changing the topic or trying again.');
    }
  } catch (err) {
    console.error('❌ AI generation failed:', err.message);
    alert('AI generation failed. Please try again.');
  } finally {
    setLoadingAI(false);
  }
};

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Create Activity</Text>
          <TouchableOpacity 
            style={styles.addButton} 
            onPress={addTask}
            activeOpacity={0.8}
          >
            <Icon name="plus" size={16} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        <ScrollView 
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Basic Information Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Basic Information</Text>
            
            <View style={styles.formGroup}>
              <Text style={styles.inputLabel}>Activity Title</Text>
              <TextInput 
                style={styles.input} 
                value={title} 
                onChangeText={setTitle}
                placeholder="Enter activity title"
                placeholderTextColor="#999999"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.inputLabel}>Description</Text>
              <TextInput 
                style={[styles.input, styles.textArea]} 
                multiline 
                value={description} 
                onChangeText={setDescription}
                placeholder="Describe the activity purpose and goals"
                placeholderTextColor="#999999"
              />
            </View>
          </View>

          {/* Configuration Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Configuration</Text>
            
            <View style={styles.formGroup}>
              <Text style={styles.inputLabel}>Task Type</Text>
              <View style={styles.optionRow}>
                {['word', 'sentence'].map((t) => (
                  <TouchableOpacity
                    key={t}
                    style={[styles.optionButton, type === t && styles.selectedOptionButton]}
                    onPress={() => setType(t)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.optionText, type === t && styles.selectedOptionText]}>
                      {t.charAt(0).toUpperCase() + t.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.inputLabel}>Skill Focus</Text>
              <View style={styles.optionRow}>
              {['reading', 'writing'].map((s) => {
                const isDisabled = type === 'word' && s === 'writing';
                const isSelected = skill === s;

                return (
                  <TouchableOpacity
                    key={s}
                    style={[
                      styles.optionButton,
                      isSelected && styles.selectedOptionButton,
                      isDisabled && styles.disabledOptionButton,
                    ]}
                    onPress={() => {
                      if (!isDisabled) setSkill(s);
                    }}
                    disabled={isDisabled}
                    activeOpacity={isDisabled ? 1 : 0.8}
                  >
                    <Text
                      style={[
                        styles.optionText,
                        isSelected && styles.selectedOptionText,
                        isDisabled && styles.disabledOptionText,
                      ]}
                    >
                      {s.charAt(0).toUpperCase() + s.slice(1)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.inputLabel}>Target Level</Text>
              <View style={styles.optionRow}>
                {['beginner', 'intermediate', 'advanced'].map((level) => (
                  <TouchableOpacity
                    key={level}
                    style={[styles.optionButton, targetLevel === level && styles.selectedOptionButton]}
                    onPress={() => setTargetLevel(level)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.optionText, targetLevel === level && styles.selectedOptionText]}>
                      {level.charAt(0).toUpperCase() + level.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          {/* AI Generation Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>AI Task Generation</Text>
            
            <View style={styles.formGroup}>
              <Text style={styles.inputLabel}>Topic</Text>
              <TextInput
                style={styles.input}
                value={topic}
                onChangeText={setTopic}
                placeholder="e.g. animals, travel, technology"
                placeholderTextColor="#999999"
              />
              
              <TouchableOpacity
                style={[styles.aiButton, loadingAI && styles.aiButtonDisabled]}
                onPress={generateTasksWithAI}
                disabled={loadingAI}
                activeOpacity={0.8}
              >
                <Icon 
                  name={loadingAI ? "spinner" : "magic"} 
                  size={16} 
                  color="#FFFFFF" 
                  style={styles.buttonIcon}
                />
                <Text style={styles.aiButtonText}>
                  {loadingAI ? 'Generating...' : 'Generate with AI'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Tasks Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Tasks ({tasks.length})</Text>
            
            {tasks.map((task, i) => (
              <View key={i} style={styles.taskCard}>
                <View style={styles.taskHeader}>
                  <Text style={styles.taskTitle}>Task {i + 1}</Text>
                  {tasks.length > 1 && (
                    <TouchableOpacity 
                      onPress={() => removeTask(i)} 
                      style={styles.removeButton}
                      activeOpacity={0.8}
                    >
                      <Icon name="trash" size={16} color="#F44336" />
                    </TouchableOpacity>
                  )}
                </View>
                
                <View style={styles.taskInputContainer}>
                  <TextInput
                    placeholder="Enter task prompt"
                    placeholderTextColor="#999999"
                    style={styles.taskInput}
                    value={task.prompt}
                    onChangeText={(text) => updateTask(i, 'prompt', text)}
                    multiline
                  />
                  
                  {type === 'word' && (
                    <TextInput
                      placeholder="Expected answer (optional)"
                      placeholderTextColor="#999999"
                      style={styles.taskInput}
                      value={task.expectedAnswer}
                      onChangeText={(text) => updateTask(i, 'expectedAnswer', text)}
                      multiline
                    />
                  )}
                </View>
              </View>       
            ))}
          </View>

          {/* Submit Button */}
          <TouchableOpacity 
            style={styles.submitButton} 
            onPress={handleSubmit}
            activeOpacity={0.8}
          >
            <Icon name="check" size={16} color="#FFFFFF" style={styles.buttonIcon} />
            <Text style={styles.submitButtonText}>Create Activity</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  container: {
    flex: 1,
    paddingTop: 50,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333333',
  },
  addButton: {
    backgroundColor: '#6B5ECD',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 16,
  },
  formGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666666',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F8F8F8',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333333',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  optionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  optionButton: {
    flex: 1,
    backgroundColor: '#F8F8F8',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  selectedOptionButton: {
    backgroundColor: '#6B5ECD',
    borderColor: '#6B5ECD',
  },
  disabledOptionButton: {
    backgroundColor: '#E8E8E8',
    borderColor: 'transparent',
  },
  optionText: {
    color: '#666666',
    fontWeight: '500',
    fontSize: 14,
  },
  selectedOptionText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  disabledOptionText: {
    color: '#CCCCCC',
  },
  aiButton: {
    backgroundColor: '#6B5ECD',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 12,
  },
  aiButtonDisabled: {
    backgroundColor: '#CCCCCC',
  },
  aiButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  buttonIcon: {
    marginRight: 8,
  },
  taskCard: {
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#6B5ECD',
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
  },
  removeButton: {
    padding: 4,
  },
  taskInputContainer: {
    gap: 12,
  },
  taskInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#333333',
    borderWidth: 1,
    borderColor: '#E8E8E8',
    minHeight: 40,
  },
  submitButton: {
    backgroundColor: '#6B5ECD',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 8,
    marginTop: 20,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ActivityManagerScreen;