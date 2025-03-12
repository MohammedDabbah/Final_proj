import React from "react";
import { createStackNavigator } from "@react-navigation/stack";
import IndexScreen from "../src/screens/IndexScreen";
import ProfileStudentScreen from "../src/screens/Profile";
import DictionaryScreen from "../src/screens/DictionaryScreen";
import QuizScreen from "../src/screens/QuizScreen";
import LevelSelectionScreen from "../src/screens/LevelSelectionScreen";
import NewsScreen from "../src/screens/NewsScreen";
import ReviewMistakesScreen from "../src/screens/ReviewMistakesScreen";
import VocabularyScreen from "../src/screens/VocabularyScreen";

const Stack = createStackNavigator();

const PrivateNavigator = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: true }}>
      <Stack.Screen name="LevelSelection" component={LevelSelectionScreen} />
      <Stack.Screen name="Home" component={IndexScreen} />
      <Stack.Screen name="Profile" component={ProfileStudentScreen} />
      <Stack.Screen name="Dict" component={DictionaryScreen} />
      <Stack.Screen name="Quiz" component={QuizScreen} />
      <Stack.Screen name="News" component={NewsScreen} />
      <Stack.Screen name="ReviewMistakes" component={ReviewMistakesScreen} />
      <Stack.Screen name="Vocabulary" component={VocabularyScreen} />
    </Stack.Navigator>
  );
};

export default PrivateNavigator;
