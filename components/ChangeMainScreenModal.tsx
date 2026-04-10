import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React from "react";
import {
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

interface Props {
  visible: boolean;
  onClose: () => void;
  currentMain: MainScreen;
  onSelect: (screen: MainScreen) => void;
}

const options: { id: MainScreen; label: string; icon: string; desc: string }[] = [
  { id: "calendar", label: "캘린더", icon: "calendar", desc: "월간 캘린더를 메인화면으로" },
  { id: "gymManagement", label: "암장관리", icon: "map-pin", desc: "암장 목록을 메인화면으로" },
  { id: "dashboard", label: "대시보드", icon: "bar-chart-2", desc: "통계 대시보드를 메인화면으로" },
];

export default function ChangeMainScreenModal({ visible, onClose, currentMain, onSelect }: Props) {
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay} />
      </TouchableWithoutFeedback>
      <View style={[styles.sheet, { paddingBottom: insets.bottom + 20 }]}>
        <View style={styles.handle} />
        <Text style={styles.title}>메인화면 변경</Text>
        <Text style={styles.subtitle}>앱 시작 시 보여줄 화면을 선택하세요</Text>

        {options.map((opt) => {
          const isSelected = opt.id === currentMain;
          return (
            <TouchableOpacity
              key={opt.id}
              style={[styles.option, isSelected && styles.optionSelected]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                onSelect(opt.id);
                onClose();
              }}
              activeOpacity={0.7}
            >
              <View style={[styles.iconBox, isSelected && styles.iconBoxSelected]}>
                <Feather name={opt.icon as any} size={22} color={isSelected ? "#fff" : colors.light.accent} />
              </View>
              <View style={styles.optionText}>
                <Text style={[styles.optionLabel, isSelected && styles.optionLabelSelected]}>{opt.label}</Text>
                <Text style={styles.optionDesc}>{opt.desc}</Text>
              </View>
              {isSelected && <Feather name="check-circle" size={20} color={colors.light.primary} />}
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
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  sheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.light.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 16,
    paddingHorizontal: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 20,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: colors.light.border,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
    color: colors.light.foreground,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: colors.light.mutedForeground,
    fontFamily: "Inter_400Regular",
    marginBottom: 20,
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: colors.radius,
    marginBottom: 10,
    backgroundColor: colors.light.muted,
    gap: 14,
  },
  optionSelected: {
    backgroundColor: "#fff0f3",
    borderWidth: 1.5,
    borderColor: colors.light.primary,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.light.card,
    alignItems: "center",
    justifyContent: "center",
  },
  iconBoxSelected: {
    backgroundColor: colors.light.primary,
  },
  optionText: { flex: 1 },
  optionLabel: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    color: colors.light.foreground,
  },
  optionLabelSelected: {
    color: colors.light.primary,
  },
  optionDesc: {
    fontSize: 12,
    color: colors.light.mutedForeground,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
});
