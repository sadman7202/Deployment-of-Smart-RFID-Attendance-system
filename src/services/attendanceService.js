const crypto = require('crypto');
const fs = require('fs/promises');
const path = require('path');

function createAttendanceService(options = {}) {
  const appsScriptUrl = options.appsScriptUrl || '';
  const appsScriptReadQuery = String(options.appsScriptReadQuery || '').trim();
  const refreshIntervalMs = Number(options.refreshIntervalMs || 15000);
  const useLocalSampleData = Boolean(options.useLocalSampleData);
  const sampleDataFile = options.sampleDataFile || 'data/sample-attendance.json';
  const resolvedSampleDataFile = path.isAbsolute(sampleDataFile)
    ? sampleDataFile
    : path.join(process.cwd(), sampleDataFile);

  const state = {
    records: [],
    lastUpdatedAt: null,
    lastSignature: '',
    error: null,
    source: 'none',
    listeners: new Set(),
  };

  let refreshTimer = null;
  let refreshInFlight = null;

  async function refreshFromSource() {
    if (refreshInFlight) {
      return refreshInFlight;
    }

    refreshInFlight = (async () => {
      try {
        let payload;
        let source = 'google-apps-script';

        if (appsScriptUrl) {
          const sourceUrl = buildSourceUrl(appsScriptUrl, appsScriptReadQuery);
          const response = await fetch(sourceUrl, { method: 'GET' });
          if (!response.ok) {
            throw new Error(`Apps Script request failed with status ${response.status}`);
          }

          const rawText = await response.text();
          payload = safeParseJson(rawText);
          if (!payload) {
            throw new Error(
              `Apps Script did not return JSON. Response was: "${truncateText(rawText, 120)}". `
              + 'Your current URL appears to be write-only. Deploy a read endpoint and set APPS_SCRIPT_READ_QUERY if needed.'
            );
          }
        } else if (useLocalSampleData) {
          const fileContent = await fs.readFile(resolvedSampleDataFile, 'utf8');
          payload = JSON.parse(fileContent);
          source = 'local-sample-file';
        } else {
          throw new Error('GOOGLE_APPS_SCRIPT_URL is not configured and USE_LOCAL_SAMPLE_DATA is false.');
        }

        const records = normalizePayload(payload).map((record) => ({
          ...record,
          source,
        }));
        const signature = crypto.createHash('sha1').update(JSON.stringify(records)).digest('hex');

        state.error = null;
        state.source = source;
        state.records = records;
        state.lastUpdatedAt = new Date().toISOString();

        const changed = signature !== state.lastSignature;
        state.lastSignature = signature;

        if (changed) {
          notifyListeners(records);
        }

        return records;
      } catch (error) {
        state.error = error.message || 'Failed to refresh attendance data.';
        return state.records;
      } finally {
        refreshInFlight = null;
      }
    })();

    return refreshInFlight;
  }

  function startAutoRefresh() {
    if (refreshTimer) {
      return;
    }

    refreshFromSource();
    refreshTimer = setInterval(() => {
      refreshFromSource();
    }, refreshIntervalMs);
  }

  function stopAutoRefresh() {
    if (refreshTimer) {
      clearInterval(refreshTimer);
      refreshTimer = null;
    }
  }

  function getRecords(filters = {}) {
    const nameFilter = normalizeFilter(filters.name);
    const dateFilter = normalizeFilter(filters.date);
    const uidFilter = normalizeFilter(filters.uid);
    const searchFilter = normalizeFilter(filters.search);

    return state.records.filter((record) => {
      const matchesName = !nameFilter || record.studentName.toLowerCase().includes(nameFilter);
      const matchesDate = !dateFilter || record.date === dateFilter;
      const matchesUid = !uidFilter || record.uid.toLowerCase().includes(uidFilter);
      const matchesSearch = !searchFilter
        || record.studentName.toLowerCase().includes(searchFilter)
        || record.uid.toLowerCase().includes(searchFilter);

      return matchesName && matchesDate && matchesUid && matchesSearch;
    });
  }

  function getState() {
    return {
      records: state.records,
      lastUpdatedAt: state.lastUpdatedAt,
      error: state.error,
      total: state.records.length,
      source: state.source,
    };
  }

  function subscribe(listener) {
    state.listeners.add(listener);
    return () => state.listeners.delete(listener);
  }

  function notifyListeners(records) {
    for (const listener of state.listeners) {
      try {
        listener({
          type: 'update',
          records,
          lastUpdatedAt: state.lastUpdatedAt,
        });
      } catch (error) {
        // Ignore subscriber failures so one bad client does not stop updates.
      }
    }
  }

  return {
    refreshFromSource,
    startAutoRefresh,
    stopAutoRefresh,
    getRecords,
    getState,
    subscribe,
  };
}

