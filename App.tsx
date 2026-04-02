import React from 'react';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  FlatList,
  StatusBar,
  ScrollView,
} from 'react-native';
import { Activity, Clock, Flame, MapPin, Zap, ChevronUp, Bluetooth, Power, Trophy } from 'lucide-react-native';
import { useBLE } from './src/hooks/useBLE';
import { useWorkoutSession } from './src/hooks/useWorkoutSession';
import { ThemeProvider, useTheme } from './src/theme/ThemeContext';
import { useWorkoutStore } from './src/store/useWorkoutStore';
import MetricCard from './src/components/Dashboard/MetricCard';
import WorkoutChart from './src/components/Charts/WorkoutChart';
import AnalyticsSummary from './src/components/Dashboard/AnalyticsSummary';

const Dashboard = () => {
  const { theme, isDark, toggleTheme } = useTheme();
  const { history } = useWorkoutStore();
  const {
    scanForDevices,
    stopScan,
    allDevices,
    connectToDevice,
    connectedDevice,
    disconnectFromDevice,
    treadmillData,
    isScanning,
    isConnecting,
  } = useBLE();

  const { isActive, stats, samples, endSession } = useWorkoutSession(treadmillData, !!connectedDevice);

  const renderDeviceItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={[styles.deviceItem, { backgroundColor: theme.card, borderColor: theme.border }]}
      onPress={() => connectToDevice(item)}>
      <View style={styles.deviceInfo}>
        <Bluetooth size={20} color={theme.primary} />
        <View style={styles.deviceNameContainer}>
          <Text style={[styles.deviceName, { color: theme.text }]}>{item.name || 'Unknown Device'}</Text>
          <Text style={[styles.deviceId, { color: theme.subtext }]}>{item.id}</Text>
        </View>
      </View>
      {isConnecting && <Activity size={16} color={theme.primary} />}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.primary }]}>
        <View>
          <Text style={styles.title}>Track My Mile</Text>
          <Text style={styles.subtitle}>
            {connectedDevice ? 'Connected' : isScanning ? 'Searching...' : 'Disconnected'}
          </Text>
        </View>
        <TouchableOpacity onPress={toggleTheme} style={styles.themeToggle}>
          <Text style={{ color: '#FFF' }}>{isDark ? '☀️' : '🌙'}</Text>
        </TouchableOpacity>
      </View>

      {!connectedDevice ? (
        <View style={styles.scanSection}>
          <TouchableOpacity
            style={[styles.scanButton, { backgroundColor: theme.success }]}
            onPress={isScanning ? stopScan : scanForDevices}>
            <Text style={styles.scanButtonText}>
              {isScanning ? 'Stop Scanning' : 'Scan for Treadmill'}
            </Text>
          </TouchableOpacity>

          <FlatList
            data={allDevices}
            renderItem={renderDeviceItem}
            keyExtractor={item => item.id}
            ListHeaderComponent={
              <Text style={[styles.listHeader, { color: theme.text }]}>Available Devices:</Text>
            }
          />
        </View>
      ) : (
        <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.dataSection}>
          <View style={[styles.statusBox, { backgroundColor: theme.card }]}>
            <View style={styles.statusHeader}>
              <View style={styles.statusInfo}>
                <View style={[styles.statusDot, { backgroundColor: theme.success }]} />
                <Text style={[styles.statusText, { color: theme.text }]}>
                  {connectedDevice.name || 'FTMS Machine'}
                </Text>
              </View>
              <TouchableOpacity
                onPress={disconnectFromDevice}
                style={[styles.disconnectButton, { backgroundColor: theme.danger }]}>
                <Power size={14} color="#FFF" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Live Charts */}
          <WorkoutChart 
            data={samples.map(s => ({ time: s.time, value: s.speed }))} 
            label="Speed Trend" 
            unit="km/h" 
          />

          {/* Metrics Grid */}
          <View style={styles.grid}>
            <MetricCard 
              label="Speed" 
              value={treadmillData?.speed} 
              unit="km/h" 
              icon={<Zap size={18} color={theme.primary} />}
              highlightTrigger={treadmillData?.speed}
            />
            <MetricCard 
              label="Incline" 
              value={treadmillData?.incline} 
              unit="%" 
              icon={<ChevronUp size={18} color={theme.primary} />}
              highlightTrigger={treadmillData?.incline}
            />
            <MetricCard 
              label="Distance" 
              value={treadmillData?.totalDistance} 
              unit="m" 
              icon={<MapPin size={18} color={theme.primary} />}
            />
            <MetricCard 
              label="Duration" 
              value={treadmillData?.elapsedTime} 
              unit="s" 
              icon={<Clock size={18} color={theme.primary} />}
            />
            <MetricCard 
              label="Calories" 
              value={treadmillData?.totalEnergy} 
              unit="kcal" 
              icon={<Flame size={18} color={theme.primary} />}
            />
            <MetricCard 
              label="Pace" 
              value={stats.pace} 
              unit="min/km" 
              icon={<Activity size={18} color={theme.primary} />}
            />
          </View>

          {/* Advanced Stats */}
          <View style={[styles.statsRow, { backgroundColor: theme.card }]}>
            <View style={styles.statItem}>
              <Text style={[styles.statLabel, { color: theme.subtext }]}>AVG SPEED</Text>
              <Text style={[styles.statValue, { color: theme.text }]}>{stats.avgSpeed.toFixed(1)}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statLabel, { color: theme.subtext }]}>MAX SPEED</Text>
              <Text style={[styles.statValue, { color: theme.text }]}>{stats.maxSpeed.toFixed(1)}</Text>
            </View>
          </View>

          {isActive && (
            <TouchableOpacity
              style={[styles.endButton, { backgroundColor: theme.danger }]}
              onPress={endSession}>
              <Text style={styles.endButtonText}>End Session</Text>
            </TouchableOpacity>
          )}

          <AnalyticsSummary />

          {history.length > 0 && (
            <View style={styles.historySection}>
              <Text style={[styles.listHeader, { color: theme.text }]}>Recent History</Text>
              {history.slice(0, 5).map((session) => (
                <View key={session.id} style={[styles.deviceItem, { backgroundColor: theme.card, borderColor: theme.border }]}>
                  <View>
                    <Text style={[styles.deviceName, { color: theme.text }]}>
                      {new Date(session.date).toLocaleDateString()}
                    </Text>
                    <Text style={[styles.deviceId, { color: theme.subtext }]}>
                      {session.distance}m • {Math.floor(session.duration / 60)}m {session.duration % 60}s
                    </Text>
                  </View>
                  <Trophy size={16} color={theme.warning} />
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

const App = () => (
  <ThemeProvider>
    <Dashboard />
  </ThemeProvider>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    flex: 1,
  },
  header: {
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    elevation: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  themeToggle: {
    padding: 10,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 12,
  },
  scanSection: {
    flex: 1,
    padding: 20,
  },
  scanButton: {
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 20,
    elevation: 4,
  },
  scanButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  listHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  deviceItem: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  deviceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  deviceNameContainer: {
    marginLeft: 12,
  },
  deviceName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  deviceId: {
    fontSize: 12,
  },
  dataSection: {
    padding: 20,
  },
  statusBox: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 20,
    elevation: 2,
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
  },
  disconnectButton: {
    padding: 8,
    borderRadius: 8,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 20,
    borderRadius: 16,
    marginTop: 8,
    marginBottom: 20,
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  endButton: {
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 30,
    elevation: 4,
  },
  endButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  historySection: {
    marginTop: 20,
    marginBottom: 40,
  },
});

export default App;
