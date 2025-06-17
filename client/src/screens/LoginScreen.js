import React, { useState, useContext, useEffect } from "react";
import { 
  View, 
  Text, 
  TextInput, 
  StyleSheet, 
  TouchableOpacity, 
  ActivityIndicator,
  Platform 
} from "react-native";
import Icon from "react-native-vector-icons/FontAwesome";
import serverApi from "../../api/serverApi";
import { AuthContext } from "../../Auth/AuthContext";
import { CommonActions, useNavigation } from "@react-navigation/native";

import * as Google from "expo-auth-session/providers/google";
import * as WebBrowser from "expo-web-browser";
import {makeRedirectUri} from 'expo-auth-session';
import {WEB_CLIENT_ID, ANDRIOD_CLIENT_ID, IOS_CLIENT_ID} from '@env';

WebBrowser.maybeCompleteAuthSession();

const LoginScreen = () => {
  const { setUser } = useContext(AuthContext);
  const navigation = useNavigation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("user");
  const [loading, setLoading] = useState(false);

  // Google Auth setup
  const [request, response, promptAsync] = Google.useAuthRequest({
    iosClientId: IOS_CLIENT_ID,
    androidClientId: ANDRIOD_CLIENT_ID,
    webClientId: WEB_CLIENT_ID,
    expoClientId: WEB_CLIENT_ID,
    scopes: ["openid", "profile", "email"],
    responseType: "id_token",
    redirectUri: makeRedirectUri({ useProxy: true }),
  });

  const processGoogleLoginResponse = async () => {
    const idToken = response?.params?.id_token;
  
    if (idToken) {
      handleGoogleLogin(idToken);
    } else if (response?.type === "error") {
      alert("Google login failed. Please try again.");
    } else {
      console.log("Google login canceled or dismissed.");
    }
  };

  useEffect(() => {
    if (!response) return;
    processGoogleLoginResponse();
  }, [response]);

  const handleGoogleLogin = async (idToken) => {
    try {
      const res = await serverApi.post("/auth/google-login", {idToken,role}, {
        withCredentials: true,
      });
      setUser(res.data.user);
      alert("Login with Google successful!");
    } catch (err) {
      console.error("Google login error:", err);
      alert("Google login failed.");
    }
  };

  const handleLogin = async () => {
    if (!email || !password) {
      alert("Please enter both email and password");
      return;
    }

    try {
      setLoading(true);
      const response = await serverApi.post("/auth/login", { email, password, role }, { withCredentials: true });

      if (response.status === 200) {
        const loggedInUser = response.data.user;
        setUser(loggedInUser);
        alert("Login successful!");
      }
    } catch (err) {
      console.error("Error:", err.response?.data || err.message);
      if (err.response?.data?.message === "Incorrect email.") {
        alert("Email not found. Please try again.");
      } else if (err.response?.data?.message === "Incorrect password.") {
        alert("Incorrect password. Please try again.");
      } else {
        alert("Error logging in. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.subtitle}>Login to continue your learning journey</Text>
      
      {/* Role Selector */}
      <View style={styles.roleSelector}>
        <TouchableOpacity
          style={[
            styles.roleButton,
            role === "user" && styles.roleSelected
          ]}
          onPress={() => setRole("user")}
        >
          <Text style={[styles.roleText, role === "user" && styles.roleTextSelected]}>Student</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.roleButton,
            role === "teacher" && styles.roleSelected
          ]}
          onPress={() => setRole("teacher")}
        >
          <Text style={[styles.roleText, role === "teacher" && styles.roleTextSelected]}>Teacher</Text>
        </TouchableOpacity>
      </View>

      {/* Email Input */}
      <View style={styles.inputContainer}>
        <Icon name="envelope" size={16} color="#6B7280" style={styles.inputIcon} />
        <TextInput
          placeholder="username@gmail.com"
          autoCapitalize="none"
          autoCorrect={false}
          style={styles.input}
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
          placeholderTextColor="#9CA3AF"
        />
      </View>

      {/* Password Input */}
      <View style={styles.inputContainer}>
        <Icon name="lock" size={16} color="#6B7280" style={styles.inputIcon} />
        <TextInput
          placeholder="••••••••"
          style={styles.input}
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          placeholderTextColor="#9CA3AF"
        />
      </View>

      {/* Remember & Forgot */}
      <View style={styles.optionsRow}>
        <Text style={styles.rememberText}>Remember</Text>
        <TouchableOpacity onPress={() => navigation.navigate("reset")}>
          <Text style={styles.forgotText}>Forgot password?</Text>
        </TouchableOpacity>
      </View>

      {/* Login Button */}
      <TouchableOpacity style={styles.loginButton} onPress={handleLogin} disabled={loading}>
        {loading ? (
          <ActivityIndicator size="small" color="#FFFFFF" />
        ) : (
          <Text style={styles.loginButtonText}>Log in</Text>
        )}
      </TouchableOpacity>

      {/* Social Login */}
      <Text style={styles.socialText}>Don't have an account? <Text style={styles.signUpLink}>Sign up</Text></Text>
      
      <TouchableOpacity 
        style={styles.googleButton}
        onPress={() => {
          if (request) {
            if (Platform.OS === "web") {
              promptAsync();
            } else {
              promptAsync({ useProxy: true });
            }
          } else {
            alert("Google login is not ready. Try again.");
          }
        }}
      >
        <Text style={styles.googleText}>Already have an account? Log in</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#FFFFFF",
  },
  subtitle: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    marginBottom: 30,
    fontWeight: "400",
  },
  
  // Role Selector
  roleSelector: {
    flexDirection: "row",
    backgroundColor: "#F9FAFB",
    borderRadius: 8,
    padding: 4,
    marginBottom: 24,
  },
  roleButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignItems: "center",
  },
  roleSelected: {
    backgroundColor: "#6B5ECD",
  },
  roleText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#6B7280",
  },
  roleTextSelected: {
    color: "#FFFFFF",
  },

  // Input Styles
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 16,
    backgroundColor: "#FFFFFF",
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: "#1F2937",
    fontWeight: "400",
  },

  // Options Row
  optionsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  rememberText: {
    fontSize: 14,
    color: "#6B7280",
    fontWeight: "400",
  },
  forgotText: {
    fontSize: 14,
    color: "#6B5ECD",
    fontWeight: "500",
  },

  // Login Button
  loginButton: {
    backgroundColor: "#6B5ECD",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 24,
  },
  loginButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },

  // Social Text
  socialText: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    marginBottom: 16,
  },
  signUpLink: {
    color: "#6B5ECD",
    fontWeight: "500",
  },

  // Google Button
  googleButton: {
    paddingVertical: 12,
    alignItems: "center",
  },
  googleText: {
    fontSize: 14,
    color: "#6B7280",
    fontWeight: "400",
  },
});

export default LoginScreen;