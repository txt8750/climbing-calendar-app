import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useMemo, useState } from "react";
import {
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import colors from "@/constants/colors";
import { CalendarEntry, useApp } from "@/context/AppContext";
import GymDetailModal from "@/components/GymDetailModal";

const DAYS_OF_WEEK = ["일", "월", "화", "수", "목", "금", "토"];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month - 1, 1).getDay();
}

function formatDate(year: number, month: number, day: number) {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

const VISIT_BG = "#10b981";
const SETTING_BG = "#8b5cf6";
const CLOSED_BG = "#ef4444";

interface DateEventSheetProps {
  visible: boolean;
  date: string;
  onClose: () => void;
  onAction: (action: string) => void;
}

function DateEventSheet({ visible, date, onClose, onAction }: DateEventSheetProps) {
  const insets = useSafeAreaInsets();
  const { getEntriesForDate, getGymById, deleteCalendarEntry, gyms, getAutoScheduleEntries } = useApp();

  const actions = [
    { id: "visit", label: "방문 등록", icon: "check-circle", color: VISIT_BG },
    { id: "closed", label: "휴관 등록", icon: "x-circle", color: CLOSED_BG },
    { id: "setting", label: "세팅 등록", icon: "tool", color: SETTING_BG },
    { id: "info", label: "암장 정보", icon: "info", color: colors.light.accent },
  ];

  const parts = date ? date.split("-") : ["", "0", "0"];
  const displayDate = date ? `${parseInt(parts[1])}월 ${parseInt(parts[2])}일` : "";

  const manualEntries = date ? getEntriesForDate(date) : [];

  const autoEntries = useMemo(() => {
    if (!date) return [];
    const year = parseInt(parts[0]);
    const month = parseInt(parts[1]);
    const result: { gymId: string; gymName: string; category: "휴관" | "세팅"; sectorIds?: string[] }[] = [];
    gyms.forEach((gym) => {
      const schedEntries = getAutoScheduleEntries(gym.id, year, month);
      schedEntries.forEach((e) => {
        if (e.date === date) {
          result.push({ gymId: gym.id, gymName: gym.name, category: e.category, sectorIds: e.sectorIds });
        }
      });
    });
    return result;
  }, [date, gyms, getAutoScheduleEntries]);

  const typeLabel = (type: string) => type === "visit" ? "방문" : type === "closed" ? "휴관" : "세팅";
  const typeColor = (type: string) => type === "visit" ? VISIT_BG : type === "closed" ? CLOSED_BG : SETTING_BG;
  const catColor = (cat: string) => cat === "휴관" ? CLOSED_BG : SETTING_BG;

  const hasEvents = manualEntries.length > 0 || autoEntries.length > 0;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={sheetStyles.overlay} />
      </TouchableWithoutFeedback>
      <View style={[sheetStyles.sheet, { paddingBottom: insets.bottom + 16 }]}>
        <View style={sheetStyles.handle} />
        <Text style={sheetStyles.dateTitle}>{displayDate}</Text>

        {/* 등록된 일정 목록 */}
        {hasEvents ? (
          <View style={sheetStyles.eventList}>
            <Text style={sheetStyles.sectionLabel}>등록된 일정</Text>
            {manualEntries.map((entry) => {
              const gym = getGymById(entry.gymId);
              return (
                <View key={entry.id} style={sheetStyles.eventRow}>
                  <View style={[sheetStyles.eventTypeBadge, { backgroundColor: typeColor(entry.type) }]}>
                    <Text style={sheetStyles.eventTypeBadgeText}>{typeLabel(entry.type)}</Text>
                  </View>
                  <View style={[sheetStyles.gymColorDot, { backgroundColor: gym?.color || "#ccc" }]} />
                  <Text style={sheetStyles.eventGymName} numberOfLines={1}>{gym?.name || "알 수 없는 암장"}</Text>
                  {entry.sectorIds && entry.sectorIds.length > 0 && (
                    <Text style={sheetStyles.eventSectors} numberOfLines={1}>({entry.sectorIds.join(", ")})</Text>
                  )}
                  <TouchableOpacity
                    style={sheetStyles.deleteBtn}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                      deleteCalendarEntry(entry.id);
                    }}
                  >
                    <Feather name="trash-2" size={14} color={colors.light.destructive} />
                  </TouchableOpacity>
                </View>
              );
            })}
            {autoEntries.map((entry, i) => (
              <View key={`auto-${i}`} style={[sheetStyles.eventRow, sheetStyles.autoEventRow]}>
                <View style={[sheetStyles.eventTypeBadge, { backgroundColor: catColor(entry.category) }]}>
                  <Text style={sheetStyles.eventTypeBadgeText}>{entry.category}</Text>
                </View>
                <View style={[sheetStyles.gymColorDot, { backgroundColor: gyms.find(g => g.id === entry.gymId)?.color || "#ccc" }]} />
                <Text style={sheetStyles.eventGymName} numberOfLines={1}>{entry.gymName}</Text>
                {entry.sectorIds && entry.sectorIds.length > 0 && (
                  <Text style={sheetStyles.eventSectors} numberOfLines={1}>({entry.sectorIds.join(", ")})</Text>
                )}
                <View style={sheetStyles.autoLabel}>
                  <Text style={sheetStyles.autoLabelText}>자동</Text>
                </View>
              </View>
            ))}
          </View>
        ) : (
          <View style={sheetStyles.emptyEvents}>
            <Feather name="calendar" size={24} color={colors.light.mutedForeground} />
            <Text style={sheetStyles.emptyEventsText}>등록된 일정이 없습니다</Text>
          </View>
        )}

        {/* 등록 액션 버튼들 */}
        <View style={sheetStyles.divider} />
        <Text style={sheetStyles.sectionLabel}>일정 추가</Text>
        <View style={sheetStyles.actionGrid}>
          {actions.map((action) => (
            <TouchableOpacity
              key={action.id}
              style={sheetStyles.actionBtn}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onClose();
                setTimeout(() => onAction(action.id), 200);
              }}
              activeOpacity={0.7}
            >
              <View style={[sheetStyles.actionIcon, { backgroundColor: action.color + "1a" }]}>
                <Feather name={action.icon as any} size={18} color={action.color} />
              </View>
              <Text style={sheetStyles.actionBtnLabel}>{action.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </Modal>
  );
}

