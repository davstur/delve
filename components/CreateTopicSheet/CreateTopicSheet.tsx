import { useCallback, useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Keyboard,
} from 'react-native';
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';

interface CreateTopicSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (title: string) => Promise<void>;
  isLoading: boolean;
  error: string | null;
  failCount: number;
}

export function CreateTopicSheet({
  isOpen,
  onClose,
  onSubmit,
  isLoading,
  error,
  failCount,
}: CreateTopicSheetProps) {
  const bottomSheetRef = useRef<BottomSheet>(null);
  const inputRef = useRef<TextInput>(null);
  const [title, setTitle] = useState('');

  useEffect(() => {
    if (isOpen) {
      bottomSheetRef.current?.expand();
      setTimeout(() => inputRef.current?.focus(), 300);
    } else {
      bottomSheetRef.current?.close();
      setTitle('');
    }
  }, [isOpen]);

  const handleSubmit = useCallback(() => {
    const trimmed = title.trim();
    if (trimmed.length < 2 || isLoading) return;
    Keyboard.dismiss();
    onSubmit(trimmed);
  }, [title, isLoading, onSubmit]);

  const canSubmit = title.trim().length >= 2 && !isLoading;

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={isOpen ? 0 : -1}
      snapPoints={['40%']}
      enablePanDownToClose={!isLoading}
      onClose={onClose}
      keyboardBehavior="interactive"
      keyboardBlurBehavior="restore"
      backgroundStyle={styles.sheetBackground}
      handleIndicatorStyle={styles.handleIndicator}
    >
      <BottomSheetView style={styles.content}>
        {isLoading ? (
          <View testID="create-topic-loading" style={styles.loadingContainer}>
            <Text style={styles.loadingEmoji}>🔭</Text>
            <Text style={styles.loadingTitle}>
              Exploring {title}...
            </Text>
            <ActivityIndicator
              size="small"
              color="#4F46E5"
              style={styles.spinner}
            />
            <Text
              style={styles.loadingSubtitle}
              accessibilityLiveRegion="polite"
            >
              Searching the web and building your breakdown
            </Text>
          </View>
        ) : (
          <View testID="create-topic-form" style={styles.formContainer}>
            <TextInput
              ref={inputRef}
              testID="create-topic-input"
              style={styles.input}
              placeholder="What are you curious about?"
              placeholderTextColor="#8888A0"
              value={title}
              onChangeText={setTitle}
              maxLength={200}
              returnKeyType="go"
              onSubmitEditing={handleSubmit}
              autoCapitalize="sentences"
              autoCorrect
              accessibilityLabel="Topic name"
              accessibilityHint="Enter a subject to explore"
            />

            {error && (
              <View testID="create-topic-error" style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
                {failCount >= 3 && (
                  <Text style={styles.errorHint}>
                    Try a different topic or check your connection.
                  </Text>
                )}
              </View>
            )}

            <Pressable
              testID="create-topic-submit"
              style={[styles.submitButton, !canSubmit && styles.submitDisabled]}
              onPress={handleSubmit}
              disabled={!canSubmit}
              accessibilityRole="button"
              accessibilityLabel="Explore topic"
              accessibilityHint="Generates an AI breakdown of your topic"
            >
              <Text
                style={[
                  styles.submitText,
                  !canSubmit && styles.submitTextDisabled,
                ]}
              >
                Explore
              </Text>
            </Pressable>
          </View>
        )}
      </BottomSheetView>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  sheetBackground: {
    backgroundColor: '#1A1A24',
  },
  handleIndicator: {
    backgroundColor: '#8888A0',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  formContainer: {
    paddingTop: 8,
  },
  input: {
    backgroundColor: '#0F0F14',
    color: '#F0F0F5',
    fontSize: 18,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2A2A36',
  },
  errorContainer: {
    marginTop: 12,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 14,
  },
  errorHint: {
    color: '#8888A0',
    fontSize: 13,
    marginTop: 4,
  },
  submitButton: {
    backgroundColor: '#4F46E5',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  submitDisabled: {
    backgroundColor: '#2A2A36',
  },
  submitText: {
    color: '#F0F0F5',
    fontSize: 17,
    fontWeight: '600',
  },
  submitTextDisabled: {
    color: '#8888A0',
  },
  loadingContainer: {
    alignItems: 'center',
    paddingTop: 24,
  },
  loadingEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  loadingTitle: {
    color: '#F0F0F5',
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
  },
  spinner: {
    marginBottom: 12,
  },
  loadingSubtitle: {
    color: '#8888A0',
    fontSize: 14,
  },
});
