import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
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
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Create Activity</Text>
        <TouchableOpacity style={styles.addButton} onPress={addTask}>
          <Icon name="plus" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.inputLabel}>Title</Text>
        <TextInput style={styles.input} value={title} onChangeText={setTitle} />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.inputLabel}>Description</Text>
        <TextInput style={[styles.input, styles.textArea]} multiline value={description} onChangeText={setDescription} />
      </View>

      <View style={styles.formGroup}>
      <Text style={styles.inputLabel}>Task Type</Text>
      <View style={styles.optionRow}>
        {['word', 'sentence'].map((t) => (
          <TouchableOpacity
            key={t}
            style={[styles.optionButton, type === t && styles.selectedOptionButton]}
            onPress={() => setType(t)}
          >
            <Text style={[styles.optionText, type === t && styles.selectedOptionText]}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>

    <View style={styles.formGroup}>
      <Text style={styles.inputLabel}>Skill</Text>
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
              isDisabled && { backgroundColor: '#ddd', borderColor: '#ccc' },
            ]}
            onPress={() => {
              if (!isDisabled) setSkill(s);
            }}
            disabled={isDisabled}
          >
            <Text
              style={[
                styles.optionText,
                isSelected && styles.selectedOptionText,
                isDisabled && { color: '#999' },
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
      <Text style={styles.inputLabel}>Target Student Level</Text>
      <View style={styles.optionRow}>
        {['beginner', 'intermediate', 'advanced'].map((level) => (
          <TouchableOpacity
            key={level}
            style={[styles.optionButton, targetLevel === level && styles.selectedOptionButton]}
            onPress={() => setTargetLevel(level)}
          >
            <Text style={[styles.optionText, targetLevel === level && styles.selectedOptionText]}>
              {level.charAt(0).toUpperCase() + level.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
  </View>




    <View style={styles.formGroup}>
      <Text style={styles.inputLabel}>Topic (for AI)</Text>
      <TextInput
        style={styles.input}
        value={topic}
        onChangeText={setTopic}
        placeholder="e.g. animals, travel, technology"
      />
    

    <TouchableOpacity
      style={[styles.submitButton, loadingAI && { backgroundColor: '#999' }]}
      onPress={generateTasksWithAI}
      disabled={loadingAI}
    >
      <Text style={styles.submitButtonText}>
        {loadingAI ? 'Generating...' : 'Generate Tasks with AI'}
      </Text>
    </TouchableOpacity>

    </View>

    <View style={styles.formGroup}>
     <Text style={styles.inputLabel}>Tasks</Text>
      {tasks.map((task, i) => (
        <View key={i} style={styles.taskCard}>
          <View style={styles.taskHeader}>
            <Text style={styles.taskTitle}>Task #{i + 1}</Text>
            <TouchableOpacity onPress={() => removeTask(i)} style={styles.removeButton}>
              <Icon name="trash" size={18} color="#FF6B6B" />
            </TouchableOpacity>
          </View>
          <TextInput
            placeholder="Prompt"
            style={styles.input}
            value={task.prompt}
            onChangeText={(text) => updateTask(i, 'prompt', text)}
          />
          <TextInput
            placeholder="Expected Answer (optional)"
            style={styles.input}
            value={task.expectedAnswer}
            onChangeText={(text) => updateTask(i, 'expectedAnswer', text)}
          />
        </View>       
      ))}
      </View>

      <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
        <Text style={styles.submitButtonText}>Submit Activity</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F8F6FF',
    flex: 1,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
  },
  addButton: {
    backgroundColor: '#B052F7',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  formGroup: {
    marginBottom: 15,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
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
  taskCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  submitButton: {
    backgroundColor: '#B052F7',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  optionRow: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  marginTop: 8,
},
optionButton: {
  flex: 1,
  backgroundColor: '#f5f5f5',
  paddingVertical: 10,
  marginRight: 10,
  borderRadius: 8,
  alignItems: 'center',
  borderWidth: 1,
  borderColor: '#e0e0e0',
},
selectedOptionButton: {
  backgroundColor: '#B052F7',
  borderColor: '#B052F7',
},
optionText: {
  color: '#333',
  fontWeight: '600',
  fontSize: 14,
},
selectedOptionText: {
  color: '#fff',
},
taskHeader: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: 10,
},
taskTitle: {
  fontSize: 16,
  fontWeight: 'bold',
  color: '#333',
},
removeButton: {
  padding: 4,
},


});

export default ActivityManagerScreen;
