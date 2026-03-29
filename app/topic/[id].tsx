import { View, Text, StyleSheet } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

export default function ExplorerScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <View testID="explorer-screen" style={styles.container}>
      <Text style={styles.title}>Explorer</Text>
      <Text style={styles.topicId}>Topic: {id}</Text>
      <Text style={styles.placeholder}>
        This screen will show the collapsible knowledge tree.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F0F14',
    padding: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#F0F0F5',
    marginBottom: 8,
  },
  topicId: {
    fontSize: 16,
    color: '#8888A0',
    marginBottom: 24,
  },
  placeholder: {
    fontSize: 15,
    color: '#8888A0',
    lineHeight: 22,
  },
});
