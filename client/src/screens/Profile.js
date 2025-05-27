import React, { useContext, useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  TouchableWithoutFeedback,
  Keyboard,
  ActivityIndicator,
} from "react-native";
import serverApi from "../../api/serverApi";
import { AuthContext } from "../../Auth/AuthContext";
import Icon from "react-native-vector-icons/FontAwesome";
import Edit from "../components/Edit";
import { useFocusEffect } from '@react-navigation/native';

const Profile = () => {
  const { user, setUser } = useContext(AuthContext);
  const [formType, setFormType] = useState(null); // Track which form is shown
  const animationValue = useRef(new Animated.Value(0)).current; // Controls the slide animation
  const [keyboardHeight, setKeyboardHeight] = useState(0); // To adjust form height dynamically
  const [isAnimating, setIsAnimating] = useState(false); // Prevent interaction during animation
  const [isLoggingOut, setIsLoggingOut] = useState(false); // For logout loading state
  const [inform, setInform] = useState(false);


  useFocusEffect(
  React.useCallback(() => {
    const fetchUser = async () => {
      try {
        const res = await serverApi.get('auth/authenticated', { withCredentials: true });
        if (res.status === 200) {
          setUser(res.data.user); // ✅ Update context
        }
      } catch (err) {
        console.error("Failed to refresh user:", err.response?.data || err.message);
      }
    };

    fetchUser(); // Call when screen comes into focus
  }, [])
);

  // Show form with animation
  const showForm = (type) => {
    if (isAnimating) return; // Prevent multiple triggers during animation
    setFormType(type);
    setIsAnimating(true);
    Animated.timing(animationValue, {
      toValue: 1, // Move the card up
      duration: 500,
      useNativeDriver: false,
    }).start(() => setIsAnimating(false));
  };

  // Hide form with animation
  const hideForm = () => {
    if (isAnimating) return; // Prevent multiple triggers during animation
    setIsAnimating(true);
    Animated.timing(animationValue, {
      toValue: 0, // Move the card back down
      duration: 400,
      useNativeDriver: false,
    }).start(() => {
      setIsAnimating(false);
      setFormType(null); // Reset the form type after animation
    });
  };

  // Keyboard event handling
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

  // Slide up animation based on keyboard height
  const slideUp = animationValue.interpolate({
    inputRange: [0, 1],
    outputRange: [600, keyboardHeight > 0 ? -keyboardHeight : 0], // Adjust based on keyboard height
  });

  // Handle Logout
  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      const response = await serverApi.post("/auth/logout", {}, { withCredentials: true });
      if (response.status === 200) {
        setUser(null); // Clear the user in AuthContext
      }
    } catch (err) {
      console.error("Error logging out:", err.response?.data || err.message);
      alert("Error logging out. Please try again.");
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.container}>
        {/* Profile Section */}
        <View style={styles.profileSection}>
          <View style={styles.avatarContainer}>
            <Icon name="user-circle" size={80} color="#B052F7" />
          </View>
          <Text style={styles.userName}>{`${user.FName} ${user.LName}`}</Text>
          <Text style={styles.userRole}>{user.role || "student"}</Text>
        </View>

        {/* Menu Items */}
        <View style={styles.menuContainer}>
          {/* Edit Profile */}
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => showForm("Edit")}
            accessible
            accessibilityLabel="Edit your profile"
          >
            <Icon name="edit" size={24} color="#B052F7" />
            <Text style={styles.menuText}>Edit Profile</Text>
            <Icon name="chevron-right" size={18} color="#B052F7" style={styles.chevron} />
          </TouchableOpacity>

          {/* Information */}
          <TouchableOpacity style={styles.menuItem} onPress={() => setInform(!inform)}>
            <Icon name="info-circle" size={24} color="#B052F7" />
            <Text style={styles.menuText}>Information</Text>
            <Icon name="chevron-right" size={18} color="#B052F7" style={styles.chevron} />
          </TouchableOpacity>

          {inform && (
          <View style={styles.infoBox}>
            <View style={styles.infoRow}>
              <Icon name="envelope" size={18} color="#B052F7" style={styles.infoIcon} />
              <Text style={styles.infoLabel}>Email:</Text>
              <Text style={styles.infoValue}>{user.Email}</Text>
            </View>
            {user.userLevel ? (
            <View style={styles.infoRow}>
              <Icon name="graduation-cap" size={18} color="#B052F7" style={styles.infoIcon} />
              <Text style={styles.infoLabel}>Level:</Text>
              <Text style={styles.infoValue}>{user.userLevel || 'N/A'}</Text>
            </View>
          ): null}

            <View style={styles.infoRow}>
              <Icon name="users" size={18} color="#B052F7" style={styles.infoIcon} />
              <Text style={styles.infoLabel}>Followers:</Text>
              <Text style={styles.infoValue}>{user.Followers?.length || 0}</Text>
            </View>

            <View style={styles.infoRow}>
              <Icon name="user-plus" size={18} color="#B052F7" style={styles.infoIcon} />
              <Text style={styles.infoLabel}>Following:</Text>
              <Text style={styles.infoValue}>{user.Following?.length || 0}</Text>
            </View>
          </View>
        )}


          {/* Logout */}
          <TouchableOpacity
            style={styles.menuItem}
            onPress={handleLogout}
            disabled={isLoggingOut}
            accessible
            accessibilityLabel="Log out of your account"
          >
            <Icon name="sign-out" size={24} color="#B052F7" />
            <Text style={styles.menuText}>
              {isLoggingOut ? "Logging out..." : "Log out"}
            </Text>
            <Icon name="chevron-right" size={18} color="#B052F7" style={styles.chevron} />
          </TouchableOpacity>
        </View>

        {/* Sliding Form */}
        {formType && (
          <Animated.View
            style={[styles.formContainer, { transform: [{ translateY: slideUp }] }]}
          >
            <TouchableOpacity style={styles.closeButton} onPress={hideForm}>
              <Icon name="close" size={24} color="#B052F7" />
            </TouchableOpacity>
            {formType === "Edit" && <Edit />}
          </Animated.View>
        )}
      </View>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  profileSection: {
    alignItems: "center",
    paddingTop: 35,
    paddingBottom: 30,
  },
  avatarContainer: {
    marginBottom: 15,
  },
  userName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 5,
  },
  userRole: {
    fontSize: 16,
    color: "#B052F7",
    marginBottom: 20,
  },
  menuContainer: {
    paddingHorizontal: 20,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  menuText: {
    fontSize: 16,
    color: "#333",
    marginLeft: 15,
    flex: 1,
  },
  chevron: {
    marginLeft: "auto",
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
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -5 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
  },
  closeButton: {
    alignSelf: "flex-end",
    padding: 10,
  },
 infoBox: {
  backgroundColor: '#F5F5F5',
  padding: 16,
  borderRadius: 12,
  marginHorizontal: 20,
  marginTop: -10,
  marginBottom: 20,
  elevation: 1,
},

infoRow: {
  flexDirection: 'row',
  alignItems: 'center',
  marginVertical: 6,
},

infoIcon: {
  marginRight: 8,
},

infoLabel: {
  fontWeight: 'bold',
  color: '#555',
  fontSize: 14,
  marginRight: 6,
},

infoValue: {
  color: '#333',
  fontSize: 16,
  flexShrink: 1,
},


});

export default Profile;
