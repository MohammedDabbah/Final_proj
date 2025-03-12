import React from 'react';
import { View } from 'react-native';
import QuizComponent from '../components/Quiz';

const QuizScreen = ({ route, navigation }) => {
    const { level, words } = route.params || {};

    return (
        <QuizComponent 
            level={level || 'beginner'} 
            numQuestions={words ? words.length : 10} 
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
