import { View, Text, StyleSheet } from 'react-native';

interface ExampleProps {
  title: string;
  subtitle?: string;
}

export function Example({ title, subtitle }: ExampleProps) {
  return (
    <View testID="example-component" style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#1A1A24',
    borderRadius: 12,
    margin: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#F0F0F5',
  },
  subtitle: {
    fontSize: 14,
    color: '#8888A0',
    marginTop: 4,
  },
});
