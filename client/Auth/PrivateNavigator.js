import React from "react";
import { createStackNavigator } from "@react-navigation/stack";
import IndexScreen from "../src/screens/IndexScreen";
import ProfileStudentScreen from "../src/screens/Profile";
import DictionaryScreen from "../src/screens/DictionaryScreen";

const Stack = createStackNavigator();

const PrivateNavigator = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: true }}>
      <Stack.Screen name="Home" component={IndexScreen} />
      <Stack.Screen name="Profile" component={ProfileStudentScreen} />
      <Stack.Screen name="Dict" component={DictionaryScreen} />
    </Stack.Navigator>
  );
};

export default PrivateNavigator;
