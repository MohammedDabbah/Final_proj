import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import LoginScreen from './LoginScreen';
import SignupScreen from './SignupScreen';

const GreetingScreen = () => {
  const [formType, setFormType] = useState(null); // Tracks whether to show "Login" or "Sign Up"
  const animationValue = useRef(new Animated.Value(0)).current; // Controls the slide animation
  const [isAnimating, setIsAnimating] = useState(false); // Prevent interaction during animation

  // Function to slide the form in
  const showForm = (type) => {
    if (isAnimating) return; // Prevent multiple triggers during animation
    setFormType(type); // Set the form type ("Login" or "Sign Up")
    setIsAnimating(true);
    Animated.timing(animationValue, {
      toValue: 1, // Move the card up
      duration: 1000,
      useNativeDriver: true,
    }).start(() => setIsAnimating(false));
  };

  // Function to reset to the greeting page
  const hideForm = () => {
    if (isAnimating) return; // Prevent multiple triggers during animation
    setIsAnimating(true);
    Animated.timing(animationValue, {
      toValue: 0, // Move the card back down
      duration: 500,
      useNativeDriver: true,
    }).start(() => {
      setIsAnimating(false);
      setFormType(null); // Reset the form type after animation
    });
  };

  const slideUp = animationValue.interpolate({
    inputRange: [0, 1],
    outputRange: [600, 0], // Adjust based on your screen height
  });

  return (
    <View style={styles.container}>
      {/* Greeting Page */}
      <View style={styles.greetingContainer}>
        <Text style={styles.title}>Welcome Back!</Text>
        <Text style={styles.subtitle}>
          Enter personal details to access your account
        </Text>

        <TouchableOpacity
          style={styles.button}
          onPress={() => showForm('Login')}
          accessible
          accessibilityLabel="Navigate to Sign In Form"
          accessibilityRole="button"
        >
          <Text style={styles.buttonText}>Sign In</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.buttonOutline}
          onPress={() => showForm('Signup')}
          accessible
          accessibilityLabel="Navigate to Sign Up Form"
          accessibilityRole="button"
        >
          <Text style={styles.buttonOutlineText}>Sign Up</Text>
        </TouchableOpacity>
      </View>

      {/* Sliding Form */}
      {formType && (
        <Animated.View
          style={[styles.formContainer, { transform: [{ translateY: slideUp }] }]}
        >
          <TouchableOpacity
            style={styles.backButton}
            onPress={hideForm}
            accessible
            accessibilityLabel="Go Back to Greeting Screen"
            accessibilityRole="button"
          >
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>
          {formType === 'Login' ? <LoginScreen /> : <SignupScreen />}
        </Animated.View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#EEF2FA',
  },
  greetingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 50,
  },
  button: {
    backgroundColor: '#6200EE',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    width: '90%',
    marginVertical: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  buttonOutline: {
    borderColor: '#6200EE',
    borderWidth: 2,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    width: '90%',
    marginVertical: 10,
  },
  buttonOutlineText: {
    color: '#6200EE',
    fontSize: 16,
    fontWeight: 'bold',
  },
  formContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    padding: 20,
    elevation: 10, // Shadow for Android
    shadowColor: '#000', // Shadow for iOS
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
  },
  backButton: {
    alignSelf: 'flex-start',
    marginBottom: 10,
  },
  backText: {
    color: '#6200EE',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default GreetingScreen;