const sheetStyles = StyleSheet.create({
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
    paddingTop: 14,
    paddingHorizontal: 20,
    maxHeight: "75%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 20,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: colors.light.border,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 14,
  },
  dateTitle: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
    color: colors.light.foreground,
    marginBottom: 14,
  },
  sectionLabel: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    color: colors.light.mutedForeground,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  eventList: {
    marginBottom: 4,
  },
  eventRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: colors.light.background,
    borderRadius: 10,
    marginBottom: 6,
  },
  autoEventRow: {
    opacity: 0.85,
  },
  eventTypeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  eventTypeBadgeText: {
    fontSize: 11,
    fontFamily: "Inter_700Bold",
    color: "#fff",
  },
  gymColorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  eventGymName: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    color: colors.light.foreground,
  },
  eventSectors: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: colors.light.mutedForeground,
    maxWidth: 80,
  },
  deleteBtn: {
    padding: 4,
  },
  autoLabel: {
    backgroundColor: colors.light.muted,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  autoLabelText: {
    fontSize: 10,
    fontFamily: "Inter_500Medium",
    color: colors.light.mutedForeground,
  },
  emptyEvents: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 16,
    paddingHorizontal: 12,
    backgroundColor: colors.light.background,
    borderRadius: 10,
    marginBottom: 4,
  },
  emptyEventsText: {
    fontSize: 14,
    color: colors.light.mutedForeground,
    fontFamily: "Inter_400Regular",
  },
  divider: {
    height: 1,
    backgroundColor: colors.light.border,
    marginVertical: 14,
  },
  actionGrid: {
    flexDirection: "row",
    gap: 10,
  },
  actionBtn: {
    flex: 1,
    alignItems: "center",
    gap: 6,
    paddingVertical: 12,
    backgroundColor: colors.light.background,
    borderRadius: 12,
  },
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  actionBtnLabel: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
    color: colors.light.foreground,
    textAlign: "center",
  },
});

interface GymPickerProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (gymId: string) => void;
  title: string;
}

function GymPicker({ visible, onClose, onSelect, title }: GymPickerProps) {
  const { gyms } = useApp();
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay} />
      </TouchableWithoutFeedback>
      <View style={[styles.pickerSheet, { paddingBottom: insets.bottom + 20 }]}>
        <View style={styles.sheetHandle} />
        <Text style={styles.pickerTitle}>{title}</Text>
        {gyms.length === 0 ? (
          <View style={styles.emptyPicker}>
            <Feather name="map-pin" size={32} color={colors.light.mutedForeground} />
            <Text style={styles.emptyPickerText}>등록된 암장이 없습니다</Text>
          </View>
        ) : (
          gyms.map((gym) => (
            <TouchableOpacity
              key={gym.id}
              style={styles.gymPickerItem}
              onPress={() => {
                onClose();
                onSelect(gym.id);
              }}
              activeOpacity={0.7}
            >
              <View style={[styles.gymDot, { backgroundColor: gym.color }]} />
              <Text style={styles.gymPickerName}>{gym.name}</Text>
              <Feather name="chevron-right" size={16} color={colors.light.mutedForeground} />
            </TouchableOpacity>
          ))
        )}
      </View>
    </Modal>
  );
}

