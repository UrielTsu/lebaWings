import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { TakeOrderScreen } from './src/screens/TakeOrderScreen';

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <TakeOrderScreen />
    </SafeAreaProvider>
  );
}
