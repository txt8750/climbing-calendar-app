import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";

export type DayOfWeek = "월" | "화" | "수" | "목" | "금" | "토" | "일";

export interface OperatingHour {
  open: string;
  close: string;
}

export interface OperatingHours {
  type: "individual" | "weekday_weekend";
  individual: Record<DayOfWeek, OperatingHour>;
  weekday: OperatingHour;
  weekend: OperatingHour;
}

export interface ScheduleEntry {
  id: string;
  type: "date" | "nth_weekday" | "weekly";
  dayOfMonth?: number;
  nth?: number;
  weekday?: DayOfWeek;
  intervalWeeks?: number; // N주마다 반복 (예: 4주)
  weekdays?: DayOfWeek[]; // 반복할 요일들 (예: ["화", "수"])
  category: "휴관" | "세팅";
  sectorIds?: string[];
}

export interface Gym {
  id: string;
  name: string;
  address: string;
  operatingHours: OperatingHours;
  sectorMapUri?: string;
  gradeImageUri?: string;
  sectors: string[];
  schedules: ScheduleEntry[];
  grades: string[];
  applicationLink?: string;
  instagramLink?: string;
  color: string;
  createdAt: string;
}

export interface CalendarEntry {
  id: string;
  date: string;
  type: "visit" | "closed" | "setting";
  gymId: string;
  sectorIds?: string[];
  note?: string;
}

export interface RestPeriod {
  id: string;
  startDate: string;
  endDate: string;
  excluded: boolean;
}

export interface ClimbingStats {
  startDate?: string;
  restPeriods: RestPeriod[];
}

export type MainScreen = "calendar" | "gymManagement" | "dashboard";

interface AppContextType {
  gyms: Gym[];
  calendarEntries: CalendarEntry[];
  stats: ClimbingStats;
  mainScreen: MainScreen;
  addGym: (gym: Gym) => void;
  updateGym: (gym: Gym) => void;
  deleteGym: (gymId: string) => void;
  addCalendarEntry: (entry: CalendarEntry) => void;
  deleteCalendarEntry: (entryId: string) => void;
  updateStats: (stats: ClimbingStats) => void;
  setMainScreen: (screen: MainScreen) => void;
  getEntriesForDate: (date: string) => CalendarEntry[];
  getGymById: (gymId: string) => Gym | undefined;
  getAutoScheduleEntries: (gymId: string, year: number, month: number) => { date: string; category: "휴관" | "세팅"; sectorIds?: string[] }[];
}

const AppContext = createContext<AppContextType | null>(null);

