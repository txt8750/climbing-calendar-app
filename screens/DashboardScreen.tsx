import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import colors from "@/constants/colors";
import { Gym, RestPeriod, useApp } from "@/context/AppContext";
import GymDetailModal from "@/components/GymDetailModal";

function generateId() {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}

function formatDate(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function parseDateStr(s: string) {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function dayDiff(a: string, b: string) {
  return Math.round((parseDateStr(b).getTime() - parseDateStr(a).getTime()) / (1000 * 60 * 60 * 24));
}

function displayKoreanDate(d: Date) {
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일`;
}

interface DatePickerModalProps {
  visible: boolean;
  onClose: () => void;
  value: string;
  onSelect: (d: string) => void;
}

function DatePickerModal({ visible, onClose, value, onSelect }: DatePickerModalProps) {
  const insets = useSafeAreaInsets();
  const [year, setYear] = useState(parseInt(value.split("-")[0]));
  const [month, setMonth] = useState(parseInt(value.split("-")[1]));
  const [day, setDay] = useState(parseInt(value.split("-")[2]));
  const daysInMonth = new Date(year, month, 0).getDate();

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  useEffect(() => {
    if (day > daysInMonth) setDay(daysInMonth);
  }, [month, year]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={dpStyles.overlay} activeOpacity={1} onPress={onClose} />
      <View style={[dpStyles.sheet, { paddingBottom: insets.bottom + 20 }]}>
        <View style={dpStyles.handle} />
        <Text style={dpStyles.title}>날짜 선택</Text>
        <View style={dpStyles.pickerRow}>
          <ScrollView style={dpStyles.col} showsVerticalScrollIndicator={false}>
            {years.map((y) => (
              <TouchableOpacity key={y} style={[dpStyles.item, y === year && dpStyles.itemSelected]} onPress={() => setYear(y)}>
                <Text style={[dpStyles.itemText, y === year && dpStyles.itemTextSelected]}>{y}년</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <ScrollView style={dpStyles.col} showsVerticalScrollIndicator={false}>
            {months.map((m) => (
              <TouchableOpacity key={m} style={[dpStyles.item, m === month && dpStyles.itemSelected]} onPress={() => setMonth(m)}>
                <Text style={[dpStyles.itemText, m === month && dpStyles.itemTextSelected]}>{m}월</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <ScrollView style={dpStyles.col} showsVerticalScrollIndicator={false}>
            {days.map((d) => (
              <TouchableOpacity key={d} style={[dpStyles.item, d === day && dpStyles.itemSelected]} onPress={() => setDay(d)}>
                <Text style={[dpStyles.itemText, d === day && dpStyles.itemTextSelected]}>{d}일</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
        <TouchableOpacity
          style={dpStyles.confirmBtn}
          onPress={() => {
            const ds = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
            onSelect(ds);
            onClose();
          }}
        >
          <Text style={dpStyles.confirmBtnText}>선택 완료</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

const dpStyles = StyleSheet.create({
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.4)" },
  sheet: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    backgroundColor: colors.light.card, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingTop: 16, paddingHorizontal: 20,
  },
  handle: { width: 40, height: 4, backgroundColor: colors.light.border, borderRadius: 2, alignSelf: "center", marginBottom: 16 },
  title: { fontSize: 18, fontFamily: "Inter_700Bold", color: colors.light.foreground, marginBottom: 16 },
  pickerRow: { flexDirection: "row", height: 200, gap: 8 },
  col: { flex: 1 },
  item: { paddingVertical: 12, alignItems: "center", borderRadius: 8 },
  itemSelected: { backgroundColor: colors.light.primary },
  itemText: { fontSize: 15, fontFamily: "Inter_500Medium", color: colors.light.foreground },
  itemTextSelected: { color: "#fff", fontFamily: "Inter_700Bold" },
  confirmBtn: { backgroundColor: colors.light.primary, borderRadius: colors.radius, paddingVertical: 14, alignItems: "center", marginTop: 16 },
  confirmBtnText: { fontSize: 16, fontFamily: "Inter_700Bold", color: "#fff" },
});

interface RestPeriodRowProps {
  period: RestPeriod;
  onChange: (p: RestPeriod) => void;
  onDelete: () => void;
}

function RestPeriodRow({ period, onChange, onDelete }: RestPeriodRowProps) {
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  const handleExcludeToggle = () => {
    if (!period.excluded) {
      Alert.alert(
        "제외 확인",
        "(클라이밍 시작일 - 휴식 일)에서 휴식 일수가 제외됩니다. 그래도 체크하시겠습니까?",
        [
          { text: "취소", style: "cancel" },
          { text: "확인", onPress: () => onChange({ ...period, excluded: true }) },
        ]
      );
    } else {
      onChange({ ...period, excluded: false });
    }
  };

  return (
    <View style={rpStyles.row}>
      <View style={rpStyles.dates}>
        <TouchableOpacity style={rpStyles.dateBtn} onPress={() => setShowStartPicker(true)}>
          <Text style={rpStyles.dateBtnText}>{period.startDate}</Text>
        </TouchableOpacity>
        <Text style={rpStyles.tilde}>~</Text>
        <TouchableOpacity style={rpStyles.dateBtn} onPress={() => setShowEndPicker(true)}>
          <Text style={rpStyles.dateBtnText}>{period.endDate}</Text>
        </TouchableOpacity>
      </View>
      <View style={rpStyles.controls}>
        <TouchableOpacity
          style={[rpStyles.checkbox, period.excluded && rpStyles.checkboxChecked]}
          onPress={handleExcludeToggle}
        >
          {period.excluded && <Feather name="check" size={12} color="#fff" />}
        </TouchableOpacity>
        <TouchableOpacity onPress={onDelete}>
          <Feather name="trash-2" size={15} color={colors.light.destructive} />
        </TouchableOpacity>
      </View>

      <DatePickerModal
        visible={showStartPicker}
        onClose={() => setShowStartPicker(false)}
        value={period.startDate}
        onSelect={(d) => onChange({ ...period, startDate: d })}
      />
      <DatePickerModal
        visible={showEndPicker}
        onClose={() => setShowEndPicker(false)}
        value={period.endDate}
        onSelect={(d) => onChange({ ...period, endDate: d })}
      />
    </View>
  );
}

const rpStyles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", marginBottom: 8, gap: 8 },
  dates: { flex: 1, flexDirection: "row", alignItems: "center", gap: 4 },
  dateBtn: {
    backgroundColor: colors.light.background, borderWidth: 1, borderColor: colors.light.border,
    borderRadius: 8, paddingHorizontal: 8, paddingVertical: 6,
  },
  dateBtnText: { fontSize: 12, fontFamily: "Inter_500Medium", color: colors.light.foreground },
  tilde: { fontSize: 14, color: colors.light.mutedForeground },
  controls: { flexDirection: "row", alignItems: "center", gap: 10 },
  checkbox: {
    width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: colors.light.border,
    alignItems: "center", justifyContent: "center",
  },
  checkboxChecked: { backgroundColor: colors.light.primary, borderColor: colors.light.primary },
});

interface GymCardProps {
  gym: Gym;
  referenceDate: string;
}

function GymCard({ gym, referenceDate }: GymCardProps) {
  const { calendarEntries, getAutoScheduleEntries } = useApp();
  const [showDetail, setShowDetail] = useState(false);

  const lastVisit = useMemo(() => {
    const visits = calendarEntries
      .filter((e) => e.gymId === gym.id && e.type === "visit" && e.date <= referenceDate)
      .sort((a, b) => b.date.localeCompare(a.date));
    return visits[0]?.date;
  }, [calendarEntries, gym.id, referenceDate]);

  const settingInfo = useMemo(() => {
    const refYear = parseInt(referenceDate.split("-")[0]);
    const refMonth = parseInt(referenceDate.split("-")[1]);

    const months = [
      { y: refMonth === 1 ? refYear - 1 : refYear, m: refMonth === 1 ? 12 : refMonth - 1 },
      { y: refYear, m: refMonth },
      { y: refMonth === 12 ? refYear + 1 : refYear, m: refMonth === 12 ? 1 : refMonth + 1 },
    ];

    const allAuto: { date: string; sectorIds?: string[] }[] = [];
    months.forEach(({ y, m }) => {
      const entries = getAutoScheduleEntries(gym.id, y, m);
      entries.filter((e) => e.category === "세팅").forEach((e) => allAuto.push({ date: e.date, sectorIds: e.sectorIds }));
    });

    const manualSettings = calendarEntries
      .filter((e) => e.gymId === gym.id && e.type === "setting")
      .map((e) => ({ date: e.date, sectorIds: e.sectorIds }));

    const all = [...allAuto, ...manualSettings].sort((a, b) => a.date.localeCompare(b.date));
    const past = all.filter((e) => e.date <= referenceDate).slice(-1)[0];
    const upcoming = all.filter((e) => e.date > referenceDate)[0];
    return { past, upcoming };
  }, [calendarEntries, gym.id, referenceDate, getAutoScheduleEntries]);

  const totalVisits = calendarEntries.filter((e) => e.gymId === gym.id && e.type === "visit").length;

  const thisMonthVisits = useMemo(() => {
    const [y, m] = referenceDate.split("-");
    return calendarEntries.filter((e) => e.gymId === gym.id && e.type === "visit" && e.date.startsWith(`${y}-${m}`)).length;
  }, [calendarEntries, gym.id, referenceDate]);

  return (
    <>
      <TouchableOpacity style={gcStyles.card} onPress={() => setShowDetail(true)} activeOpacity={0.7}>
        <View style={[gcStyles.colorBar, { backgroundColor: gym.color }]} />
        <View style={gcStyles.content}>
          <Text style={gcStyles.gymName}>{gym.name}</Text>
          {lastVisit && (
            <Text style={gcStyles.lastVisit}>최근 방문: {lastVisit}</Text>
          )}
          <View style={gcStyles.settingRow}>
            {settingInfo.past && (
              <View style={gcStyles.settingChip}>
                <Feather name="clock" size={11} color={colors.light.mutedForeground} />
                <Text style={gcStyles.settingChipText}>
                  {Math.abs(dayDiff(referenceDate, settingInfo.past.date))}일 전 세팅
                  {settingInfo.past.sectorIds?.length ? ` (${settingInfo.past.sectorIds.join(", ")})` : ""}
                </Text>
              </View>
            )}
            {settingInfo.upcoming && (
              <View style={[gcStyles.settingChip, gcStyles.upcomingChip]}>
                <Feather name="calendar" size={11} color={colors.light.primary} />
                <Text style={[gcStyles.settingChipText, { color: colors.light.primary }]}>
                  {dayDiff(referenceDate, settingInfo.upcoming.date)}일 후 세팅
                  {settingInfo.upcoming.sectorIds?.length ? ` (${settingInfo.upcoming.sectorIds.join(", ")})` : ""}
                </Text>
              </View>
            )}
          </View>
          <View style={gcStyles.visitStats}>
            <Text style={gcStyles.visitStat}>이번달 {thisMonthVisits}회</Text>
            <Text style={gcStyles.visitStatDot}>·</Text>
            <Text style={gcStyles.visitStat}>총 {totalVisits}회</Text>
          </View>
        </View>
        <Feather name="chevron-right" size={18} color={colors.light.mutedForeground} style={gcStyles.arrow} />
      </TouchableOpacity>

      {showDetail && (
        <GymDetailModal
          visible={showDetail}
          onClose={() => setShowDetail(false)}
          gymId={gym.id}
          referenceDate={lastVisit || referenceDate}
          alternativeDate={lastVisit !== referenceDate ? referenceDate : undefined}
        />
      )}
    </>
  );
}

const gcStyles = StyleSheet.create({
  card: {
    flexDirection: "row", backgroundColor: colors.light.card, borderRadius: colors.radius,
    overflow: "hidden", shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 6, elevation: 2, marginBottom: 10,
  },
  colorBar: { width: 5 },
  content: { flex: 1, padding: 14 },
  gymName: { fontSize: 16, fontFamily: "Inter_700Bold", color: colors.light.foreground, marginBottom: 4 },
  lastVisit: { fontSize: 12, fontFamily: "Inter_400Regular", color: colors.light.mutedForeground, marginBottom: 8 },
  settingRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 8 },
  settingChip: {
    flexDirection: "row", alignItems: "center", gap: 4,
    backgroundColor: colors.light.muted, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20,
  },
  upcomingChip: { backgroundColor: "#fff0f3" },
  settingChipText: { fontSize: 11, fontFamily: "Inter_400Regular", color: colors.light.mutedForeground },
  visitStats: { flexDirection: "row", alignItems: "center", gap: 6 },
  visitStat: { fontSize: 12, fontFamily: "Inter_500Medium", color: colors.light.foreground },
  visitStatDot: { color: colors.light.mutedForeground },
  arrow: { alignSelf: "center", marginRight: 12 },
});

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const { gyms, calendarEntries, stats, updateStats } = useApp();
  const today = formatDate(new Date());
  const [referenceDate, setReferenceDate] = useState(today);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);

  useEffect(() => {
    setReferenceDate(today);
  }, []);

  const thisMonthVisits = useMemo(() => {
    const [y, m] = today.split("-");
    return calendarEntries.filter((e) => e.type === "visit" && e.date.startsWith(`${y}-${m}`)).length;
  }, [calendarEntries, today]);

  const totalVisits = useMemo(() => calendarEntries.filter((e) => e.type === "visit").length, [calendarEntries]);

  const climbingDaysInfo = useMemo(() => {
    if (!stats.startDate) return null;
    const start = stats.startDate;
    const totalDays = dayDiff(start, today) + 1;

    let restDays = 0;
    stats.restPeriods.forEach((p) => {
      if (!p.excluded) {
        const diff = dayDiff(p.startDate, p.endDate) + 1;
        restDays += Math.max(0, diff);
      }
    });

    const effectiveDays = Math.max(0, totalDays - restDays);
    return { start, totalDays, restDays, effectiveDays };
  }, [stats, today]);

  const addRestPeriod = () => {
    const newPeriod: RestPeriod = {
      id: generateId(),
      startDate: today,
      endDate: today,
      excluded: false,
    };
    updateStats({ ...stats, restPeriods: [...stats.restPeriods, newPeriod] });
  };

  const updateRestPeriod = (period: RestPeriod) => {
    updateStats({ ...stats, restPeriods: stats.restPeriods.map((p) => (p.id === period.id ? period : p)) });
  };

  const deleteRestPeriod = (id: string) => {
    updateStats({ ...stats, restPeriods: stats.restPeriods.filter((p) => p.id !== id) });
  };

  const isToday = referenceDate === today;

  const isWeb = Platform.OS === "web";

  return (
    <View style={[styles.container, { paddingTop: isWeb ? 130 : insets.top + 75 }]}>
      <View style={styles.dateSelector}>
        <TouchableOpacity
          style={[styles.dateBtn, isToday && styles.dateBtnToday]}
          onPress={() => setShowDatePicker(true)}
          activeOpacity={0.7}
        >
          <Feather name="calendar" size={14} color={isToday ? "#fff" : colors.light.primary} />
          <Text style={[styles.dateBtnText, isToday && styles.dateBtnTextToday]}>
            {isToday ? "오늘 기준" : `${parseInt(referenceDate.split("-")[1])}월 ${parseInt(referenceDate.split("-")[2])}일 기준`}
          </Text>
          <Feather name="chevron-down" size={14} color={isToday ? "#fff" : colors.light.primary} />
        </TouchableOpacity>
        {!isToday && (
          <TouchableOpacity style={styles.resetBtn} onPress={() => setReferenceDate(today)}>
            <Text style={styles.resetBtnText}>오늘로 돌아가기</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 20 }]} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>암장 목록</Text>
        {gyms.length === 0 ? (
          <View style={styles.emptyGym}>
            <Feather name="map-pin" size={32} color={colors.light.mutedForeground} />
            <Text style={styles.emptyText}>등록된 암장이 없습니다</Text>
          </View>
        ) : (
          gyms.map((gym) => <GymCard key={gym.id} gym={gym} referenceDate={referenceDate} />)
        )}

        <View style={styles.statsCard}>
          <Text style={styles.statsTitle}>클라이밍 통계</Text>
          <View style={styles.statRow}>
            <StatBox label="이번달 방문" value={`${thisMonthVisits}회`} icon="calendar" />
            <StatBox label="총 방문" value={`${totalVisits}회`} icon="activity" />
          </View>
        </View>

        <View style={styles.statsCard}>
          <Text style={styles.statsTitle}>클라이밍 시작</Text>
          {stats.startDate ? (
            <View>
              <View style={styles.startDateRow}>
                <Text style={styles.startDateText}>{displayKoreanDate(parseDateStr(stats.startDate))} 시작</Text>
                <TouchableOpacity onPress={() => setShowStartDatePicker(true)}>
                  <Feather name="edit-2" size={14} color={colors.light.primary} />
                </TouchableOpacity>
              </View>
              <Text style={styles.startDateSub}>
                {displayKoreanDate(parseDateStr(stats.startDate))} ~ {displayKoreanDate(new Date())} 진행 중
              </Text>
              <Text style={styles.startDateDays}>
                {climbingDaysInfo?.effectiveDays ?? 0}일 클라이밍 중
                {(climbingDaysInfo?.restDays ?? 0) > 0 ? ` (휴식 ${climbingDaysInfo?.restDays}일 제외)` : ""}
              </Text>
            </View>
          ) : (
            <TouchableOpacity style={styles.setStartBtn} onPress={() => setShowStartDatePicker(true)}>
              <Feather name="plus-circle" size={16} color={colors.light.primary} />
              <Text style={styles.setStartBtnText}>시작 날짜 등록</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.statsCard}>
          <View style={styles.statsCardHeader}>
            <Text style={styles.statsTitle}>암장이용못한기간</Text>
            <TouchableOpacity style={styles.addRestBtn} onPress={addRestPeriod}>
              <Feather name="plus" size={14} color={colors.light.primary} />
            </TouchableOpacity>
          </View>
          {stats.restPeriods.length === 0 ? (
            <Text style={styles.noRestText}>기록된 휴식 기간이 없습니다</Text>
          ) : (
            <>
              <View style={styles.restHeader}>
                <Text style={styles.restHeaderText}>기간</Text>
                <Text style={styles.restHeaderExclude}>클라이밍일수 제외</Text>
              </View>
              {stats.restPeriods.map((period) => (
                <RestPeriodRow
                  key={period.id}
                  period={period}
                  onChange={updateRestPeriod}
                  onDelete={() => deleteRestPeriod(period.id)}
                />
              ))}
            </>
          )}
        </View>
      </ScrollView>

      <DatePickerModal
        visible={showDatePicker}
        onClose={() => setShowDatePicker(false)}
        value={referenceDate}
        onSelect={(d) => {
          setReferenceDate(d);
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }}
      />

      <DatePickerModal
        visible={showStartDatePicker}
        onClose={() => setShowStartDatePicker(false)}
        value={stats.startDate || today}
        onSelect={(d) => updateStats({ ...stats, startDate: d })}
      />
    </View>
  );
}

function StatBox({ label, value, icon }: { label: string; value: string; icon: string }) {
  return (
    <View style={sbStyles.box}>
      <Feather name={icon as any} size={18} color={colors.light.primary} />
      <Text style={sbStyles.value}>{value}</Text>
      <Text style={sbStyles.label}>{label}</Text>
    </View>
  );
}

const sbStyles = StyleSheet.create({
  box: {
    flex: 1, backgroundColor: colors.light.background, borderRadius: 10,
    padding: 14, alignItems: "center", gap: 6,
  },
  value: { fontSize: 22, fontFamily: "Inter_700Bold", color: colors.light.foreground },
  label: { fontSize: 12, fontFamily: "Inter_400Regular", color: colors.light.mutedForeground },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.light.background },
  dateSelector: {
    alignItems: "center",
    marginBottom: 16,
    gap: 8,
    paddingHorizontal: 16,
  },
  dateBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: colors.light.muted,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: colors.light.primary,
  },
  dateBtnToday: {
    backgroundColor: colors.light.primary,
    borderColor: colors.light.primary,
  },
  dateBtnText: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: colors.light.primary,
  },
  dateBtnTextToday: {
    color: "#fff",
  },
  resetBtn: {
    paddingVertical: 4,
  },
  resetBtnText: {
    fontSize: 13,
    color: colors.light.mutedForeground,
    fontFamily: "Inter_400Regular",
  },
  content: { paddingHorizontal: 16, gap: 14 },
  sectionTitle: { fontSize: 18, fontFamily: "Inter_700Bold", color: colors.light.foreground },
  emptyGym: { alignItems: "center", gap: 8, paddingVertical: 20 },
  emptyText: { fontSize: 14, color: colors.light.mutedForeground, fontFamily: "Inter_400Regular" },
  statsCard: {
    backgroundColor: colors.light.card, borderRadius: colors.radius, padding: 16,
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1,
  },
  statsCardHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
  statsTitle: { fontSize: 16, fontFamily: "Inter_700Bold", color: colors.light.foreground, marginBottom: 12 },
  statRow: { flexDirection: "row", gap: 10 },
  startDateRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 4 },
  startDateText: { fontSize: 16, fontFamily: "Inter_600SemiBold", color: colors.light.foreground, flex: 1 },
  startDateSub: { fontSize: 13, fontFamily: "Inter_400Regular", color: colors.light.mutedForeground, marginBottom: 4 },
  startDateDays: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: colors.light.primary },
  setStartBtn: {
    flexDirection: "row", alignItems: "center", gap: 8,
    paddingVertical: 12, borderWidth: 1.5, borderColor: colors.light.primary,
    borderRadius: 10, justifyContent: "center", borderStyle: "dashed",
  },
  setStartBtnText: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: colors.light.primary },
  addRestBtn: {
    width: 30, height: 30, borderRadius: 15, backgroundColor: "#fff0f3",
    alignItems: "center", justifyContent: "center",
  },
  restHeader: { flexDirection: "row", alignItems: "center", marginBottom: 6, paddingBottom: 6, borderBottomWidth: 1, borderBottomColor: colors.light.border },
  restHeaderText: { flex: 1, fontSize: 12, fontFamily: "Inter_500Medium", color: colors.light.mutedForeground },
  restHeaderExclude: { fontSize: 12, fontFamily: "Inter_500Medium", color: colors.light.mutedForeground, marginRight: 32 },
  noRestText: { fontSize: 13, color: colors.light.mutedForeground, fontFamily: "Inter_400Regular" },
});
