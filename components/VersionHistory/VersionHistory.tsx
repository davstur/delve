import React, { useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { formatRelativeTime } from '../../utils/formatTime';
import type { VersionEntry } from '../../api/client';

const ACTION_LABELS: Record<string, { icon: string; label: string }> = {
  create_topic: { icon: '🌱', label: 'Created' },
  expand: { icon: '✨', label: 'Expanded' },
  create_subtopics: { icon: '➕', label: 'Added subtopics' },
  restore: { icon: '⏪', label: 'Restored' },
};

interface VersionHistoryProps {
  versions: VersionEntry[];
  isLoading: boolean;
  error: string | null;
  onSelectVersion: (versionId: string) => void;
  onRestore: (versionId: string) => void;
  onClose: () => void;
}

export function VersionHistory({
  versions,
  isLoading,
  error,
  onSelectVersion,
  onRestore,
  onClose,
}: VersionHistoryProps) {
  const handleRestore = useCallback(
    (versionId: string, action: string, createdAt: string) => {
      Alert.alert(
        'Restore this version?',
        `This will replace your current content with the version from ${formatRelativeTime(createdAt)}. A backup of the current state will be saved.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Restore',
            style: 'destructive',
            onPress: () => onRestore(versionId),
          },
        ],
      );
    },
    [onRestore],
  );

  if (isLoading) {
    return (
      <View testID="version-history" style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Version History</Text>
          <Pressable onPress={onClose} testID="version-history-close">
            <Text style={styles.closeText}>Close</Text>
          </Pressable>
        </View>
        <ActivityIndicator size="small" color="#4F46E5" style={styles.loader} />
      </View>
    );
  }

  if (error) {
    return (
      <View testID="version-history" style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Version History</Text>
          <Pressable onPress={onClose} testID="version-history-close">
            <Text style={styles.closeText}>Close</Text>
          </Pressable>
        </View>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <View testID="version-history" style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Version History</Text>
        <Pressable onPress={onClose} testID="version-history-close">
          <Text style={styles.closeText}>Close</Text>
        </Pressable>
      </View>

      {versions.length === 0 ? (
        <Text style={styles.emptyText}>No version history yet</Text>
      ) : (
        <FlatList
          testID="version-list"
          data={versions}
          keyExtractor={(item) => item.id}
          renderItem={({ item, index }) => {
            const meta = ACTION_LABELS[item.action] || {
              icon: '📝',
              label: item.action,
            };
            const isCurrent = index === 0;

            return (
              <View testID={`version-item-${item.id}`} style={styles.item}>
                <View style={styles.itemLeft}>
                  <Text style={styles.itemIcon}>{meta.icon}</Text>
                  <View>
                    <Text style={styles.itemAction}>
                      {meta.label}
                      {item.target_label ? `: ${item.target_label}` : ''}
                    </Text>
                    <Text style={styles.itemTime}>
                      {formatRelativeTime(item.created_at)}
                      {isCurrent ? ' (current)' : ''}
                    </Text>
                  </View>
                </View>
                {!isCurrent && (
                  <View style={styles.itemActions}>
                    <Pressable
                      testID={`version-view-${item.id}`}
                      style={styles.viewButton}
                      onPress={() => onSelectVersion(item.id)}
                    >
                      <Text style={styles.viewButtonText}>View</Text>
                    </Pressable>
                    <Pressable
                      testID={`version-restore-${item.id}`}
                      style={styles.restoreButton}
                      onPress={() =>
                        handleRestore(item.id, item.action, item.created_at)
                      }
                    >
                      <Text style={styles.restoreButtonText}>Restore</Text>
                    </Pressable>
                  </View>
                )}
              </View>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A1A24',
    paddingTop: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  title: {
    color: '#F0F0F5',
    fontSize: 20,
    fontWeight: '700',
  },
  closeText: {
    color: '#4F46E5',
    fontSize: 16,
    fontWeight: '600',
  },
  loader: {
    marginTop: 40,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 20,
    paddingHorizontal: 16,
  },
  emptyText: {
    color: '#8888A0',
    fontSize: 15,
    textAlign: 'center',
    marginTop: 40,
  },
  item: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A36',
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 10,
  },
  itemIcon: {
    fontSize: 20,
  },
  itemAction: {
    color: '#F0F0F5',
    fontSize: 15,
    fontWeight: '500',
  },
  itemTime: {
    color: '#8888A0',
    fontSize: 13,
    marginTop: 2,
  },
  itemActions: {
    flexDirection: 'row',
    gap: 8,
  },
  viewButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#2A2A36',
  },
  viewButtonText: {
    color: '#F0F0F5',
    fontSize: 13,
  },
  restoreButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#4F46E5',
  },
  restoreButtonText: {
    color: '#F0F0F5',
    fontSize: 13,
    fontWeight: '600',
  },
});
