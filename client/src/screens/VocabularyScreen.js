import React, { useState, useEffect, useContext } from 'react';
import { 
    View, 
    Text, 
    TextInput, 
    FlatList, 
    TouchableOpacity, 
    StyleSheet, 
    ActivityIndicator,
    SafeAreaView,
    StatusBar,
    Animated,
    Dimensions
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import merriamApi from '../../api/merriamApi';
import serverApi from '../../api/serverApi';
import beginnerWords from '../../Json/beginner_words.json';
import intermediateWords from '../../Json/intermediate_words.json';
import advancedWords from '../../Json/advanced_words.json';
import { AuthContext } from '../../Auth/AuthContext';

const { width } = Dimensions.get('window');

const VocabularyScreen = () => {
    const { user } = useContext(AuthContext);
    const [searchTerm, setSearchTerm] = useState('');
    const [words, setWords] = useState([]);
    const [loading, setLoading] = useState(false);
    const [fadeAnim] = useState(new Animated.Value(0));

    useEffect(() => {
        loadWordsByLevel();
        // Fade in animation
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
        }).start();
    }, [user?.userLevel]);
    
    const loadWordsByLevel = async () => {
        setLoading(true);
        try {
            let selectedWords;
            if (user?.userLevel === 'beginner') {
                selectedWords = beginnerWords.map(obj => obj.word);
            } else if (user?.userLevel === 'intermediate') {
                selectedWords = intermediateWords.map(obj => obj.word);
            } else {
                selectedWords = advancedWords.map(obj => obj.word);
            }
    
            const uniqueWords = [...new Set(selectedWords)];
            const wordDefinitions = await fetchDefinitions(uniqueWords);
            setWords(wordDefinitions);
        } catch (error) {
            console.error('Error loading words:', error);
        } finally {
            setLoading(false);
        }
    };

    const delay = ms => new Promise(res => setTimeout(res, ms));

    const fetchDefinitions = async (words) => {
        const batchSize = 25;
        const result = [];

        for (let i = 0; i < words.length; i += batchSize) {
            const batch = words.slice(i, i + batchSize);
            const batchResults = await Promise.all(
                batch.map(async (word) => {
                    try {
                        const response = await merriamApi.get(`/${word}`);
                        const definition = response.data?.[0]?.shortdef?.[0] || 'Definition not found';
                        return { word, definition };
                    } catch (error) {
                        return { word, definition: 'Error fetching definition' };
                    }
                })
            );
            result.push(...batchResults);
            await delay(300);
        }
        return result;
    };

    const handleSearch = async () => {
        if (searchTerm.trim() === '') return;
        setLoading(true);
        try {
            const definitions = await fetchDefinitions([searchTerm]);
            setWords(definitions);
        } catch (error) {
            console.error('Error fetching definition:', error);
        } finally {
            setLoading(false);
        }
    };

    const getLevelEmoji = (level) => {
        switch (level) {
            case 'beginner': return '🌱';
            case 'intermediate': return '🌿';
            case 'advanced': return '🌳';
            default: return '📚';
        }
    };

    const getLevelColor = (level) => {
        switch (level) {
            case 'beginner': return '#4CAF50';
            case 'intermediate': return '#FF9800';
            case 'advanced': return '#E91E63';
            default: return '#6B5ECD';
        }
    };

    const renderWordCard = ({ item, index }) => (
        <Animated.View 
            style={[
                styles.wordCard,
                {
                    opacity: fadeAnim,
                    transform: [{
                        translateY: fadeAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [50, 0],
                        }),
                    }],
                }
            ]}
        >
            <View style={styles.wordHeader}>
                <View style={styles.wordBadge}>
                    <Text style={styles.wordBadgeText}>{index + 1}</Text>
                </View>
                <View style={styles.wordContent}>
                    <Text style={styles.word}>{item.word}</Text>
                    <View style={styles.wordMeta}>
                        <Text style={styles.wordType}>Definition</Text>
                    </View>
                </View>
                {/* <TouchableOpacity style={styles.favoriteButton}>
                    <Icon name="heart-o" size={18} color="#6B5ECD" />
                </TouchableOpacity> */}
            </View>
            <View style={styles.definitionContainer}>
                <Text style={styles.definition}>{item.definition}</Text>
            </View>
        </Animated.View>
    );

    const renderEmptyState = () => (
        <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>📖</Text>
            <Text style={styles.emptyTitle}>No words found</Text>
            <Text style={styles.emptySubtitle}>
                {searchTerm ? 'Try searching for a different word' : 'Loading vocabulary...'}
            </Text>
        </View>
    );

    const renderLoadingState = () => (
        <View style={styles.loadingContainer}>
            <View style={styles.loadingCard}>
                <ActivityIndicator size="large" color="#6B5ECD" />
                <Text style={styles.loadingText}>
                    {searchTerm ? 'Searching...' : 'Loading vocabulary...'}
                </Text>
                <Text style={styles.loadingSubtext}>
                    Fetching definitions from dictionary ✨
                </Text>
            </View>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#6B5ECD" />
            
            {/* Background */}
            <View style={styles.backgroundContainer}>
                
                {/* Header Section */}
                <View style={styles.headerSection}>
                    <View style={styles.headerContent}>
                       
                        <View style={styles.levelContainer}>
                            <Text style={styles.levelEmoji}>
                                {getLevelEmoji(user?.userLevel)}
                            </Text>
                            <Text style={styles.header}>
                                {user?.userLevel?.toUpperCase() || 'VOCABULARY'} WORDS
                            </Text>
                        </View>
                        <View style={[styles.levelBadge, { backgroundColor: getLevelColor(user?.userLevel) }]}>
                            <Text style={styles.levelBadgeText}>
                                {words.length} words available
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Main Content */}
                <View style={styles.mainContent}>
                    
                    {/* Search Section */}
                    <View style={styles.searchSection}>
                        <View style={styles.searchContainer}>
                            <View style={styles.searchInputContainer}>
                                <Icon name="search" size={18} color="#999" style={styles.searchIcon} />
                                <TextInput
                                    style={styles.searchInput}
                                    placeholder="Search for any word..."
                                    placeholderTextColor="#999"
                                    value={searchTerm}
                                    onChangeText={setSearchTerm}
                                    onSubmitEditing={handleSearch}
                                />
                            </View>
                            <TouchableOpacity onPress={handleSearch} style={styles.searchButton}>
                                <Icon name="arrow-right" size={18} color="#FFF" />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Words List */}
                    <View style={styles.wordsSection}>
                        <View style={styles.wordsSectionHeader}>
                            <Text style={styles.sectionTitle}>
                                📚 Your Vocabulary
                            </Text>
                            {/* <TouchableOpacity style={styles.refreshButton} onPress={loadWordsByLevel}>
                                <Icon name="refresh" size={16} color="#6B5ECD" />
                            </TouchableOpacity> */}
                        </View>

                        {loading ? (
                            renderLoadingState()
                        ) : (
                            <FlatList
                                data={words}
                                keyExtractor={(item, index) => `${item.word}-${index}`}
                                renderItem={renderWordCard}
                                ListEmptyComponent={renderEmptyState}
                                showsVerticalScrollIndicator={false}
                                contentContainerStyle={styles.listContainer}
                                ItemSeparatorComponent={() => <View style={styles.separator} />}
                            />
                        )}
                    </View>
                </View>

                {/* Floating Elements */}
                <View style={styles.floatingElements}>
                    <View style={[styles.floatingBubble, styles.bubble1]} />
                    <View style={[styles.floatingBubble, styles.bubble2]} />
                </View>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#6B5ECD',
    },
    backgroundContainer: {
        flex: 1,
        backgroundColor: '#6B5ECD',
    },
    headerSection: {
        paddingTop: 20,
        paddingHorizontal: 20,
        paddingBottom: 30,
    },
    headerContent: {
        alignItems: 'center',
    },
    welcomeText: {
        fontSize: 16,
        color: '#E8E3FF',
        marginBottom: 10,
        fontWeight: '500',
    },
    levelContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15,
    },
    levelEmoji: {
        fontSize: 24,
        marginRight: 10,
    },
    header: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#FFFFFF',
        letterSpacing: 1,
    },
    levelBadge: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#4CAF50',
    },
    levelBadgeText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '600',
    },
    mainContent: {
        flex: 1,
        backgroundColor: '#F8F6FF',
        borderTopLeftRadius: 25,
        borderTopRightRadius: 25,
        paddingTop: 25,
        paddingHorizontal: 20,
    },
    searchSection: {
        marginBottom: 25,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 15,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    searchInputContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 15,
        paddingHorizontal: 15,
        paddingVertical: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
        borderWidth: 1,
        borderColor: 'rgba(107, 94, 205, 0.2)',
    },
    searchIcon: {
        marginRight: 10,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        color: '#333',
    },
    searchButton: {
        backgroundColor: '#6B5ECD',
        padding: 12,
        borderRadius: 15,
        shadowColor: '#6B5ECD',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    wordsSection: {
        flex: 1,
    },
    wordsSectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
    },
    refreshButton: {
        padding: 8,
        borderRadius: 10,
        backgroundColor: 'rgba(107, 94, 205, 0.1)',
    },
    listContainer: {
        paddingBottom: 20,
    },
    separator: {
        height: 10,
    },
    wordCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 5,
        borderWidth: 1,
        borderColor: 'rgba(107, 94, 205, 0.1)',
    },
    wordHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15,
    },
    wordBadge: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#6B5ECD',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    wordBadgeText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: 'bold',
    },
    wordContent: {
        flex: 1,
    },
    word: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 4,
    },
    wordMeta: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    wordType: {
        fontSize: 12,
        color: '#999',
        fontWeight: '500',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    favoriteButton: {
        padding: 8,
        borderRadius: 10,
        backgroundColor: 'rgba(107, 94, 205, 0.1)',
    },
    definitionContainer: {
        backgroundColor: 'rgba(107, 94, 205, 0.05)',
        padding: 15,
        borderRadius: 12,
        borderLeftWidth: 4,
        borderLeftColor: '#6B5ECD',
    },
    definition: {
        fontSize: 16,
        color: '#555',
        lineHeight: 24,
        fontStyle: 'italic',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 50,
    },
    loadingCard: {
        backgroundColor: '#FFFFFF',
        padding: 30,
        borderRadius: 20,
        alignItems: 'center',
        shadowColor: '#6B5ECD',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 5,
    },
    loadingText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#6B5ECD',
        marginTop: 15,
        marginBottom: 5,
    },
    loadingSubtext: {
        fontSize: 14,
        color: '#888',
        textAlign: 'center',
    },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 50,
    },
    emptyEmoji: {
        fontSize: 64,
        marginBottom: 20,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 10,
    },
    emptySubtitle: {
        fontSize: 16,
        color: '#888',
        textAlign: 'center',
        lineHeight: 24,
    },
    floatingElements: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        pointerEvents: 'none',
    },
    floatingBubble: {
        position: 'absolute',
        borderRadius: 50,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.2)',
    },
    bubble1: {
        width: 80,
        height: 80,
        top: '10%',
        right: '5%',
    },
    bubble2: {
        width: 60,
        height: 60,
        top: '60%',
        left: '5%',
    },
});

export default VocabularyScreen;