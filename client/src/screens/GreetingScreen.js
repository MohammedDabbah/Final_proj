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

const FloatingCircle = ({ style }) => (
  <View style={[styles.circle, style]} />
);

const GreetingScreen = () => {
  const [formType, setFormType] = useState(null);
  const animationValue = useRef(new Animated.Value(0)).current;
  const [isAnimating, setIsAnimating] = useState(false);

  const showForm = (type) => {
    if (isAnimating) return;
    setFormType(type);
    setIsAnimating(true);
    Animated.timing(animationValue, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start(() => setIsAnimating(false));
  };

  const hideForm = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    Animated.timing(animationValue, {
      toValue: 0,
      duration: 500,
      useNativeDriver: true,
    }).start(() => {
      setIsAnimating(false);
      setFormType(null);
    });
  };

  const slideUp = animationValue.interpolate({
    inputRange: [0, 1],
    outputRange: [600, 0],
  });

  return (
    <View style={styles.container}>
      {/* Background Circles */}
      <FloatingCircle style={styles.circle1} />
      <FloatingCircle style={styles.circle2} />
      <FloatingCircle style={styles.circle3} />
      <FloatingCircle style={styles.circle4} />

      {/* Content Container */}
      <View style={styles.contentContainer}>
        {/* Top Section with Title */}
        <View style={styles.titleSection}>
          <Text style={styles.title}>Welcome Back!</Text>
          <Text style={styles.subtitle}>
            Enter personal details to your employee account
          </Text>
        </View>

        {/* Bottom Section with Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.button}
            onPress={() => showForm('Login')}
            accessible
            accessibilityLabel="Navigate to Sign In Form"
            accessibilityRole="button"
          >
            <Text style={styles.buttonText}>Sign in</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.buttonOutline}
            onPress={() => showForm('Signup')}
            accessible
            accessibilityLabel="Navigate to Sign Up Form"
            accessibilityRole="button"
          >
            <Text style={styles.buttonOutlineText}>Sign up</Text>
          </TouchableOpacity>
        </View>
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
    backgroundColor: '#c1bbf0', // Updated to new theme color
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'space-between',
    padding: 20,
  },
  titleSection: {
    marginTop: '20%',
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: 40,
    paddingHorizontal: 20,
  },
  button: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 15,
    paddingHorizontal: 35,
    borderRadius: 25,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  buttonText: {
    color: '#B052F7', // Updated to new theme color
    fontSize: 16,
    fontWeight: '600',
  },
  buttonOutline: {
    backgroundColor: 'transparent',
    paddingVertical: 15,
    paddingHorizontal: 35,
    borderRadius: 25,
  },
  buttonOutlineText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
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
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
  },
  backButton: {
    alignSelf: 'flex-start',
    marginBottom: 10,
  },
  backText: {
    color: '#B052F7', // Updated to new theme color
    fontSize: 16,
    fontWeight: 'bold',
  },
  // Floating circles styles
  circle: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  circle1: {
    width: 150,
    height: 150,
    top: -20,
    right: -20,
    backgroundColor: 'rgba(176, 82, 247, 0.7)', // Updated with new theme color
  },
  circle2: {
    width: 100,
    height: 100,
    top: 100,
    left: -20,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  circle3: {
    width: 80,
    height: 80,
    top: 200,
    right: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  circle4: {
    width: 120,
    height: 120,
    bottom: 400,
    left: 20,
    backgroundColor: 'rgba(176, 82, 247, 0.5)', // Updated with new theme color
  },
});

export default GreetingScreen;