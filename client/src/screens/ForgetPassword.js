import React, { useState } from "react";
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ActivityIndicator } from "react-native";
import serverApi from "../../api/serverApi";

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [step, setStep] = useState(1); // Tracks the current step
  const [loading, setLoading] = useState(false);

  const handleSendCode = async () => {
    if (!email) {
      alert("Please enter your email address");
      return;
    }

    setLoading(true);
    try {
      const response = await serverApi.post('/forgot-password', { email });
      if (response.status === 200) {
        alert("Verification code sent to your email");
        setStep(2); // Move to the next step
      }
    } catch (err) {
      console.error("Error sending verification code:", err.response?.data || err.message);
      alert(err.response?.data?.error || "Error sending verification code");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!verificationCode || !newPassword) {
      alert("Please enter the verification code and your new password");
      return;
    }

    setLoading(true);
    try {
      const response = await serverApi.post('/reset-password', { email, verificationCode, newPassword });
      if (response.status === 200) {
        alert("Password reset successful");
        setStep(1); // Reset to the initial step
        setEmail('');
        setVerificationCode('');
        setNewPassword('');
      }
    } catch (err) {
      console.error("Error resetting password:", err.response?.data || err.message);
      alert(err.response?.data?.error || "Error resetting password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Forgot Password</Text>

    
        <>
          <TextInput
            placeholder="Enter your email"
            autoCapitalize="none"
            autoCorrect={false}
            style={styles.input}
            value={email}
            onChangeText={setEmail}
          />
          <TouchableOpacity style={styles.buttonOutline} onPress={handleSendCode} disabled={loading}>
            {loading ? (
              <ActivityIndicator size="small" color="#6B5ECD" />
            ) : (
              <Text style={styles.buttonOutlineText}>Send Verification Code</Text>
            )}
          </TouchableOpacity>
        </>
 

   
        <>
          <TextInput
            placeholder="Enter verification code"
            style={styles.input}
            value={verificationCode}
            onChangeText={setVerificationCode}
          />
          <TextInput
            placeholder="Enter new password"
            style={styles.input}
            secureTextEntry
            value={newPassword}
            onChangeText={setNewPassword}
          />
          <TouchableOpacity style={styles.button} onPress={handleResetPassword} disabled={loading}>
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Reset Password</Text>
            )}
          </TouchableOpacity>
        </>

    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // justifyContent: "center",
    padding: 20,
    backgroundColor: "#EEF2FA",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    paddingTop:100,
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
 button: {
     backgroundColor: "#007BFF",
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
  buttonOutline: {
    borderColor: '#B052F7',
    borderWidth: 2,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    // width: '90%',
    marginBottom: 20,
    marginVertical: 0,
  },
  buttonOutlineText: {
    color: '#B052F7',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ForgotPassword;
