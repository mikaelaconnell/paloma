import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { colors, fonts, spacing, borderRadius } from "../lib/theme";
import { useAuth } from "../hooks/useAuth";

export default function AuthScreen() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const { signInWithEmail, signUpWithEmail } = useAuth();

  const handleSubmit = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert("Missing fields", "Please enter your email and password.");
      return;
    }

    if (mode === "signup" && !displayName.trim()) {
      Alert.alert("Missing name", "Please enter your name.");
      return;
    }

    setLoading(true);

    if (mode === "signin") {
      const { error } = await signInWithEmail(email.trim(), password);
      if (error) Alert.alert("Sign in failed", error.message);
    } else {
      const { error } = await signUpWithEmail(
        email.trim(),
        password,
        displayName.trim()
      );
      if (error) Alert.alert("Sign up failed", error.message);
    }

    setLoading(false);
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[colors.mediterranean[600], colors.mediterranean[400]]}
        style={styles.topGradient}
      >
        <View style={styles.heroContent}>
          <Text style={styles.sun}>&#x1F54A;</Text>
          <Text style={styles.appName}>Paloma</Text>
          <Text style={styles.tagline}>
            Plan beautiful trips with your people
          </Text>
        </View>
      </LinearGradient>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.formContainer}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.card}>
            {/* Mode toggle */}
            <View style={styles.modeToggle}>
              <TouchableOpacity
                style={[
                  styles.modeButton,
                  mode === "signin" && styles.modeButtonActive,
                ]}
                onPress={() => setMode("signin")}
              >
                <Text
                  style={[
                    styles.modeButtonText,
                    mode === "signin" && styles.modeButtonTextActive,
                  ]}
                >
                  Sign In
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modeButton,
                  mode === "signup" && styles.modeButtonActive,
                ]}
                onPress={() => setMode("signup")}
              >
                <Text
                  style={[
                    styles.modeButtonText,
                    mode === "signup" && styles.modeButtonTextActive,
                  ]}
                >
                  Sign Up
                </Text>
              </TouchableOpacity>
            </View>

            {mode === "signup" && (
              <TextInput
                style={styles.input}
                placeholder="Your first name"
                placeholderTextColor={colors.textLight}
                value={displayName}
                onChangeText={setDisplayName}
                autoCapitalize="words"
              />
            )}

            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor={colors.textLight}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />

            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor={colors.textLight}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />

            <TouchableOpacity
              style={[styles.submitButton, loading && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <Text style={styles.submitButtonText}>
                  {mode === "signin" ? "Sign In" : "Create Account"}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  topGradient: {
    paddingTop: 80,
    paddingBottom: 50,
    alignItems: "center",
  },
  heroContent: {
    alignItems: "center",
  },
  sun: {
    fontSize: 48,
    marginBottom: 8,
  },
  appName: {
    fontFamily: fonts.serif,
    fontSize: 40,
    color: colors.white,
    letterSpacing: 1,
  },
  tagline: {
    fontFamily: fonts.sans,
    fontSize: 16,
    color: "rgba(255,255,255,0.7)",
    marginTop: 8,
  },
  formContainer: {
    flex: 1,
    marginTop: -20,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    shadowColor: colors.mediterranean[600],
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 24,
    elevation: 8,
  },
  modeToggle: {
    flexDirection: "row",
    backgroundColor: colors.mediterranean[50],
    borderRadius: borderRadius.lg,
    padding: 4,
    marginBottom: spacing.lg,
  },
  modeButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: borderRadius.md,
    alignItems: "center",
  },
  modeButtonActive: {
    backgroundColor: colors.white,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  modeButtonText: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 14,
    color: colors.textLight,
  },
  modeButtonTextActive: {
    color: colors.mediterranean[600],
  },
  input: {
    fontFamily: fonts.sans,
    fontSize: 16,
    color: colors.text,
    backgroundColor: colors.sand[50],
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    marginBottom: spacing.md,
  },
  submitButton: {
    backgroundColor: colors.mediterranean[600],
    borderRadius: borderRadius.lg,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: spacing.sm,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontFamily: fonts.sansBold,
    fontSize: 16,
    color: colors.white,
  },
});
