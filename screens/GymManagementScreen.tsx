import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import React, { useState } from "react";
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
import { DayOfWeek, Gym, OperatingHours, ScheduleEntry, useApp } from "@/context/AppContext";

const GYM_COLORS = colors.light.gymColors;
const DAYS: DayOfWeek[] = ["월", "화", "수", "목", "금", "토", "일"];
const NTH_OPTIONS = [1, 2, 3, 4, 5];

function generateId() {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}

const defaultOperatingHours = (): OperatingHours => ({
  type: "weekday_weekend",
  individual: {
    월: { open: "10:00", close: "22:00" },
    화: { open: "10:00", close: "22:00" },
    수: { open: "10:00", close: "22:00" },
    목: { open: "10:00", close: "22:00" },
    금: { open: "10:00", close: "22:00" },
    토: { open: "10:00", close: "22:00" },
    일: { open: "10:00", close: "22:00" },
  },
  weekday: { open: "10:00", close: "22:00" },
  weekend: { open: "10:00", close: "22:00" },
});

interface TimeInputProps {
  value: string;
  onChange: (v: string) => void;
}

function TimeInput({ value, onChange }: TimeInputProps) {
  const parts = value.split(":");
  const h = parts[0] || "00";
  const m = parts[1] || "00";

  return (
    <View style={tiStyles.timeRow}>
      <TextInput
        style={tiStyles.input}
        value={h}
        onChangeText={(t) => onChange(`${t.replace(/\D/g, "").slice(0, 2)}:${m}`)}
        keyboardType="number-pad"
        maxLength={2}
      />
      <Text style={tiStyles.colon}>:</Text>
      <TextInput
        style={tiStyles.input}
        value={m}
        onChangeText={(t) => onChange(`${h}:${t.replace(/\D/g, "").slice(0, 2)}`)}
        keyboardType="number-pad"
        maxLength={2}
      />
    </View>
  );
}

const tiStyles = StyleSheet.create({
  timeRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  input: {
    width: 42,
    height: 36,
    borderWidth: 1,
    borderColor: colors.light.border,
    borderRadius: 8,
    textAlign: "center",
    fontSize: 15,
    fontFamily: "Inter_500Medium",
    color: colors.light.foreground,
    backgroundColor: colors.light.background,
  },
  colon: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
    color: colors.light.foreground,
  },
});

function TimeRangeInput({
  value,
  onChange,
}: {
  value: { open: string; close: string };
  onChange: (v: { open: string; close: string }) => void;
}) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
      <TimeInput value={value.open} onChange={(v) => onChange({ ...value, open: v })} />
      <Text style={{ color: colors.light.mutedForeground, fontFamily: "Inter_400Regular" }}>~</Text>
      <TimeInput value={value.close} onChange={(v) => onChange({ ...value, close: v })} />
    </View>
  );
}

interface GymFormProps {
  initial?: Gym;
  onSave: (gym: Gym) => void;
  onCancel: () => void;
}

