import React, { useContext, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import { AuthContext } from '../../Auth/AuthContext';

const { width } = Dimensions.get('window');

const teacherCardData = [
  {
    title: 'Activity Manager',
    subtitle: 'Design quizzes and writing tasks',
    icon: 'plus-circle',
    bgColor: '#6B5ECD', // Changed to your brand color
    screen: 'ActivityManagerScreen',
  },
  {
    title: 'Evaluate Tasks',
    subtitle: 'Review and give feedback',
    icon: 'check',
    bgColor: '#4CAF50',
    screen: 'EvaluatePicker',
  },
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
      {/* Enhanced Header */}
      <Animated.View style={[styles.header, { opacity: fadeAnim }]}>
        <View style={styles.headerCard}>
          <View style={styles.headerContent}>
            <View style={styles.avatarContainer}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {(user?.FName || 'T').charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={styles.teacherBadge}>
                <Icon name="graduation-cap" size={12} color="#FFFFFF" />
              </View>
            </View>
            <Text style={styles.greetingText}>
              Hello, <Text style={styles.nameText}>{user?.FName || 'Teacher'}</Text>
            </Text>
          </View>
        </View>
      </Animated.View>

      {/* Enhanced Cards Container */}
      <View style={styles.cardsContainer}>
        {teacherCardData.map((item, index) => (
          <Animated.View
            key={index}
            style={{
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            }}
          >
            <TouchableOpacity
              style={[styles.card, { backgroundColor: item.bgColor }]}
              onPress={() => navigation.navigate(item.screen)}
              activeOpacity={0.8}
            >
              <View style={styles.cardHeader}>
                <View style={styles.cardIconContainer}>
                  <Icon name={item.icon} size={28} color="#fff" />
                </View>
                <View style={styles.cardArrow}>
                  <Icon name="arrow-right" size={16} color="rgba(255,255,255,0.8)" />
                </View>
              </View>
              <View style={styles.cardContent}>
                <Text style={styles.cardTitle}>{item.title}</Text>
                <Text style={styles.cardSubtitle}>{item.subtitle}</Text>
              </View>
            </TouchableOpacity>
          </Animated.View>
        ))}
      </View>

      {/* Enhanced Bottom Navigation */}
      <Animated.View style={[styles.bottomNav, { opacity: fadeAnim }]}>
        {[
          { name: 'FollowList', icon: 'user-plus', type: 'user', displayName: 'Students' },
          { name: 'Messages', icon: 'envelope', displayName: 'Messages' },
          { name: 'PerformanceScreen', icon: 'line-chart', displayName: 'Analytics' },
          { name: 'Profile', icon: 'user', displayName: 'Profile' },
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
            activeOpacity={0.7}
          >
            <View style={styles.navIconContainer}>
              <Icon name={item.icon} size={20} color="#6B5ECD" />
            </View>
            <Text style={styles.navText}>{item.displayName}</Text>
          </TouchableOpacity>
        ))}
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },

  // Enhanced Header
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  headerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#6B5ECD',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
    borderWidth: 2,
    borderColor: '#F0EBFF',
  },
  headerContent: {
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#6B5ECD',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#6B5ECD',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '700',
  },
  teacherBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  greetingText: {
    fontSize: 24,
    color: '#111827',
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 4,
  },
  nameText: {
    color: '#6B5ECD',
    fontWeight: '700',
  },
  subGreeting: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    fontWeight: '500',
  },

  // Enhanced Cards Container
  cardsContainer: {
    flex: 1,
    paddingHorizontal: 20,
    marginTop: 10,
    marginBottom: 100,
  },
  card: {
    borderRadius: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 0,
  },
  cardIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardArrow: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardContent: {
    padding: 20,
  },
  cardTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  cardSubtitle: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 14,
    fontWeight: '500',
  },

  // Enhanced Bottom Navigation
  bottomNav: {
    position: 'absolute',
    bottom: 30,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    shadowColor: '#6B5ECD',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 12,
    borderWidth: 2,
    borderColor: '#F0EBFF',
  },
  navItem: {
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  navIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#F0EBFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  navText: {
    fontSize: 12,
    color: '#6B5ECD',
    fontWeight: '600',
  },
});

export default TeacherScreen;