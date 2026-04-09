const state = {
  records: [],
  filters: {
    search: '',
    date: '',
  },
  lastScannedUid: '',
  eventSource: null,
  fallbackTimer: null,
};

const attendanceBody = document.getElementById('attendanceBody');
const totalCount = document.getElementById('totalCount');
const visibleCount = document.getElementById('visibleCount');
const lastScannedName = document.getElementById('lastScannedName');
const lastUpdatedText = document.getElementById('lastUpdatedText');
const connectionStatus = document.getElementById('connectionStatus');
const searchInput = document.getElementById('searchInput');
const dateInput = document.getElementById('dateInput');
const refreshButton = document.getElementById('refreshButton');
const logoutButton = document.getElementById('logoutButton');

searchInput.addEventListener('input', (event) => {
  state.filters.search = event.target.value.trim();
  renderRecords();
});

dateInput.addEventListener('change', (event) => {
  state.filters.date = event.target.value;
  renderRecords();
});

refreshButton.addEventListener('click', () => {
  loadRecords();
});

if (logoutButton) {
  logoutButton.addEventListener('click', async () => {
    await fetch('/auth/logout', { method: 'POST' });
    window.location.href = '/login';
  });
}

function buildQueryString() {
  return '';
}

async function loadRecords() {
  connectionStatus.textContent = 'Syncing...';

  try {
    const response = await fetch('/attendance');
    if (!response.ok) {
      if (response.status === 401) {
        window.location.href = '/login';
        return;
      }
      throw new Error(`Request failed with status ${response.status}`);
    }

    const payload = await response.json();
    state.records = Array.isArray(payload.records) ? payload.records : [];
    state.lastScannedUid = state.records[0]?.uid || '';
    totalCount.textContent = String(payload.allRecords ?? state.records.length);
    visibleCount.textContent = String(state.records.length);
    lastUpdatedText.textContent = payload.lastUpdatedAt
      ? `Last updated ${formatDateTime(payload.lastUpdatedAt)}`
      : 'No update time available';
    connectionStatus.textContent = payload.error ? 'Needs attention' : 'Connected';
    connectionStatus.style.color = payload.error ? '#991b1b' : 'var(--brand)';
    lastScannedName.textContent = state.records[0]
      ? `${state.records[0].studentName} (${state.records[0].uid})`
      : '-';

    renderRecords();
  } catch (error) {
    connectionStatus.textContent = 'Offline';
    connectionStatus.style.color = '#991b1b';
    lastUpdatedText.textContent = error.message;
    renderError(error.message);
  }
}

async function setupAuthState() {
  try {
    const response = await fetch('/auth/status');
    if (!response.ok) {
      return;
    }

    const payload = await response.json();
    if (payload.authEnabled && logoutButton) {
      logoutButton.hidden = false;
    }
  } catch (error) {
    // Ignore auth status fetch errors. The app can still load data normally.
  }
}

function renderRecords() {
  const filtered = applyClientFilters(state.records);
  visibleCount.textContent = String(filtered.length);

  if (!filtered.length) {
    attendanceBody.innerHTML = `
      <tr>
        <td colspan="4" class="empty-state">No attendance records match your filters.</td>
      </tr>
    `;
    return;
  }

  attendanceBody.innerHTML = filtered.map((record) => {
    const isLatest = record.uid === state.lastScannedUid;
    return `
      <tr class="${isLatest ? 'row-highlight' : ''}">
        <td>${escapeHtml(record.uid)}</td>
        <td>${escapeHtml(record.studentName)}</td>
        <td>${escapeHtml(record.date)}</td>
        <td>${escapeHtml(record.time)}</td>
      </tr>
    `;
  }).join('');
}

function renderError(message) {
  attendanceBody.innerHTML = `
    <tr>
      <td colspan="4" class="empty-state error-state">${escapeHtml(message)}</td>
    </tr>
  `;
}

function applyClientFilters(records) {
  const search = state.filters.search.toLowerCase();
  const date = state.filters.date;

  return records.filter((record) => {
    const matchesSearch = !search
      || record.studentName.toLowerCase().includes(search)
      || record.uid.toLowerCase().includes(search);
    const matchesDate = !date || record.date === date;
    return matchesSearch && matchesDate;
  });
}

function setupLiveUpdates() {
  if (state.eventSource) {
    state.eventSource.close();
  }

  try {
    state.eventSource = new EventSource('/events');
    connectionStatus.textContent = 'Connected';
    connectionStatus.style.color = 'var(--brand)';

    state.eventSource.addEventListener('update', () => {
      loadRecords();
    });

    state.eventSource.onerror = () => {
      connectionStatus.textContent = 'Reconnecting...';
      connectionStatus.style.color = '#92400e';
      if (state.fallbackTimer) {
        return;
      }
      state.fallbackTimer = setInterval(() => {
        loadRecords();
      }, 30000);
    };
  } catch (error) {
    connectionStatus.textContent = 'Polling mode';
    connectionStatus.style.color = '#92400e';
    state.fallbackTimer = setInterval(() => {
      loadRecords();
    }, 30000);
  }
}

function formatDateTime(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleString();
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

setupAuthState();
setupLiveUpdates();
loadRecords();