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
import { AuthContext } from "../Auth/AuthContext"; // ✅ Fixed path

const Stack = createStackNavigator();

const PrivateNavigator = () => {
  const { user } = useContext(AuthContext); // ✅ Access user from AuthContext

  return (
    <Stack.Navigator screenOptions={{ headerShown: true }}>
      {/* ✅ Show LevelSelectionScreen if user has not evaluated */}
      {!user?.evaluate ? (
        <Stack.Screen name="LevelSelection" component={LevelSelectionScreen} />
      ) : (
        <>
          <Stack.Screen name="Home" component={IndexScreen} />
          <Stack.Screen name="LevelSelection" component={LevelSelectionScreen} />
          <Stack.Screen name="Profile" component={ProfileStudentScreen} />
          <Stack.Screen name="Dict" component={DictionaryScreen} />
          <Stack.Screen name="Quiz" component={QuizScreen} />
          <Stack.Screen name="News" component={NewsScreen} />
          <Stack.Screen name="ReviewMistakes" component={ReviewMistakesScreen} />
          <Stack.Screen name="Vocabulary" component={VocabularyScreen} />
          <Stack.Screen name="AssessmentScreen" component={AssessmentScreen} />
          <Stack.Screen name="ResultsScreen" component={ResultsScreen} />
        </>
      )}
    </Stack.Navigator>
  );
};

export default PrivateNavigator;
