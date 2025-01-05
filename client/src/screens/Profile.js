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
      outputRange: [600, 0], // Adjust '600' and '0' as per screen size
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
    <View style={styles.container}>
    

      {/* Profile Section */}
      <View style={styles.profileSection}>
        <View style={styles.avatarContainer}>
          <Icon name="user-circle" size={80} color="#B052F7" />
        </View>
        <Text style={styles.userName}>{`${user.FName} ${user.LName}`}</Text>
      </View>

      {/* Menu Items */}
      <View style={styles.menuContainer}>
        <TouchableOpacity style={styles.menuItem} onPress={() => showForm('Edit')}>
          <Icon name="edit" size={24} color="#B052F7" />
          <Text style={styles.menuText}>Edit Profile</Text>
          <Icon name="chevron-right" size={18} color="#B052F7" style={styles.chevron} />
        </TouchableOpacity>

      

        <TouchableOpacity style={styles.menuItem}>
          <Icon name="info-circle" size={24} color="#B052F7" />
          <Text style={styles.menuText}>Information</Text>
          <Icon name="chevron-right" size={18} color="#B052F7" style={styles.chevron} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={handleLogout}>
          <Icon name="sign-out" size={24} color="#B052F7" />
          <Text style={styles.menuText}>Log out</Text>
          <Icon name="chevron-right" size={18} color="#B052F7" style={styles.chevron} />
        </TouchableOpacity>
      </View>

      {/* Sliding Form */}
      {formType && (
        <Animated.View style={[styles.formContainer, { transform: [{ translateY: slideUp }] }]}>
          <TouchableOpacity style={styles.closeButton} onPress={hideForm}>
            <Icon name="close" size={24} color="#B052F7" />
          </TouchableOpacity>
          {formType === 'Edit' && <Edit />}
        </Animated.View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  backButton: {
    position: 'absolute',
    top: 40,
    left: 20,
    zIndex: 1,
  },
  profileSection: {
    alignItems: 'center',
    paddingTop: 35,
    paddingBottom: 30,
  },
  avatarContainer: {
    marginBottom: 15,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  userRole: {
    fontSize: 16,
    color: '#6A11DA',
    marginBottom: 20,
  },
  menuContainer: {
    paddingHorizontal: 20,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  menuText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 15,
    flex: 1,
  },
  chevron: {
    marginLeft: 'auto',
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
    shadowOffset: { width: 0, height: -5 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
  },
  closeButton: {
    alignSelf: 'flex-end',
    padding: 10,
  },
});

export default Profile;
