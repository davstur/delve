import { useState, useCallback, useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const DEBOUNCE_MS = 500;

/**
 * Manages collapse state for a topic, persisted to AsyncStorage.
 */
export function usePersistedCollapseState(
  topicId: string | undefined,
  defaultExpanded: Set<string>,
) {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(defaultExpanded);
  const [loaded, setLoaded] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const expandedRef = useRef(expandedNodes);
  expandedRef.current = expandedNodes;

  // Load persisted state
  useEffect(() => {
    if (!topicId) return;
    const key = `collapse-state:${topicId}`;

    AsyncStorage.getItem(key)
      .then((raw) => {
        if (raw) {
          try {
            const ids: string[] = JSON.parse(raw);
            if (Array.isArray(ids)) {
              setExpandedNodes(new Set(ids));
            }
          } catch (e) {
            console.warn(`[collapseState] Corrupt data for ${topicId}, clearing:`, e);
            AsyncStorage.removeItem(key).catch(() => {});
          }
        }
        setLoaded(true);
      })
      .catch((e) => {
        console.warn(`[collapseState] Failed to load for ${topicId}:`, e);
        setLoaded(true);
      });
  }, [topicId]);

  // Debounced save
  useEffect(() => {
    if (!topicId || !loaded) return;
    const key = `collapse-state:${topicId}`;

    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      AsyncStorage.setItem(key, JSON.stringify(Array.from(expandedNodes))).catch(
        (e) => console.warn(`[collapseState] Failed to save for ${topicId}:`, e)
      );
    }, DEBOUNCE_MS);

    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
      // Flush current state on unmount
      if (topicId && loaded) {
        AsyncStorage.setItem(key, JSON.stringify(Array.from(expandedRef.current))).catch(
          (e) => console.warn(`[collapseState] Failed to flush on unmount:`, e)
        );
      }
    };
  }, [expandedNodes, topicId, loaded]);

  const toggleNode = useCallback((nodeId: string) => {
    setExpandedNodes((prev) => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  }, []);

  return { expandedNodes, toggleNode, setExpandedNodes, loaded };
}
