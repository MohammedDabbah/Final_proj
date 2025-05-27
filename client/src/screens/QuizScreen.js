import React, { useContext } from 'react';
import { View } from 'react-native';
import QuizComponent from '../components/Quiz';
import { CommonActions } from '@react-navigation/native';
import { AuthContext } from '../../Auth/AuthContext';


const QuizScreen = ({ route, navigation }) => {
    //const { level, words } = route.params || {};
    const { words } = route.params || {};
    const {user} = useContext(AuthContext);
   // console.log(words);

    return (
        <QuizComponent 
            level={user.userLevel} 
            numQuestions={10} 
            words={words} 
            onQuizComplete={(score) => navigation.dispatch(
                            CommonActions.reset({
                                index: 0,
                                routes: [{ name: 'ReviewMistakes' }]
                                }
                            ))
                            }
        />
    );
};


export default QuizScreen;
