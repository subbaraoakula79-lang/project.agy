// apps/rider-mobile/app/history.tsx
import { useState, useEffect } from 'react';
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  SafeAreaView,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, fontSizes, borderRadius, shadows } from '../theme';
import { useAuth } from '../context/AuthContext';
import { AppHeader } from '../components/AppHeader';
import { BottomTabBar } from '../components/BottomTabBar';

interface RideHistoryItem {
  id: string;
  status: 'COMPLETED' | 'CANCELLED';
  pickup: string;
  drop: string;
  dateTime: string;
  fare: number;
  vehicleType: 'Bike' | 'Auto' | 'Cab';
}

const SAMPLE_RIDES: RideHistoryItem[] = [
  {
    id: 'ride-01',
    status: 'COMPLETED',
    pickup: 'Kakinada Railway Station',
    drop: 'Rama Rao Peta',
    dateTime: '12 Sep 2026, 09:12 AM',
    fare: 48,
    vehicleType: 'Bike',
  },
  {
    id: 'ride-02',
    status: 'COMPLETED',
    pickup: 'Rama Rao Peta',
    drop: 'Beach Road',
    dateTime: '10 Sep 2026, 06:45 PM',
    fare: 82,
    vehicleType: 'Auto',
  },
  {
    id: 'ride-03',
    status: 'COMPLETED',
    pickup: 'Kakinada City',
    drop: 'Samalkot',
    dateTime: '8 Sep 2026, 11:20 AM',
    fare: 125,
    vehicleType: 'Cab',
  },
  {
    id: 'ride-04',
    status: 'COMPLETED',
    pickup: 'Railway Station',
    drop: 'Gandhi Nagar',
    dateTime: '5 Sep 2026, 07:30 PM',
    fare: 52,
    vehicleType: 'Bike',
  },
];

export default function RiderHistoryScreen() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();

  const [activeFilter, setActiveFilter] = useState<'ALL' | 'COMPLETED' | 'CANCELLED'>('ALL');

  // Guard: if not authenticated, redirect to login
  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/login');
    }
  }, [isAuthenticated, router]);

  if (!isAuthenticated) {
    return null;
  }

  const filteredRides = SAMPLE_RIDES.filter((ride) => {
    if (activeFilter === 'COMPLETED') return ride.status === 'COMPLETED';
    if (activeFilter === 'CANCELLED') return ride.status === 'CANCELLED';
    return true;
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <AppHeader
        title="Ride History"
        showBack={true}
        onBack={() => router.replace('/')}
      />

      {/* Filter Chips matching Reference Screen 11 */}
      <View style={styles.filterBar}>
        {(['ALL', 'COMPLETED', 'CANCELLED'] as const).map((filter) => {
          const isActive = activeFilter === filter;
          const label =
            filter === 'ALL' ? 'All' : filter === 'COMPLETED' ? 'Completed' : 'Cancelled';
          return (
            <TouchableOpacity
              key={filter}
              style={[styles.filterChip, isActive && styles.filterChipActive]}
              onPress={() => setActiveFilter(filter)}
              accessibilityRole="button"
              accessibilityLabel={`Filter by ${label}`}
              accessibilityState={{ selected: isActive }}
            >
              <Text
                style={[styles.filterChipText, isActive && styles.filterChipTextActive]}
              >
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Ride Cards List */}
      <FlatList
        data={filteredRides}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <View style={styles.rideCard}>
            <View style={styles.cardHeader}>
              <View style={styles.routeRow}>
                <Ionicons name="location" size={16} color={colors.success} />
                <Text style={styles.routeText} numberOfLines={1}>
                  {item.pickup} → {item.drop}
                </Text>
              </View>
              <View style={styles.statusBadge}>
                <Text style={styles.statusText}>{item.status === 'COMPLETED' ? 'Completed' : 'Cancelled'}</Text>
              </View>
            </View>

            <View style={styles.metaRow}>
              <View style={styles.historyThumbBox}>
                <Image
                  source={
                    item.vehicleType === 'Bike'
                      ? require('../assets/images/vehicles/bike.png')
                      : item.vehicleType === 'Cab'
                      ? require('../assets/images/vehicles/cab.png')
                      : require('../assets/images/vehicles/auto.png')
                  }
                  style={styles.historyVehicleThumb}
                  resizeMode="contain"
                />
              </View>
              <Text style={styles.metaText}>
                ₹{item.fare} • {item.vehicleType} • {item.dateTime}
              </Text>
            </View>
          </View>
        )}
      />

      <BottomTabBar activeTab="rides" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  filterBar: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  filterChip: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: borderRadius.full,
    backgroundColor: '#F1F5F9',
  },
  filterChipActive: {
    backgroundColor: colors.primary,
  },
  filterChipText: {
    fontSize: fontSizes.sm,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  listContent: {
    padding: spacing.md,
    gap: spacing.md,
  },
  rideCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  routeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: spacing.sm,
    gap: 6,
  },
  routeText: {
    fontSize: fontSizes.sm + 1,
    fontWeight: '700',
    color: colors.textPrimary,
    flex: 1,
  },
  statusBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: borderRadius.full,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#15803D',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 22,
    gap: 8,
  },
  historyThumbBox: {
    width: 28,
    height: 20,
    borderRadius: 4,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  historyVehicleThumb: {
    width: '100%',
    height: '100%',
  },
  metaText: {
    fontSize: fontSizes.xs,
    color: colors.textSecondary,
    fontWeight: '500',
  },
});
