import { Tabs } from 'expo-router';

export default function Layout() {
  return (
    <Tabs>
      <Tabs.Screen name="index" options={{ title: "Daily" }} />
      <Tabs.Screen name="freeplay" options={{ title: "Freeplay" }} />
      <Tabs.Screen name="social" options={{ title: "Social" }} />
      <Tabs.Screen name="profile" options={{ title: "Profile" }} />
    </Tabs>
  );
}
