import React, { useState } from 'react';
import { Animated, TouchableOpacity, View, Text, StyleSheet, Modal } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';

const RenderCard = ({ item, index, fadeAnim, slideAnim, scaleAnim, navigation }) => {
    const [modalVisible, setModalVisible] = useState(false);

    const handlePress = () => {
        if (index === 0) {
            navigation.navigate('News');
        } else if (index === 1) {
            navigation.navigate('ImproveWritingScreen');
        } else if (index === 2) {
            navigation.navigate('ImproveReadingScreen');
        } else if (index === 3) { // Vocabulary Card
            setModalVisible(true);
        }
    };

    return (
        <>
            <Animated.View
                key={index}
                style={[
                    styles.card,
                    {
                        opacity: fadeAnim,
                        transform: [{ translateX: slideAnim }, { scale: scaleAnim }],
                        backgroundColor: item.bgColor,
                    },
                ]}
            >
                <TouchableOpacity style={styles.cardButton} activeOpacity={0.9} onPress={handlePress}>
                    <View style={styles.cardContent}>
                        <View style={styles.titleContainer}>
                            <Text style={styles.cardTitle}>{item.title}</Text>
                            <Text style={styles.cardSubtitle}>{item.subtitle}</Text>
                        </View>
                        <View style={styles.cardIconContainer}>
                            <Icon name={item.icon} size={24} color="#FFF" />
                        </View>
                    </View>
                    <View style={[styles.decorativeCircle, styles.circle1]} />
                    <View style={[styles.decorativeCircle, styles.circle2]} />
                </TouchableOpacity>
            </Animated.View>

            {/* Vocabulary Options Modal */}
            <Modal
                transparent={true}
                animationType="slide"
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Choose an Option</Text>

                        <TouchableOpacity 
                            style={styles.modalButton} 
                            onPress={() => {
                                setModalVisible(false);
                                navigation.navigate('Vocabulary');
                            }}
                        >
                            <Text style={styles.modalButtonText}>View Vocabulary</Text>
                        </TouchableOpacity>

                        <TouchableOpacity 
                            style={styles.modalButton} 
                            onPress={() => {
                                setModalVisible(false);
                                navigation.navigate('Quiz', { level: 'userLevel' });
                            }}
                        >
                            <Text style={styles.modalButtonText}>Take a Quiz</Text>
                        </TouchableOpacity>

                        <TouchableOpacity 
                            style={styles.modalButton} 
                            onPress={() => {
                                setModalVisible(false);
                                navigation.navigate('ReviewMistakes');
                            }}
                        >
                            <Text style={styles.modalButtonText}>Review Mistakes</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.modalCancelButton} onPress={() => setModalVisible(false)}>
                            <Text style={styles.modalCancelText}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </>
    );
};

const styles = StyleSheet.create({
    card: {
        borderRadius: 15,
        marginBottom: 15,
        height: 100,
        overflow: 'hidden',
        position: 'relative',
    },
    cardButton: {
        flex: 1,
        padding: 20,
    },
    cardContent: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        zIndex: 2,
    },
    titleContainer: {
        flex: 1,
    },
    cardTitle: {
        fontSize: 20,
        color: '#FFFFFF',
        fontWeight: 'bold',
        marginBottom: 5,
    },
    cardSubtitle: {
        fontSize: 16,
        color: 'rgba(255, 255, 255, 0.8)',
    },
    cardIconContainer: {
        width: 45,
        height: 45,
        borderRadius: 22.5,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    decorativeCircle: {
        position: 'absolute',
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: 100,
    },
    circle1: {
        width: 100,
        height: 100,
        right: -20,
        top: -50,
    },
    circle2: {
        width: 70,
        height: 70,
        right: 40,
        bottom: -20,
    },
    modalContainer: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        backgroundColor: '#FFF',
        padding: 20,
        borderRadius: 15,
        width: '80%',
        alignItems: 'center',
    },
    modalTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 15,
        color: '#6B5ECD',
    },
    modalButton: {
        backgroundColor: '#6B5ECD',
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 10,
        marginBottom: 10,
        width: '100%',
        alignItems: 'center',
    },
    modalButtonText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
    modalCancelButton: {
        marginTop: 10,
    },
    modalCancelText: {
        fontSize: 16,
        color: '#333',
    },
});

export default RenderCard;