function GymForm({ initial, onSave, onCancel }: GymFormProps) {
  const insets = useSafeAreaInsets();
  const [name, setName] = useState(initial?.name || "");
  const [address, setAddress] = useState(initial?.address || "");
  const [operatingHours, setOperatingHours] = useState<OperatingHours>(initial?.operatingHours || defaultOperatingHours());
  const [sectorMapUri, setSectorMapUri] = useState<string | undefined>(initial?.sectorMapUri);
  const [gradeImageUri, setGradeImageUri] = useState<string | undefined>(initial?.gradeImageUri);
  const [sectors, setSectors] = useState<string[]>(initial?.sectors || [""]);
  const [schedules, setSchedules] = useState<ScheduleEntry[]>(initial?.schedules || []);
  const [applicationLink, setApplicationLink] = useState(initial?.applicationLink || "");
  const [instagramLink, setInstagramLink] = useState(initial?.instagramLink || "");
  const [selectedColor, setSelectedColor] = useState(initial?.color || GYM_COLORS[0]);

  const pickImage = async (setter: (uri: string) => void) => {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 0.8 });
    if (!result.canceled && result.assets[0]) setter(result.assets[0].uri);
  };

  const updateIndividualHour = (day: DayOfWeek, field: "open" | "close", value: string) => {
    setOperatingHours((prev) => ({
      ...prev,
      individual: {
        ...prev.individual,
        [day]: { ...prev.individual[day], [field]: value },
      },
    }));
  };

  const addSector = () => setSectors((prev) => [...prev, ""]);
  const removeSector = (index: number) => setSectors((prev) => prev.filter((_, i) => i !== index));
  const updateSector = (index: number, value: string) => {
    setSectors((prev) => prev.map((s, i) => (i === index ? value : s)));
  };

  const addSchedule = () => {
    setSchedules((prev) => [
      ...prev,
      { id: generateId(), type: "date", dayOfMonth: 1, category: "휴관" },
    ]);
  };

  const removeSchedule = (id: string) => setSchedules((prev) => prev.filter((s) => s.id !== id));

  const updateSchedule = (id: string, updates: Partial<ScheduleEntry>) => {
    setSchedules((prev) => prev.map((s) => (s.id === id ? { ...s, ...updates } : s)));
  };

  const handleSave = () => {
    if (!name.trim()) {
      Alert.alert("오류", "암장 이름을 입력해주세요");
      return;
    }
    const gym: Gym = {
      id: initial?.id || generateId(),
      name: name.trim(),
      address: address.trim(),
      operatingHours,
      sectorMapUri,
      gradeImageUri,
      sectors: sectors.filter((s) => s.trim() !== ""),
      schedules,
      grades: [],
      applicationLink: applicationLink.trim(),
      instagramLink: instagramLink.trim(),
      color: selectedColor,
      createdAt: initial?.createdAt || new Date().toISOString(),
    };
    onSave(gym);
  };

  return (
    <View style={[fStyles.container, { paddingTop: insets.top }]}>
      <View style={fStyles.header}>
        <TouchableOpacity onPress={onCancel} style={fStyles.headerBtn}>
          <Feather name="x" size={22} color={colors.light.foreground} />
        </TouchableOpacity>
        <Text style={fStyles.headerTitle}>{initial ? "암장 수정" : "암장 등록"}</Text>
        <TouchableOpacity onPress={handleSave} style={[fStyles.headerBtn, fStyles.saveBtn]}>
          <Text style={fStyles.saveBtnText}>저장</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={[fStyles.content, { paddingBottom: insets.bottom + 20 }]} keyboardShouldPersistTaps="handled">
        <View style={fStyles.section}>
          <Text style={fStyles.sectionTitle}>색상</Text>
          <View style={fStyles.colorRow}>
            {GYM_COLORS.map((c) => (
              <TouchableOpacity key={c} style={[fStyles.colorDot, { backgroundColor: c }, selectedColor === c && fStyles.colorDotSelected]} onPress={() => setSelectedColor(c)} />
            ))}
          </View>
        </View>

        <View style={fStyles.section}>
          <Text style={fStyles.label}>암장 이름 *</Text>
          <TextInput style={fStyles.input} value={name} onChangeText={setName} placeholder="암장 이름 입력" placeholderTextColor={colors.light.mutedForeground} />
        </View>

        <View style={fStyles.section}>
          <Text style={fStyles.label}>암장 주소</Text>
          <TextInput style={fStyles.input} value={address} onChangeText={setAddress} placeholder="주소 입력" placeholderTextColor={colors.light.mutedForeground} />
        </View>

        <View style={fStyles.section}>
          <Text style={fStyles.sectionTitle}>이용시간</Text>
          <View style={fStyles.toggleRow}>
            <TouchableOpacity
              style={[fStyles.toggleBtn, operatingHours.type === "individual" && fStyles.toggleBtnActive]}
              onPress={() => setOperatingHours((p) => ({ ...p, type: "individual" }))}
            >
              <Text style={[fStyles.toggleText, operatingHours.type === "individual" && fStyles.toggleTextActive]}>요일별</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[fStyles.toggleBtn, operatingHours.type === "weekday_weekend" && fStyles.toggleBtnActive]}
              onPress={() => setOperatingHours((p) => ({ ...p, type: "weekday_weekend" }))}
            >
              <Text style={[fStyles.toggleText, operatingHours.type === "weekday_weekend" && fStyles.toggleTextActive]}>평일/주말</Text>
            </TouchableOpacity>
          </View>

          {operatingHours.type === "individual" ? (
            DAYS.map((day) => (
              <View key={day} style={fStyles.hourRow}>
                <Text style={fStyles.hourDay}>{day}</Text>
                <TimeRangeInput
                  value={operatingHours.individual[day]}
                  onChange={(v) => setOperatingHours((p) => ({ ...p, individual: { ...p.individual, [day]: v } }))}
                />
              </View>
            ))
          ) : (
            <>
              <View style={fStyles.hourRow}>
                <Text style={fStyles.hourDay}>평일</Text>
                <TimeRangeInput
                  value={operatingHours.weekday}
                  onChange={(v) => setOperatingHours((p) => ({ ...p, weekday: v }))}
                />
              </View>
              <View style={fStyles.hourRow}>
                <Text style={fStyles.hourDay}>주말</Text>
                <TimeRangeInput
                  value={operatingHours.weekend}
                  onChange={(v) => setOperatingHours((p) => ({ ...p, weekend: v }))}
                />
              </View>
            </>
          )}
        </View>

        <View style={fStyles.section}>
          <Text style={fStyles.sectionTitle}>섹터 지도</Text>
          <TouchableOpacity style={fStyles.imagePicker} onPress={() => pickImage(setSectorMapUri)}>
            <Feather name={sectorMapUri ? "check-circle" : "image"} size={20} color={sectorMapUri ? colors.light.success : colors.light.mutedForeground} />
            <Text style={[fStyles.imagePickerText, sectorMapUri && { color: colors.light.success }]}>
              {sectorMapUri ? "이미지 선택됨 (탭하여 변경)" : "이미지 첨부"}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={fStyles.section}>
          <Text style={fStyles.sectionTitle}>그레이드</Text>
          <TouchableOpacity style={fStyles.imagePicker} onPress={() => pickImage(setGradeImageUri)}>
            <Feather name={gradeImageUri ? "check-circle" : "image"} size={20} color={gradeImageUri ? colors.light.success : colors.light.mutedForeground} />
            <Text style={[fStyles.imagePickerText, gradeImageUri && { color: colors.light.success }]}>
              {gradeImageUri ? "이미지 선택됨 (탭하여 변경)" : "이미지 첨부"}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={fStyles.section}>
          <View style={fStyles.sectionTitleRow}>
            <Text style={fStyles.sectionTitle}>섹터 이름</Text>
            <TouchableOpacity onPress={addSector} style={fStyles.addBtn}>
              <Feather name="plus" size={16} color={colors.light.primary} />
            </TouchableOpacity>
          </View>
          {sectors.map((sector, index) => (
            <View key={index} style={fStyles.sectorRow}>
              <TextInput
                style={[fStyles.input, { flex: 1 }]}
                value={sector}
                onChangeText={(v) => updateSector(index, v)}
                placeholder={`섹터 ${index + 1}`}
                placeholderTextColor={colors.light.mutedForeground}
              />
              {sectors.length > 1 && (
                <TouchableOpacity onPress={() => removeSector(index)} style={fStyles.removeBtn}>
                  <Feather name="x" size={16} color={colors.light.destructive} />
                </TouchableOpacity>
              )}
            </View>
          ))}
        </View>

        <View style={fStyles.section}>
          <View style={fStyles.sectionTitleRow}>
            <Text style={fStyles.sectionTitle}>정기 휴관/세팅</Text>
            <TouchableOpacity onPress={addSchedule} style={fStyles.addBtn}>
              <Feather name="plus" size={16} color={colors.light.primary} />
            </TouchableOpacity>
          </View>
          {schedules.map((sched) => (
            <View key={sched.id} style={fStyles.scheduleCard}>
              <View style={fStyles.scheduleRow}>
                <TouchableOpacity
                  style={[fStyles.schedTypePill, sched.type === "date" && fStyles.schedTypePillActive]}
                  onPress={() => updateSchedule(sched.id, { type: "date", dayOfMonth: 1 })}
                >
                  <Text style={[fStyles.schedTypePillText, sched.type === "date" && fStyles.schedTypePillTextActive]}>날짜</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[fStyles.schedTypePill, sched.type === "nth_weekday" && fStyles.schedTypePillActive]}
                  onPress={() => updateSchedule(sched.id, { type: "nth_weekday", nth: 1, weekday: "월" })}
                >
                  <Text style={[fStyles.schedTypePillText, sched.type === "nth_weekday" && fStyles.schedTypePillTextActive]}>N번째 요일</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => removeSchedule(sched.id)} style={{ marginLeft: "auto" }}>
                  <Feather name="trash-2" size={16} color={colors.light.destructive} />
                </TouchableOpacity>
              </View>

              {sched.type === "date" ? (
                <View style={fStyles.schedDetailRow}>
                  <Text style={fStyles.schedLabel}>매달</Text>
                  <TextInput
                    style={fStyles.smallInput}
                    value={String(sched.dayOfMonth || 1)}
                    onChangeText={(v) => updateSchedule(sched.id, { dayOfMonth: parseInt(v) || 1 })}
                    keyboardType="number-pad"
                    maxLength={2}
                  />
                  <Text style={fStyles.schedLabel}>일</Text>
                </View>
              ) : (
                <View style={fStyles.schedDetailRow}>
                  <Text style={fStyles.schedLabel}>매달</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ maxWidth: 160 }}>
                    <View style={{ flexDirection: "row", gap: 4 }}>
                      {NTH_OPTIONS.map((n) => (
                        <TouchableOpacity
                          key={n}
                          style={[fStyles.nthBtn, sched.nth === n && fStyles.nthBtnActive]}
                          onPress={() => updateSchedule(sched.id, { nth: n })}
                        >
                          <Text style={[fStyles.nthBtnText, sched.nth === n && fStyles.nthBtnTextActive]}>{n}번째</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </ScrollView>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ maxWidth: 220 }}>
                    <View style={{ flexDirection: "row", gap: 4 }}>
                      {DAYS.map((d) => (
                        <TouchableOpacity
                          key={d}
                          style={[fStyles.nthBtn, sched.weekday === d && fStyles.nthBtnActive]}
                          onPress={() => updateSchedule(sched.id, { weekday: d })}
                        >
                          <Text style={[fStyles.nthBtnText, sched.weekday === d && fStyles.nthBtnTextActive]}>{d}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </ScrollView>
                </View>
              )}

              <View style={fStyles.schedCategoryRow}>
                <TouchableOpacity
                  style={[fStyles.categoryPill, { backgroundColor: sched.category === "휴관" ? "#fde8e8" : colors.light.muted }, sched.category === "휴관" && { borderWidth: 1.5, borderColor: colors.light.destructive }]}
                  onPress={() => updateSchedule(sched.id, { category: "휴관", sectorIds: undefined })}
                >
                  <Text style={[fStyles.categoryPillText, { color: sched.category === "휴관" ? colors.light.destructive : colors.light.mutedForeground }]}>휴관</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[fStyles.categoryPill, { backgroundColor: sched.category === "세팅" ? "#fef3e2" : colors.light.muted }, sched.category === "세팅" && { borderWidth: 1.5, borderColor: colors.light.warning }]}
                  onPress={() => updateSchedule(sched.id, { category: "세팅" })}
                >
                  <Text style={[fStyles.categoryPillText, { color: sched.category === "세팅" ? colors.light.warning : colors.light.mutedForeground }]}>세팅</Text>
                </TouchableOpacity>
              </View>

              {sched.category === "세팅" && sectors.filter((s) => s.trim()).length > 0 && (
                <View style={fStyles.schedSectorSection}>
                  <Text style={fStyles.schedSectorLabel}>세팅 섹터</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View style={fStyles.schedSectorRow}>
                      <TouchableOpacity
                        style={[
                          fStyles.nthBtn,
                          (!sched.sectorIds || sched.sectorIds.length === 0) && fStyles.schedSectorAllActive,
                        ]}
                        onPress={() => updateSchedule(sched.id, { sectorIds: [] })}
                      >
                        <Text style={[
                          fStyles.nthBtnText,
                          (!sched.sectorIds || sched.sectorIds.length === 0) && { color: "#fff" },
                        ]}>전체</Text>
                      </TouchableOpacity>
                      {sectors.filter((s) => s.trim()).map((sector) => {
                        const active = sched.sectorIds?.includes(sector) ?? false;
                        return (
                          <TouchableOpacity
                            key={sector}
                            style={[fStyles.nthBtn, active && fStyles.schedSectorActive]}
                            onPress={() => {
                              const cur = sched.sectorIds || [];
                              const next = active
                                ? cur.filter((s) => s !== sector)
                                : [...cur, sector];
                              updateSchedule(sched.id, { sectorIds: next });
                            }}
                          >
                            <Text style={[fStyles.nthBtnText, active && { color: "#fff" }]}>{sector}</Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </ScrollView>
                </View>
              )}
            </View>
          ))}
        </View>

        <View style={fStyles.section}>
          <Text style={fStyles.label}>일일이용신청서 링크</Text>
          <TextInput
            style={fStyles.input}
            value={applicationLink}
            onChangeText={setApplicationLink}
            placeholder="https://..."
            placeholderTextColor={colors.light.mutedForeground}
            autoCapitalize="none"
            keyboardType="url"
          />
        </View>

        <View style={fStyles.section}>
          <Text style={fStyles.label}>인스타그램 링크</Text>
          <TextInput
            style={fStyles.input}
            value={instagramLink}
            onChangeText={setInstagramLink}
            placeholder="https://instagram.com/..."
            placeholderTextColor={colors.light.mutedForeground}
            autoCapitalize="none"
            keyboardType="url"
          />
        </View>
      </ScrollView>
    </View>
  );
}

const fStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.light.background },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.light.border,
    backgroundColor: colors.light.card,
  },
  headerBtn: { padding: 4 },
  headerTitle: { flex: 1, fontSize: 18, fontFamily: "Inter_700Bold", color: colors.light.foreground, textAlign: "center" },
  saveBtn: { backgroundColor: colors.light.primary, paddingHorizontal: 14, paddingVertical: 6, borderRadius: 8 },
  saveBtnText: { color: "#fff", fontFamily: "Inter_600SemiBold", fontSize: 14 },
  content: { padding: 16, gap: 12 },
  section: { backgroundColor: colors.light.card, borderRadius: colors.radius, padding: 16 },
  sectionTitle: { fontSize: 15, fontFamily: "Inter_700Bold", color: colors.light.foreground, marginBottom: 12 },
  sectionTitleRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
  label: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: colors.light.foreground, marginBottom: 8 },
  input: {
    borderWidth: 1, borderColor: colors.light.border, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10,
    fontSize: 15, fontFamily: "Inter_400Regular", color: colors.light.foreground, backgroundColor: colors.light.background,
  },
  colorRow: { flexDirection: "row", gap: 10, flexWrap: "wrap" },
  colorDot: { width: 32, height: 32, borderRadius: 16 },
  colorDotSelected: { borderWidth: 3, borderColor: colors.light.foreground },
  toggleRow: { flexDirection: "row", backgroundColor: colors.light.muted, borderRadius: 8, padding: 3, marginBottom: 14 },
  toggleBtn: { flex: 1, paddingVertical: 7, alignItems: "center", borderRadius: 6 },
  toggleBtnActive: { backgroundColor: colors.light.card, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 1 },
  toggleText: { fontSize: 14, fontFamily: "Inter_500Medium", color: colors.light.mutedForeground },
  toggleTextActive: { color: colors.light.foreground, fontFamily: "Inter_600SemiBold" },
  hourRow: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  hourDay: { width: 36, fontSize: 14, fontFamily: "Inter_600SemiBold", color: colors.light.foreground },
  imagePicker: {
    flexDirection: "row", alignItems: "center", gap: 10, borderWidth: 1.5,
    borderColor: colors.light.border, borderRadius: 10, padding: 14, borderStyle: "dashed",
  },
  imagePickerText: { fontSize: 14, fontFamily: "Inter_400Regular", color: colors.light.mutedForeground },
  addBtn: {
    width: 32, height: 32, borderRadius: 16, backgroundColor: "#fff0f3",
    alignItems: "center", justifyContent: "center", borderWidth: 1.5, borderColor: colors.light.primary,
  },
  sectorRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 },
  removeBtn: { padding: 8 },
  scheduleCard: {
    backgroundColor: colors.light.background, borderRadius: 10, padding: 12,
    marginBottom: 10, borderWidth: 1, borderColor: colors.light.border,
  },
  scheduleRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 10 },
  schedTypePill: {
    paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20,
    backgroundColor: colors.light.muted,
  },
  schedTypePillActive: { backgroundColor: colors.light.primary },
  schedTypePillText: { fontSize: 12, fontFamily: "Inter_500Medium", color: colors.light.mutedForeground },
  schedTypePillTextActive: { color: "#fff" },
  schedDetailRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 10, flexWrap: "wrap" },
  schedLabel: { fontSize: 14, fontFamily: "Inter_400Regular", color: colors.light.foreground },
  smallInput: {
    width: 44, height: 34, borderWidth: 1, borderColor: colors.light.border, borderRadius: 8,
    textAlign: "center", fontSize: 15, fontFamily: "Inter_500Medium", color: colors.light.foreground,
  },
  nthBtn: {
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6, backgroundColor: colors.light.muted,
  },
  nthBtnActive: { backgroundColor: colors.light.accent },
  nthBtnText: { fontSize: 12, fontFamily: "Inter_500Medium", color: colors.light.mutedForeground },
  nthBtnTextActive: { color: "#fff" },
  schedCategoryRow: { flexDirection: "row", gap: 8 },
  categoryPill: { paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20 },
  categoryPillText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  schedSectorSection: { marginTop: 10 },
  schedSectorLabel: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    color: colors.light.mutedForeground,
    marginBottom: 6,
  },
  schedSectorRow: { flexDirection: "row", gap: 6 },
  schedSectorActive: { backgroundColor: "#8b5cf6" },
  schedSectorAllActive: { backgroundColor: colors.light.mutedForeground },
});

