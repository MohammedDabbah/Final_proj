import React, { useState } from "react";
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ActivityIndicator } from "react-native";
import serverApi from "../../api/serverApi";

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [role, setRole] = useState('user');
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const handleSendCode = async () => {
    if (!email) {
      alert("Please enter your email address");
      return;
    }

    setLoading(true);
    try {
      const response = await serverApi.post('/forgot-password', { email, role });
      if (response.status === 200) {
        alert("Verification code sent to your email");
        setStep(2);
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
      const response = await serverApi.post('/reset-password', { email, verificationCode, newPassword, role });
      if (response.status === 200) {
        alert("Password reset successful");
        setStep(1);
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
      <Text style={styles.subtitle}>Reset your password securely</Text>

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

      {step === 1 && (
        <>
          <View style={styles.inputContainer}>
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

          <TouchableOpacity style={styles.button} onPress={handleSendCode} disabled={loading}>
            {loading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.buttonText}>Send Verification Code</Text>
            )}
          </TouchableOpacity>
        </>
      )}

      {step === 2 && (
        <>
          <View style={styles.inputContainer}>
            <TextInput
              placeholder="Enter verification code"
              style={styles.input}
              value={verificationCode}
              onChangeText={setVerificationCode}
              placeholderTextColor="#9CA3AF"
            />
          </View>
          <View style={styles.inputContainer}>
            <TextInput
              placeholder="Enter new password"
              style={styles.input}
              secureTextEntry
              value={newPassword}
              onChangeText={setNewPassword}
              placeholderTextColor="#9CA3AF"
            />
          </View>

          <TouchableOpacity style={styles.button} onPress={handleResetPassword} disabled={loading}>
            {loading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.buttonText}>Reset Password</Text>
            )}
          </TouchableOpacity>
        </>
      )}
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
    marginTop: 100,
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
  input: {
    flex: 1,
    fontSize: 16,
    color: "#1F2937",
    fontWeight: "400",
  },

  // Buttons
  button: {
    backgroundColor: "#6B5ECD",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 24,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});

export default ForgotPassword;
