import React, { useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import serverApi from '../../api/serverApi';
import { AuthContext } from "../../Auth/AuthContext";
import { CommonActions } from '@react-navigation/native';

const LevelSelectionScreen = ({ navigation }) => {
    const {user} = useContext(AuthContext)
    const handleTakeQuiz = () => {
        navigation.navigate('QuizScreen', { assessLevel: true }); // Pass a flag to quiz for assessment
    };

    const handleSkipQuiz = async () => {
        try{
            // Set default level to beginner
            //const response = await serverApi.post('/userLevel-update', {user}, {withCredentials: true})
            navigation.dispatch(
                CommonActions.reset({
                    index: 0,
                    routes: [{ name: 'Home' }]
                })
            );
           
        }catch(err){}
    };

    return (
        <View style={styles.container}>
            <Text style={styles.header}>Welcome!</Text>
            <Text style={styles.subHeader}>
                Would you like to take a quiz to determine your level, or start as a beginner?
            </Text>

            <TouchableOpacity style={styles.button} onPress={handleTakeQuiz}>
                <Text style={styles.buttonText}>Take Level Assessment</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.button, styles.skipButton]} onPress={handleSkipQuiz}>
                <Text style={styles.buttonText}>Continue as Beginner</Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8F6FF',
        paddingHorizontal: 20,
        paddingTop: 80,
        alignItems: 'center',
    },
    header: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#6B5ECD',
        marginBottom: 10,
    },
    subHeader: {
        fontSize: 18,
        color: '#555',
        textAlign: 'center',
        marginBottom: 30,
        paddingHorizontal: 15,
    },
    button: {
        backgroundColor: '#6B5ECD',
        paddingVertical: 15,
        paddingHorizontal: 30,
        borderRadius: 15,
        marginBottom: 12,
        width: '100%',
        alignItems: 'center',
    },
    skipButton: {
        backgroundColor: '#FF8C69',
    },
    buttonText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
});

export default LevelSelectionScreen;
