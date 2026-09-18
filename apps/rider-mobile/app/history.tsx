import { useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

interface Rating {
  id: string;
  rating: number;
  comment?: string | null;
  raterUserId: string;
}

interface RideHistoryItem {
  id: string;
  status: string;
  requestedAt: string;
  completedAt?: string | null;
  cancelledAt?: string | null;
  cancellationReason?: string | null;
  estimatedFare: number;
  actualFare?: number | null;
  paymentMethod: string;
  location?: {
    pickupAddress: string;
    dropAddress: string;
  } | null;
  vehicle?: {
    make?: string | null;
    model?: string | null;
    registrationNumber: string;
    vehicleType?: { displayName: string };
  } | null;
  driver?: {
    firstName?: string | null;
    lastName?: string | null;
    averageRating?: number;
  } | null;
  myRating?: Rating | null;
}

export default function RiderHistoryScreen() {
  const [rides, setRides] = useState<RideHistoryItem[]>([
    // Mock initial demonstration ride
    {
      id: 'ride-hist-101',
      status: 'COMPLETED',
      requestedAt: new Date(Date.now() - 3600000).toISOString(),
      completedAt: new Date(Date.now() - 1800000).toISOString(),
      estimatedFare: 108,
      actualFare: 108,
      paymentMethod: 'CASH',
      location: {
        pickupAddress: 'Kakinada Railway Station',
        dropAddress: 'Jagannaickpur Main Road',
      },
      vehicle: {
        make: 'Bajaj',
        model: 'RE Compact',
        registrationNumber: 'AP05CD5678',
        vehicleType: { displayName: 'Auto Rickshaw' },
      },
      driver: {
        firstName: 'Suresh',
        lastName: 'Babu',
        averageRating: 4.8,
      },
      myRating: null,
    },
    {
      id: 'ride-hist-102',
      status: 'CANCELLED_BY_RIDER',
      requestedAt: new Date(Date.now() - 86400000).toISOString(),
      cancelledAt: new Date(Date.now() - 86100000).toISOString(),
      cancellationReason: 'Cancelled by rider',
      estimatedFare: 76,
      paymentMethod: 'UPI',
      location: {
        pickupAddress: 'Bhanugudi Junction',
        dropAddress: 'Sarpavaram Junction',
      },
      vehicle: {
        make: 'Honda',
        model: 'Activa 6G',
        registrationNumber: 'AP05AB1234',
        vehicleType: { displayName: 'Bike' },
      },
      driver: {
        firstName: 'Ramesh',
        lastName: 'K',
        averageRating: 4.9,
      },
      myRating: null,
    },
  ]);

  const [filter, setFilter] = useState<'ALL' | 'COMPLETED' | 'CANCELLED'>('ALL');
  const [selectedRide, setSelectedRide] = useState<RideHistoryItem | null>(null);

  // Rating Form Modal State
  const [ratingModalVisible, setRatingModalVisible] = useState(false);
  const [selectedScore, setSelectedScore] = useState<number>(5);
  const [comment, setComment] = useState('');
  const [submittingRating, setSubmittingRating] = useState(false);
  const [ratingError, setRatingError] = useState('');

  const filteredRides = rides.filter((r) => {
    if (filter === 'COMPLETED') return r.status === 'COMPLETED' || r.status === 'RIDE_COMPLETED';
    if (filter === 'CANCELLED') return r.status.startsWith('CANCELLED');
    return true;
  });

  const handleOpenRating = (ride: RideHistoryItem) => {
    setSelectedRide(ride);
    setSelectedScore(5);
    setComment('');
    setRatingError('');
    setRatingModalVisible(true);
  };

  const handleSubmitRating = () => {
    if (!selectedRide) return;
    setRatingError('');
    setSubmittingRating(true);

    // Simulate API rating post to /rides/:id/rating
    setTimeout(() => {
      const newRating: Rating = {
        id: `rat-${Date.now()}`,
        rating: selectedScore,
        comment: comment.trim() || null,
        raterUserId: 'rider-001',
      };

      setRides((prev) =>
        prev.map((r) => (r.id === selectedRide.id ? { ...r, myRating: newRating } : r)),
      );

      setSubmittingRating(false);
      setRatingModalVisible(false);
    }, 600);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>📜 Ride History</Text>
      <Text style={styles.subtitle}>Your trips in Kakinada, AP</Text>

      {/* Filter Chips */}
      <View style={styles.filterRow}>
        {(['ALL', 'COMPLETED', 'CANCELLED'] as const).map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterChip, filter === f && styles.filterChipActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.filterChipText, filter === f && styles.filterChipTextActive]}>
              {f}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
          data={filteredRides}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: 20 }}
          renderItem={({ item }) => {
            const isCompleted = item.status === 'COMPLETED' || item.status === 'RIDE_COMPLETED';
            const isCancelled = item.status.startsWith('CANCELLED');

            return (
              <View style={styles.rideCard}>
                <View style={styles.rideCardHeader}>
                  <Text style={styles.vehicleType}>
                    {item.vehicle?.vehicleType?.displayName || 'Vehicle'} • ₹{item.actualFare || item.estimatedFare}
                  </Text>
                  <View
                    style={[
                      styles.statusBadge,
                      { backgroundColor: isCompleted ? '#27ae60' : isCancelled ? '#c0392b' : '#f39c12' },
                    ]}
                  >
                    <Text style={styles.statusText}>{item.status}</Text>
                  </View>
                </View>

                <Text style={styles.dateText}>
                  📅 {new Date(item.requestedAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                </Text>

                <View style={styles.locationBox}>
                  <Text style={styles.locText}>🟢 Pickup: {item.location?.pickupAddress}</Text>
                  <Text style={styles.locText}>🔴 Drop: {item.location?.dropAddress}</Text>
                </View>

                {item.driver && (
                  <Text style={styles.driverText}>
                    🚖 Captain: {item.driver.firstName} {item.driver.lastName} (⭐ {item.driver.averageRating || 'New'})
                  </Text>
                )}

                {/* Rating Section */}
                {isCompleted && (
                  <View style={styles.ratingSection}>
                    {item.myRating ? (
                      <View style={styles.submittedRatingBox}>
                        <Text style={styles.submittedRatingText}>
                          ✅ Rated Captain: {'⭐'.repeat(item.myRating.rating)} ({item.myRating.rating}/5)
                        </Text>
                        {item.myRating.comment ? (
                          <Text style={styles.commentText}>"{item.myRating.comment}"</Text>
                        ) : null}
                      </View>
                    ) : (
                      <TouchableOpacity
                        style={styles.rateButton}
                        onPress={() => handleOpenRating(item)}
                      >
                        <Text style={styles.rateButtonText}>⭐ Rate Captain</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}
              </View>
            );
          }}
        />

      {/* Rating Submission Modal */}
      <Modal visible={ratingModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Rate Your Trip</Text>
            <Text style={styles.modalSub}>
              How was your ride with {selectedRide?.driver?.firstName || 'Captain'}?
            </Text>

            {ratingError ? <Text style={styles.errorText}>{ratingError}</Text> : null}

            {/* Star Selector */}
            <View style={styles.starRow}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity key={star} onPress={() => setSelectedScore(star)}>
                  <Text style={[styles.starIcon, selectedScore >= star && styles.starActive]}>
                    ★
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.scoreLabel}>{selectedScore} Out of 5 Stars</Text>

            <TextInput
              style={styles.commentInput}
              placeholder="Write an optional review..."
              placeholderTextColor="#8a8a9a"
              value={comment}
              onChangeText={setComment}
              multiline
              maxLength={500}
            />

            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: '#4a5568' }]}
                onPress={() => setRatingModalVisible(false)}
              >
                <Text style={styles.modalBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: '#e94560' }]}
                onPress={handleSubmitRating}
                disabled={submittingRating}
              >
                {submittingRating ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.modalBtnText}>Submit Rating</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#e94560',
    marginTop: 20,
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 13,
    color: '#8a8a9a',
    marginBottom: 16,
  },
  filterRow: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 8,
  },
  filterChip: {
    backgroundColor: '#0f3460',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  filterChipActive: {
    backgroundColor: '#e94560',
  },
  filterChipText: {
    color: '#eaeaea',
    fontSize: 13,
  },
  filterChipTextActive: {
    color: '#fff',
    fontWeight: 'bold',
  },
  rideCard: {
    backgroundColor: '#16213e',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#0f3460',
  },
  rideCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  vehicleType: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  dateText: {
    color: '#8a8a9a',
    fontSize: 12,
    marginBottom: 10,
  },
  locationBox: {
    backgroundColor: '#0f3460',
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
  },
  locText: {
    color: '#eaeaea',
    fontSize: 13,
    marginBottom: 4,
  },
  driverText: {
    color: '#53a8b6',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 10,
  },
  ratingSection: {
    marginTop: 6,
  },
  rateButton: {
    backgroundColor: '#f39c12',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  rateButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  submittedRatingBox: {
    backgroundColor: '#1f4068',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#27ae60',
  },
  submittedRatingText: {
    color: '#2ecc71',
    fontWeight: 'bold',
    fontSize: 13,
  },
  commentText: {
    color: '#eaeaea',
    fontSize: 12,
    fontStyle: 'italic',
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    backgroundColor: '#16213e',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#0f3460',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 6,
  },
  modalSub: {
    fontSize: 13,
    color: '#8a8a9a',
    marginBottom: 16,
    textAlign: 'center',
  },
  starRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 8,
  },
  starIcon: {
    fontSize: 36,
    color: '#4a5568',
  },
  starActive: {
    color: '#f1c40f',
  },
  scoreLabel: {
    color: '#f1c40f',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 14,
  },
  commentInput: {
    width: '100%',
    backgroundColor: '#0f3460',
    color: '#fff',
    borderRadius: 8,
    padding: 12,
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: 16,
  },
  modalBtnRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  modalBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  errorText: {
    color: '#e74c3c',
    fontSize: 13,
    marginBottom: 10,
  },
});
