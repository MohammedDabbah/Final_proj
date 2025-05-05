import React, { useContext } from "react";
import { createStackNavigator } from "@react-navigation/stack";
import IndexScreen from "../src/screens/IndexScreen";
import TeacherScreen from "../src/screens/TeacherScreen"; // 👈 Import TeacherScreen
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
import ImproveWritingScreen from '../src/screens/ImproveWritingScreen';
import SentencePracticeWriting from '../src/screens/SentencePracticeWriting';
import WordsPracticeWriting from '../src/screens/WordsPracticeWriting';
import ImproveReadingScreen from '../src/screens/ImproveReadingScreen';
import ProgressScreen from '../src/screens/ProgressScreen';
import FollowListScreen from "../src/screens/FollowListScreen";
import StudentListScreen from "../src/screens/StudentListScreen";
import StudentProgressScreen from "../src/screens/StudentProgressScreen";
import MessageListScreen from "../src/screens/MessageListScreen";
import MessageScreen from "../src/screens/MessageScreen";
import ActivityManagerScreen from "../src/screens/ActivityManagerScreen";
// import EvaluateScreen from "../src/screens/EvaluateScreen";

const Stack = createStackNavigator();

const PrivateNavigator = () => {
  const { user } = useContext(AuthContext);

  return (
    <Stack.Navigator screenOptions={{ headerShown: true }}>
      {/* ✅ Conditional start screen based on role */}
      {console.log(user.role)}
      {user?.role === 'teacher' ? (
        <Stack.Screen name="Home" component={TeacherScreen} />
      ) : user?.evaluate === false ? (
        <Stack.Screen name="LevelSelection" component={LevelSelectionScreen} />
      ) : (
        <Stack.Screen name="Home" component={IndexScreen} />
      )}

      {/* ✅ Common student/user screens */}
      <Stack.Screen name="Profile" component={ProfileStudentScreen} />
      <Stack.Screen name="Dict" component={DictionaryScreen} />
      <Stack.Screen name="Quiz" component={QuizScreen} />
      <Stack.Screen name="News" component={NewsScreen} />
      <Stack.Screen name="ReviewMistakes" component={ReviewMistakesScreen} />
      <Stack.Screen name="Vocabulary" component={VocabularyScreen} />
      <Stack.Screen name="AssessmentScreen" component={AssessmentScreen} />
      <Stack.Screen name="ResultsScreen" component={ResultsScreen} />
      <Stack.Screen name="ImproveWritingScreen" component={ImproveWritingScreen} />
      <Stack.Screen name="SentencePracticeWriting" component={SentencePracticeWriting} />
      <Stack.Screen name="WordsPracticeWriting" component={WordsPracticeWriting} />
      <Stack.Screen name="ImproveReadingScreen" component={ImproveReadingScreen} />
      <Stack.Screen name="Progress" component={ProgressScreen} options={{ title: 'My Progress' }} />
      <Stack.Screen name="FollowList" component={FollowListScreen}/>
      <Stack.Screen name="PerformanceScreen" component={StudentListScreen} />
      <Stack.Screen name="StudentProgressScreen" component={StudentProgressScreen} />
      <Stack.Screen name="Messages" component={MessageListScreen} />
      <Stack.Screen name="MessageScreen" component={MessageScreen} />
      <Stack.Screen name="ActivityManagerScreen" component={ActivityManagerScreen} />
      {/* <Stack.Screen name="EvaluateScreen" component={EvaluateScreen} /> */}
      {/* ✅ Add future teacher-specific screens here too if needed */}
    </Stack.Navigator>
  );
};

export default PrivateNavigator;
