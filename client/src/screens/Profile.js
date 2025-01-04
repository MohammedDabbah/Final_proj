import React, { useContext, useState,useRef } from "react";
import { View, Text, StyleSheet, Image, TouchableOpacity, Animated } from "react-native";
import serverApi from "../../api/serverApi";
import { AuthContext } from "../../Auth/AuthContext";
import Icon from 'react-native-vector-icons/FontAwesome';
import Edit from "../components/Edit";

const Profile = () => {
  const { user, setUser } = useContext(AuthContext);
  const [formType, setFormType] = useState(null); 
  const animationValue = useRef(new Animated.Value(0)).current; // Controls the slide animation
  const [isAnimating, setIsAnimating] = useState(false); // Prevent interaction during animation

  const showForm = (type) => {
      if (isAnimating) return; // Prevent multiple triggers during animation
      setFormType(type); 
      setIsAnimating(true);
      Animated.timing(animationValue, {
        toValue: 1, // Move the card up
        duration: 500,
        useNativeDriver: true,
      }).start(() => setIsAnimating(false));
    };
  
    // Function to reset to the greeting page
    const hideForm = () => {
      if (isAnimating) return; // Prevent multiple triggers during animation
      setIsAnimating(true);
      Animated.timing(animationValue, {
        toValue: 0, // Move the card back down
        duration: 400,
        useNativeDriver: true,
      }).start(() => {
        setIsAnimating(false);
        setFormType(null); // Reset the form type after animation
      });
    };
  
    const slideUp = animationValue.interpolate({
      inputRange: [0, 1],
      outputRange: [600, 500], // Adjust based on your screen height
    });
  

  const handleLogout = async () => {
    try {
      const response = await serverApi.post("/auth/logout", {}, { withCredentials: true });
      if (response.status === 200) {
        setUser(null); // Clear the user in AuthContext
      }
    } catch (err) {
      console.error("Error logging out:", err.response?.data || err.message);
      alert("Error logging out. Please try again.");
    }
  };

  return (
    <View style={styles.card}>
      {/* Profile Picture */}
      <Image
        source={{
          uri: "https://static.vecteezy.com/system/resources/thumbnails/005/544/718/small_2x/profile-icon-design-free-vector.jpg", // Placeholder image
        }}
        style={styles.profileImage}
      />

      {/* User Information */}
      <Text style={styles.name}>{user.FName}</Text>
      <Text style={styles.name}>{user.LName}</Text>
      <Text style={styles.role}>Student</Text>

      {/* Action Buttons */}
      <View style={styles.actionsContainer}>
        <TouchableOpacity style={styles.button} 
          onPress={() => showForm('Edit')}
        >
          <Text style={styles.buttonText}> 
          <Icon name="edit" size={20}></Icon>
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, styles.logoutButton]}
          onPress={handleLogout}
        >
          <Text style={styles.logoutButtonText}>Logout
          </Text>
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
            <Text style={styles.backText}><Icon name="close" size={20} color={'red'}></Icon></Text>
          </TouchableOpacity>
          {formType === 'Edit' && <Edit /> }
        </Animated.View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    margin: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
    alignItems: "center",
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 15,
  },
  name: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
  },
  role: {
    fontSize: 14,
    color: "#666",
    marginBottom: 15,
  },
  actionsContainer: {
    flexDirection: "row",
    marginTop: 20,
  },
  button: {
    backgroundColor: "#6200EE",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginHorizontal: 5,
  },
  buttonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
  },
  logoutButton: {
    backgroundColor: "#FF6B81",
  },
  logoutButtonText: {
    color: "#fff",
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
});

export default Profile;
