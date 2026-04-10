import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import { Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import ChangeMainScreenModal from "@/components/ChangeMainScreenModal";
import Menu from "@/components/Menu";
import colors from "@/constants/colors";
import { MainScreen, useApp } from "@/context/AppContext";
import CalendarScreen from "@/screens/CalendarScreen";
import DashboardScreen from "@/screens/DashboardScreen";
import GymManagementScreen from "@/screens/GymManagementScreen";

const SCREEN_TITLES: Record<MainScreen, string> = {
  calendar: "클라이밍 캘린더",
  gymManagement: "암장관리",
  dashboard: "대시보드",
};

export default function App() {
  const { mainScreen, setMainScreen } = useApp();
  const [currentScreen, setCurrentScreen] = useState<MainScreen>(mainScreen);
  const [menuVisible, setMenuVisible] = useState(false);
  const [changeMainVisible, setChangeMainVisible] = useState(false);
  const insets = useSafeAreaInsets();

  const handleNavigate = (screen: MainScreen) => {
    if (screen === "dashboard") {
    }
    setCurrentScreen(screen);
  };

  const handleChangeMain = (screen: MainScreen) => {
    setMainScreen(screen);
    setCurrentScreen(screen);
  };

  const renderScreen = () => {
    switch (currentScreen) {
      case "calendar":
        return <CalendarScreen />;
      case "gymManagement":
        return <GymManagementScreen />;
      case "dashboard":
        return <DashboardScreen />;
    }
  };

  const isWeb = Platform.OS === "web";

  return (
    <View style={styles.container}>
      <View style={[
        styles.header,
        {
          paddingTop: isWeb ? 67 : insets.top + 8,
          paddingBottom: 10,
        }
      ]}>
        <TouchableOpacity
          style={styles.menuButton}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setMenuVisible(true);
          }}
          activeOpacity={0.7}
        >
          <Feather name="menu" size={22} color={colors.light.foreground} />
          <Text style={styles.menuButtonText}>메뉴</Text>
        </TouchableOpacity>

        <Text style={styles.headerTitle}>{SCREEN_TITLES[currentScreen]}</Text>

        <View style={styles.headerRight} />
      </View>

      <View style={styles.screenContainer}>{renderScreen()}</View>

      <Menu
        visible={menuVisible}
        onClose={() => setMenuVisible(false)}
        currentScreen={currentScreen}
        onNavigate={handleNavigate}
        onChangeMainScreen={() => setChangeMainVisible(true)}
      />

      <ChangeMainScreenModal
        visible={changeMainVisible}
        onClose={() => setChangeMainVisible(false)}
        currentMain={mainScreen}
        onSelect={handleChangeMain}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.light.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    backgroundColor: colors.light.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.light.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    zIndex: 100,
  },
  menuButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 6,
    paddingRight: 8,
  },
  menuButtonText: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    color: colors.light.foreground,
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 17,
    fontFamily: "Inter_700Bold",
    color: colors.light.foreground,
  },
  headerRight: {
    width: 60,
  },
  screenContainer: {
    flex: 1,
  },
});
