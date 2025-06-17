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
  SafeAreaView,
  StatusBar,
} from "react-native";
import serverApi from "../../api/serverApi";
import { AuthContext } from "../../Auth/AuthContext";
import Icon from "react-native-vector-icons/FontAwesome";
import Edit from "../components/Edit";
import { useFocusEffect } from '@react-navigation/native';

const Profile = ({ navigation }) => {
  const { user, setUser } = useContext(AuthContext);
  const [formType, setFormType] = useState(null); // Track which form is shown
  const animationValue = useRef(new Animated.Value(0)).current; // Controls the slide animation
  const [keyboardHeight, setKeyboardHeight] = useState(0); // To adjust form height dynamically
  const [isAnimating, setIsAnimating] = useState(false); // Prevent interaction during animation
  const [isLoggingOut, setIsLoggingOut] = useState(false); // For logout loading state
  const [inform, setInform] = useState(false);

  // Customize the navigation header
  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: true,
      headerTitle: '',
      headerStyle: {
        backgroundColor: '#FFFFFF',
        elevation: 0,
        shadowOpacity: 0,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
      },
      headerTintColor: '#6B5ECD', // Back button color
      headerBackTitleVisible: false, // Hide "Back" text on iOS
      headerLeftContainerStyle: {
        paddingLeft: 20,
      },
    });
  }, [navigation]);

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
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.container}>

          {/* Profile Section */}
          <View style={styles.profileSection}>
            <View style={styles.avatarContainer}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {(user?.FName || 'U').charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={styles.proBadge}>
              </View>
            </View>
            <Text style={styles.userName}>{`${user?.FName || ''} ${user?.LName || ''}`}</Text>
          <Text style={styles.userRole}>{user.role || "student"}</Text>
          </View>

          {/* Menu Cards */}
          <View style={styles.menuContainer}>
            
            {/* Edit Profile */}
            <TouchableOpacity
              style={[styles.menuCard, { backgroundColor: '#E8E3F7' }]}
              onPress={() => showForm("Edit")}
              accessible
              accessibilityLabel="Edit your profile"
            >
              <View style={[styles.iconContainer, { backgroundColor: '#6B5ECD' }]}>
                <Icon name="user" size={20} color="#FFFFFF" />
              </View>
              <View style={styles.menuContent}>
                <Text style={styles.menuTitle}>Edit profile</Text>
              </View>
              <Icon name="chevron-right" size={16} color="#666" />
            </TouchableOpacity>

            {/* Information */}
            <TouchableOpacity 
              style={[styles.menuCard, { backgroundColor: '#D1C9E8' }]}
              onPress={() => setInform(!inform)}
            >
              <View style={[styles.iconContainer, { backgroundColor: '#8A7BC8' }]}>
                <Icon name="bar-chart" size={20} color="#FFFFFF" />
              </View>
              <View style={styles.menuContent}>
                <Text style={styles.menuTitle}>Information</Text>
              </View>
              <Icon name="chevron-right" size={16} color="#666" />
            </TouchableOpacity>

            {/* Information Details */}
            {inform && (
              <View style={styles.infoCard}>
                <View style={styles.infoHeader}>
                  <View style={styles.infoHeaderIcon}>
                    <Icon name="info-circle" size={16} color="#6B5ECD" />
                  </View>
                  <Text style={styles.infoHeaderTitle}>Account Information</Text>
                </View>
                
                <View style={styles.infoContent}>
                  <View style={styles.infoItem}>
                    <View style={[styles.infoIconBox, { backgroundColor: '#E8F4FD' }]}>
                      <Icon name="envelope" size={16} color="#1976D2" />
                    </View>
                    <View style={styles.infoDetails}>
                      <Text style={styles.infoLabel}>Email</Text>
                      <Text style={styles.infoValue}>{user?.Email}</Text>
                    </View>
                  </View>

                  {user?.userLevel && (
                    <View style={styles.infoItem}>
                      <View style={[styles.infoIconBox, { backgroundColor: '#F3E5F5' }]}>
                        <Icon name="graduation-cap" size={16} color="#7B1FA2" />
                      </View>
                      <View style={styles.infoDetails}>
                        <Text style={styles.infoLabel}>Level</Text>
                        <Text style={styles.infoValue}>{user.userLevel}</Text>
                      </View>
                    </View>
                  )}

                  <View style={styles.statsRow}>
                    <View style={styles.statItem}>
                      <View style={[styles.statIconBox, { backgroundColor: '#FFF8E1' }]}>
                        <Icon name="users" size={14} color="#F57C00" />
                      </View>
                      <View>
                        <Text style={styles.statNumber}>{user?.Followers?.length || 0}</Text>
                        <Text style={styles.statLabel}>Followers</Text>
                      </View>
                    </View>

                    <View style={styles.statItem}>
                      <View style={[styles.statIconBox, { backgroundColor: '#E8F5E8' }]}>
                        <Icon name="user-plus" size={14} color="#388E3C" />
                      </View>
                      <View>
                        <Text style={styles.statNumber}>{user?.Following?.length || 0}</Text>
                        <Text style={styles.statLabel}>Following</Text>
                      </View>
                    </View>
                  </View>
                </View>
              </View>
            )}

            {/* Logout */}
            <TouchableOpacity
              style={[styles.menuCard, { backgroundColor: '#B8A9D9' }]}
              onPress={handleLogout}
              disabled={isLoggingOut}
              accessible
              accessibilityLabel="Log out of your account"
            >
              <View style={[styles.iconContainer, { backgroundColor: '#9B7EF7' }]}>
                <Icon name="sign-out" size={20} color="#FFFFFF" />
              </View>
              <View style={styles.menuContent}>
                <Text style={styles.menuTitle}>
                  {isLoggingOut ? "Logging out..." : "Log out"}
                </Text>
              </View>
              <Icon name="chevron-right" size={16} color="#666" />
            </TouchableOpacity>

          </View>

          {/* Sliding Form */}
          {formType && (
            <Animated.View
              style={[styles.formContainer, { transform: [{ translateY: slideUp }] }]}
            >
              <TouchableOpacity style={styles.closeButton} onPress={hideForm}>
                <Icon name="close" size={24} color="#6B5ECD" />
              </TouchableOpacity>
              {formType === "Edit" && <Edit />}
            </Animated.View>
          )}
        </View>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },

  // Profile Section
  profileSection: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    borderRadius: 20,
    paddingVertical: 30,
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  avatarContainer: {
    marginBottom: 20,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#6B5ECD',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#6B5ECD',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 36,
    fontWeight: '700',
  },
  userName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2C3E50',
    marginBottom: 5,
  },
  userRole: {
    fontSize: 16,
    color: '#6B5ECD',
    fontWeight: '500',
  },

  // Menu Container
  menuContainer: {
    paddingHorizontal: 20,
  },
  menuCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  iconContainer: {
    width: 45,
    height: 45,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  menuContent: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C3E50',
  },

  // Simple Professional Information Card
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    overflow: 'hidden',
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F6FF',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  infoHeaderIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#E8E3F7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  infoHeaderTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2C3E50',
  },
  infoContent: {
    padding: 16,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F8F9FA',
  },
  infoIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  infoDetails: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#7F8C8D',
    marginBottom: 3,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2C3E50',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 12,
    flex: 0.48,
  },
  statIconBox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  statNumber: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2C3E50',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: '#7F8C8D',
  },

  // Form Container
  formContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
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