import React, { useContext, useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, Animated, Dimensions, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import { AuthContext } from '../../Auth/AuthContext';
import RenderCard from '../components/renderCard';

const { width } = Dimensions.get('window');

const cardData = [
  {
    title: 'News',
    subtitle: 'Stay updated with latest educational news',
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
];

const IndexScreen = ({ navigation }) => {
  const { user } = useContext(AuthContext); // Access user data from AuthContext
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
          <Icon name="search" size={20} color="#B052F7" style={styles.searchIcon} />
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

      {/* Bottom Navigation */}
      <Animated.View style={[styles.bottomNav, { opacity: fadeAnim }]}>
        {[
          { name: 'ReviewMistakes', icon: 'home' },
          { name: 'Notifications', icon: 'bell' },
          { name: 'Quiz', icon: 'graduation-cap' },
          { name: 'Profile', icon: 'user' },
        ].map((item, index) => (
          <TouchableOpacity
            key={index}
            style={styles.navItem}
            onPress={() => {
              navigation.navigate(item.name);
            }}
          >
            <Icon name={item.icon} size={24} color="#B052F7" />
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
    color: '#B052F7',
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
    borderTopWidth: 1,
    borderColor: '#fff',
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

export default IndexScreen;
