import { useRef, useCallback, useEffect } from 'react';
import { ScrollView, NativeSyntheticEvent, NativeScrollEvent } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Persists and restores scroll position for a topic.
 */
export function usePersistedScrollPosition(topicId: string | undefined) {
  const scrollRef = useRef<ScrollView>(null);
  const scrollY = useRef(0);
  const restored = useRef(false);

  // Save on unmount
  useEffect(() => {
    return () => {
      if (topicId && scrollY.current > 0) {
        AsyncStorage.setItem(
          `scroll-pos:${topicId}`,
          String(Math.round(scrollY.current)),
        ).catch(() => {});
      }
    };
  }, [topicId]);

  const onScroll = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    scrollY.current = e.nativeEvent.contentOffset.y;
  }, []);

  const restoreScrollPosition = useCallback(() => {
    if (!topicId || restored.current) return;
    restored.current = true;

    AsyncStorage.getItem(`scroll-pos:${topicId}`)
      .then((raw) => {
        if (raw) {
          const y = parseInt(raw, 10);
          if (!isNaN(y) && y > 0) {
            // Small delay to let content render
            setTimeout(() => {
              scrollRef.current?.scrollTo({ y, animated: false });
            }, 100);
          }
        }
      })
      .catch(() => {});
  }, [topicId]);

  return { scrollRef, onScroll, restoreScrollPosition };
}
