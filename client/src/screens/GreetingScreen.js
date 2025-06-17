import React, { useRef, useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Keyboard,
  Platform,
  TouchableWithoutFeedback,
} from "react-native";
import LoginScreen from "./LoginScreen";
import SignupScreen from "./SignupScreen";
import Icon from "react-native-vector-icons/FontAwesome";

const FloatingCircle = ({ style }) => <View style={[styles.circle, style]} />;

const GreetingScreen = () => {
  const [formType, setFormType] = useState(null); // Track which form is shown
  const animationValue = useRef(new Animated.Value(0)).current; // For sliding animation
  const [keyboardHeight, setKeyboardHeight] = useState(0); // To adjust form height dynamically
  const [isAnimating, setIsAnimating] = useState(false);

  // Floating animations
  const floatAnim1 = useRef(new Animated.Value(0)).current;
  const floatAnim2 = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Floating animation for circles
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim1, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim1, {
          toValue: 0,
          duration: 3000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim2, {
          toValue: 1,
          duration: 4000,
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim2, {
          toValue: 0,
          duration: 4000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Rotate animation for logo
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 20000,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  // Show form with animation
  const showForm = (type) => {
    if (isAnimating) return;
    setFormType(type);
    setIsAnimating(true);
    Animated.timing(animationValue, {
      toValue: 1,
      duration: 500,
      useNativeDriver: false,
    }).start(() => setIsAnimating(false));
  };

  // Hide form with animation
  const hideForm = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    Animated.timing(animationValue, {
      toValue: 0,
      duration: 500,
      useNativeDriver: false,
    }).start(() => {
      setIsAnimating(false);
      setFormType(null);
    });
  };

  // Handle keyboard events
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener("keyboardDidShow", (event) => {
      setKeyboardHeight(event.endCoordinates.height);
    });

    const keyboardDidHideListener = Keyboard.addListener("keyboardDidHide", () => {
      setKeyboardHeight(0);
    });

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  const slideUp = animationValue.interpolate({
    inputRange: [0, 1],
    outputRange: [600, keyboardHeight > 0 ? -keyboardHeight / 2 : 0], // Adjust based on keyboard height
  });

  // Animation interpolations
  const float1Y = floatAnim1.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -20],
  });

  const float2Y = floatAnim2.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 15],
  });

  const logoRotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.container}>
        {/* Animated Background Circles */}
        <Animated.View style={[styles.circle1, { transform: [{ translateY: float1Y }] }]} />
        <Animated.View style={[styles.circle2, { transform: [{ translateY: float2Y }] }]} />
        <Animated.View style={[styles.circle3, { transform: [{ translateY: float1Y }] }]} />
        <Animated.View style={[styles.circle4, { transform: [{ translateY: float2Y }] }]} />
        <Animated.View style={[styles.circle5, { transform: [{ translateY: float1Y }] }]} />

        {/* Content Container */}
        <View style={styles.contentContainer}>
          {/* Top Section with Logo and Title */}
          <View style={styles.titleSection}>
            <View style={styles.logoContainer}>
              <View style={styles.logoInner}>
                <Icon name="graduation-cap" size={32} color="#FFFFFF" />
              </View>
            </View>
            <Text style={styles.appName}>UpBe</Text>
            <Text style={styles.subtitle}>
              Educational platform for bright minds
            </Text>
          </View>

          {/* Bottom Section with Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.button}
              onPress={() => showForm("Login")}
            >
              <Text style={styles.buttonText}>Sign in</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.buttonOutline}
              onPress={() => showForm("Signup")}
            >
              <Text style={styles.buttonOutlineText}>Sign up</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Sliding Form */}
        {formType && (
          <Animated.View
            style={[
              styles.formContainer,
              { transform: [{ translateY: slideUp }] },
            ]}
          >
            <View style={styles.formHeader}>
              <TouchableOpacity style={styles.backButton} onPress={hideForm}>
                <Icon name="arrow-left" size={18} color="#8B5CF6" />
                <Text style={styles.backText}>Back</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.formContent}>
              {formType === "Login" ? <LoginScreen /> : <SignupScreen />}
            </View>
          </Animated.View>
        )}
      </View>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FF",
    overflow: 'hidden',
  },
  contentContainer: {
    flex: 1,
    justifyContent: "space-between",
    padding: 20,
    zIndex: 10,
  },
  titleSection: {
    marginTop: "25%",
    alignItems: "center",
  },
  logoContainer: {
    width: 120,
    height: 120,
    borderRadius: 30,
    backgroundColor: "#8B5CF6",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 30,
    shadowColor: "#8B5CF6",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 15,
  },
  logoInner: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: "#7C3AED",
    justifyContent: "center",
    alignItems: "center",
  },
  appName: {
    fontSize: 42,
    fontWeight: "700",
    color: "#5B21B6",
    marginBottom: 12,
    letterSpacing: 2,
  },
  subtitle: {
    fontSize: 16,
    color: "#6B7280",
    textAlign: "center",
    paddingHorizontal: 20,
    fontWeight: "500",
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingBottom: 40,
    paddingHorizontal: 20,
  },
  button: {
    backgroundColor: "#8B5CF6",
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 25,
    elevation: 6,
    shadowColor: "#8B5CF6",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  buttonOutline: {
    backgroundColor: "transparent",
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: "#8B5CF6",
  },
  buttonOutlineText: {
    color: "#8B5CF6",
    fontSize: 16,
    fontWeight: "600",
  },
  formContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    top: 0,
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    zIndex: 1000,
  },
  formHeader: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  formContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: "flex-start",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: '#F8F9FF',
  },
  backText: {
    color: "#8B5CF6",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },

  // Animated Purple Circles
  circle1: {
    position: "absolute",
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: "rgba(139, 92, 246, 0.1)",
    top: -50,
    right: -50,
  },
  circle2: {
    position: "absolute",
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: "rgba(124, 58, 237, 0.15)",
    top: 120,
    left: -40,
  },
  circle3: {
    position: "absolute",
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "rgba(168, 85, 247, 0.2)",
    top: 250,
    right: 30,
  },
  circle4: {
    position: "absolute",
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: "rgba(147, 51, 234, 0.12)",
    bottom: 200,
    left: -30,
  },
  circle5: {
    position: "absolute",
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(126, 34, 206, 0.18)",
    bottom: 350,
    right: -20,
  },
  circle: {
    position: "absolute",
    borderRadius: 999,
  },
});

export default GreetingScreen;