function buildSourceUrl(baseUrl, readQuery) {
  if (!readQuery) {
    return baseUrl;
  }

  const hasQuery = baseUrl.includes('?');
  return `${baseUrl}${hasQuery ? '&' : '?'}${readQuery}`;
}

function safeParseJson(rawText) {
  try {
    return JSON.parse(rawText);
  } catch (error) {
    return null;
  }
}

function truncateText(text, maxLength) {
  const value = String(text || '');
  if (value.length <= maxLength) {
    return value;
  }
  return `${value.slice(0, maxLength)}...`;
}

function normalizePayload(payload) {
  const rawRecords = Array.isArray(payload)
    ? payload
    : Array.isArray(payload?.records)
      ? payload.records
      : Array.isArray(payload?.data)
        ? payload.data
        : Array.isArray(payload?.attendance)
          ? payload.attendance
          : Array.isArray(payload?.rows)
            ? payload.rows
            : [];

  return rawRecords
    .map(normalizeRecord)
    .filter(Boolean)
    .sort((left, right) => {
      const leftStamp = `${left.date} ${left.time}`;
      const rightStamp = `${right.date} ${right.time}`;
      return leftStamp < rightStamp ? 1 : leftStamp > rightStamp ? -1 : 0;
    });
}

function normalizeRecord(record) {
  if (!record || typeof record !== 'object') {
    return null;
  }

  const uid = readField(record, ['uid', 'UID', 'cardUid', 'cardUID', 'rfid', 'id']);
  const studentName = readField(record, ['studentName', 'student_name', 'name', 'Student Name', 'student']);
  const date = normalizeDate(readField(record, ['date', 'Date', 'scanDate']));
  const time = normalizeTime(readField(record, ['time', 'Time', 'scanTime']));

  if (!uid || !studentName || !date || !time) {
    return null;
  }

  return {
    uid: String(uid).trim(),
    studentName: String(studentName).trim(),
    date,
    time,
    source: record.source || 'google-sheets',
  };
}

function readField(record, keys) {
  for (const key of keys) {
    if (record[key] !== undefined && record[key] !== null && String(record[key]).trim() !== '') {
      return record[key];
    }
  }

  return '';
}

function normalizeFilter(value) {
  return String(value || '').trim().toLowerCase();
}

function normalizeDate(value) {
  if (!value) {
    return '';
  }

  const text = String(value).trim();
  if (!text) {
    return '';
  }

  const match = text.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (match) {
    return text;
  }

  const slashMatch = text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (slashMatch) {
    const [, month, day, year] = slashMatch;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }

  const parsedDate = new Date(text);
  if (!Number.isNaN(parsedDate.getTime())) {
    const year = parsedDate.getFullYear();
    const month = String(parsedDate.getMonth() + 1).padStart(2, '0');
    const day = String(parsedDate.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  return text;
}

function normalizeTime(value) {
  if (!value) {
    return '';
  }

  const text = String(value).trim();
  if (!text) {
    return '';
  }

  const timeMatch = text.match(/^(\d{1,2}):(\d{2})(?::\d{2})?\s*(AM|PM|am|pm)?$/);
  if (timeMatch) {
    let [, hours, minutes, suffix] = timeMatch;
    let numericHours = Number(hours);

    if (suffix) {
      const normalizedSuffix = suffix.toUpperCase();
      if (normalizedSuffix === 'PM' && numericHours < 12) {
        numericHours += 12;
      }
      if (normalizedSuffix === 'AM' && numericHours === 12) {
        numericHours = 0;
      }
      return `${String(numericHours).padStart(2, '0')}:${minutes}`;
    }

    return `${String(numericHours).padStart(2, '0')}:${minutes}`;
  }

  const parsedDate = new Date(text);
  if (!Number.isNaN(parsedDate.getTime())) {
    const hours = String(parsedDate.getHours()).padStart(2, '0');
    const minutes = String(parsedDate.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  }

  return text;
}

module.exports = {
  createAttendanceService,
  normalizePayload,
  normalizeRecord,
};