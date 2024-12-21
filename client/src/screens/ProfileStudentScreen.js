import React from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Animated, Dimensions } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';

const { width } = Dimensions.get('window');

const cardData = [
  {
    title: "News",
    subtitle: "Stay updated with latest educational news",
    icon: "newspaper-o",
    bgColor: '#6B5ECD',
  },
  {
    title: "Improve Writing",
    subtitle: "Enhance your writing skills",
    icon: "pencil",
    bgColor: '#FF8C69',
  },
  {
    title: "Improve Reading",
    subtitle: "Boost your reading comprehension",
    icon: "book",
    bgColor: '#FF6B81',
  }
];

const ProfileStudentScreen = ({ route, navigation }) => {
  const { userData } = route.params;
  
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const slideAnim = React.useRef(new Animated.Value(width)).current;
  const scaleAnim = React.useRef(new Animated.Value(0.9)).current;

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 20,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 20,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const renderCard = (item, index) => {
    return (
      <Animated.View
        key={index}
        style={[
          styles.card,
          {
            opacity: fadeAnim,
            transform: [
              { translateX: slideAnim },
              { scale: scaleAnim }
            ],
            backgroundColor: item.bgColor,
          },
        ]}
      >
        <TouchableOpacity 
          style={styles.cardButton}
          activeOpacity={0.9}
          onPress={() => {/* Add navigation here */}}
        >
          <View style={styles.cardContent}>
            <View style={styles.titleContainer}>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.cardSubtitle}>{item.subtitle}</Text>
            </View>
            <View style={styles.cardIconContainer}>
              <Icon name={item.icon} size={24} color="#FFF" />
            </View>
          </View>
          {/* Decorative circles */}
          <View style={[styles.decorativeCircle, styles.circle1]} />
          <View style={[styles.decorativeCircle, styles.circle2]} />
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header Section */}
      <Animated.View style={[styles.header, { opacity: fadeAnim }]}>
        <Text style={styles.greetingText}>
          Hi, <Text style={styles.nameText}>{userData?.FName || 'User'}</Text>
        </Text>
      </Animated.View>

      {/* Search Bar */}
      <Animated.View style={[styles.searchContainer, { opacity: fadeAnim }]}>
        <Icon name="search" size={20} color="#6A11DA" style={styles.searchIcon} />
        <TextInput 
          placeholder="Search" 
          style={styles.searchInput}
          placeholderTextColor="#B4B4B4"
        />
      </Animated.View>

      {/* Cards Container */}
      <View style={styles.cardsContainer}>
        {cardData.map((item, index) => renderCard(item, index))}
      </View>

      {/* Bottom Navigation */}
      <Animated.View style={[styles.bottomNav, { opacity: fadeAnim }]}>
        {[
          { name: 'Home', icon: 'home' },
          { name: 'Notifications', icon: 'bell' },
          { name: 'Study', icon: 'graduation-cap' },
          { name: 'Profile', icon: 'user' },
        ].map((item, index) => (
          <TouchableOpacity key={index} style={styles.navItem}>
            <Icon name={item.icon} size={24} color="#6A11DA" />
            <Text style={styles.navText}>{item.name}</Text>
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
    fontSize: 28,
    color: '#000',
    fontWeight: '600',
    paddingVertical: 10,
  },
  nameText: {
    color: '#6A11DA',
    fontWeight: 'bold',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    paddingHorizontal: 15,
    paddingVertical: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  cardsContainer: {
    flex: 1,
    paddingTop: 10,
  },
  card: {
    borderRadius: 15,
    marginBottom: 15,
    height: 100,
    overflow: 'hidden',
    position: 'relative',
  },
  cardButton: {
    flex: 1,
    padding: 20,
  },
  cardContent: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 2,
  },
  titleContainer: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 20,
    color: '#FFFFFF',
    fontWeight: 'bold',
    marginBottom: 5,
  },
  cardSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  cardIconContainer: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  decorativeCircle: {
    position: 'absolute',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 100,
  },
  circle1: {
    width: 100,
    height: 100,
    right: -20,
    top: -50,
  },
  circle2: {
    width: 70,
    height: 70,
    right: 40,
    bottom: -20,
  },
  bottomNav: {
    position: 'absolute',
    bottom: 20, // Adjusts the navigation away from the screen edge
    left: 10, // Adds slight margin from the sides
    right: 10,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 10,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderColor: '#fff',
    borderRadius: 10, // Optional: Add rounded corners for better aesthetics
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3, // For Android shadow effect
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

export default ProfileStudentScreen;