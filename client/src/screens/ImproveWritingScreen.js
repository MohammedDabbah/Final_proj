import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native'; // Import the navigation hook

const ImprovingWritingScreen = () => {
  const navigation = useNavigation(); // Get navigation prop using the hook

  const navigateToSentencePractice = () => {
    navigation.navigate('SentencePracticeWriting'); // Navigate to the 'SentencePractice' screen
  };
  const navigateToWordsPracticeWriting = () => {
    navigation.navigate('WordsPracticeWriting'); // Navigate to the 'SentencePractice' screen
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Decorative background elements - Repositioned and resized */}
      <View style={styles.decorativeCirclesContainer}>
        <View style={styles.decorativeCircle1} />
        <View style={styles.decorativeCircle2} />
        <View style={styles.decorativeCircle3} />
      </View>
      
      {/* Main content card */}
      <View style={styles.mainCard}>
        <View style={styles.iconCircle}>
          <Feather name="edit-3" size={24} color="white" />
        </View>
        <Text style={styles.mainCardTitle}>Improving Your Writing</Text>
      </View>
      
      {/* Description section */}
      <View style={styles.descriptionContainer}>
        <Text style={styles.descriptionTitle}>Description</Text>
        <Text style={styles.descriptionText}>
          Writing is fundamental to effective communication and self-expression. 
          Regular practice helps develop clarity of thought, vocabulary enrichment, 
          and better articulation of ideas. Through consistent writing exercises, 
          you can enhance your creativity, critical thinking, and overall language 
          proficiency. This tool provides structured practice for both word usage 
          and sentence construction.
        </Text>
      </View>
      
      {/* Bottom action cards */}
      <View style={styles.bottomSection}>
        <TouchableOpacity 
        style={styles.actionCard}
        onPress={navigateToWordsPracticeWriting} // Add this onPress handler for navigation

        >
          <View style={styles.iconContainer}>
            <Feather name="book" size={24} color="black" />
          </View>
          <Text style={styles.actionCardText}>Words Practice</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.actionCard} 
          onPress={navigateToSentencePractice} // Add this onPress handler for navigation
        >
          <View style={styles.iconContainer}>
            <Feather name="align-left" size={24} color="black" />
          </View>
          <Text style={styles.actionCardText}>Sentences Practice</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f8',
  },
  decorativeCirclesContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 200,
    overflow: 'visible',
    zIndex: 1,
  },
  decorativeCircle1: {
    position: 'absolute',
    top: 20,
    right: 20,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#F8D568', // Yellow circle
    opacity:2,
    zIndex: 1,
  },
  decorativeCircle2: {
    position: 'absolute',
    top: 30,
    right: 100,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#5454CE', // Purple circle
    zIndex: 1,
  },
  decorativeCircle3: {
    position: 'absolute',
    top: 20,
    right: 70,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#F29CB1', // Pink circle - Moved to be more visible
    opacity: 1, // Increased opacity for better visibility
    zIndex: 3, // Higher z-index to ensure it's on top
  },
  mainCard: {
    marginTop: 80,
    marginHorizontal: 20,
    height: 160,
    backgroundColor: '#5454CE', // Purple main card
    borderRadius: 20,
    padding: 20,
    shadowColor: '#080707',
    justifyContent: 'flex-end',
    zIndex: 6, // Ensure it's above the circles
  },
  iconCircle: {
    position: 'absolute',
    top: -20,
    left: 20,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#5454CE',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#080707',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 5,
  },
  mainCardTitle: {
    color: 'white',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 30,
  },
  descriptionContainer: {
    marginTop: 30,
    marginHorizontal: 20,
  },
  descriptionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  descriptionText: {
    fontSize: 15,
    lineHeight: 22,
    color: '#444',
  },
  bottomSection: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#5454CE', // Purple bottom section
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 20,
    paddingBottom: 30, // Added extra padding at the bottom
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 15,
    marginBottom: 15,
    height: 70,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  iconContainer: {
    width: 60,
    height: '100%',
    backgroundColor: '#FFF0D9', // Light beige
    borderTopLeftRadius: 15,
    borderBottomLeftRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionCardText: {
    marginLeft: 15,
    fontSize: 16,
    fontWeight: '500',
  },
});

export default ImprovingWritingScreen;