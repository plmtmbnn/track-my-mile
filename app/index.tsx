import { SafeAreaView } from 'react-native-safe-area-context';
import DashboardScreen from '@/screens/DashboardScreen';
import { COLORS } from '@/constants/theme';

export default function Index() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.bg }} edges={['top', 'bottom']}>
      <DashboardScreen />
    </SafeAreaView>
  );
}
