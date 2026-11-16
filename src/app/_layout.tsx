import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: '#06040F' },
          headerTitleStyle: {
            fontWeight: '800',
            fontSize: 18,
            color: '#FFFFFF',
          },
          headerShadowVisible: false,
          contentStyle: { backgroundColor: '#06040F' },
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen
          name="senhas"
          options={{
            title: 'Cofre de Senhas',
            headerTintColor: '#00F5D4',
          }}
        />
        <Stack.Screen
          name="documentos"
          options={{
            title: 'Cofre de Documentos',
            headerTintColor: '#E879F9',
          }}
        />
      </Stack>
    </>
  );
}