export default function GymManagementScreen() {
  const insets = useSafeAreaInsets();
  const { gyms, addGym, updateGym, deleteGym } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [editingGym, setEditingGym] = useState<Gym | undefined>();

  const handleAdd = () => {
    setEditingGym(undefined);
    setShowForm(true);
  };

  const handleEdit = (gym: Gym) => {
    setEditingGym(gym);
    setShowForm(true);
  };

  const handleDelete = (gym: Gym) => {
    Alert.alert("암장 삭제", `"${gym.name}"을 삭제하시겠습니까?`, [
      { text: "취소", style: "cancel" },
      {
        text: "삭제",
        style: "destructive",
        onPress: () => {
          deleteGym(gym.id);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        },
      },
    ]);
  };

  const handleSave = (gym: Gym) => {
    if (editingGym) updateGym(gym);
    else addGym(gym);
    setShowForm(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const isWeb = Platform.OS === "web";

  return (
    <View style={[styles.container, { paddingTop: isWeb ? 130 : insets.top + 75 }]}>
      <View style={styles.topRow}>
        <Text style={styles.title}>암장관리</Text>
        <TouchableOpacity style={styles.addButton} onPress={handleAdd} activeOpacity={0.8}>
          <Feather name="plus" size={18} color="#fff" />
          <Text style={styles.addButtonText}>암장등록</Text>
        </TouchableOpacity>
      </View>

      {gyms.length === 0 ? (
        <View style={styles.emptyState}>
          <Feather name="map-pin" size={48} color={colors.light.mutedForeground} />
          <Text style={styles.emptyTitle}>등록된 암장이 없습니다</Text>
          <Text style={styles.emptyDesc}>암장등록 버튼을 눌러 첫 암장을 등록해보세요</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
          {gyms.map((gym) => (
            <View key={gym.id} style={styles.gymCard}>
              <View style={[styles.gymColorBar, { backgroundColor: gym.color }]} />
              <View style={styles.gymInfo}>
                <Text style={styles.gymName}>{gym.name}</Text>
                {gym.address ? <Text style={styles.gymAddress}>{gym.address}</Text> : null}
                <View style={styles.gymMeta}>
                  <Text style={styles.gymMetaText}>{gym.sectors.length}개 섹터</Text>
                  <Text style={styles.gymMetaDot}>·</Text>
                  <Text style={styles.gymMetaText}>{gym.schedules.length}개 정기일정</Text>
                </View>
              </View>
              <View style={styles.gymActions}>
                <TouchableOpacity onPress={() => handleEdit(gym)} style={styles.actionBtn}>
                  <Feather name="edit-2" size={16} color={colors.light.accent} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDelete(gym)} style={styles.actionBtn}>
                  <Feather name="trash-2" size={16} color={colors.light.destructive} />
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </ScrollView>
      )}

      <Modal visible={showForm} animationType="slide" onRequestClose={() => setShowForm(false)}>
        <GymForm initial={editingGym} onSave={handleSave} onCancel={() => setShowForm(false)} />
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.light.background },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  title: { fontSize: 24, fontFamily: "Inter_700Bold", color: colors.light.foreground },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.light.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  addButtonText: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: "#fff" },
  emptyState: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12, paddingHorizontal: 40 },
  emptyTitle: { fontSize: 18, fontFamily: "Inter_600SemiBold", color: colors.light.foreground },
  emptyDesc: { fontSize: 14, fontFamily: "Inter_400Regular", color: colors.light.mutedForeground, textAlign: "center" },
  list: { paddingHorizontal: 16, gap: 12, paddingBottom: 20 },
  gymCard: {
    flexDirection: "row",
    backgroundColor: colors.light.card,
    borderRadius: colors.radius,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  gymColorBar: { width: 5 },
  gymInfo: { flex: 1, padding: 14 },
  gymName: { fontSize: 16, fontFamily: "Inter_700Bold", color: colors.light.foreground },
  gymAddress: { fontSize: 13, fontFamily: "Inter_400Regular", color: colors.light.mutedForeground, marginTop: 2 },
  gymMeta: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 6 },
  gymMetaText: { fontSize: 12, fontFamily: "Inter_400Regular", color: colors.light.mutedForeground },
  gymMetaDot: { color: colors.light.mutedForeground },
  gymActions: { flexDirection: "column", justifyContent: "center", paddingRight: 12, gap: 12 },
  actionBtn: { padding: 6 },
});
