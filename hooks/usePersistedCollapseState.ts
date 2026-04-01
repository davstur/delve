import { useState, useCallback, useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const DEBOUNCE_MS = 500;

/**
 * Manages collapse state for a topic, persisted to AsyncStorage.
 * Returns [expandedNodes, toggleNode, setExpandedNodes].
 */
export function usePersistedCollapseState(
  topicId: string | undefined,
  defaultExpanded: Set<string>,
) {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(defaultExpanded);
  const [loaded, setLoaded] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

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
          } catch {
            // Corrupt data — use defaults
          }
        }
        setLoaded(true);
      })
      .catch(() => {
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
        () => {} // Best-effort save
      );
    }, DEBOUNCE_MS);

    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
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
