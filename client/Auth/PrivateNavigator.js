import React, { useContext } from "react";
import { createStackNavigator } from "@react-navigation/stack";
import IndexScreen from "../src/screens/IndexScreen";
import ProfileStudentScreen from "../src/screens/Profile";
import DictionaryScreen from "../src/screens/DictionaryScreen";
import QuizScreen from "../src/screens/QuizScreen";
import LevelSelectionScreen from "../src/screens/LevelSelectionScreen";
import NewsScreen from "../src/screens/NewsScreen";
import ReviewMistakesScreen from "../src/screens/ReviewMistakesScreen";
import VocabularyScreen from "../src/screens/VocabularyScreen";
import AssessmentScreen from "../src/screens/AssessmentScreen";
import ResultsScreen from "../src/screens/ResultsScreen";
import { AuthContext } from "../Auth/AuthContext";

const Stack = createStackNavigator();

const PrivateNavigator = () => {
  const { user } = useContext(AuthContext); // ✅ Get user data

  return (
    <Stack.Navigator screenOptions={{ headerShown: true }}>
      {/* ✅ If user is NEW, send them to LevelSelection first */}
      {user?.evaluate === false ? (
        <Stack.Screen name="LevelSelection" component={LevelSelectionScreen} />
      ) : (
        <Stack.Screen name="Home" component={IndexScreen} />
      )}

      {/* ✅ Add other screens */}
      <Stack.Screen name="Profile" component={ProfileStudentScreen} />
      <Stack.Screen name="Dict" component={DictionaryScreen} />
      <Stack.Screen name="Quiz" component={QuizScreen} />
      <Stack.Screen name="News" component={NewsScreen} />
      <Stack.Screen name="ReviewMistakes" component={ReviewMistakesScreen} />
      <Stack.Screen name="Vocabulary" component={VocabularyScreen} />
      <Stack.Screen name="AssessmentScreen" component={AssessmentScreen} />
      <Stack.Screen name="ResultsScreen" component={ResultsScreen} />
    </Stack.Navigator>
  );
};

export default PrivateNavigator;
