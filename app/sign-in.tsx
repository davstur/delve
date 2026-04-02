import { View, Text, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

export default function SignInScreen() {
  const { signInWithGoogle } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignIn = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await signInWithGoogle();
    } catch (e: any) {
      setError(e?.message || 'Sign in failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View testID="sign-in-screen" style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.emoji}>🔭</Text>
        <Text style={styles.title}>Delve</Text>
        <Text style={styles.subtitle}>
          AI-powered knowledge exploration
        </Text>

        {error && (
          <View testID="sign-in-error" style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <Pressable
          testID="google-sign-in-button"
          style={[styles.googleButton, isLoading && styles.googleButtonDisabled]}
          onPress={handleSignIn}
          disabled={isLoading}
          accessibilityRole="button"
          accessibilityLabel="Sign in with Google"
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#F0F0F5" />
          ) : (
            <Text style={styles.googleButtonText}>Sign in with Google</Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F0F14',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  emoji: {
    fontSize: 80,
    marginBottom: 16,
  },
  title: {
    fontSize: 36,
    fontWeight: '700',
    color: '#F0F0F5',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#8888A0',
    textAlign: 'center',
    marginBottom: 48,
  },
  errorContainer: {
    backgroundColor: '#7F1D1D',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    marginBottom: 16,
    width: '100%',
  },
  errorText: {
    color: '#FCA5A5',
    fontSize: 14,
    textAlign: 'center',
  },
  googleButton: {
    backgroundColor: '#4F46E5',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
  },
  googleButtonDisabled: {
    opacity: 0.7,
  },
  googleButtonText: {
    color: '#F0F0F5',
    fontSize: 17,
    fontWeight: '600',
  },
});
