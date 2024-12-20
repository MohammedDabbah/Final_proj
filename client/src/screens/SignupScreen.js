import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import serverApi from '../../api/serverApi';

const SignupScreen = () => {
  const [FName, setFName] = useState('');
  const [LName, setLName] = useState('');
  const [Email, setEmail] = useState('');
  const [Password, setPassword] = useState('');
  const [ConfirmPS, setConfirmPS] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (Password !== ConfirmPS) {
      alert("Passwords don't match");
      return;
    }

    if (!FName || !LName || !Email || !Password) {
      alert('Please fill all the fields');
      return;
    }

    try {
      setLoading(true); // Show loading spinner during the API call
      const response = await serverApi.post('/auth/register', {
        FName,
        LName,
        Email,
        Password,
      });

      if (response.status === 200) {
        alert('User registered successfully!');
        // Clear input fields after successful registration
        setFName('');
        setLName('');
        setEmail('');
        setPassword('');
        setConfirmPS('');
      }
    } catch (err) {
      console.error('Error:', err.response?.data || err.message);
      if (err.response?.data?.error?.includes('duplicate key error')) {
        alert('Email already exists. Please use a different email.');
      } else {
        alert('Error registering user. Please try again.');
      }
    } finally {
      setLoading(false); // Hide loading spinner after the API call
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Get Started</Text>
      <TextInput
        placeholder="First Name"
        style={styles.input}
        value={FName}
        onChangeText={(value) => setFName(value)}
      />
      <TextInput
        placeholder="Last Name"
        style={styles.input}
        value={LName}
        onChangeText={(value) => setLName(value)}
      />
      <TextInput
        placeholder="Email"
        style={styles.input}
        keyboardType="email-address"
        value={Email}
        onChangeText={(value) => setEmail(value)}
      />
      <TextInput
        placeholder="Password"
        style={styles.input}
        secureTextEntry
        value={Password}
        onChangeText={(value) => setPassword(value)}
      />
      <TextInput
        placeholder="Confirm password"
        style={styles.input}
        secureTextEntry
        value={ConfirmPS}
        onChangeText={(value) => setConfirmPS(value)}
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
      <Text style={styles.socialText}>Sign up with</Text>
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
  agreementContainer: {
    marginVertical: 15,
  },
  agreementText: {
    fontSize: 14,
    color: '#333',
    textAlign: 'center',
  },
  link: {
    color: '#6200EE',
    fontWeight: 'bold',
  },
  button: {
    backgroundColor: '#6200EE',
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

export default SignupScreen;
