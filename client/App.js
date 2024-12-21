import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import GreetingScreen from './src/screens/GreetingScreen';
import SignupScreen from './src/screens/SignupScreen';
import LoginScreen from './src/screens/LoginScreen';
import ProfileStudentScreen from './src/screens/ProfileStudentScreen';


const Stack = createStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Greeting" screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Greeting" component={GreetingScreen} />
        <Stack.Screen name="Signup" component={SignupScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="ProfileStudentScreen" component={ProfileStudentScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
