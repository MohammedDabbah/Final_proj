import React, { useState, useContext ,useEffect} from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ActivityIndicator, Platform } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import serverApi from '../../api/serverApi';
import { AuthContext } from "../../Auth/AuthContext";

import * as Google from "expo-auth-session/providers/google";
import * as WebBrowser from "expo-web-browser";
import {makeRedirectUri} from 'expo-auth-session';
import {WEB_CLIENT_ID, ANDRIOD_CLIENT_ID, IOS_CLIENT_ID} from '@env';



WebBrowser.maybeCompleteAuthSession();


const SignupScreen = () => {
  const { setUser } = useContext(AuthContext); // Access setUser from AuthContext
  const [fName, setFName] = useState('');
  const [lName, setLName] = useState('');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
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
        setUser(response.data.user); // Set the authenticated user in AuthContext
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
    <View style={styles.container}>
      <Text style={styles.title}>Get Started</Text>
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
        placeholder="First Name"
        autoCapitalize="none"
        autoCorrect={false}
        style={styles.input}
        value={fName}
        onChangeText={setFName}
      />
      <TextInput
        placeholder="Last Name"
        autoCapitalize="none"
        autoCorrect={false}
        style={styles.input}
        value={lName}
        onChangeText={setLName}
      />
      <View style={styles.inputWithIcon}>
        <TextInput
          placeholder="Email"
          autoCapitalize="none"
          autoCorrect={false}
          style={styles.inputFlex}
          value={email}
          keyboardType="email-address"
          onChangeText={setEmail}
        />
        <TouchableOpacity onPress={handleSendVerificationCode}>
          <Icon name="check" size={20} color="green" style={styles.iconInsideInput} />
        </TouchableOpacity>
      </View>
      <TextInput
        placeholder="Verification Code"
        style={styles.input}
        value={code}
        onChangeText={setCode}
      />
      <TextInput
        placeholder="Password"
        style={styles.input}
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      <TextInput
        placeholder="Confirm Password"
        style={styles.input}
        secureTextEntry
        value={confirmPassword}
        onChangeText={setConfirmPassword}
      />
      <TouchableOpacity style={styles.agreementContainer}>
        <Text style={styles.agreementText}>
          I agree to the processing of <Text style={styles.link}>Personal data</Text>
        </Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.button} onPress={handleSubmit} disabled={loading}>
        {loading ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Sign Up</Text>
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
  inputWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 10,
    marginBottom: 15,
    backgroundColor: '#fff',
  },
  inputFlex: {
    flex: 1,
    marginRight: 10,
  },
  iconInsideInput: {
    marginLeft: 10,
  },
  agreementContainer: {
    marginVertical: 15,
  },
  agreementText: {
    fontSize: 14,
    color: '#333',
    textAlign: 'center',
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

export default SignupScreen;
