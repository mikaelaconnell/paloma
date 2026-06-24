import React, { useState, useCallback } from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import {
  useFonts,
  PlayfairDisplay_400Regular,
  PlayfairDisplay_400Regular_Italic,
  PlayfairDisplay_700Bold,
} from "@expo-google-fonts/playfair-display";
import {
  DMSans_400Regular,
  DMSans_500Medium,
  DMSans_600SemiBold,
  DMSans_700Bold,
} from "@expo-google-fonts/dm-sans";
import * as SplashScreen from "expo-splash-screen";

import { useAuth } from "./src/hooks/useAuth";
import { colors } from "./src/lib/theme";
import { Trip } from "./src/types";

import AuthScreen from "./src/screens/AuthScreen";
import HomeScreen from "./src/screens/HomeScreen";
import AIPlannerScreen from "./src/screens/AIPlannerScreen";
import TripScreen from "./src/screens/TripScreen";

SplashScreen.preventAutoHideAsync();

type Screen =
  | { name: "home" }
  | { name: "planner" }
  | { name: "trip"; trip: Trip };

export default function App() {
  const { session, user, loading: authLoading, signOut } = useAuth();
  const [screen, setScreen] = useState<Screen>({ name: "home" });

  const [fontsLoaded] = useFonts({
    PlayfairDisplay_400Regular,
    PlayfairDisplay_400Regular_Italic,
    PlayfairDisplay_700Bold,
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_600SemiBold,
    DMSans_700Bold,
  });

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded && !authLoading) {
      await SplashScreen.hideAsync();
    }
  }, [fontsLoaded, authLoading]);

  if (!fontsLoaded || authLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={colors.mediterranean[400]} />
      </View>
    );
  }

  // Not logged in
  if (!session || !user) {
    return (
      <View style={styles.root} onLayout={onLayoutRootView}>
        <AuthScreen />
      </View>
    );
  }

  const displayName =
    user.user_metadata?.display_name || user.email?.split("@")[0] || "Friend";

  return (
    <View style={styles.root} onLayout={onLayoutRootView}>
      {screen.name === "home" && (
        <HomeScreen
          userId={user.id}
          displayName={displayName}
          onSelectTrip={(trip) => setScreen({ name: "trip", trip })}
          onCreateWithAI={() => setScreen({ name: "planner" })}
          onSignOut={signOut}
        />
      )}

      {screen.name === "planner" && (
        <AIPlannerScreen
          userId={user.id}
          onTripCreated={() => setScreen({ name: "home" })}
          onBack={() => setScreen({ name: "home" })}
        />
      )}

      {screen.name === "trip" && (
        <TripScreen
          trip={screen.trip}
          userId={user.id}
          onBack={() => setScreen({ name: "home" })}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loading: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
  },
});
