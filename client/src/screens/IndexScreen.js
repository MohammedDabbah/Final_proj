import React, { useContext, useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, Animated, Dimensions, TouchableOpacity, ScrollView } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import { AuthContext } from '../../Auth/AuthContext';
import RenderCard from '../components/renderCard';

const { width } = Dimensions.get('window');

const cardData = [
  {
    title: 'News',
    subtitle: 'Stay updated with the latest educational news',
    icon: 'newspaper-o',
    bgColor: '#6B5ECD',
  },
  {
    title: 'Improve Writing',
    subtitle: 'Enhance your writing skills',
    icon: 'pencil',
    bgColor: '#FF8C69',
  },
  {
    title: 'Improve Reading',
    subtitle: 'Boost your reading comprehension',
    icon: 'book',
    bgColor: '#FF6B81',
  },
  {
    title: 'Vocabulary',
    subtitle: 'Expand your word knowledge',
    icon: 'language',
    bgColor: '#4CAF50',
  },
   {
    title: 'Activity',
    subtitle: 'Take your activities',
  icon: 'bolt', 
    bgColor: '#678fd6',
  },
];

const IndexScreen = ({ navigation }) => {
  const { user } = useContext(AuthContext);
  const [initialWord, setInitialWord] = useState('');

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

  return (
    <View style={styles.container}>
      {/* Header Section */}
      <Animated.View style={[styles.header, { opacity: fadeAnim }]}>
        <Text style={styles.greetingText}>
          Hi, <Text style={styles.nameText}>{user?.FName || 'User'}</Text>
        </Text>
      </Animated.View>

      {/* Search Bar */}
      <Animated.View style={[styles.searchContainer, { opacity: fadeAnim }]}>
        <TouchableOpacity
          onPress={() => {
            if (initialWord.trim() !== '') {
              navigation.navigate('Dict', { initialWord });
            } else {
              alert('Please enter a word to search!');
            }
          }}
        >
          <Icon name="search" size={20} color="#6B5ECD" style={styles.searchIcon} />
        </TouchableOpacity>
        <TextInput
          placeholder="search a word"
          style={styles.searchInput}
          placeholderTextColor="#B4B4B4"
          value={initialWord}
          onChangeText={setInitialWord}
        />
      </Animated.View>

      {/* Cards Container */}
      <ScrollView>
        <View style={styles.cardsContainer}>
          {cardData.map((item, index) => (
            <RenderCard
              key={index}
              item={item}
              index={index}
              fadeAnim={fadeAnim}
              slideAnim={slideAnim}
              scaleAnim={scaleAnim}
              navigation={navigation}
            />
          ))}
        </View>
      </ScrollView>

      {/* Enhanced Bottom Navigation */}
      <Animated.View style={[styles.bottomNav, { opacity: fadeAnim }]}>
        {[
          { name: 'FollowList', icon: 'user-plus', type: 'user', displayName: 'Teachers' },
          { name: 'Messages', icon: 'envelope', displayName: 'Messages' },
          { name: 'Progress', icon: 'graduation-cap', displayName: 'Progress' },
          { name: 'Profile', icon: 'user', displayName: 'Profile' },
        ].map((item, index) => (
          <TouchableOpacity
            key={index}
            style={styles.navItem}
            onPress={() => {
              navigation.navigate(item.name);
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
    color: '#6B5ECD',
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
    paddingBottom: 80, // Back to original size
  },

  // Enhanced Bottom Navigation - Smaller Size
  bottomNav: {
    position: 'absolute',
    bottom: 20, // Back to original position
    left: 10,   // Back to original margins
    right: 10,  // Back to original margins
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 10, // Back to original padding
    backgroundColor: '#FFFFFF',
    borderRadius: 10, // Back to original radius
    shadowColor: '#6B5ECD',
    shadowOffset: { width: 0, height: 4 }, // Reduced shadow
    shadowOpacity: 0.1, // Reduced opacity
    shadowRadius: 8,    // Reduced radius
    elevation: 6,       // Reduced elevation
    borderWidth: 1,     // Thinner border
    borderColor: '#F0EBFF',
  },
  navItem: {
    alignItems: 'center',
    paddingVertical: 4,  // Reduced padding
    paddingHorizontal: 8, // Reduced padding
  },
  navIconContainer: {
    width: 36,    // Smaller icon container
    height: 36,   // Smaller icon container
    borderRadius: 10, // Smaller radius
    backgroundColor: '#F0EBFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4, // Reduced margin
  },
  navText: {
    fontSize: 11, // Slightly smaller text
    color: '#6B5ECD',
    fontWeight: '600',
  },
});

export default IndexScreen;