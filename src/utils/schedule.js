export async function fetchSubjectData(subjectCode) {
  const response = await fetch(
    `/api/subject/${encodeURIComponent(subjectCode)}`,
  );
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  const html = await response.text();
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  const rows = doc.querySelectorAll("#resulttable tbody tr");
  return Array.from(rows).map(parseTableRow).filter(Boolean);
}

export function parseTableRow(row) {
  if (!row) return null;

  const cells = row.querySelectorAll("td");
  if (cells.length < 6) return null;

  const time = cells[0].textContent.trim();
  const codeAndType = cells[1].textContent.trim();
  const title = cells[2].textContent.trim();
  const location = cells[3].textContent.trim();
  const instructor = cells[5].textContent.trim();

  // Extract type from code (e.g., "IP-18fWPEG-90 (lecture)" -> "lecture")
  const typeMatch = codeAndType.match(/\((.*?)\)$/);
  const type = typeMatch ? typeMatch[1] : "";

  return {
    time,
    title,
    type,
    location: location !== "-" ? location : "",
    instructor: instructor.trim(),
    code: codeAndType.split(" (")[0],
  };
}

export function parseTimeString(timeStr) {
  if (!timeStr || timeStr === "Weeks: ") return null;

  const dayTimeRegex =
    /(Monday|Tuesday|Wednesday|Thursday|Friday)\s+(\d{1,2}):(\d{2})-(\d{1,2}):(\d{2})/;
  const match = timeStr.match(dayTimeRegex);

  if (!match) {
    return null;
  }

  return {
    dayOfWeek: match[1],
    startTime: match[2].padStart(2, "0") + ":" + match[3],
    endTime: match[4].padStart(2, "0") + ":" + match[5],
  };
}

export function parseSubjectCodes(input) {
  return input
    .split(/[\s,]+/)
    .map((code) => code.trim())
    .filter(Boolean);
}

export function processSubjectCode(code) {
  const parts = code.split("-");
  if (parts.length > 1) parts.pop();
  return parts.join("-");
}

// Tanrend codes such as DEMO-1 are already base codes. Only strip a group
// suffix when the code contains at least three dash-separated segments.
export function getTanrendSubjectCode(code) {
  const parts = code.split("-");
  if (parts.length > 2) parts.pop();
  return parts.join("-");
}

export function createCalendarEvents(classes) {
  if (!Array.isArray(classes)) return [];

  return classes.flatMap((subjectClass) => {
    if (!subjectClass) return [];
    const time = parseTimeString(subjectClass.time);
    if (!time) return [];

    return [
      {
        title: `${subjectClass.title} (${subjectClass.type})`,
        dayOfWeek: time.dayOfWeek,
        startTime: time.startTime,
        endTime: time.endTime,
        description: `${subjectClass.code}\nInstructor: ${subjectClass.instructor}`,
        code: subjectClass.code,
        extendedProps: {
          location: subjectClass.location,
          type: subjectClass.type,
          instructor: subjectClass.instructor,
        },
        enabled: false,
      },
    ];
  });
}

