import React from "react";
import { createStackNavigator } from "@react-navigation/stack";
import GreetingScreen from "../src/screens/GreetingScreen";
import SignupScreen from "../src/screens/SignupScreen";
import LoginScreen from "../src/screens/LoginScreen";
import ForgotPassword from "../src/screens/ForgetPassword";

const Stack = createStackNavigator();

const PublicNavigator = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: true }}>
      <Stack.Screen name="Greeting" component={GreetingScreen} />
      <Stack.Screen name="Signup" component={SignupScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="reset" component={ForgotPassword} />
    </Stack.Navigator>
  );
};

export default PublicNavigator;
