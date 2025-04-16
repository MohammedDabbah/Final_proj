import React, { useContext, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import { AuthContext } from '../../Auth/AuthContext';

const { width } = Dimensions.get('window');

const teacherCardData = [
  // {
  //   title: 'My Students',
  //   subtitle: 'Manage and support your learners',
  //   icon: 'users',
  //   bgColor: '#6B5ECD',
  //   screen: 'MyStudentsScreen',
  // },
  {
    title: 'Create Activity',
    subtitle: 'Design quizzes and writing tasks',
    icon: 'plus-circle',
    bgColor: '#FF6B81',
    screen: 'CreateActivityScreen',
  },
  {
    title: 'Evaluate Tasks',
    subtitle: 'Review and give feedback',
    icon: 'check',
    bgColor: '#4CAF50',
    screen: 'EvaluateScreen',
  },
//   {
//     title: 'Performance',
//     subtitle: 'Track progress over time',
//     icon: 'line-chart',
//     bgColor: '#FFA500',
//     screen: 'PerformanceScreen',
//   },
];

const TeacherScreen = ({ navigation }) => {
  const { user } = useContext(AuthContext);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(width)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.header, { opacity: fadeAnim }]}>
        <Text style={styles.greetingText}>
          Hello, <Text style={styles.nameText}>{user?.FName || 'Teacher'}</Text>
        </Text>
        <Text style={styles.subGreeting}>Ready to inspire minds today?</Text>
      </Animated.View>

      <View style={styles.cardsContainer}>
        {teacherCardData.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={[styles.card, { backgroundColor: item.bgColor }]}
            onPress={() => navigation.navigate(item.screen)}
          >
            <Icon name={item.icon} size={28} color="#fff" style={styles.cardIcon} />
            <Text style={styles.cardTitle}>{item.title}</Text>
            <Text style={styles.cardSubtitle}>{item.subtitle}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ✅ Bottom Navigation */}
            <Animated.View style={[styles.bottomNav, { opacity: fadeAnim }]}>
        {[
            { name: 'FollowList', icon: 'user-plus', type: 'user' },
            { name: 'Messages', icon: 'envelope' },
            { name: 'PerformanceScreen', icon: 'line-chart' },
            { name: 'Profile', icon: 'user' },
        ].map((item, index) => (
            <TouchableOpacity
            key={index}
            style={styles.navItem}
            onPress={() => {
                if (item.name === 'FollowList') {
                navigation.navigate(item.name, { type: item.type });
                } else {
                navigation.navigate(item.name);
                }
            }}
            >
            <Icon name={item.icon} size={24} color="#B052F7" />
            <Text style={styles.navText}>{item.name.replace('Screen', '')}</Text>
            </TouchableOpacity>
        ))}
        </Animated.View>

    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F6FF',
    paddingHorizontal: 20,
    paddingTop: 40,
  },
  header: {
    marginBottom: 20,
  },
  greetingText: {
    fontSize: 26,
    color: '#000',
    fontWeight: '600',
  },
  subGreeting: {
    fontSize: 16,
    color: '#666',
    marginTop: 5,
  },
  nameText: {
    color: '#B052F7',
    fontWeight: 'bold',
  },
  cardsContainer: {
    flex: 1,
    marginTop: 10,
    marginBottom: 80, // Add margin so bottom nav doesn't overlap
  },
  card: {
    padding: 20,
    borderRadius: 15,
    marginBottom: 15,
  },
  cardIcon: {
    marginBottom: 10,
  },
  cardTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  cardSubtitle: {
    color: '#f0f0f0',
    marginTop: 5,
  },
  bottomNav: {
    position: 'absolute',
    bottom: 20,
    left: 10,
    right: 10,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 10,
    backgroundColor: '#fff',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  navItem: {
    alignItems: 'center',
  },
  navText: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
  },
});

export default TeacherScreen;