const DAYS: DayOfWeek[] = ["월", "화", "수", "목", "금", "토", "일"];

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [gyms, setGyms] = useState<Gym[]>([]);
  const [calendarEntries, setCalendarEntries] = useState<CalendarEntry[]>([]);
  const [stats, setStats] = useState<ClimbingStats>({ restPeriods: [] });
  const [mainScreen, setMainScreenState] = useState<MainScreen>("calendar");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [gymsData, entriesData, statsData, mainScreenData] = await Promise.all([
        AsyncStorage.getItem("gyms"),
        AsyncStorage.getItem("calendarEntries"),
        AsyncStorage.getItem("stats"),
        AsyncStorage.getItem("mainScreen"),
      ]);
      if (gymsData) setGyms(JSON.parse(gymsData));
      if (entriesData) setCalendarEntries(JSON.parse(entriesData));
      if (statsData) setStats(JSON.parse(statsData));
      if (mainScreenData) setMainScreenState(JSON.parse(mainScreenData));
    } catch {}
  };

  const saveGyms = async (data: Gym[]) => {
    await AsyncStorage.setItem("gyms", JSON.stringify(data));
  };
  const saveEntries = async (data: CalendarEntry[]) => {
    await AsyncStorage.setItem("calendarEntries", JSON.stringify(data));
  };
  const saveStats = async (data: ClimbingStats) => {
    await AsyncStorage.setItem("stats", JSON.stringify(data));
  };

  const addGym = useCallback((gym: Gym) => {
    setGyms((prev) => {
      const next = [...prev, gym];
      saveGyms(next);
      return next;
    });
  }, []);

  const updateGym = useCallback((gym: Gym) => {
    setGyms((prev) => {
      const oldGym = prev.find((g) => g.id === gym.id);

      // 섹터 이름 변경 감지 (인덱스 기준)
      const renameMap: Record<string, string> = {};
      if (oldGym) {
        const minLen = Math.min(oldGym.sectors.length, gym.sectors.length);
        for (let i = 0; i < minLen; i++) {
          const oldName = oldGym.sectors[i];
          const newName = gym.sectors[i];
          if (oldName && newName && oldName !== newName) {
            renameMap[oldName] = newName;
          }
        }
      }

      const applyRename = (ids?: string[]) =>
        ids ? ids.map((id) => renameMap[id] ?? id) : ids;

      let updatedGym = gym;
      if (Object.keys(renameMap).length > 0) {
        // 암장 자동 스케줄의 sectorIds도 업데이트
        updatedGym = {
          ...gym,
          schedules: gym.schedules.map((s) => ({
            ...s,
            sectorIds: applyRename(s.sectorIds),
          })),
        };

        // 캘린더 항목의 sectorIds 업데이트
        setCalendarEntries((entries) => {
          const updated = entries.map((entry) => {
            if (entry.gymId !== gym.id || !entry.sectorIds) return entry;
            return { ...entry, sectorIds: applyRename(entry.sectorIds) };
          });
          saveEntries(updated);
          return updated;
        });
      }

      const next = prev.map((g) => (g.id === gym.id ? updatedGym : g));
      saveGyms(next);
      return next;
    });
  }, []);

  const deleteGym = useCallback((gymId: string) => {
    setGyms((prev) => {
      const next = prev.filter((g) => g.id !== gymId);
      saveGyms(next);
      return next;
    });
    setCalendarEntries((prev) => {
      const next = prev.filter((e) => e.gymId !== gymId);
      saveEntries(next);
      return next;
    });
  }, []);

  const addCalendarEntry = useCallback((entry: CalendarEntry) => {
    setCalendarEntries((prev) => {
      const next = [...prev, entry];
      saveEntries(next);
      return next;
    });
  }, []);

  const deleteCalendarEntry = useCallback((entryId: string) => {
    setCalendarEntries((prev) => {
      const next = prev.filter((e) => e.id !== entryId);
      saveEntries(next);
      return next;
    });
  }, []);

  const updateStats = useCallback((newStats: ClimbingStats) => {
    setStats(newStats);
    saveStats(newStats);
  }, []);

  const setMainScreen = useCallback((screen: MainScreen) => {
    setMainScreenState(screen);
    AsyncStorage.setItem("mainScreen", JSON.stringify(screen));
  }, []);

  const getEntriesForDate = useCallback(
    (date: string) => calendarEntries.filter((e) => e.date === date),
    [calendarEntries]
  );

  const getGymById = useCallback((gymId: string) => gyms.find((g) => g.id === gymId), [gyms]);

  const getAutoScheduleEntries = useCallback(
    (gymId: string, year: number, month: number) => {
      const gym = gyms.find((g) => g.id === gymId);
      if (!gym) return [];

      const results: { date: string; category: "휴관" | "세팅"; sectorIds?: string[] }[] = [];
      const daysInMonth = new Date(year, month, 0).getDate();

      for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
        const dateObj = new Date(year, month - 1, day);
        const jsDay = dateObj.getDay();
        const dayIndex = jsDay === 0 ? 6 : jsDay - 1;
        const dayName = DAYS[dayIndex];

        for (const schedule of gym.schedules) {
          if (schedule.type === "date" && schedule.dayOfMonth === day) {
            results.push({ date: dateStr, category: schedule.category, sectorIds: schedule.sectorIds });
          } else if (schedule.type === "nth_weekday" && schedule.weekday === dayName) {
            const nthInMonth = Math.ceil(day / 7);
            if (nthInMonth === schedule.nth) {
              results.push({ date: dateStr, category: schedule.category, sectorIds: schedule.sectorIds });
            }
          } else if (schedule.type === "weekly" && schedule.weekdays && schedule.intervalWeeks) {
            if (schedule.weekdays.includes(dayName)) {
              let firstMatchingDay = -1;
              for (let d = 1; d <= 7; d++) {
                const checkObj = new Date(year, month - 1, d);
                const checkDay = checkObj.getDay();
                const checkDayIndex = checkDay === 0 ? 6 : checkDay - 1;
                if (DAYS[checkDayIndex] === schedule.weekdays[0]) {
                  firstMatchingDay = d;
                  break;
                }
              }
              if (firstMatchingDay > 0) {
                const weeksSinceFirst = Math.floor((day - firstMatchingDay) / 7);
                if (weeksSinceFirst >= 0 && weeksSinceFirst % schedule.intervalWeeks === 0) {
                  results.push({ date: dateStr, category: schedule.category, sectorIds: schedule.sectorIds });
                }
              }
            }
          }
        }
      }

      return results;
    },
    [gyms]
  );

  return (
    <AppContext.Provider
      value={{
        gyms,
        calendarEntries,
        stats,
        mainScreen,
        addGym,
        updateGym,
        deleteGym,
        addCalendarEntry,
        deleteCalendarEntry,
        updateStats,
        setMainScreen,
        getEntriesForDate,
        getGymById,
        getAutoScheduleEntries,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
