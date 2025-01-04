import React, { useState, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native";
import { Audio } from "expo-av";
import merriamApi from "../../api/merriamApi";

const DictionaryScreen = ({ route }) => {
  // Destructure word from route.params
  const { initialWord } = route.params;
  const [word, setWord] = useState(initialWord || "");
  const [definition, setDefinition] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (initialWord) {
        console.log(initialWord)
      fetchWordData(initialWord);
    }
  }, [initialWord]);

  const fetchWordData = async (wordToFetch) => {
    if (!wordToFetch.trim()) {
      alert("Please enter a word!");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setDefinition(null);
      setAudioUrl(null);

      // Fetch word data from the API
      const response = await merriamApi.get(`/${wordToFetch}`);
      const data = response.data;

      if (data.length === 0 || !data[0].shortdef) {
        setError("No definitions found for this word.");
      } else {
        setDefinition(data[0].shortdef);

        // Extract audio URL if available
        const audioKey = data[0]?.hwi?.prs[0]?.sound?.audio;
        if (audioKey) {
          const audioFileUrl = `https://media.merriam-webster.com/audio/prons/en/us/mp3/${audioKey[0]}/${audioKey}.mp3`;
          setAudioUrl(audioFileUrl);
        }
      }
    } catch (err) {
      console.error("Error fetching word data:", err);
      setError("Failed to fetch the word data. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const playAudio = async () => {
    if (!audioUrl) return;
    try {
      const sound = new Audio.Sound();
      await sound.loadAsync({ uri: audioUrl });
      await sound.playAsync();
    } catch (err) {
      console.error("Error playing audio:", err);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Merriam-Webster Dictionary</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter a word..."
        value={word}
        onChangeText={setWord}
      />
      <TouchableOpacity style={styles.button} onPress={() => fetchWordData(word)}>
        <Text style={styles.buttonText}>Get Definition</Text>
      </TouchableOpacity>
      {loading && <ActivityIndicator size="large" color="#6200EE" />}
      {error && <Text style={styles.errorText}>{error}</Text>}
      {definition && (
        <View style={styles.definitionContainer}>
          <Text style={styles.definitionTitle}>Definitions:</Text>
          {definition.map((def, index) => (
            <Text key={index} style={styles.definitionText}>
              {index + 1}. {def}
            </Text>
          ))}
          {audioUrl && (
            <TouchableOpacity style={styles.audioButton} onPress={playAudio}>
              <Text style={styles.audioButtonText}>🔊 Play Pronunciation</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#EEF2FA",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
    marginBottom: 15,
    backgroundColor: "#fff",
    fontSize: 16,
  },
  button: {
    backgroundColor: "#6200EE",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 20,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  errorText: {
    color: "red",
    textAlign: "center",
    marginBottom: 10,
  },
  definitionContainer: {
    marginTop: 20,
  },
  definitionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  definitionText: {
    fontSize: 16,
    marginBottom: 10,
    color: "#333",
  },
  audioButton: {
    marginTop: 10,
    backgroundColor: "#007BFF",
    padding: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  audioButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default DictionaryScreen;
