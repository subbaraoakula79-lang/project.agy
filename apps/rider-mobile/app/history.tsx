import { useState } from 'react';
import {
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, fontSizes, borderRadius, shadows } from './theme';
import { AppHeader } from '../components/AppHeader';
import { RideCard } from '../components/RideCard';
import { EmptyState } from '../components/EmptyState';
import { PrimaryButton } from '../components/PrimaryButton';
import { SecondaryButton } from '../components/SecondaryButton';
import { BottomTabBar } from '../components/BottomTabBar';

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
  const router = useRouter();

  const [rides, setRides] = useState<RideHistoryItem[]>([
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
    <SafeAreaView style={styles.safeArea}>
      <AppHeader
        title="Ride History"
        subtitle="Your trips in Kakinada, AP"
        showBack={true}
        onBack={() => router.replace('/')}
        showNotification={false}
        showProfile={true}
      />

      <View style={styles.container}>
        {/* Filter Pills */}
        <View style={styles.filterRow} accessibilityRole="tablist">
          {(['ALL', 'COMPLETED', 'CANCELLED'] as const).map((f) => {
            const isActive = filter === f;
            const label = f === 'ALL' ? 'All Rides' : f === 'COMPLETED' ? 'Completed' : 'Cancelled';
            return (
              <TouchableOpacity
                key={f}
                style={[styles.filterChip, isActive && styles.filterChipActive]}
                onPress={() => setFilter(f)}
                activeOpacity={0.7}
                accessibilityRole="tab"
                accessibilityLabel={`${label} filter`}
                accessibilityState={{ selected: isActive }}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    isActive && styles.filterChipTextActive,
                  ]}
                >
                  {label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Rides List */}
        <FlatList
          data={filteredRides}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <EmptyState
              iconName="receipt-outline"
              title="No rides found"
              description={`You have no ${filter !== 'ALL' ? filter.toLowerCase() : ''} rides recorded in Kakinada yet.`}
              actionTitle="Book a Ride"
              onActionPress={() => router.replace('/')}
            />
          }
          renderItem={({ item }) => {
            const formattedDate = new Date(item.requestedAt).toLocaleString('en-IN', {
              dateStyle: 'medium',
              timeStyle: 'short',
            });

            return (
              <RideCard
                id={item.id}
                date={formattedDate}
                pickup={item.location?.pickupAddress || 'Kakinada'}
                destination={item.location?.dropAddress || 'Destination'}
                vehicleType={item.vehicle?.vehicleType?.displayName || 'Auto'}
                fare={item.actualFare || item.estimatedFare}
                status={item.status}
                driverName={
                  item.driver
                    ? `${item.driver.firstName || ''} ${item.driver.lastName || ''}`.trim()
                    : undefined
                }
                driverRating={item.driver?.averageRating}
                ratedStars={item.myRating?.rating}
                onRatePress={() => handleOpenRating(item)}
              />
            );
          }}
        />
      </View>

      {/* Rating Submission Modal */}
      <Modal visible={ratingModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard} accessibilityLabel="Rate your trip modal">
            <View style={styles.modalIconCircle}>
              <Ionicons name="star" size={28} color="#D97706" />
            </View>
            <Text style={styles.modalTitle}>Rate Your Trip</Text>
            <Text style={styles.modalSub}>
              How was your journey with {selectedRide?.driver?.firstName || 'Captain'}?
            </Text>

            {ratingError ? <Text style={styles.modalErrorText}>{ratingError}</Text> : null}

            {/* Star Selector */}
            <View style={styles.starRow}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity
                  key={star}
                  onPress={() => setSelectedScore(star)}
                  style={styles.starTouch}
                  accessibilityRole="button"
                  accessibilityLabel={`${star} stars`}
                >
                  <Ionicons
                    name={selectedScore >= star ? 'star' : 'star-outline'}
                    size={36}
                    color={selectedScore >= star ? '#F59E0B' : colors.textMuted}
                  />
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.scoreLabel}>{selectedScore} of 5 Stars</Text>

            <TextInput
              style={styles.commentInput}
              placeholder="Leave feedback for the captain (optional)..."
              placeholderTextColor={colors.textMuted}
              value={comment}
              onChangeText={setComment}
              multiline
              maxLength={500}
              accessibilityLabel="Optional review comments"
            />

            <View style={styles.modalBtnRow}>
              <SecondaryButton
                title="Cancel"
                onPress={() => setRatingModalVisible(false)}
                style={styles.modalBtn}
              />
              <PrimaryButton
                title="Submit Rating"
                onPress={handleSubmitRating}
                loading={submittingRating}
                style={styles.modalBtn}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* Bottom Navigation */}
      <BottomTabBar activeTab="rides" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
  },
  filterRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  filterChip: {
    flex: 1,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterChipText: {
    fontSize: fontSizes.xs + 1,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  filterChipTextActive: {
    color: colors.surface,
    fontWeight: '700',
  },
  listContent: {
    paddingBottom: spacing.lg,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  modalCard: {
    width: '100%',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.elevated,
  },
  modalIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.warningLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  modalTitle: {
    fontSize: fontSizes.xl,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  modalSub: {
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  starRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: spacing.xs,
  },
  starTouch: {
    padding: 4,
  },
  scoreLabel: {
    fontSize: fontSizes.sm,
    fontWeight: '700',
    color: '#D97706',
    marginBottom: spacing.md,
  },
  commentInput: {
    width: '100%',
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.sm,
    padding: spacing.md,
    fontSize: fontSizes.sm,
    color: colors.textPrimary,
    height: 80,
    textAlignVertical: 'top',
    marginBottom: spacing.md,
  },
  modalBtnRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    width: '100%',
  },
  modalBtn: {
    flex: 1,
  },
  modalErrorText: {
    color: colors.danger,
    fontSize: fontSizes.xs,
    marginBottom: spacing.sm,
  },
});
