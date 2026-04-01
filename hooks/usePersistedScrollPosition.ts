import { useRef, useCallback, useEffect } from 'react';
import { ScrollView, NativeSyntheticEvent, NativeScrollEvent } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Persists and restores scroll position for a topic.
 * Use onContentSizeChange on ScrollView to trigger restore.
 */
export function usePersistedScrollPosition(topicId: string | undefined) {
  const scrollRef = useRef<ScrollView>(null);
  const scrollY = useRef(0);
  const restored = useRef(false);
  const targetY = useRef<number | null>(null);

  // Load target Y on mount
  useEffect(() => {
    restored.current = false;
    targetY.current = null;
    if (!topicId) return;

    AsyncStorage.getItem(`scroll-pos:${topicId}`)
      .then((raw) => {
        if (raw) {
          const y = parseInt(raw, 10);
          if (!isNaN(y) && y > 0) {
            targetY.current = y;
          }
        }
      })
      .catch((e) => console.warn(`[scrollPosition] Failed to load for ${topicId}:`, e));

    // Save on unmount
    return () => {
      if (topicId && scrollY.current > 0) {
        AsyncStorage.setItem(
          `scroll-pos:${topicId}`,
          String(Math.round(scrollY.current)),
        ).catch((e) => console.warn(`[scrollPosition] Failed to save for ${topicId}:`, e));
      }
    };
  }, [topicId]);

  const onScroll = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    scrollY.current = e.nativeEvent.contentOffset.y;
  }, []);

  // Called by ScrollView's onContentSizeChange — content is laid out
  const onContentSizeChange = useCallback(() => {
    if (restored.current || targetY.current === null) return;
    restored.current = true;
    scrollRef.current?.scrollTo({ y: targetY.current, animated: false });
  }, []);

  return { scrollRef, onScroll, onContentSizeChange };
}
