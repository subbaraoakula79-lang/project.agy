import { View, Text, StyleSheet } from 'react-native';

/**
 * Rider app home screen placeholder.
 * Will be replaced with map view and booking flow in Phase 2+.
 */
export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>🚗 YatraSeva</Text>
      <Text style={styles.subtitle}>Rider App</Text>
      <Text style={styles.info}>Kakinada, Andhra Pradesh</Text>
      <View style={styles.badge}>
        <Text style={styles.badgeText}>Phase 0 — Foundation</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#e94560',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: '#eaeaea',
    marginBottom: 4,
  },
  info: {
    fontSize: 14,
    color: '#8a8a9a',
    marginBottom: 24,
  },
  badge: {
    backgroundColor: '#16213e',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#0f3460',
  },
  badgeText: {
    color: '#53a8b6',
    fontSize: 12,
    fontWeight: '600',
  },
});
