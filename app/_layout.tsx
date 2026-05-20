import { useEffect } from "react";
import { AppState } from "react-native";
import { Stack } from "expo-router";
import { initExecutorch } from "react-native-executorch";
import { ExpoResourceFetcher } from "react-native-executorch-expo-resource-fetcher";

import { supabase } from "../lib/supabase";

if (typeof window !== "undefined") {
  initExecutorch({ resourceFetcher: ExpoResourceFetcher });
}

export default function RootLayout() {
  useEffect(() => {
    // wzorzec z dokumentacji Supabase dla React Native.
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        supabase.auth.startAutoRefresh();
      } else {
        supabase.auth.stopAutoRefresh();
      }
    });
    return () => sub.remove();
  }, []);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
    </Stack>
  );
}
