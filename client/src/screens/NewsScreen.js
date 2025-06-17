import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, Image, TouchableOpacity, StyleSheet, ActivityIndicator, SafeAreaView, StatusBar } from 'react-native';
import newsApi from '../../api/newsApi';
import { Linking } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';

const NewsScreen = ({ navigation }) => {
    const [news, setNews] = useState([]);
    const [loading, setLoading] = useState(true);

    // Customize the navigation header
    React.useLayoutEffect(() => {
        navigation.setOptions({
            title: '', // Remove the title
            headerStyle: {
                backgroundColor: '#FFFFFF',
                elevation: 0,
                shadowOpacity: 0,
            },
            headerTintColor: '#6B5ECD', // Back button color
            headerBackTitleVisible: false, // Hide "Back" text on iOS
        });
    }, [navigation]);

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

    const formatDate = () => {
        const now = new Date();
        return now.toLocaleDateString('en-US', { 
            day: 'numeric', 
            month: 'short', 
            year: 'numeric' 
        });
    };

    const renderFeaturedItem = ({ item }) => {
        const imageUrl = item.urlToImage ? item.urlToImage : 'https://via.placeholder.com/350x200';
        
        return (
            <TouchableOpacity 
                style={styles.featuredCard} 
                onPress={() => Linking.openURL(item.url)}
                activeOpacity={0.9}
            >
                <Image source={{ uri: imageUrl }} style={styles.featuredImage} />
                <View style={styles.featuredContent}>
                    <Text style={styles.featuredTitle} numberOfLines={2}>
                        {item.title}
                    </Text>
                    <View style={styles.featuredMeta}>
                        <View style={styles.authorContainer}>
                            <View style={styles.authorAvatar}>
                                <Icon name="user" size={12} color="#6B5ECD" />
                            </View>
                            <Text style={styles.authorName}>{item.source.name}</Text>
                        </View>
                        <Text style={styles.publishDate}>{formatDate()}</Text>
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    const renderRegularItem = ({ item }) => {
        const imageUrl = item.urlToImage ? item.urlToImage : 'https://via.placeholder.com/80x80';
        
        return (
            <TouchableOpacity 
                style={styles.regularCard} 
                onPress={() => Linking.openURL(item.url)}
                activeOpacity={0.8}
            >
                <Image source={{ uri: imageUrl }} style={styles.regularImage} />
                <View style={styles.regularContent}>
                    <Text style={styles.regularTitle} numberOfLines={3}>
                        {item.title}
                    </Text>
                    <View style={styles.regularMeta}>
                        <Icon name="clock-o" size={12} color="#999" />
                        <Text style={styles.timeAgo}>2h ago</Text>
                        <Icon name="eye" size={12} color="#999" style={{ marginLeft: 15 }} />
                        <Text style={styles.readTime}>3 min read</Text>
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.safeArea}>
                <StatusBar barStyle="dark-content" backgroundColor="#F8F9FA" />
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#6B5ECD" />
                    <Text style={styles.loadingText}>Loading news...</Text>
                </View>
            </SafeAreaView>
        );
    }

    const featuredNews = news.slice(0, 1);
    const regularNews = news.slice(1);

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="dark-content" backgroundColor="#F8F9FA" />
            <View style={styles.container}>
                
                {/* Header Section */}
                <View style={styles.header}>
                    <View style={styles.headerTop}>
                        <View style={styles.dateContainer}>
                            <View style={styles.dateCircle}>
                                <Icon name="calendar" size={16} color="#6B5ECD" />
                            </View>
                            <Text style={styles.dateText}>{formatDate()}</Text>
                        </View>
                    </View>
                    <Text style={styles.headerTitle}>Breaking News</Text>
                </View>

                <FlatList
                    data={[]}
                    ListHeaderComponent={
                        <View>
                            {/* Featured News */}
                            {featuredNews.length > 0 && (
                                <View style={styles.featuredSection}>
                                    <FlatList
                                        data={featuredNews}
                                        renderItem={renderFeaturedItem}
                                        keyExtractor={(item, index) => `featured_${index}`}
                                        showsVerticalScrollIndicator={false}
                                    />
                                </View>
                            )}

                            {/* Regular News */}
                            <View style={styles.regularSection}>
                                {regularNews.map((item, index) => (
                                    <View key={index}>
                                        {renderRegularItem({ item })}
                                    </View>
                                ))}
                            </View>
                        </View>
                    }
                    showsVerticalScrollIndicator={false}
                />
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#F8F9FA',
    },
    container: {
        flex: 1,
        backgroundColor: '#F8F9FA',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 15,
        fontSize: 16,
        color: '#6B5ECD',
        fontWeight: '500',
    },
    
    // Header Styles
    header: {
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 25,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
    },
    headerTop: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    dateContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    dateCircle: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#F0F0F8',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    dateText: {
        fontSize: 14,
        color: '#666',
        fontWeight: '500',
    },
    searchButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#F0F0F8',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: '800',
        color: '#2C3E50',
    },

    // Featured News Styles
    featuredSection: {
        paddingHorizontal: 20,
        paddingTop: 25,
    },
    featuredCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        overflow: 'hidden',
        shadowColor: '#6B5ECD',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 8,
    },
    featuredImage: {
        width: '100%',
        height: 200,
        resizeMode: 'cover',
    },
    featuredContent: {
        padding: 20,
    },
    featuredTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#2C3E50',
        lineHeight: 24,
        marginBottom: 15,
    },
    featuredMeta: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    authorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    authorAvatar: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#F0F0F8',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 8,
    },
    authorName: {
        fontSize: 12,
        color: '#6B5ECD',
        fontWeight: '600',
    },
    publishDate: {
        fontSize: 12,
        color: '#999',
        fontWeight: '500',
    },

    // Regular News Styles
    regularSection: {
        paddingHorizontal: 20,
        paddingTop: 10,
    },
    regularCard: {
        flexDirection: 'row',
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 15,
        marginBottom: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 3,
    },
    regularImage: {
        width: 80,
        height: 80,
        borderRadius: 12,
        marginRight: 15,
    },
    regularContent: {
        flex: 1,
        justifyContent: 'space-between',
    },
    regularTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: '#2C3E50',
        lineHeight: 20,
        marginBottom: 10,
    },
    regularMeta: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    timeAgo: {
        fontSize: 11,
        color: '#999',
        marginLeft: 5,
        fontWeight: '500',
    },
    readTime: {
        fontSize: 11,
        color: '#999',
        marginLeft: 5,
        fontWeight: '500',
    },
});

export default NewsScreen;