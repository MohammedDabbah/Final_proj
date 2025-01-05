import React, { useState, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator,Animated  } from "react-native";
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
      <Text style={styles.title}> Dictionary</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter a word..."
        value={word}
        onChangeText={setWord}
      />
      <TouchableOpacity style={styles.button} onPress={() => fetchWordData(word)}>
        <Text style={styles.buttonText}>Get Definition</Text>
      </TouchableOpacity>
      {loading && <ActivityIndicator size="large" color="#B052F7" />}
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
    backgroundColor: "#F8F9FF",  // Softer background color
  },
  title: {
    fontSize: 26,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 25,
    color: "#4A4A8F",  // Friendly purple-blue color
    letterSpacing: 0.5,
  },
  input: {
    borderWidth: 2,
    borderColor: "#E8E8FF",
    borderRadius: 15,
    padding: 15,
    marginBottom: 15,
    backgroundColor: "#fff",
    fontSize: 18,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  button: {
    backgroundColor: "#B052F7",  // Softer purple
    padding: 15,
    borderRadius: 15,
    alignItems: "center",
    marginBottom: 20,
    shadowColor: "#7B78FF",
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  errorText: {
    color: "#FF6B6B",  // Softer red
    textAlign: "center",
    marginBottom: 10,
    fontSize: 16,
  },
  definitionContainer: {
    marginTop: 20,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 25,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: "#F0F0FF",
  },
  definitionTitle: {
    fontSize: 22,
    fontWeight: "600",
    marginBottom: 15,
    color: "#4A4A8F",
    letterSpacing: 0.5,
  },
  definitionText: {
    fontSize: 18,
    marginBottom: 15,
    color: "#484848",
    lineHeight: 26,
    letterSpacing: 0.3,
  },
  audioButton: {
    marginTop: 15,
    backgroundColor: "#B052F7",
    padding: 12,
    borderRadius: 15,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
  },
  audioButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "500",
  },
});

export default DictionaryScreen;
