import React, { useState, useContext, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ActivityIndicator, Platform, ScrollView } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import serverApi from '../../api/serverApi';
import { AuthContext } from "../../Auth/AuthContext";

import * as Google from "expo-auth-session/providers/google";
import * as WebBrowser from "expo-web-browser";
import {makeRedirectUri} from 'expo-auth-session';
import {WEB_CLIENT_ID, ANDRIOD_CLIENT_ID, IOS_CLIENT_ID} from '@env';

WebBrowser.maybeCompleteAuthSession();

const SignupScreen = () => {
  const { setUser } = useContext(AuthContext);
  const [fName, setFName] = useState('');
  const [lName, setLName] = useState('');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
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

  const handleSendVerificationCode = async () => {
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      alert('Please enter a valid email address');
      return;
    }

    try {
      const response = await serverApi.get('/auth/Verification', {
        params: { mail: email },
        withCredentials: true,
      });
      alert('Verification code sent!');
    } catch (err) {
      console.error('Error:', err.response?.data || err.message);
      alert('Error sending verification code.');
    }
  };

  const handleSubmit = async () => {
    if (password !== confirmPassword) {
      alert("Passwords don't match");
      return;
    }

    if (!fName || !lName || !email || !password) {
      alert('Please fill all the fields');
      return;
    }

    try {
      setLoading(true);
      const response = await serverApi.post(
        '/auth/register',
        {
          FName: fName,
          LName: lName,
          Email: email,
          code,
          Password: password,
          role
        },
        { withCredentials: true }
      );

      if (response.status === 200) {
        alert('User registered successfully!');
        setUser(response.data.user);
        setFName('');
        setLName('');
        setEmail('');
        setCode('');
        setPassword('');
        setConfirmPassword('');
      }
    } catch (err) {
      console.error('Error:', err.response?.data || err.message);
      if (err.response?.data?.error?.includes('duplicate key error')) {
        alert('Email already exists. Please use a different email.');
      } else {
        alert('Error registering user. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={styles.subtitle}>Create an account to continue learning</Text>
      
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

      {/* Full Name Input */}
      <View style={styles.inputContainer}>
        <Icon name="user" size={16} color="#6B7280" style={styles.inputIcon} />
        <TextInput
          placeholder="Your Name"
          autoCapitalize="words"
          autoCorrect={false}
          style={styles.input}
          value={fName}
          onChangeText={setFName}
          placeholderTextColor="#9CA3AF"
        />
      </View>

      {/* Last Name Input */}
      <View style={styles.inputContainer}>
        <Icon name="user" size={16} color="#6B7280" style={styles.inputIcon} />
        <TextInput
          placeholder="Last Name"
          autoCapitalize="words"
          autoCorrect={false}
          style={styles.input}
          value={lName}
          onChangeText={setLName}
          placeholderTextColor="#9CA3AF"
        />
      </View>

      {/* Email Input with Verification */}
      <View style={styles.inputWithButtonContainer}>
        <View style={styles.emailInputContainer}>
          <Icon name="envelope" size={16} color="#6B7280" style={styles.inputIcon} />
          <TextInput
            placeholder="username@gmail.com"
            autoCapitalize="none"
            autoCorrect={false}
            style={styles.input}
            value={email}
            keyboardType="email-address"
            onChangeText={setEmail}
            placeholderTextColor="#9CA3AF"
          />
        </View>
        <TouchableOpacity onPress={handleSendVerificationCode} style={styles.verifyButton}>
          <Icon name="check" size={18} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Verification Code */}
      <View style={styles.inputContainer}>
        <Icon name="shield" size={16} color="#6B7280" style={styles.inputIcon} />
        <TextInput
          placeholder="Verification Code"
          style={styles.input}
          value={code}
          onChangeText={setCode}
          placeholderTextColor="#9CA3AF"
          keyboardType="numeric"
        />
      </View>

      {/* Password */}
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

      {/* Confirm Password */}
      <View style={styles.inputContainer}>
        <Icon name="lock" size={16} color="#6B7280" style={styles.inputIcon} />
        <TextInput
          placeholder="••••••••"
          style={styles.input}
          secureTextEntry
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          placeholderTextColor="#9CA3AF"
        />
      </View>

      {/* Agreement */}
      <TouchableOpacity style={styles.agreementContainer}>
        <Text style={styles.agreementText}>
          I agree to the processing of <Text style={styles.link}>Personal data</Text>
        </Text>
      </TouchableOpacity>

      {/* Sign Up Button */}
      <TouchableOpacity style={styles.signupButton} onPress={handleSubmit} disabled={loading}>
        {loading ? (
          <ActivityIndicator size="small" color="#FFFFFF" />
        ) : (
          <Text style={styles.signupButtonText}>Sign up</Text>
        )}
      </TouchableOpacity>

      {/* Social Text */}
      <TouchableOpacity 
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
        <Text style={styles.socialText}>Continue with <Text style={styles.loginLink}>Google account</Text></Text>
      </TouchableOpacity>
    </ScrollView>
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

  // Email with verification button
  inputWithButtonContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  emailInputContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
  },
  verifyButton: {
    marginLeft: 12,
    width: 44,
    height: 44,
    backgroundColor: "#10B981",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#10B981",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },

  // Agreement
  agreementContainer: {
    marginVertical: 16,
    alignItems: "center",
  },
  agreementText: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    fontWeight: "400",
  },
  link: {
    color: "#6B5ECD",
    fontWeight: "500",
  },

  // Sign Up Button
  signupButton: {
    backgroundColor: "#6B5ECD",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 24,
  },
  signupButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },

  // Social Text
  socialText: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    marginBottom: 20,
    fontWeight: "400",
  },
  loginLink: {
    color: "#6B5ECD",
    fontWeight: "500",
  },
});

export default SignupScreen;