import React, { useState, useContext } from "react";
import { Text, View, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator } from "react-native";
import { AuthContext } from "../../Auth/AuthContext";
import serverApi from "../../api/serverApi";

const Edit = () => {
  const { user, updateUser } = useContext(AuthContext);
  const [fName, setFName] = useState(user.FName);
  const [lName, setLName] = useState(user.LName);
  const [password, setPassword] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [flag, setFlag] = useState(false);
  const [loading, setLoading] = useState(false);

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
      <Text style={styles.title}>Edit Personal Details</Text>

      {/* Name Fields */}
      <TextInput
        placeholder="First Name"
        style={styles.input}
        value={fName}
        onChangeText={setFName}
      />
      <TextInput
        placeholder="Last Name"
        style={styles.input}
        value={lName}
        onChangeText={setLName}
      />

      {/* Password Change Option */}
      <TouchableOpacity onPress={() => setFlag(!flag)}>
        {flag ? <Text style={styles.link}>Cancel Password Change</Text> : <Text style={styles.link}>Change Password?</Text>}
      </TouchableOpacity>

      {flag && (
        <View>
          <TextInput
            placeholder="Current Password"
            style={styles.input}
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />
          <TextInput
            placeholder="New Password"
            style={styles.input}
            secureTextEntry
            value={newPwd}
            onChangeText={setNewPwd}
          />
        </View>
      )}

      {/* Confirm Button */}
      <TouchableOpacity style={styles.button} disabled={loading} onPress={handleConfirm}>
        {loading ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Confirm</Text>
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
  link: {
    color: '#B052F7',
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
});

export default Edit;
