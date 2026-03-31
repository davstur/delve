import { View, StyleSheet } from 'react-native';

interface DepthIndicatorProps {
  depth: number;
}

export function DepthIndicator({ depth }: DepthIndicatorProps) {
  if (depth <= 1) return null;

  const dots = depth - 1; // H2=1 dot, H3=2, H4=3

  return (
    <View testID="depth-indicator" style={styles.container}>
      {Array.from({ length: dots }, (_, i) => (
        <View key={i} style={styles.dot} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginRight: 6,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#8888A0',
  },
});
