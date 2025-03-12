import React, { useState, useEffect, useContext } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import merriamApi from '../../api/merriamApi';
import serverApi from '../../api/serverApi';
import beginnerWords from '../../Json/beginner_words.json';
import intermediateWords from '../../Json/intermediate_words.json';
import advancedWords from '../../Json/advanced_words.json';
import { AuthContext } from '../../Auth/AuthContext';

const VocabularyScreen = () => {
    const { user } = useContext(AuthContext); // Get user level
    const [searchTerm, setSearchTerm] = useState('');
    const [words, setWords] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadWordsByLevel();
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
    
            // ✅ Remove duplicate words before fetching definitions
            const uniqueWords = [...new Set(selectedWords)];
            
            const wordDefinitions = await fetchDefinitions(uniqueWords);
            setWords(wordDefinitions);
        } catch (error) {
            console.error('Error loading words:', error);
        } finally {
            setLoading(false);
        }
    };
    

    // Fetch definitions from Merriam-Webster API
    const fetchDefinitions = async (words) => {
        const fetchedDefinitions = [];
        for (const word of words) {
            try {
                const response = await merriamApi.get(`/${word}`);
                if (response.data.length > 0 && response.data[0].shortdef) {
                    fetchedDefinitions.push({ word, definition: response.data[0].shortdef[0] });
                } else {
                    fetchedDefinitions.push({ word, definition: 'Definition not found' });
                }
            } catch (error) {
                fetchedDefinitions.push({ word, definition: 'Error fetching definition' });
            }
        }
        return fetchedDefinitions;
    };

    // Handle search
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

    return (
        <View style={styles.container}>
            <Text style={styles.header}>Vocabulary - {user?.userLevel?.toUpperCase()}</Text>

            {/* Search Bar */}
            <View style={styles.searchContainer}>
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search for a word..."
                    value={searchTerm}
                    onChangeText={setSearchTerm}
                />
                <TouchableOpacity onPress={handleSearch} style={styles.searchButton}>
                    <Icon name="search" size={18} color="#FFF" />
                </TouchableOpacity>
            </View>

            {/* Loading Indicator */}
            {loading && <ActivityIndicator size="large" color="#6B5ECD" style={{ marginTop: 20 }} />}

            {/* Word List */}
            <FlatList
                data={words}
                keyExtractor={(item, index) => `${item.word}-${index}`} // ✅ Ensure unique keys
                renderItem={({ item }) => (
                <View style={styles.wordCard}>
                    <Text style={styles.word}>{item.word}</Text>
                    <Text style={styles.definition}>{item.definition}</Text>
                </View>
                )}
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
        textAlign: 'center',
        marginBottom: 20,
    },
    searchContainer: {
        flexDirection: 'row',
        backgroundColor: '#FFF',
        borderRadius: 10,
        paddingHorizontal: 15,
        paddingVertical: 10,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        color: '#333',
    },
    searchButton: {
        backgroundColor: '#6B5ECD',
        padding: 10,
        borderRadius: 8,
    },
    wordCard: {
        backgroundColor: '#FFF',
        padding: 15,
        borderRadius: 10,
        marginBottom: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    word: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    definition: {
        fontSize: 16,
        color: '#555',
        marginTop: 5,
    },
});

export default VocabularyScreen;
