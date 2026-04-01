import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Linking,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { DepthIndicator } from './DepthIndicator';
import type { Source } from '../../types';

interface CollapsibleSectionProps {
  nodeId: string;
  label: string;
  emoji: string;
  summary: string;
  depth: number;
  branchColor: string;
  sources: Source[] | null;
  isExpanded: boolean;
  childCount: number;
  onToggle: (nodeId: string) => void;
  onExpand?: (nodeId: string, prompt?: string) => Promise<void>;
  onAddSubtopics?: (nodeId: string, labels: string[]) => Promise<void>;
  onSuggestSubtopics?: (nodeId: string) => Promise<{ label: string; emoji: string }[]>;
  children?: React.ReactNode;
}

const DEPTH_STYLES = {
  1: { fontSize: 28, fontWeight: '700' as const },
  2: { fontSize: 22, fontWeight: '600' as const },
  3: { fontSize: 18, fontWeight: '500' as const },
  4: { fontSize: 16, fontWeight: '600' as const },
};

const DEPTH_INDENT = { 1: 0, 2: 0, 3: 12, 4: 24 };

function CollapsibleSectionInner({
  nodeId,
  label,
  emoji,
  summary,
  depth,
  branchColor,
  sources,
  isExpanded,
  childCount,
  onToggle,
  onExpand,
  onAddSubtopics,
  onSuggestSubtopics,
  children,
}: CollapsibleSectionProps) {
  const isRoot = depth === 1;
  const isMaxDepth = depth === 4;
  const chevronRotation = useSharedValue(isExpanded ? 1 : 0);
  const [expandPanelOpen, setExpandPanelOpen] = useState(false);
  const [expandPrompt, setExpandPrompt] = useState('');
  const [isExpanding, setIsExpanding] = useState(false);
  const [expandError, setExpandError] = useState<string | null>(null);

  // Subtopic panel state
  const [subtopicPanelOpen, setSubtopicPanelOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<{ label: string; emoji: string }[]>([]);
  const [selectedLabels, setSelectedLabels] = useState<Set<string>>(new Set());
  const [customLabel, setCustomLabel] = useState('');
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [isCreatingSubtopics, setIsCreatingSubtopics] = useState(false);
  const [subtopicError, setSubtopicError] = useState<string | null>(null);

  React.useEffect(() => {
    chevronRotation.value = withTiming(isExpanded ? 1 : 0, { duration: 200 });
  }, [isExpanded, chevronRotation]);

  const chevronStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${chevronRotation.value * 90}deg` }],
  }));

  const handlePress = useCallback(() => {
    if (!isRoot) {
      onToggle(nodeId);
    }
  }, [isRoot, nodeId, onToggle]);

  const handleExpandChipPress = useCallback(() => {
    if (onExpand) {
      setExpandPanelOpen((prev) => !prev);
      setExpandError(null);
    } else {
      Alert.alert('Coming soon', 'This feature is coming in a future update.');
    }
  }, [onExpand]);

  const handleExpandSubmit = useCallback(async () => {
    if (!onExpand || isExpanding) return;
    setIsExpanding(true);
    setExpandError(null);
    try {
      await onExpand(nodeId, expandPrompt.trim() || undefined);
      setExpandPanelOpen(false);
      setExpandPrompt('');
    } catch (e: any) {
      setExpandError(e?.message || 'Expansion failed. Try again.');
    } finally {
      setIsExpanding(false);
    }
  }, [onExpand, nodeId, expandPrompt, isExpanding]);

  const handleSubtopicsChipPress = useCallback(async () => {
    if (!onSuggestSubtopics || !onAddSubtopics) {
      Alert.alert('Coming soon', 'This feature is coming in a future update.');
      return;
    }

    // If panel is open, just close it
    if (subtopicPanelOpen) {
      setSubtopicPanelOpen(false);
      setSubtopicError(null);
      return;
    }

    // Open panel and fetch suggestions if needed
    setSubtopicPanelOpen(true);
    setSubtopicError(null);

    if (suggestions.length === 0) {
      setIsSuggesting(true);
      try {
        const results = await onSuggestSubtopics(nodeId);
        setSuggestions(results);
      } catch (e: any) {
        setSubtopicError(e?.message || 'Failed to get suggestions. Try again.');
      } finally {
        setIsSuggesting(false);
      }
    }
  }, [onSuggestSubtopics, onAddSubtopics, nodeId, subtopicPanelOpen, suggestions.length]);

  const toggleSuggestion = useCallback((label: string) => {
    setSelectedLabels((prev) => {
      const next = new Set(prev);
      if (next.has(label)) {
        next.delete(label);
      } else {
        next.add(label);
      }
      return next;
    });
  }, []);

  const addCustomLabel = useCallback(() => {
    const trimmed = customLabel.trim();
    if (trimmed.length >= 2) {
      setSelectedLabels((prev) => new Set(prev).add(trimmed));
      setCustomLabel('');
    }
  }, [customLabel]);

  const handleCreateSubtopics = useCallback(async () => {
    if (!onAddSubtopics || isCreatingSubtopics || selectedLabels.size === 0) return;
    setIsCreatingSubtopics(true);
    setSubtopicError(null);
    try {
      await onAddSubtopics(nodeId, Array.from(selectedLabels));
      setSubtopicPanelOpen(false);
      setSuggestions([]);
      setSelectedLabels(new Set());
    } catch (e: any) {
      setSubtopicError(e?.message || 'Failed to create subtopics. Try again.');
    } finally {
      setIsCreatingSubtopics(false);
    }
  }, [onAddSubtopics, nodeId, selectedLabels, isCreatingSubtopics]);

  // Sources may come as string (JSONB from Supabase) or array
  const parsedSources: Source[] = React.useMemo(() => {
    if (!sources) return [];
    if (typeof sources === 'string') {
      try { return JSON.parse(sources); } catch { return []; }
    }
    return sources;
  }, [sources]);

  const indent = DEPTH_INDENT[depth as keyof typeof DEPTH_INDENT] ?? 0;
  const headingStyle = DEPTH_STYLES[depth as keyof typeof DEPTH_STYLES] ?? DEPTH_STYLES[4];

  return (
    <View
      testID={`section-${nodeId}`}
      style={[
        styles.container,
        indent > 0 && { marginLeft: indent },
        depth > 1 && { borderLeftWidth: 3, borderLeftColor: branchColor },
      ]}
    >
      {/* Heading row */}
      <Pressable
        testID={`section-heading-${nodeId}`}
        style={styles.headingRow}
        onPress={handlePress}
        disabled={isRoot}
        accessibilityRole="header"
        accessibilityState={{ expanded: isExpanded }}
        accessibilityHint={isRoot ? undefined : 'Double tap to collapse or expand'}
      >
        {depth > 1 && <DepthIndicator depth={depth} />}
        <Text style={[styles.emoji, { fontSize: headingStyle.fontSize - 4 }]}>
          {emoji}
        </Text>
        <Text
          style={[
            styles.headingText,
            { fontSize: headingStyle.fontSize, fontWeight: headingStyle.fontWeight },
          ]}
          numberOfLines={2}
        >
          {label}
        </Text>
        {!isRoot && (
          <View style={styles.chevronArea}>
            {!isExpanded && childCount > 0 && (
              <Text style={styles.childCount}>{childCount}</Text>
            )}
            <Animated.Text style={[styles.chevron, chevronStyle]}>
              ▸
            </Animated.Text>
          </View>
        )}
      </Pressable>

      {/* Expanded content */}
      {isExpanded && (
        <View testID={`section-body-${nodeId}`} style={styles.body}>
          <Text style={styles.summary}>{summary}</Text>

          {/* Source links */}
          {parsedSources.length > 0 && (
            <View testID={`section-sources-${nodeId}`} style={styles.sourceRow}>
              {parsedSources.map((source, i) => (
                <Pressable
                  key={i}
                  testID={`source-link-${nodeId}-${i}`}
                  onPress={() => {
                    if (source.url) {
                      Linking.openURL(source.url).catch(() => {
                        Alert.alert('Cannot open link', 'This link could not be opened.');
                      });
                    }
                  }}
                  accessibilityRole="link"
                  accessibilityLabel={`Open ${source.title}`}
                >
                  <Text style={styles.sourceText} numberOfLines={1}>
                    🔗 {source.title}
                  </Text>
                </Pressable>
              ))}
            </View>
          )}

          {/* Action chips */}
          <View testID={`section-chips-${nodeId}`} style={styles.chipRow}>
            <Pressable
              testID={`chip-expand-${nodeId}`}
              style={[styles.chip, expandPanelOpen && styles.chipActive]}
              onPress={handleExpandChipPress}
              disabled={isExpanding}
              accessibilityRole="button"
              accessibilityLabel="Expand this section"
            >
              <Text style={styles.chipText}>
                {isExpanding ? '⏳ Expanding...' : '✨ Expand'}
              </Text>
            </Pressable>
            {!isMaxDepth && (
              <Pressable
                testID={`chip-subtopics-${nodeId}`}
                style={[styles.chip, subtopicPanelOpen && styles.chipActive]}
                onPress={handleSubtopicsChipPress}
                disabled={isCreatingSubtopics}
                accessibilityRole="button"
                accessibilityLabel="Add subtopics"
              >
                <Text style={styles.chipText}>
                  {isCreatingSubtopics ? '⏳ Creating...' : '➕ Add subtopics'}
                </Text>
              </Pressable>
            )}
          </View>

          {/* Expand panel (inline) */}
          {expandPanelOpen && !isExpanding && (
            <View testID={`expand-panel-${nodeId}`} style={styles.expandPanel}>
              <TextInput
                testID={`expand-input-${nodeId}`}
                style={styles.expandInput}
                placeholder="focus on... (optional)"
                placeholderTextColor="#8888A0"
                value={expandPrompt}
                onChangeText={setExpandPrompt}
                returnKeyType="go"
                onSubmitEditing={handleExpandSubmit}
                autoCapitalize="sentences"
              />
              <Pressable
                testID={`expand-go-${nodeId}`}
                style={styles.expandGoButton}
                onPress={handleExpandSubmit}
                accessibilityRole="button"
                accessibilityLabel="Expand with optional focus"
              >
                <Text style={styles.expandGoText}>Go</Text>
              </Pressable>
            </View>
          )}

          {/* Expand loading */}
          {isExpanding && (
            <View testID={`expand-loading-${nodeId}`} style={styles.expandLoading}>
              <ActivityIndicator size="small" color="#4F46E5" />
              <Text style={styles.expandLoadingText}>Expanding...</Text>
            </View>
          )}

          {/* Expand error */}
          {expandError && (
            <View testID={`expand-error-${nodeId}`} style={styles.expandErrorRow}>
              <Text style={styles.expandErrorText}>{expandError}</Text>
            </View>
          )}

          {/* Subtopic panel */}
          {subtopicPanelOpen && !isCreatingSubtopics && (
            <View testID={`subtopic-panel-${nodeId}`} style={styles.subtopicPanel}>
              {isSuggesting ? (
                <View style={styles.expandLoading}>
                  <ActivityIndicator size="small" color="#4F46E5" />
                  <Text style={styles.expandLoadingText}>Finding subtopics...</Text>
                </View>
              ) : (
                <>
                  {suggestions.length > 0 && (
                    <View style={styles.suggestionRow}>
                      {suggestions.map((s) => (
                        <Pressable
                          key={s.label}
                          testID={`suggestion-${s.label}`}
                          style={[
                            styles.suggestionChip,
                            selectedLabels.has(s.label) && styles.suggestionSelected,
                          ]}
                          onPress={() => toggleSuggestion(s.label)}
                        >
                          <Text style={styles.suggestionText}>
                            {s.emoji} {s.label}
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                  )}
                  <View style={styles.expandPanel}>
                    <TextInput
                      testID={`subtopic-custom-input-${nodeId}`}
                      style={styles.expandInput}
                      placeholder="or type a custom subtopic..."
                      placeholderTextColor="#8888A0"
                      value={customLabel}
                      onChangeText={setCustomLabel}
                      returnKeyType="done"
                      onSubmitEditing={addCustomLabel}
                    />
                    <Pressable
                      testID={`subtopic-add-custom-${nodeId}`}
                      style={styles.expandGoButton}
                      onPress={addCustomLabel}
                    >
                      <Text style={styles.expandGoText}>+</Text>
                    </Pressable>
                  </View>
                  {selectedLabels.size > 0 && (
                    <Pressable
                      testID={`subtopic-create-${nodeId}`}
                      style={styles.createButton}
                      onPress={handleCreateSubtopics}
                      accessibilityRole="button"
                    >
                      <Text style={styles.createButtonText}>
                        Create {selectedLabels.size} subtopic{selectedLabels.size > 1 ? 's' : ''}
                      </Text>
                    </Pressable>
                  )}
                </>
              )}
            </View>
          )}

          {isCreatingSubtopics && (
            <View style={styles.expandLoading}>
              <ActivityIndicator size="small" color="#4F46E5" />
              <Text style={styles.expandLoadingText}>Creating subtopics...</Text>
            </View>
          )}

          {subtopicPanelOpen && subtopicError && (
            <View style={styles.expandErrorRow}>
              <Text style={styles.expandErrorText}>{subtopicError}</Text>
            </View>
          )}

          {/* Nested children */}
          {children}
        </View>
      )}
    </View>
  );
}

export const CollapsibleSection = React.memo(CollapsibleSectionInner);

const styles = StyleSheet.create({
  container: {
    paddingLeft: 12,
    paddingVertical: 4,
  },
  headingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 44,
    paddingVertical: 8,
    paddingRight: 8,
  },
  emoji: {
    marginRight: 8,
  },
  headingText: {
    color: '#F0F0F5',
    flex: 1,
  },
  chevronArea: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },
  childCount: {
    color: '#8888A0',
    fontSize: 13,
    marginRight: 4,
  },
  chevron: {
    color: '#8888A0',
    fontSize: 16,
  },
  body: {
    paddingTop: 4,
    paddingBottom: 8,
    paddingRight: 8,
  },
  summary: {
    color: '#F0F0F5',
    fontSize: 15,
    lineHeight: 24,
  },
  sourceRow: {
    marginTop: 8,
    gap: 2,
  },
  sourceText: {
    color: '#8888A0',
    fontSize: 12,
  },
  chipRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
    marginBottom: 4,
  },
  chip: {
    backgroundColor: '#2A2A36',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  chipActive: {
    backgroundColor: '#4F46E5',
  },
  chipText: {
    color: '#8888A0',
    fontSize: 13,
  },
  expandPanel: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
    alignItems: 'center',
  },
  expandInput: {
    flex: 1,
    backgroundColor: '#0F0F14',
    color: '#F0F0F5',
    fontSize: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2A2A36',
  },
  expandGoButton: {
    backgroundColor: '#4F46E5',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  expandGoText: {
    color: '#F0F0F5',
    fontSize: 14,
    fontWeight: '600',
  },
  expandLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  expandLoadingText: {
    color: '#8888A0',
    fontSize: 13,
  },
  expandErrorRow: {
    marginTop: 8,
  },
  expandErrorText: {
    color: '#EF4444',
    fontSize: 13,
  },
  subtopicPanel: {
    marginTop: 8,
    gap: 8,
  },
  suggestionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  suggestionChip: {
    backgroundColor: '#2A2A36',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#2A2A36',
  },
  suggestionSelected: {
    borderColor: '#4F46E5',
    backgroundColor: '#1E1B4B',
  },
  suggestionText: {
    color: '#F0F0F5',
    fontSize: 13,
  },
  createButton: {
    backgroundColor: '#4F46E5',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 4,
  },
  createButtonText: {
    color: '#F0F0F5',
    fontSize: 14,
    fontWeight: '600',
  },
});
