import React from 'react';
import { Animated, TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';



const RenderCard = ({ item, index, fadeAnim, slideAnim, scaleAnim, navigation }) => {
  return (
    <Animated.View
      key={index}
      style={[
        styles.card,
        {
          opacity: fadeAnim,
          transform: [
            { translateX: slideAnim },
            { scale: scaleAnim },
          ],
          backgroundColor: item.bgColor,
        },
      ]}
    >
      <TouchableOpacity
        style={styles.cardButton}
        activeOpacity={0.9}
        onPress={() => {
          if (index === 0) {
            console.log('news pressed');
            navigation.navigate('News')
          } else if (index === 1) {
            console.log('write pressed');
          } else if (index === 2) {
            console.log('reading pressed');
          }
        }}
      >
        <View style={styles.cardContent}>
          <View style={styles.titleContainer}>
            <Text style={styles.cardTitle}>{item.title}</Text>
            <Text style={styles.cardSubtitle}>{item.subtitle}</Text>
          </View>
          <View style={styles.cardIconContainer}>
            <Icon name={item.icon} size={24} color="#FFF" />
          </View>
        </View>
        {/* Decorative Circles */}
        <View style={[styles.decorativeCircle, styles.circle1]} />
        <View style={[styles.decorativeCircle, styles.circle2]} />
      </TouchableOpacity>
    </Animated.View>
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
});

export default RenderCard;
