import { View, Text, StyleSheet } from 'react-native';

/**
 * Driver app home screen placeholder.
 * Will be replaced with online/offline toggle and ride request view in Phase 2+.
 */
export default function DriverHomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>🏍️ YatraSeva</Text>
      <Text style={styles.subtitle}>Captain App</Text>
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
    backgroundColor: '#0f3460',
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
    backgroundColor: '#1a1a2e',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#16213e',
  },
  badgeText: {
    color: '#53a8b6',
    fontSize: 12,
    fontWeight: '600',
  },
});
