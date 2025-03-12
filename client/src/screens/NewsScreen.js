import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, Image, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import newsApi from '../../api/newsApi';
import { Linking } from 'react-native';


const NewsScreen = () => {
    const [news, setNews] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchNews();
    }, []);

    const fetchNews = async () => {
        try {
            const response = await newsApi.get();
            setNews(response.data.articles);
        } catch (error) {
            console.error('Error fetching news:', error);
        } finally {
            setLoading(false);
        }
    };

    const renderItem = ({ item }) => {
        const imageUrl = item.urlToImage ? item.urlToImage : 'https://via.placeholder.com/150';
    
        return (
            <TouchableOpacity style={styles.card} onPress={() => Linking.openURL(item.url)}>
                <Image source={{ uri: imageUrl }} style={styles.image} />
                <View style={styles.textContainer}>
                    <Text style={styles.title}>{item.title}</Text>
                    <Text style={styles.source}>{item.source.name}</Text>
                </View>
            </TouchableOpacity>
        );
    };

    if (loading) return <ActivityIndicator size="large" color="#6B5ECD" style={{ flex: 1, justifyContent: 'center' }} />;

    return (
        <View style={styles.container}>
            <Text style={styles.header}>Educational News</Text>
            <FlatList
                data={news}
                keyExtractor={(item, index) => index.toString()}
                renderItem={renderItem}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8F6FF',
        padding: 20,
    },
    header: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#6B5ECD',
        marginBottom: 10,
        textAlign: 'center',
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 15,
        padding: 15,
        marginBottom: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    textContainer: {
        marginTop: 10,
    },
    image: {
        width: '100%',
        height: 150,
        borderRadius: 10,
    },
    title: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
    },
    source: {
        fontSize: 12,
        color: '#888',
        marginTop: 5,
    },
});

export default NewsScreen;