function timeToMinutes(time) {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

export function checkTimeOverlap(first, second) {
  return (
    first.dayOfWeek === second.dayOfWeek &&
    timeToMinutes(first.startTime) < timeToMinutes(second.endTime) &&
    timeToMinutes(second.startTime) < timeToMinutes(first.endTime)
  );
}

function isLecture(event) {
  return (event.extendedProps?.type ?? event.type ?? "")
    .toLowerCase()
    .includes("lecture");
}

export function getConflictPairs(events, lectureExemption = false) {
  const conflicts = [];
  for (let first = 0; first < events.length; first += 1) {
    for (let second = first + 1; second < events.length; second += 1) {
      if (!checkTimeOverlap(events[first], events[second])) continue;
      if (
        lectureExemption &&
        (isLecture(events[first]) || isLecture(events[second]))
      )
        continue;
      conflicts.push({ event1: first, event2: second });
    }
  }
  return conflicts;
}

export function markConflicts(subjects, lectureExemption = false) {
  const enabledEvents = subjects.flatMap((subject) =>
    subject.events.filter((event) => event.enabled),
  );
  const conflictingEvents = new Set(
    getConflictPairs(enabledEvents, lectureExemption).flatMap(
      ({ event1, event2 }) => [enabledEvents[event1], enabledEvents[event2]],
    ),
  );

  return subjects.map((subject) => ({
    ...subject,
    events: subject.events.map((event) => ({
      ...event,
      hasConflict: conflictingEvents.has(event),
    })),
  }));
}

export function decodeSchedule(encodedSchedule) {
  try {
    const parts = atob(encodedSchedule).split("|");
    const lectureExemption = parts.pop() === "1";
    const fullCodes = parts.flatMap((section) => {
      const match = section.match(/^([^{}]+)\{(.*)\}$/);
      if (!match) return [];
      const [, prefix, contents] = match;
      return contents
        .split(",")
        .map((item) => (prefix === "OTHER" ? item : `${prefix}-${item}`));
    });

    return {
      baseCodes: [...new Set(fullCodes)].join(" "),
      fullCodes,
      lectureExemption,
    };
  } catch {
    return { baseCodes: "", fullCodes: [], lectureExemption: false };
  }
}

export function encodeSchedule(codes, lectureExemption = false) {
  const groups = new Map();
  for (const code of new Set(codes)) {
    const parts = code.split("-");
    const prefix = parts.length > 2 ? parts.shift() : "OTHER";
    const value = prefix === "OTHER" ? code : parts.join("-");
    groups.set(prefix, [...(groups.get(prefix) ?? []), value]);
  }

  const sections = [...groups]
    .sort(([prefix]) => (prefix === "OTHER" ? 1 : -1))
    .map(([prefix, values]) => `${prefix}{${values.join(",")}}`);
  return btoa(`${sections.join("|")}|${lectureExemption ? "1" : "0"}`);
}

/**
 * Get the date for a specific day of the current week in a timezone-safe manner.
 * Avoids using toISOString() which can cause date shifts near midnight in non-UTC timezones.
 *
 * @param {string} dayOfWeek - Day name: "Monday", "Tuesday", etc.
 * @returns {string} ISO date string in YYYY-MM-DD format
 */
export function getWeekDateForDay(dayOfWeek) {
  const dayMap = {
    Monday: 1,
    Tuesday: 2,
    Wednesday: 3,
    Thursday: 4,
    Friday: 5,
  };

  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth();
  const currentDate = today.getDate();
  const currentDay = today.getDay(); // 0 = Sunday, 1 = Monday, etc.

  // Calculate days to subtract to get to Monday (in local timezone)
  const daysToMonday = currentDay === 0 ? 6 : currentDay - 1;
  const mondayDate = currentDate - daysToMonday;

  // Calculate days to add from Monday
  const daysToAdd = dayMap[dayOfWeek] - 1;
  const finalDate = mondayDate + daysToAdd;

  // Create date object to handle month/year overflow correctly
  const eventDateObj = new Date(currentYear, currentMonth, finalDate);

  return formatDateToISO(eventDateObj);
}

/**
 * Get the date for a specific day of next week in a timezone-safe manner.
 *
 * @param {string} dayOfWeek - Day name: "Monday", "Tuesday", etc.
 * @returns {string} ISO date string in YYYY-MM-DD format
 */
export function getNextWeekDateForDay(dayOfWeek) {
  const dayMap = {
    Monday: 1,
    Tuesday: 2,
    Wednesday: 3,
    Thursday: 4,
    Friday: 5,
  };

  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth();
  const currentDate = today.getDate();
  const currentDay = today.getDay();

  // Calculate days until next Monday (ensure it's at least 7 if today is Monday)
  const daysUntilMonday = (8 - currentDay) % 7 || 7;
  const mondayDate = currentDate + daysUntilMonday;

  // Calculate days to add from Monday
  const daysToAdd = dayMap[dayOfWeek] - 1;
  const finalDate = mondayDate + daysToAdd;

  // Create date object to handle month/year overflow correctly
  const eventDateObj = new Date(currentYear, currentMonth, finalDate);

  return formatDateToISO(eventDateObj);
}

/**
 * Format a Date object to ISO string (YYYY-MM-DD) without timezone conversion.
 * This prevents the bug where toISOString() converts to UTC and shifts dates.
 *
 * @param {Date} date - Date object to format
 * @returns {string} ISO date string in YYYY-MM-DD format
 */
export function formatDateToISO(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Format a Date object to compact format (YYYYMMDD) for Google Calendar URLs.
 *
 * @param {Date} date - Date object to format
 * @returns {string} Compact date string in YYYYMMDD format
 */
export function formatDateToCompact(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}${month}${day}`;
}
