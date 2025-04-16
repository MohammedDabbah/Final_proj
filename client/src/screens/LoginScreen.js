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
  const { setUser } = useContext(AuthContext); // Removed 'user' as it's not needed here
  const navigation = useNavigation(); // Corrected navigation hook
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("user"); // ✅ Role state
  const [loading, setLoading] = useState(false);


   // Google Auth setup (no condition on platform)
   const [request, response, promptAsync] = Google.useAuthRequest({
    iosClientId: IOS_CLIENT_ID,
    androidClientId: ANDRIOD_CLIENT_ID,
    webClientId: WEB_CLIENT_ID,
    expoClientId: WEB_CLIENT_ID,
    scopes: ["openid", "profile", "email"],
    responseType: "id_token", // ✅ REQUIRED to get id_token
    redirectUri: makeRedirectUri({ useProxy: true }), // ✅ FIXED
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
  
    processGoogleLoginResponse(); // your logic
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
        setUser(loggedInUser); // ✅ Set user state

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
      <Text style={styles.title}>Welcome Back</Text>
      <View style={styles.roleSelector}>
        <TouchableOpacity
          style={[
            styles.roleButton,
            role === "user" && styles.roleSelected
          ]}
          onPress={() => setRole("user")}
        >
          <Text style={styles.roleText}>User</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.roleButton,
            role === "teacher" && styles.roleSelected
          ]}
          onPress={() => setRole("teacher")}
        >
          <Text style={styles.roleText}>Teacher</Text>
        </TouchableOpacity>
      </View>
      <TextInput
        placeholder="Email"
        autoCapitalize="none"
        autoCorrect={false}
        style={styles.input}
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        placeholder="Password"
        style={styles.input}
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      <TouchableOpacity style={styles.checkboxContainer} onPress={() => navigation.navigate("reset")}>
        <Text style={styles.link}>Forgot password?</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
        {loading ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Sign In</Text>
        )}
      </TouchableOpacity>
      <TouchableOpacity onPress={() =>{
        if (request) {
          if (Platform.OS === "web") {
                promptAsync(); // no proxy
              } else {
                promptAsync({ useProxy: true }); // use proxy for native
              }
        } else {
          alert("Google login is not ready. Try again.");
        }
      }}>
      <Text style={styles.socialText}>Sign in with</Text>
      <View style={styles.socialIcons}>
        <Icon name="google" size={30} color="#DB4437" style={styles.icon} />
      </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
    backgroundColor: "#EEF2FA",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
    marginBottom: 15,
    backgroundColor: "#fff",
  },
  checkboxContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 15,
  },
  link: {
    color: "#B052F7",
    fontWeight: "bold",
  },
  button: {
    backgroundColor: "#B052F7",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 20,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  socialText: {
    textAlign: "center",
    marginVertical: 10,
    color: "#666",
  },
  socialIcons: {
    flexDirection: "row",
    justifyContent: "center",
  },
  icon: {
    marginHorizontal: 10,
  },
  roleSelector: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 20,
  },
  roleButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    backgroundColor: "#ccc",
    marginHorizontal: 10,
  },
  roleSelected: {
    backgroundColor: "#6B5ECD",
  },
  roleText: {
    color: "#fff",
    fontWeight: "bold",
  }
});

export default LoginScreen;
