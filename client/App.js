import React, { useContext } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { AuthProvider, AuthContext } from "./Auth/AuthContext";
import PrivateNavigator from "./Auth/PrivateNavigator";
import PublicNavigator from "./Auth/PublicNavigator";
import { ActivityIndicator, View } from "react-native";

const AppNavigator = () => {
  const { user, loading } = useContext(AuthContext);

  if (loading) {
    // Show a loading spinner while checking authentication
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {user ? <PrivateNavigator /> : <PublicNavigator />}
    </NavigationContainer>
  );
};

const App = () => (
  <AuthProvider>
    <AppNavigator />
  </AuthProvider>
);

export default App;
