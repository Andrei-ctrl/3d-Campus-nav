import * as XLSX from 'xlsx';
import { expandCourseAliases } from './courseAliasUtils.js';
import timetableAssetUrl from '../timetable_en_24-05-2026_23-52-48.xlsx?url';

const SCHEDULE_LOCATION_PATTERN =
  /\(?\s*PER\s*(\d+)\s*,\s*(?:Room|Salle)\s*([A-Za-z]?\d+)\s*\)?/gi;

const TIMETABLE_ROOM_OVERRIDES = {
  'PER22:002': 'PER22_AUDITORIUM_JOSEPH_DEISS',
  'PER17:001': 'PER17_001',
  'PER17:010': 'PER17_MICROSCOPES_010',
  'PER17:036': 'PER17_REUNION_036'
};

function normalizeRoomNumber(roomNumber) {
  return String(roomNumber || '')
    .trim()
    .toUpperCase()
    .replace(/\s+/g, '');
}

function buildingNumberToId(buildingNumber) {
  return `PER${buildingNumber}`;
}

export function parseScheduleLocations(scheduleText) {
  const locations = [];

  if (!scheduleText) {
    return locations;
  }

  const text = String(scheduleText);
  let match = SCHEDULE_LOCATION_PATTERN.exec(text);

  while (match) {
    locations.push({
      buildingId: buildingNumberToId(match[1]),
      roomNumber: normalizeRoomNumber(match[2])
    });
    match = SCHEDULE_LOCATION_PATTERN.exec(text);
  }

  SCHEDULE_LOCATION_PATTERN.lastIndex = 0;
  return locations;
}

export function buildRoomLookup(rooms = []) {
  const byDestinationId = new Map();
  const byBuildingRoom = new Map();

  rooms.forEach((room) => {
    byDestinationId.set(room.id, room);

    const suffix = room.id.startsWith(`${room.buildingId}_`)
      ? room.id.slice(room.buildingId.length + 1)
      : room.name;

    byBuildingRoom.set(`${room.buildingId}:${normalizeRoomNumber(suffix)}`, room.id);

    const numericMatch = String(room.name).match(/(\d+)/);
    if (numericMatch) {
      byBuildingRoom.set(`${room.buildingId}:${normalizeRoomNumber(numericMatch[1])}`, room.id);
    }
  });

  return { byDestinationId, byBuildingRoom };
}

export function resolveTimetableRoomId(buildingId, roomNumber, roomLookup) {
  const normalizedRoom = normalizeRoomNumber(roomNumber);
  const overrideKey = `${buildingId}:${normalizedRoom}`;

  if (TIMETABLE_ROOM_OVERRIDES[overrideKey]) {
    return TIMETABLE_ROOM_OVERRIDES[overrideKey];
  }

  return roomLookup.byBuildingRoom.get(overrideKey) || null;
}

function findHeaderRowIndex(rows) {
  return rows.findIndex((row) =>
    row.some((cell) => String(cell).trim().toLowerCase() === 'long title')
  );
}

function findColumnIndex(headerRow, matchers) {
  for (const matcher of matchers) {
    const index = headerRow.findIndex((cell) => matcher(String(cell || '').trim()));

    if (index >= 0) {
      return index;
    }
  }

  return -1;
}

export function parseTimetableWorkbook(workbook, rooms = []) {
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
  const headerIndex = findHeaderRowIndex(rows);

  if (headerIndex < 0) {
    throw new Error('Timetable sheet is missing a "Long title" header row.');
  }

  const headerRow = rows[headerIndex];
  const columns = {
    id: findColumnIndex(headerRow, [
      (value) => value.toLowerCase() === 'id'
    ]),
    code: findColumnIndex(headerRow, [
      (value) => value.toLowerCase() === 'excel.code',
      (value) => value.toLowerCase().includes('code')
    ]),
    title: findColumnIndex(headerRow, [
      (value) => value.toLowerCase() === 'long title'
    ]),
    schedule: findColumnIndex(headerRow, [
      (value) => value.toLowerCase() === 'schedule'
    ])
  };

  if (columns.title < 0 || columns.schedule < 0) {
    throw new Error('Timetable sheet is missing required course columns.');
  }

  const roomLookup = buildRoomLookup(rooms);
  const courses = [];
  const courseAliasesByRoomId = {};
  const unmappedCourses = [];

  for (let rowIndex = headerIndex + 1; rowIndex < rows.length; rowIndex += 1) {
    const row = rows[rowIndex];
    const title = String(row[columns.title] || '').trim();
    const schedule = String(row[columns.schedule] || '').trim();
    const courseCode = columns.code >= 0 ? String(row[columns.code] || '').trim() : '';
    const courseId = columns.id >= 0 ? row[columns.id] : null;

    if (!title) {
      continue;
    }

    const locations = parseScheduleLocations(schedule);
    const aliases = expandCourseAliases([title, courseCode].filter(Boolean));
    const mappedRoomIds = new Set();
    const unresolvedLocations = [];

    locations.forEach((location) => {
      const roomId = resolveTimetableRoomId(
        location.buildingId,
        location.roomNumber,
        roomLookup
      );

      if (roomId) {
        mappedRoomIds.add(roomId);

        if (!courseAliasesByRoomId[roomId]) {
          courseAliasesByRoomId[roomId] = [];
        }

        courseAliasesByRoomId[roomId].push(...aliases);
      } else {
        unresolvedLocations.push(location);
      }
    });

    const courseEntry = {
      courseId,
      courseCode,
      title,
      schedule,
      locations,
      roomIds: [...mappedRoomIds],
      aliases
    };

    courses.push(courseEntry);

    if (locations.length === 0) {
      unmappedCourses.push({
        ...courseEntry,
        reason: 'No classroom location in schedule'
      });
    } else if (mappedRoomIds.size === 0) {
      unmappedCourses.push({
        ...courseEntry,
        reason: 'Classroom not mapped in campus model',
        unresolvedLocations
      });
    } else if (unresolvedLocations.length > 0) {
      unmappedCourses.push({
        ...courseEntry,
        reason: 'Some schedule locations are not mapped in campus model',
        unresolvedLocations
      });
    }
  }

  Object.keys(courseAliasesByRoomId).forEach((roomId) => {
    courseAliasesByRoomId[roomId] = [...new Set(courseAliasesByRoomId[roomId])];
  });

  return {
    sheetName,
    courseCount: courses.length,
    mappedCourseCount: courses.filter((course) => course.roomIds.length > 0).length,
    courses,
    courseAliasesByRoomId,
    unmappedCourses
  };
}

export async function loadCampusTimetable(rooms = [], assetUrl = timetableAssetUrl) {
  const response = await fetch(assetUrl);

  if (!response.ok) {
    throw new Error(`Failed to fetch timetable file (${response.status}).`);
  }

  const buffer = await response.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array' });

  return parseTimetableWorkbook(workbook, rooms);
}

export { timetableAssetUrl as TIMETABLE_ASSET_URL };
