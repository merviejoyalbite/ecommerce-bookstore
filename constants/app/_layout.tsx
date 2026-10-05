import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from '@expo-google-fonts/inter';
import {
  PlayfairDisplay_600SemiBold,
  PlayfairDisplay_600SemiBold_Italic,
  PlayfairDisplay_700Bold,
} from '@expo-google-fonts/playfair-display';
import { AuthProvider } from '@/store/auth';
import { CartProvider } from '@/store/cart';
import { ShopProvider } from '@/store/shop';
import { SessionSync } from '@/components/SessionSync';

SplashScreen.preventAutoHideAsync();

// Single layout for native + web: Supabase (supabase-js) works on both,
// so no platform split is needed.
export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    PlayfairDisplay_600SemiBold,
    PlayfairDisplay_600SemiBold_Italic,
    PlayfairDisplay_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync().catch(() => {});
  }, [fontsLoaded]);

  return (
    <AuthProvider>
      <ShopProvider>
        <CartProvider>
          <SessionSync />
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="book/[id]" options={{ headerShown: false }} />
            <Stack.Screen name="checkout" options={{ headerShown: false }} />
            <Stack.Screen name="order-success" options={{ headerShown: false }} />
            <Stack.Screen name="order/[id]" options={{ headerShown: false }} />
            <Stack.Screen name="+not-found" />
          </Stack>
        </CartProvider>
      </ShopProvider>
    </AuthProvider>
  );
}
