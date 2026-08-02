export const SCHEDULES_STORAGE_KEY = "scheduleManager";
export const DEFAULT_SCHEDULE_NAME = "Default schedule";

function createScheduleId() {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }
  return `schedule-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function readJson(storage, key, fallback) {
  try {
    const value = storage.getItem(key);
    return value === null ? fallback : JSON.parse(value);
  } catch {
    return fallback;
  }
}

function normalizeSchedule(schedule, fallbackName, makeId) {
  return {
    id: typeof schedule?.id === "string" && schedule.id ? schedule.id : makeId(),
    name:
      typeof schedule?.name === "string" && schedule.name.trim()
        ? schedule.name.trim()
        : fallbackName,
    subjects: Array.isArray(schedule?.subjects) ? schedule.subjects : [],
    lectureExemption: schedule?.lectureExemption === true,
  };
}

export function createEmptySchedule(name, makeId = createScheduleId) {
  return normalizeSchedule({}, name, makeId);
}

export function saveScheduleStore(storage, store) {
  storage.setItem(SCHEDULES_STORAGE_KEY, JSON.stringify(store));
  return store;
}

export function loadScheduleStore(storage, makeId = createScheduleId) {
  const stored = readJson(storage, SCHEDULES_STORAGE_KEY, null);
  if (stored && Array.isArray(stored.schedules) && stored.schedules.length > 0) {
    const schedules = stored.schedules.map((schedule, index) =>
      normalizeSchedule(schedule, `Schedule ${index + 1}`, makeId)
    );
    const activeScheduleId = schedules.some(
      (schedule) => schedule.id === stored.activeScheduleId
    )
      ? stored.activeScheduleId
      : schedules[0].id;
    const normalized = { version: 1, activeScheduleId, schedules };
    if (JSON.stringify(normalized) !== JSON.stringify(stored)) {
      saveScheduleStore(storage, normalized);
    }
    return normalized;
  }

  const legacySubjects = readJson(storage, "savedSubjects", []);
  const legacyExemption = readJson(storage, "lectureExemption", false);
  const schedule = normalizeSchedule(
    {
      name: DEFAULT_SCHEDULE_NAME,
      subjects: Array.isArray(legacySubjects) ? legacySubjects : [],
      lectureExemption: legacyExemption === true,
    },
    DEFAULT_SCHEDULE_NAME,
    makeId
  );
  return saveScheduleStore(storage, {
    version: 1,
    activeScheduleId: schedule.id,
    schedules: [schedule],
  });
}

export function getActiveSchedule(store) {
  return (
    store.schedules.find(
      (schedule) => schedule.id === store.activeScheduleId
    ) ?? store.schedules[0]
  );
}

export function updateActiveSchedule(store, updates) {
  return {
    ...store,
    schedules: store.schedules.map((schedule) =>
      schedule.id === store.activeScheduleId
        ? { ...schedule, ...updates, id: schedule.id }
        : schedule
    ),
  };
}

export function addSchedule(
  store,
  { name, subjects = [], lectureExemption = false } = {},
  makeId = createScheduleId
) {
  const schedule = normalizeSchedule(
    { name, subjects, lectureExemption },
    getUniqueScheduleName(store, "New schedule"),
    makeId
  );
  return {
    ...store,
    activeScheduleId: schedule.id,
    schedules: [...store.schedules, schedule],
  };
}

export function renameSchedule(store, scheduleId, name) {
  const trimmedName = name.trim();
  if (!trimmedName) return store;
  return {
    ...store,
    schedules: store.schedules.map((schedule) =>
      schedule.id === scheduleId ? { ...schedule, name: trimmedName } : schedule
    ),
  };
}

export function removeSchedule(store, scheduleId) {
  if (store.schedules.length === 1) return store;
  const removedIndex = store.schedules.findIndex(
    (schedule) => schedule.id === scheduleId
  );
  if (removedIndex === -1) return store;

  const schedules = store.schedules.filter(
    (schedule) => schedule.id !== scheduleId
  );
  const activeScheduleId =
    store.activeScheduleId === scheduleId
      ? schedules[Math.min(removedIndex, schedules.length - 1)].id
      : store.activeScheduleId;
  return { ...store, activeScheduleId, schedules };
}

export function activateSchedule(store, scheduleId) {
  if (!store.schedules.some((schedule) => schedule.id === scheduleId)) {
    return store;
  }
  return { ...store, activeScheduleId: scheduleId };
}

export function getUniqueScheduleName(store, preferredName) {
  const baseName = preferredName.trim() || "Schedule";
  const existingNames = new Set(store.schedules.map((schedule) => schedule.name));
  if (!existingNames.has(baseName)) return baseName;
  let suffix = 2;
  while (existingNames.has(`${baseName} ${suffix}`)) suffix += 1;
  return `${baseName} ${suffix}`;
}
