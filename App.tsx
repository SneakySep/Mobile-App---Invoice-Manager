import { StatusBar } from 'expo-status-bar';
import { PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { appTheme } from './src/constants/theme';
import { RootNavigator } from './src/navigation/RootNavigator';
import { InvoicesProvider } from './src/providers/InvoicesProvider';

export default function App() {
  return (
    <SafeAreaProvider>
      <PaperProvider theme={appTheme}>
        <StatusBar style="dark" />
        <InvoicesProvider>
          <RootNavigator />
        </InvoicesProvider>
      </PaperProvider>
    </SafeAreaProvider>
  );
}
