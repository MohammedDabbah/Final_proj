import React, { useState, useContext } from "react";
import { Text, View, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator } from "react-native";
import { AuthContext } from "../../Auth/AuthContext";
import serverApi from "../../api/serverApi";
import Icon from "react-native-vector-icons/FontAwesome";

const Edit = () => {
  const { user, updateUser } = useContext(AuthContext);
  const [fName, setFName] = useState(user.FName);
  const [lName, setLName] = useState(user.LName);
  const [password, setPassword] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [flag, setFlag] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  const handleConfirm = async () => {
    if (!fName && !lName && !password && !newPwd) {
      alert("Please provide at least one field to update.");
      return;
    }

    setLoading(true);
    try {
      const response = await serverApi.post(
        '/change-details',
        { fName, lName, password, newPwd },
        { withCredentials: true }
      );

      if (response.status === 200) {
        alert('Details updated successfully.');
        updateUser({ FName: fName, LName: lName }); // Update the AuthContext
      }
    } catch (err) {
      console.error('Error updating details:', err.response?.data || err.message);
      alert(err.response?.data?.error || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerIcon}>
          <Icon name="edit" size={24} color="#6B5ECD" />
        </View>
        <Text style={styles.title}>Edit Personal Details</Text>
        <Text style={styles.subtitle}>Update your profile information</Text>
      </View>

      {/* Name Fields */}
      <View style={styles.inputContainer}>
        <View style={styles.inputIconContainer}>
          <Icon name="user" size={16} color="#6B5ECD" />
        </View>
        <TextInput
          placeholder="First Name"
          style={styles.input}
          value={fName}
          onChangeText={setFName}
          placeholderTextColor="#A0A0A0"
        />
        {fName && (
          <View style={styles.validIcon}>
            <Icon name="check" size={12} color="#4CAF50" />
          </View>
        )}
      </View>

      <View style={styles.inputContainer}>
        <View style={styles.inputIconContainer}>
          <Icon name="user" size={16} color="#6B5ECD" />
        </View>
        <TextInput
          placeholder="Last Name"
          style={styles.input}
          value={lName}
          onChangeText={setLName}
          placeholderTextColor="#A0A0A0"
        />
        {lName && (
          <View style={styles.validIcon}>
            <Icon name="check" size={12} color="#4CAF50" />
          </View>
        )}
      </View>

      {/* Password Change Option */}
      <TouchableOpacity 
        style={styles.passwordToggle}
        onPress={() => setFlag(!flag)}
      >
        <View style={styles.toggleContent}>
          <Icon name="shield" size={16} color="#6B5ECD" />
          <Text style={styles.toggleText}>
            {flag ? "Cancel Password Change" : "Change Password"}
          </Text>
        </View>
        <Icon 
          name={flag ? "chevron-up" : "chevron-down"} 
          size={14} 
          color="#6B5ECD" 
        />
      </TouchableOpacity>

      {flag && (
        <View>
          <View style={styles.inputContainer}>
            <View style={styles.inputIconContainer}>
              <Icon name="lock" size={16} color="#6B5ECD" />
            </View>
            <TextInput
              placeholder="Current Password"
              style={styles.input}
              secureTextEntry={!showCurrentPassword}
              value={password}
              onChangeText={setPassword}
              placeholderTextColor="#A0A0A0"
            />
            <TouchableOpacity 
              style={styles.eyeIcon}
              onPress={() => setShowCurrentPassword(!showCurrentPassword)}
            >
              <Icon 
                name={showCurrentPassword ? "eye-slash" : "eye"} 
                size={16} 
                color="#A0A0A0" 
              />
            </TouchableOpacity>
          </View>

          <View style={styles.inputContainer}>
            <View style={styles.inputIconContainer}>
              <Icon name="key" size={16} color="#6B5ECD" />
            </View>
            <TextInput
              placeholder="New Password"
              style={styles.input}
              secureTextEntry={!showNewPassword}
              value={newPwd}
              onChangeText={setNewPwd}
              placeholderTextColor="#A0A0A0"
            />
            <TouchableOpacity 
              style={styles.eyeIcon}
              onPress={() => setShowNewPassword(!showNewPassword)}
            >
              <Icon 
                name={showNewPassword ? "eye-slash" : "eye"} 
                size={16} 
                color="#A0A0A0" 
              />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Confirm Button */}
      <TouchableOpacity 
        style={[styles.button, loading && styles.buttonDisabled]} 
        disabled={loading} 
        onPress={handleConfirm}
      >
        {loading ? (
          <View style={styles.buttonContent}>
            <ActivityIndicator size="small" color="#FFFFFF" />
            <Text style={styles.buttonText}>Saving...</Text>
          </View>
        ) : (
          <View style={styles.buttonContent}>
            {/* <Icon name="save" size={16} color="#FFFFFF" /> */}
            <Text style={styles.buttonText}>Save Changes</Text>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#F8F9FA',
  },
  
  // Enhanced Header Styles
  header: {
    alignItems: 'center',
    marginBottom: 30,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 20,
    shadowColor: '#6B5ECD',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.12,
    shadowRadius: 15,
    elevation: 8,
  },
  headerIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: '#F8F6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#E8E3F7',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#2C3E50',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#7F8C8D',
    textAlign: 'center',
    fontWeight: '500',
  },

  // Enhanced Input Styles
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingHorizontal: 15,
    paddingVertical: 4,
    marginBottom: 15,
    shadowColor: '#6B5ECD',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#F0F2F5',
  },
  inputIconContainer: {
    width: 30,
    alignItems: 'center',
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#2C3E50',
    paddingVertical: 15,
    fontWeight: '500',
  },
  validIcon: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#E8F5E8',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  eyeIcon: {
    padding: 10,
  },

  // Enhanced Password Toggle Styles
  passwordToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F8F6FF',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#E8E3F7',
    shadowColor: '#6B5ECD',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  toggleContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  toggleText: {
    color: '#6B5ECD',
    fontWeight: '600',
    fontSize: 15,
    marginLeft: 10,
  },

  // Enhanced Button Styles
  button: {
    backgroundColor: '#6B5ECD',
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginTop: 10,
    shadowColor: '#6B5ECD',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  buttonDisabled: {
    backgroundColor: '#B8A9D9',
    shadowOpacity: 0.1,
  },
  buttonContent: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 8,
    letterSpacing: 0.3,
  },
});

export default Edit;