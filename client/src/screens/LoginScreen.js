import React, { useState, useContext } from "react";
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ActivityIndicator } from "react-native";
import Icon from "react-native-vector-icons/FontAwesome";
import serverApi from "../../api/serverApi";
import { AuthContext } from "../../Auth/AuthContext";
import { useNavigation } from "@react-navigation/native";

const LoginScreen = () => {
  const { setUser } = useContext(AuthContext); // Access setUser from AuthContext
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation(); // Use useNavigation hook


  const handleLogin = async () => {
    if (!email || !password) {
      alert("Please enter both email and password");
      return;
    }

    try {
      setLoading(true);
      const response = await serverApi.post("/auth/login", { email, password }, { withCredentials: true });

      if (response.status === 200) {
        alert("Login successful!");
        setUser(response.data.user); // Set the authenticated user in AuthContext
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
      <TextInput
        placeholder="Email"
        autoCapitalize="none"
        autoCorrect={false}
        style={styles.input}
        keyboardType="email-address"
        value={email}
        onChangeText={(value) => setEmail(value)}
      />
      <TextInput
        placeholder="Password"
        style={styles.input}
        secureTextEntry
        value={password}
        onChangeText={(value) => setPassword(value)}
      />
      <TouchableOpacity style={styles.checkboxContainer} onPress={()=>{navigation.navigate('reset')}}>
        {/* <Text style={styles.checkboxText}>Remember me</Text> */}
        <Text style={styles.link}>Forgot password?</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
        {loading ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Sign In</Text>
        )}
      </TouchableOpacity>
      <Text style={styles.socialText}>Sign in with</Text>
      <View style={styles.socialIcons}>
        <Icon name="google" size={30} color="#DB4437" style={styles.icon} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#EEF2FA',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 10,
    marginBottom: 15,
    backgroundColor: '#fff',
  },
  checkboxContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  checkboxText: {
    color: '#333',
  },
  link: {
    color: '#B052F7',
    fontWeight: 'bold',
  },
  button: {
    backgroundColor: '#B052F7',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  socialText: {
    textAlign: 'center',
    marginVertical: 10,
    color: '#666',
  },
  socialIcons: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  icon: {
    marginHorizontal: 10,
  },
});

export default LoginScreen;
