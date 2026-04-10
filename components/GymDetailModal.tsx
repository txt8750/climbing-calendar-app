import { Feather } from "@expo/vector-icons";
import React, { useMemo } from "react";
import {
  Image,
  Linking,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import colors from "@/constants/colors";
import { useApp } from "@/context/AppContext";

interface Props {
  visible: boolean;
  onClose: () => void;
  gymId: string;
  referenceDate: string;
  alternativeDate?: string;
}

function getDaysBetween(date1: string, date2: string) {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  return Math.round((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));
}

export default function GymDetailModal({ visible, onClose, gymId, referenceDate, alternativeDate }: Props) {
  const insets = useSafeAreaInsets();
  const { getGymById, calendarEntries, getAutoScheduleEntries } = useApp();
  const gym = getGymById(gymId);

  const gymEntries = useMemo(() => calendarEntries.filter((e) => e.gymId === gymId), [calendarEntries, gymId]);

  const lastVisit = useMemo(() => {
    const visits = gymEntries.filter((e) => e.type === "visit" && e.date <= referenceDate).sort((a, b) => b.date.localeCompare(a.date));
    return visits[0]?.date;
  }, [gymEntries, referenceDate]);

  const getSettingInfo = (refDate: string) => {
    if (!gym) return { past: [], upcoming: [] };
    const today = refDate;
    const year = parseInt(today.split("-")[0]);
    const month = parseInt(today.split("-")[1]);

    const ranges = [
      { year, month: month - 1 <= 0 ? 12 : month - 1, y: month - 1 <= 0 ? year - 1 : year },
      { year, month, y: year },
      { year, month: month + 1 > 12 ? 1 : month + 1, y: month + 1 > 12 ? year + 1 : year },
    ];

    const allAuto: { date: string; category: "휴관" | "세팅"; sectorIds?: string[] }[] = [];
    ranges.forEach((r) => {
      const entries = getAutoScheduleEntries(gymId, r.y, r.month);
      allAuto.push(...entries);
    });

    const manualSettings = calendarEntries.filter((e) => e.gymId === gymId && e.type === "setting");
    const allSettings = [
      ...allAuto.filter((e) => e.category === "세팅").map((e) => ({ date: e.date, sectorIds: e.sectorIds, source: "auto" })),
      ...manualSettings.map((e) => ({ date: e.date, sectorIds: e.sectorIds, source: "manual" })),
    ].sort((a, b) => a.date.localeCompare(b.date));

    const past = allSettings.filter((e) => e.date <= today).slice(-3);
    const upcoming = allSettings.filter((e) => e.date > today).slice(0, 3);
    return { past, upcoming };
  };

  const { past: refPast, upcoming: refUpcoming } = useMemo(() => getSettingInfo(referenceDate), [referenceDate, gym, gymEntries]);
  const { past: altPast, upcoming: altUpcoming } = useMemo(
    () => alternativeDate ? getSettingInfo(alternativeDate) : { past: [], upcoming: [] },
    [alternativeDate, gym, gymEntries]
  );

  if (!gym) return null;

  const formatOperatingHours = () => {
    const oh = gym.operatingHours;
    if (oh.type === "weekday_weekend") {
      return [
        { label: "평일", time: `${oh.weekday.open} ~ ${oh.weekday.close}` },
        { label: "주말", time: `${oh.weekend.open} ~ ${oh.weekend.close}` },
      ];
    }
    const days = ["월", "화", "수", "목", "금", "토", "일"] as const;
    return days.map((d) => ({ label: d, time: `${oh.individual[d].open} ~ ${oh.individual[d].close}` }));
  };

  const renderSettingList = (list: { date: string; sectorIds?: string[] }[], isPast: boolean) => {
    if (list.length === 0) return <Text style={styles.noData}>없음</Text>;
    return list.map((item, i) => {
      const days = getDaysBetween(referenceDate, item.date);
      const absDays = Math.abs(days);
      return (
        <View key={i} style={styles.settingRow}>
          <Text style={styles.settingDate}>{item.date}</Text>
          <Text style={styles.settingDays}>
            {isPast ? `${absDays}일 전` : `${absDays}일 후`}
          </Text>
          {item.sectorIds && item.sectorIds.length > 0 && (
            <Text style={styles.settingSectors}>{item.sectorIds.join(", ")}</Text>
          )}
        </View>
      );
    });
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Feather name="x" size={22} color={colors.light.foreground} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{gym.name}</Text>
          <View style={[styles.gymColorDot, { backgroundColor: gym.color }]} />
        </View>

        <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 20 }]} showsVerticalScrollIndicator={false}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>기준: {referenceDate} 세팅 현황</Text>
            <Text style={styles.subLabel}>최근 세팅</Text>
            {renderSettingList(refPast, true)}
            <Text style={[styles.subLabel, { marginTop: 8 }]}>예정 세팅</Text>
            {renderSettingList(refUpcoming, false)}
          </View>

          {alternativeDate && (
            <View style={[styles.section, styles.altSection]}>
              <Text style={styles.sectionTitle}>선택날짜 기준: {alternativeDate} 세팅 현황</Text>
              <Text style={styles.subLabel}>최근 세팅</Text>
              {renderSettingList(altPast, true)}
              <Text style={[styles.subLabel, { marginTop: 8 }]}>예정 세팅</Text>
              {renderSettingList(altUpcoming, false)}
            </View>
          )}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>기본 정보</Text>
            <View style={styles.infoRow}>
              <Feather name="map-pin" size={14} color={colors.light.mutedForeground} />
              <Text style={styles.infoText}>{gym.address || "주소 미입력"}</Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>이용시간</Text>
            {formatOperatingHours().map((h, i) => (
              <View key={i} style={styles.hoursRow}>
                <Text style={styles.hoursDay}>{h.label}</Text>
                <Text style={styles.hoursTime}>{h.time}</Text>
              </View>
            ))}
          </View>

          {gym.sectorMapUri && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>섹터 지도</Text>
              <Image source={{ uri: gym.sectorMapUri }} style={styles.mapImage} resizeMode="contain" />
            </View>
          )}

          {gym.gradeImageUri && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>그레이드</Text>
              <Image source={{ uri: gym.gradeImageUri }} style={styles.mapImage} resizeMode="contain" />
            </View>
          )}

          {gym.sectors.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>섹터</Text>
              <View style={styles.sectorChips}>
                {gym.sectors.map((s, i) => (
                  <View key={i} style={styles.chip}>
                    <Text style={styles.chipText}>{s}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {gym.schedules.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>정기 휴관/세팅</Text>
              {gym.schedules.map((s, i) => (
                <View key={i} style={styles.scheduleRow}>
                  <View style={[styles.scheduleBadge, { backgroundColor: s.category === "휴관" ? "#fde8e8" : "#fef3e2" }]}>
                    <Text style={[styles.scheduleBadgeText, { color: s.category === "휴관" ? colors.light.destructive : colors.light.warning }]}>{s.category}</Text>
                  </View>
                  <Text style={styles.scheduleDesc}>
                    {s.type === "date" ? `매달 ${s.dayOfMonth}일` : `매달 ${s.nth}번째 주 ${s.weekday}요일`}
                    {s.sectorIds && s.sectorIds.length > 0 ? ` — ${s.sectorIds.join(", ")}` : ""}
                  </Text>
                </View>
              ))}
            </View>
          )}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>링크</Text>
            {gym.applicationLink ? (
              <TouchableOpacity style={styles.linkRow} onPress={() => Linking.openURL(gym.applicationLink!)}>
                <Feather name="file-text" size={14} color={colors.light.primary} />
                <Text style={styles.linkText}>일일이용신청서</Text>
                <Feather name="external-link" size={14} color={colors.light.primary} />
              </TouchableOpacity>
            ) : null}
            {gym.instagramLink ? (
              <TouchableOpacity style={styles.linkRow} onPress={() => Linking.openURL(gym.instagramLink!)}>
                <Feather name="instagram" size={14} color={colors.light.primary} />
                <Text style={styles.linkText}>인스타그램</Text>
                <Feather name="external-link" size={14} color={colors.light.primary} />
              </TouchableOpacity>
            ) : null}
            {!gym.applicationLink && !gym.instagramLink && (
              <Text style={styles.noData}>링크 미등록</Text>
            )}
          </View>
        </ScrollView>
      </View>
    </Modal>
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
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.light.border,
    backgroundColor: colors.light.card,
  },
  closeBtn: {
    padding: 4,
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    color: colors.light.foreground,
    flex: 1,
  },
  gymColorDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  content: {
    padding: 16,
    gap: 16,
  },
  section: {
    backgroundColor: colors.light.card,
    borderRadius: colors.radius,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  altSection: {
    borderLeftWidth: 3,
    borderLeftColor: colors.light.info,
  },
  sectionTitle: {
    fontSize: 15,
    fontFamily: "Inter_700Bold",
    color: colors.light.foreground,
    marginBottom: 12,
  },
  subLabel: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    color: colors.light.mutedForeground,
    marginBottom: 6,
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 4,
  },
  settingDate: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    color: colors.light.foreground,
  },
  settingDays: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: colors.light.mutedForeground,
  },
  settingSectors: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: colors.light.primary,
  },
  noData: {
    fontSize: 13,
    color: colors.light.mutedForeground,
    fontFamily: "Inter_400Regular",
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  infoText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: colors.light.foreground,
    flex: 1,
  },
  hoursRow: {
    flexDirection: "row",
    marginBottom: 6,
  },
  hoursDay: {
    width: 40,
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    color: colors.light.foreground,
  },
  hoursTime: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: colors.light.mutedForeground,
  },
  mapImage: {
    width: "100%",
    height: 200,
    borderRadius: 8,
    backgroundColor: colors.light.muted,
  },
  sectorChips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    backgroundColor: colors.light.muted,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  chipText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    color: colors.light.foreground,
  },
  scheduleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 8,
  },
  scheduleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  scheduleBadgeText: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
  },
  scheduleDesc: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: colors.light.foreground,
    flex: 1,
  },
  linkRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 8,
  },
  linkText: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    color: colors.light.primary,
    flex: 1,
  },
});