interface SectorPickerProps {
  visible: boolean;
  gymId: string;
  onClose: () => void;
  onSelect: (sectorIds: string[]) => void;
}

function SectorPicker({ visible, gymId, onClose, onSelect }: SectorPickerProps) {
  const { getGymById } = useApp();
  const gym = getGymById(gymId);
  const [selected, setSelected] = useState<string[]>([]);
  const insets = useSafeAreaInsets();

  const toggle = (sector: string) => {
    setSelected((prev) =>
      prev.includes(sector) ? prev.filter((s) => s !== sector) : [...prev, sector]
    );
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay} />
      </TouchableWithoutFeedback>
      <View style={[styles.pickerSheet, { paddingBottom: insets.bottom + 20 }]}>
        <View style={styles.sheetHandle} />
        <Text style={styles.pickerTitle}>섹터 선택 — {gym?.name}</Text>
        {(!gym?.sectors || gym.sectors.length === 0) ? (
          <Text style={styles.emptyPickerText}>등록된 섹터가 없습니다</Text>
        ) : (
          <>
            {gym.sectors.map((sector) => (
              <TouchableOpacity
                key={sector}
                style={styles.sectorItem}
                onPress={() => toggle(sector)}
                activeOpacity={0.7}
              >
                <View style={[styles.checkbox, selected.includes(sector) && styles.checkboxSelected]}>
                  {selected.includes(sector) && <Feather name="check" size={12} color="#fff" />}
                </View>
                <Text style={styles.sectorLabel}>{sector}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={[styles.confirmBtn, { opacity: selected.length === 0 ? 0.5 : 1 }]}
              onPress={() => {
                if (selected.length > 0) {
                  onSelect(selected);
                  setSelected([]);
                  onClose();
                }
              }}
              disabled={selected.length === 0}
              activeOpacity={0.8}
            >
              <Text style={styles.confirmBtnText}>등록 ({selected.length}개 선택)</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </Modal>
  );
}

export default function CalendarScreen() {
  const insets = useSafeAreaInsets();
  const { gyms, calendarEntries, getEntriesForDate, addCalendarEntry, getAutoScheduleEntries, getGymById } = useApp();

  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [showActionMenu, setShowActionMenu] = useState(false);
  const [currentAction, setCurrentAction] = useState<string | null>(null);
  const [showGymPicker, setShowGymPicker] = useState(false);
  const [selectedGymId, setSelectedGymId] = useState<string | null>(null);
  const [showSectorPicker, setShowSectorPicker] = useState(false);
  const [showGymDetail, setShowGymDetail] = useState(false);

  const firstDay = getFirstDayOfMonth(year, month);
  const daysInMonth = getDaysInMonth(year, month);
  const todayStr = formatDate(today.getFullYear(), today.getMonth() + 1, today.getDate());

  const autoSchedules = useMemo(() => {
    const map: Record<string, { category: "휴관" | "세팅"; gymId: string; sectorIds?: string[] }[]> = {};
    gyms.forEach((gym) => {
      const entries = getAutoScheduleEntries(gym.id, year, month);
      entries.forEach((e) => {
        if (!map[e.date]) map[e.date] = [];
        map[e.date].push({ category: e.category, gymId: gym.id, sectorIds: e.sectorIds });
      });
    });
    return map;
  }, [gyms, year, month, getAutoScheduleEntries]);

  const calendarDays = useMemo(() => {
    const days: (number | null)[] = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(i);
    return days;
  }, [firstDay, daysInMonth]);

  const prevMonth = () => {
    if (month === 1) { setMonth(12); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (month === 12) { setMonth(1); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  };

  const handleDayPress = (day: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const dateStr = formatDate(year, month, day);
    setSelectedDate(dateStr);
    setShowActionMenu(true);
  };

  const handleAction = (action: string) => {
    setCurrentAction(action);
    if (action === "info") {
      setShowGymPicker(true);
    } else {
      setShowGymPicker(true);
    }
  };

  const handleGymSelect = (gymId: string) => {
    setSelectedGymId(gymId);
    if (currentAction === "setting") {
      setShowSectorPicker(true);
    } else if (currentAction === "info") {
      setShowGymDetail(true);
    } else if (currentAction === "visit" || currentAction === "closed") {
      const entry: CalendarEntry = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        date: selectedDate!,
        type: currentAction as "visit" | "closed",
        gymId,
      };
      addCalendarEntry(entry);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const handleSectorSelect = (sectorIds: string[]) => {
    if (!selectedDate || !selectedGymId) return;
    const entry: CalendarEntry = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      date: selectedDate,
      type: "setting",
      gymId: selectedGymId,
      sectorIds,
    };
    addCalendarEntry(entry);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const getDayEntries = (day: number) => {
    const dateStr = formatDate(year, month, day);
    const manual = getEntriesForDate(dateStr);
    const auto = autoSchedules[dateStr] || [];
    return { manual, auto };
  };

  const abbr = (name: string) => name.length > 4 ? name.slice(0, 4) : name;

  const renderDay = (day: number | null, index: number) => {
    if (!day) return <View key={`empty-${index}`} style={styles.dayCell} />;

    const dateStr = formatDate(year, month, day);
    const { manual, auto } = getDayEntries(day);
    const isToday = dateStr === todayStr;
    const isSelected = dateStr === selectedDate;
    const isWeekend = index % 7 === 0 || index % 7 === 6;

    const visits = manual.filter((e) => e.type === "visit");
    const closedManual = manual.filter((e) => e.type === "closed");
    const closedAuto = auto.filter((e) => e.category === "휴관");
    const settingsManual = manual.filter((e) => e.type === "setting");
    const settingsAuto = auto.filter((e) => e.category === "세팅");

    type EventChip = { key: string; color: string; label: string };
    const chips: EventChip[] = [];

    visits.slice(0, 2).forEach((e, i) => {
      const gym = getGymById(e.gymId);
      chips.push({ key: `v${i}`, color: VISIT_BG, label: `${abbr(gym?.name || "암장")} 방문` });
    });
    closedManual.slice(0, 1).forEach((e, i) => {
      const gym = getGymById(e.gymId);
      chips.push({ key: `cm${i}`, color: CLOSED_BG, label: `${abbr(gym?.name || "암장")} 휴관` });
    });
    closedAuto.slice(0, 1).forEach((e, i) => {
      const gym = getGymById((e as any).gymId || "");
      chips.push({ key: `ca${i}`, color: CLOSED_BG, label: `${gym ? abbr(gym.name) : ""} 휴관`.trim() });
    });
    settingsManual.slice(0, 1).forEach((e, i) => {
      const gym = getGymById(e.gymId);
      chips.push({ key: `sm${i}`, color: SETTING_BG, label: `${abbr(gym?.name || "암장")} 세팅` });
    });
    settingsAuto.slice(0, 1).forEach((e, i) => {
      const gym = getGymById((e as any).gymId || "");
      chips.push({ key: `sa${i}`, color: SETTING_BG, label: `${gym ? abbr(gym.name) : ""} 세팅`.trim() });
    });

    const displayChips = chips.slice(0, 3);
    const extra = chips.length - displayChips.length;

    return (
      <TouchableOpacity
        key={day}
        style={[styles.dayCell, isSelected && styles.dayCellSelected]}
        onPress={() => handleDayPress(day)}
        activeOpacity={0.7}
      >
        <View style={[styles.dayNumber, isToday && styles.dayNumberToday]}>
          <Text style={[
            styles.dayText,
            isWeekend && styles.dayTextWeekend,
            isToday && styles.dayTextToday,
          ]}>
            {day}
          </Text>
        </View>
        <View style={styles.dayEvents}>
          {displayChips.map((chip) => (
            <View key={chip.key} style={[styles.eventChip, { backgroundColor: chip.color }]}>
              <Text style={styles.eventChipText} numberOfLines={1}>{chip.label}</Text>
            </View>
          ))}
          {extra > 0 && (
            <Text style={styles.extraText}>+{extra}개</Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const isWeb = Platform.OS === "web";

  return (
    <View style={[styles.container, { paddingTop: isWeb ? 130 : insets.top + 75 }]}>
      <View style={styles.monthNav}>
        <TouchableOpacity onPress={prevMonth} style={styles.navBtn}>
          <Feather name="chevron-left" size={22} color={colors.light.foreground} />
        </TouchableOpacity>
        <Text style={styles.monthTitle}>{year}년 {month}월</Text>
        <TouchableOpacity onPress={nextMonth} style={styles.navBtn}>
          <Feather name="chevron-right" size={22} color={colors.light.foreground} />
        </TouchableOpacity>
      </View>

      <View style={styles.weekHeader}>
        {DAYS_OF_WEEK.map((d) => (
          <Text key={d} style={[styles.weekDay, (d === "일" || d === "토") && styles.weekDayWeekend]}>{d}</Text>
        ))}
      </View>

      <View style={styles.grid}>
        {calendarDays.map((day, index) => renderDay(day, index))}
      </View>

      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: "#10b981" }]} />
          <Text style={styles.legendText}>방문</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: "#ef4444" }]} />
          <Text style={styles.legendText}>휴관</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: "#8b5cf6" }]} />
          <Text style={styles.legendText}>세팅</Text>
        </View>
      </View>

      <DateEventSheet
        visible={showActionMenu}
        date={selectedDate || ""}
        onClose={() => setShowActionMenu(false)}
        onAction={handleAction}
      />

      <GymPicker
        visible={showGymPicker}
        onClose={() => setShowGymPicker(false)}
        onSelect={handleGymSelect}
        title={
          currentAction === "visit" ? "방문 암장 선택" :
          currentAction === "closed" ? "휴관 암장 선택" :
          currentAction === "setting" ? "세팅 암장 선택" : "암장 선택"
        }
      />

      <SectorPicker
        visible={showSectorPicker}
        gymId={selectedGymId || ""}
        onClose={() => setShowSectorPicker(false)}
        onSelect={handleSectorSelect}
      />

      {showGymDetail && selectedGymId && selectedDate && (
        <GymDetailModal
          visible={showGymDetail}
          onClose={() => setShowGymDetail(false)}
          gymId={selectedGymId}
          referenceDate={selectedDate}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.light.background,
    paddingHorizontal: 12,
  },
  monthNav: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  navBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: colors.light.muted,
  },
  monthTitle: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
    color: colors.light.foreground,
  },
  weekHeader: {
    flexDirection: "row",
    marginBottom: 8,
  },
  weekDay: {
    flex: 1,
    textAlign: "center",
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    color: colors.light.mutedForeground,
    paddingVertical: 4,
  },
  weekDayWeekend: {
    color: colors.light.primary,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  dayCell: {
    width: "14.285714%",
    minHeight: 80,
    alignItems: "stretch",
    justifyContent: "flex-start",
    paddingTop: 4,
    paddingHorizontal: 1,
    borderRadius: 8,
  },
  dayCellSelected: {
    backgroundColor: colors.light.muted,
  },
  dayNumber: {
    width: 26,
    height: 26,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 13,
    alignSelf: "center",
  },
  dayNumberToday: {
    backgroundColor: colors.light.primary,
  },
  dayText: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    color: colors.light.foreground,
  },
  dayTextWeekend: {
    color: "#e94560",
  },
  dayTextToday: {
    color: "#fff",
    fontFamily: "Inter_700Bold",
  },
  dayEvents: {
    flexDirection: "column",
    gap: 2,
    marginTop: 3,
    paddingHorizontal: 1,
  },
  eventChip: {
    borderRadius: 3,
    paddingHorizontal: 3,
    paddingVertical: 2,
  },
  eventChipText: {
    fontSize: 8,
    fontFamily: "Inter_600SemiBold",
    color: "#fff",
  },
  extraText: {
    fontSize: 8,
    fontFamily: "Inter_400Regular",
    color: colors.light.mutedForeground,
    paddingLeft: 2,
  },
  legend: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 14,
    marginTop: 8,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: colors.light.border,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 3,
  },
  legendText: {
    fontSize: 11,
    color: colors.light.mutedForeground,
    fontFamily: "Inter_400Regular",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  pickerSheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.light.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 16,
    paddingHorizontal: 20,
    maxHeight: "70%",
  },
  sheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: colors.light.border,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 16,
  },
  pickerTitle: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    color: colors.light.foreground,
    marginBottom: 16,
  },
  emptyPicker: {
    alignItems: "center",
    paddingVertical: 32,
    gap: 12,
  },
  emptyPickerText: {
    fontSize: 14,
    color: colors.light.mutedForeground,
    fontFamily: "Inter_400Regular",
  },
  gymPickerItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.light.border,
    gap: 12,
  },
  gymDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  gymPickerName: {
    fontSize: 16,
    fontFamily: "Inter_500Medium",
    color: colors.light.foreground,
    flex: 1,
  },
  sectorItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.light.border,
    gap: 12,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.light.border,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxSelected: {
    backgroundColor: colors.light.primary,
    borderColor: colors.light.primary,
  },
  sectorLabel: {
    fontSize: 16,
    fontFamily: "Inter_500Medium",
    color: colors.light.foreground,
  },
  confirmBtn: {
    backgroundColor: colors.light.primary,
    borderRadius: colors.radius,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 16,
  },
  confirmBtnText: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
    color: "#fff",
  },
});
