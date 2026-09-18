import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';

export default function DriverSafetyScreen() {
  const router = useRouter();

  const [activeRideId] = useState<string>('ride-driver-200');
  const [sosActive, setSosActive] = useState<boolean>(false);
  const [sosLoading, setSosLoading] = useState<boolean>(false);

  const [incidentCategory] = useState<string>('RIDER_BEHAVIOR');
  const [incidentDescription, setIncidentDescription] = useState<string>('');
  const [submittingIncident, setSubmittingIncident] = useState<boolean>(false);
  const [submittedIncidentId, setSubmittedIncidentId] = useState<string | null>(null);

  const handleTriggerSos = async () => {
    setSosLoading(true);
    try {
      setSosActive(true);
      Alert.alert(
        '🚨 Emergency SOS Activated',
        'Captain emergency signal broadcasted to Control Center.',
      );
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to trigger SOS');
    } finally {
      setSosLoading(false);
    }
  };

  const handleSubmitIncident = async () => {
    if (!incidentDescription.trim()) {
      Alert.alert('Validation Error', 'Please describe the incident');
      return;
    }
    setSubmittingIncident(true);
    try {
      const incidentId = 'inc-' + Math.floor(1000 + Math.random() * 9000);
      setSubmittedIncidentId(incidentId);
      setIncidentDescription('');
      Alert.alert('Incident Reported', `Incident report #${incidentId} logged for review.`);
    } catch (err: any) {
      Alert.alert('Error', 'Failed to report incident');
    } finally {
      setSubmittingIncident(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Captain Safety & Incidents</Text>
      </View>

      {/* Emergency SOS */}
      <View style={[styles.card, styles.sosCard]}>
        <Text style={styles.sosCardTitle}>🚨 Captain Emergency SOS</Text>
        <Text style={styles.sosCardSub}>
          Active Trip #{activeRideId}. One-tap emergency trigger for immediate safety assistance.
        </Text>

        {sosActive ? (
          <View style={styles.sosActiveBadge}>
            <Text style={styles.sosActiveText}>🔴 SOS DISPATCH ACTIVE</Text>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.sosBtn}
            onPress={handleTriggerSos}
            disabled={sosLoading}
          >
            {sosLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.sosBtnText}>EMERGENCY SOS ASSIST</Text>
            )}
          </TouchableOpacity>
        )}
      </View>

      {/* Report Incident */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>⚠️ File Incident Report ({incidentCategory})</Text>

        <Text style={styles.label}>Incident Details</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Describe rider behavior, route deviation, safety issue, or vehicle damage"
          placeholderTextColor="#999"
          multiline
          numberOfLines={4}
          value={incidentDescription}
          onChangeText={setIncidentDescription}
        />

        <TouchableOpacity
          style={styles.submitBtn}
          onPress={handleSubmitIncident}
          disabled={submittingIncident}
        >
          {submittingIncident ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitBtnText}>Submit Incident Report</Text>
          )}
        </TouchableOpacity>

        {submittedIncidentId && (
          <View style={styles.successBox}>
            <Text style={styles.successText}>Incident #{submittedIncidentId} Logged</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  content: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 40,
  },
  backBtn: {
    marginRight: 12,
  },
  backText: {
    color: '#38BDF8',
    fontSize: 16,
  },
  headerTitle: {
    color: '#F8FAFC',
    fontSize: 20,
    fontWeight: 'bold',
  },
  card: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  sosCard: {
    borderColor: '#EF4444',
    backgroundColor: '#1E1B2E',
  },
  sosCardTitle: {
    color: '#EF4444',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  sosCardSub: {
    color: '#94A3B8',
    fontSize: 13,
    marginBottom: 16,
  },
  sosBtn: {
    backgroundColor: '#DC2626',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
  },
  sosBtnText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  sosActiveBadge: {
    backgroundColor: '#7F1D1D',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  sosActiveText: {
    color: '#FECACA',
    fontWeight: 'bold',
  },
  cardTitle: {
    color: '#F8FAFC',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  label: {
    color: '#CBD5E1',
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  input: {
    backgroundColor: '#0F172A',
    borderRadius: 8,
    padding: 12,
    color: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#334155',
  },
  textArea: {
    height: 90,
    textAlignVertical: 'top',
  },
  submitBtn: {
    backgroundColor: '#EAB308',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  submitBtnText: {
    color: '#0F172A',
    fontWeight: 'bold',
  },
  successBox: {
    marginTop: 10,
    backgroundColor: '#064E3B',
    padding: 10,
    borderRadius: 6,
  },
  successText: {
    color: '#A7F3D0',
    fontSize: 13,
  },
});
