import React from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";

import { AuthScreen } from "../components/screens/AuthScreen";
import { Photo } from "../components/screens/PhotoScreen";
import { AccountScreen } from "../components/screens/AccountScreen";
import { LeaderboardScreen } from "../components/screens/LeaderboardScreen";
import { COLORS, MONO } from "../components/photo/theme";
import { useSession } from "../lib/useSession";

const Tab = createBottomTabNavigator();

const tabLabel =
  (label: string) =>
  ({ focused }: { focused: boolean }) => (
    <Text style={[styles.tabLabel, focused && styles.tabLabelActive]}>
      {label}
    </Text>
  );

const App: React.FC = () => (
  <Tab.Navigator
    initialRouteName="aparat"
    screenOptions={{
      headerShown: false,
      tabBarStyle: styles.tabBar,
      tabBarShowLabel: true,
      tabBarLabelPosition: "below-icon",
      tabBarItemStyle: styles.tabItem,
    }}
  >
    <Tab.Screen
      name="ranking"
      component={LeaderboardScreen}
      options={{
        tabBarLabel: tabLabel("RANKING"),
        tabBarIcon: () => null,
      }}
    />
    <Tab.Screen
      name="aparat"
      component={Photo}
      options={{
        tabBarLabel: tabLabel("APARAT"),
        tabBarIcon: () => null,
      }}
    />
    <Tab.Screen
      name="konto"
      component={AccountScreen}
      options={{
        tabBarLabel: tabLabel("KONTO"),
        tabBarIcon: () => null,
      }}
    />
  </Tab.Navigator>
);

export default function Index() {
  const { session, loading } = useSession();

  if (loading) {
    return (
      <View style={styles.splash}>
        <ActivityIndicator color={COLORS.ink} />
      </View>
    );
  }

  return session ? <App /> : <AuthScreen />;
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    backgroundColor: COLORS.paperEdge,
    alignItems: "center",
    justifyContent: "center",
  },
  tabBar: {
    backgroundColor: COLORS.paper,
    borderTopWidth: 1,
    borderTopColor: COLORS.ink,
    height: 80,
  },
  tabItem: { paddingVertical: 0 },
  tabLabel: {
    fontFamily: MONO,
    fontSize: 13,
    letterSpacing: 2,
    color: COLORS.inkSoft,
    textAlign: "center",
  },
  tabLabelActive: {
    color: COLORS.stamp,
    fontWeight: "900",
  },
});
