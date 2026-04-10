import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React from "react";
import {
  Animated,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import colors from "@/constants/colors";
import { MainScreen } from "@/context/AppContext";

interface MenuProps {
  visible: boolean;
  onClose: () => void;
  currentScreen: MainScreen;
  onNavigate: (screen: MainScreen) => void;
  onChangeMainScreen: () => void;
}

const menuItems: { id: MainScreen | "changeMain"; label: string; icon: string }[] = [
  { id: "calendar", label: "캘린더", icon: "calendar" },
  { id: "gymManagement", label: "암장관리", icon: "map-pin" },
  { id: "dashboard", label: "대시보드", icon: "bar-chart-2" },
  { id: "changeMain", label: "메인화면 변경", icon: "settings" },
];

export default function Menu({ visible, onClose, currentScreen, onNavigate, onChangeMainScreen }: MenuProps) {
  const insets = useSafeAreaInsets();

  const handleItem = (item: typeof menuItems[0]) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onClose();
    if (item.id === "changeMain") {
      setTimeout(() => onChangeMainScreen(), 300);
    } else {
      onNavigate(item.id as MainScreen);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay} />
      </TouchableWithoutFeedback>
      <View style={[styles.menu, { top: insets.top + 60 }]}>
        {menuItems.map((item, index) => {
          const isActive = item.id === currentScreen;
          return (
            <TouchableOpacity
              key={item.id}
              style={[styles.menuItem, index < menuItems.length - 1 && styles.menuItemBorder]}
              onPress={() => handleItem(item)}
              activeOpacity={0.7}
            >
              <Feather
                name={item.icon as any}
                size={18}
                color={isActive ? colors.light.primary : colors.light.foreground}
              />
              <Text style={[styles.menuLabel, isActive && styles.menuLabelActive]}>{item.label}</Text>
              {isActive && <View style={styles.activeDot} />}
            </TouchableOpacity>
          );
        })}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.3)",
  },
  menu: {
    position: "absolute",
    left: 16,
    backgroundColor: colors.light.card,
    borderRadius: colors.radius,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
    minWidth: 200,
    overflow: "hidden",
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 18,
    gap: 12,
  },
  menuItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.light.border,
  },
  menuLabel: {
    fontSize: 16,
    color: colors.light.foreground,
    fontFamily: "Inter_500Medium",
    flex: 1,
  },
  menuLabelActive: {
    color: colors.light.primary,
    fontFamily: "Inter_600SemiBold",
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.light.primary,
  },
});
