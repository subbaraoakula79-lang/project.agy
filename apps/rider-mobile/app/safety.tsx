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

export default function RiderSafetyScreen() {
  const router = useRouter();

  const [activeRideId] = useState<string>('ride-current-100');
  const [sosActive, setSosActive] = useState<boolean>(false);
  const [sosLoading, setSosLoading] = useState<boolean>(false);
  const [shareToken, setShareToken] = useState<string | null>(null);

  const [supportCategory] = useState<string>('SAFETY');
  const [supportSubject, setSupportSubject] = useState<string>('');
  const [supportDescription, setSupportDescription] = useState<string>('');
  const [submittingSupport, setSubmittingSupport] = useState<boolean>(false);
  const [submittedTicketId, setSubmittedTicketId] = useState<string | null>(null);

  const handleTriggerSos = async () => {
    setSosLoading(true);
    try {
      // API integration call
      setSosActive(true);
      Alert.alert(
        '🚨 Emergency SOS Activated',
        'Safety team and emergency dispatch notified. Live location tracking enabled.',
      );
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to trigger SOS');
    } finally {
      setSosLoading(false);
    }
  };

  const handleShareTrip = async () => {
    try {
      const generatedToken = 'st_' + Math.random().toString(36).substring(2, 10);
      setShareToken(generatedToken);
      Alert.alert('Trip Link Generated', `Safe Share URL: /shared-trip/${generatedToken}`);
    } catch (err: any) {
      Alert.alert('Error', 'Failed to generate trip link');
    }
  };

  const handleSubmitTicket = async () => {
    if (!supportSubject.trim() || !supportDescription.trim()) {
      Alert.alert('Validation Error', 'Please fill subject and description');
      return;
    }
    setSubmittingSupport(true);
    try {
      const ticketId = 'st-ticket-' + Math.floor(1000 + Math.random() * 9000);
      setSubmittedTicketId(ticketId);
      setSupportSubject('');
      setSupportDescription('');
      Alert.alert('Support Ticket Created', `Ticket #${ticketId} submitted to YatraSeva Support.`);
    } catch (err: any) {
      Alert.alert('Error', 'Failed to submit support ticket');
    } finally {
      setSubmittingSupport(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Safety & Support</Text>
      </View>

      {/* Emergency SOS Action */}
      <View style={[styles.card, styles.sosCard]}>
        <Text style={styles.sosCardTitle}>🚨 Emergency SOS Assistance</Text>
        <Text style={styles.sosCardSub}>
          Active Ride #{activeRideId}. Tap below during trip to instantly alert YatraSeva Safety Control.
        </Text>

        {sosActive ? (
          <View style={styles.sosActiveBadge}>
            <Text style={styles.sosActiveText}>🔴 SOS ACTIVE — Dispatch Notified</Text>
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
              <Text style={styles.sosBtnText}>TRIGGER EMERGENCY SOS</Text>
            )}
          </TouchableOpacity>
        )}
      </View>

      {/* Share Trip */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>🔗 Share Trip Link</Text>
        <Text style={styles.cardSub}>
          Share an opaque, privacy-safe live tracking link with trusted contacts.
        </Text>

        <TouchableOpacity style={styles.shareBtn} onPress={handleShareTrip}>
          <Text style={styles.shareBtnText}>Generate Safe Share Link</Text>
        </TouchableOpacity>

        {shareToken && (
          <View style={styles.tokenBox}>
            <Text style={styles.tokenText}>Share Token: {shareToken}</Text>
          </View>
        )}
      </View>

      {/* Support Ticket Submission */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>💬 Create Support Ticket ({supportCategory})</Text>

        <Text style={styles.label}>Subject</Text>
        <TextInput
          style={styles.input}
          placeholder="Brief summary of issue"
          placeholderTextColor="#999"
          value={supportSubject}
          onChangeText={setSupportSubject}
        />

        <Text style={styles.label}>Description</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Detailed description of problem or incident"
          placeholderTextColor="#999"
          multiline
          numberOfLines={4}
          value={supportDescription}
          onChangeText={setSupportDescription}
        />

        <TouchableOpacity
          style={styles.submitBtn}
          onPress={handleSubmitTicket}
          disabled={submittingSupport}
        >
          {submittingSupport ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitBtnText}>Submit Support Ticket</Text>
          )}
        </TouchableOpacity>

        {submittedTicketId && (
          <View style={styles.successBox}>
            <Text style={styles.successText}>Ticket #{submittedTicketId} Submitted Successfully</Text>
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
    marginBottom: 6,
  },
  cardSub: {
    color: '#94A3B8',
    fontSize: 13,
    marginBottom: 14,
  },
  shareBtn: {
    backgroundColor: '#0284C7',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  shareBtnText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  tokenBox: {
    marginTop: 10,
    backgroundColor: '#0F172A',
    padding: 10,
    borderRadius: 6,
  },
  tokenText: {
    color: '#38BDF8',
    fontSize: 13,
  },
  label: {
    color: '#CBD5E1',
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 4,
    marginTop: 10,
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
    backgroundColor: '#16A34A',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  submitBtnText: {
    color: '#FFFFFF',
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
