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

const FloatingCircle = ({ style }) => <View style={[styles.circle, style]} />;

const GreetingScreen = () => {
  const [formType, setFormType] = useState(null); // Track which form is shown
  const animationValue = useRef(new Animated.Value(0)).current; // For sliding animation
  const [keyboardHeight, setKeyboardHeight] = useState(0); // To adjust form height dynamically
  const [isAnimating, setIsAnimating] = useState(false);

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

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
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
            <TouchableOpacity style={styles.backButton} onPress={hideForm}>
              <Text style={styles.backText}>Back</Text>
            </TouchableOpacity>
            {formType === "Login" ? <LoginScreen /> : <SignupScreen />}
          </Animated.View>
        )}
      </View>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#c1bbf0",
  },
  contentContainer: {
    flex: 1,
    justifyContent: "space-between",
    padding: 20,
  },
  titleSection: {
    marginTop: "20%",
    alignItems: "center",
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#FFFFFF",
    textAlign: "center",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.8)",
    textAlign: "center",
    paddingHorizontal: 20,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingBottom: 40,
    paddingHorizontal: 20,
  },
  button: {
    backgroundColor: "#FFFFFF",
    paddingVertical: 15,
    paddingHorizontal: 35,
    borderRadius: 25,
    elevation: 3,
  },
  buttonText: {
    color: "#B052F7",
    fontSize: 16,
    fontWeight: "600",
  },
  buttonOutline: {
    backgroundColor: "transparent",
    paddingVertical: 15,
    paddingHorizontal: 35,
    borderRadius: 25,
  },
  buttonOutlineText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  formContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    padding: 20,
    elevation: 10,
  },
  backButton: {
    alignSelf: "flex-start",
    marginBottom: 10,
  },
  backText: {
    color: "#B052F7",
    fontSize: 16,
    fontWeight: "bold",
  },
  circle: {
    position: "absolute",
    borderRadius: 999,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
  },
  circle1: {
    width: 150,
    height: 150,
    top: -20,
    right: -20,
    backgroundColor: "rgba(176, 82, 247, 0.7)",
  },
  circle2: {
    width: 100,
    height: 100,
    top: 100,
    left: -20,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
  },
  circle3: {
    width: 80,
    height: 80,
    top: 200,
    right: 40,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  circle4: {
    width: 120,
    height: 120,
    bottom: 400,
    left: 20,
    backgroundColor: "rgba(176, 82, 247, 0.5)",
  },
});

export default GreetingScreen;
