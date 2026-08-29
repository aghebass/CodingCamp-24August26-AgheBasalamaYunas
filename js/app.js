/* ============================================================
   Life Dashboard — app.js
   Features: Clock/Greeting, Custom Name, Light/Dark Theme,
             Focus Timer (custom duration), To-Do List, Quick Links
   Storage: localStorage only — no backend
   ============================================================ */

'use strict';

/* ============================================================
   UTILITY HELPERS
   ============================================================ */

/**
 * Pad a number to 2 digits, e.g. 5 → "05"
 * @param {number} n
 * @returns {string}
 */
function pad(n) {
  return String(n).padStart(2, '0');
}

/**
 * Generate a short unique id (good enough for client-side keys)
 * @returns {string}
 */
function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

/**
 * Sanitise a string so it can be safely set as textContent
 * @param {string} str
 * @returns {string}
 */
function sanitise(str) {
  return String(str).trim();
}

/* ============================================================
   1. LIGHT / DARK MODE
   ============================================================ */

const STORAGE_THEME_KEY = 'dashboard_theme';

const htmlEl       = document.documentElement;      // <html data-theme="">
const themeToggle  = document.getElementById('theme-toggle');
const themeIcon    = document.getElementById('theme-icon');
const themeLabel   = document.getElementById('theme-label');

/**
 * Apply a theme ('dark' | 'light') and persist it.
 * @param {string} theme
 */
function applyTheme(theme) {
  htmlEl.setAttribute('data-theme', theme);
  localStorage.setItem(STORAGE_THEME_KEY, theme);

  if (theme === 'light') {
    themeIcon.textContent  = '🌙';
    themeLabel.textContent = 'Dark Mode';
  } else {
    themeIcon.textContent  = '☀️';
    themeLabel.textContent = 'Light Mode';
  }
}

/** Toggle between dark and light. */
function toggleTheme() {
  const current = htmlEl.getAttribute('data-theme') || 'dark';
  applyTheme(current === 'dark' ? 'light' : 'dark');
}

// Load saved theme (default: dark)
applyTheme(localStorage.getItem(STORAGE_THEME_KEY) || 'dark');
themeToggle.addEventListener('click', toggleTheme);

/* ============================================================
   2. CLOCK & GREETING (with custom name)
   ============================================================ */

const STORAGE_NAME_KEY = 'dashboard_username';

const greetingEl      = document.getElementById('greeting');
const dateDisplayEl   = document.getElementById('date-display');
const clockEl         = document.getElementById('clock');

// Name elements
const nameDisplayEl   = document.getElementById('name-display');
const nameDisplayRow  = document.getElementById('name-display-row');
const nameInputRow    = document.getElementById('name-input-row');
const nameInputEl     = document.getElementById('name-input');
const nameEditBtn     = document.getElementById('name-edit-btn');
const nameSaveBtn     = document.getElementById('name-save-btn');
const nameCancelBtn   = document.getElementById('name-cancel-btn');

const DAY_NAMES   = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const MONTH_NAMES = ['January','February','March','April','May','June',
                     'July','August','September','October','November','December'];

/** @type {string} */
let userName = '';

/**
 * Return the greeting phrase based on the current hour.
 * @param {number} hour
 * @param {string} name  — optional custom name
 * @returns {string}
 */
function getGreeting(hour, name) {
  const suffix = name ? `, ${name}!` : '!';
  if (hour >= 5  && hour < 12) return `Good Morning${suffix} ☀️`;
  if (hour >= 12 && hour < 17) return `Good Afternoon${suffix} 🌤️`;
  if (hour >= 17 && hour < 21) return `Good Evening${suffix} 🌆`;
  return `Good Night${suffix} 🌙`;
}

/** Update clock, greeting, and date every second. */
function tickClock() {
  const now = new Date();
  const h   = now.getHours();
  const m   = now.getMinutes();
  const s   = now.getSeconds();

  // Clock
  clockEl.textContent = `${pad(h)}:${pad(m)}:${pad(s)}`;

  // Greeting (includes name if set)
  const greeting = getGreeting(h, userName);
  if (greetingEl.textContent !== greeting) {
    greetingEl.textContent = greeting;
  }

  // Date string  e.g. "Saturday, August 29, 2026"
  const dateStr = `${DAY_NAMES[now.getDay()]}, ${MONTH_NAMES[now.getMonth()]} ${now.getDate()}, ${now.getFullYear()}`;
  if (dateDisplayEl.textContent !== dateStr) {
    dateDisplayEl.textContent = dateStr;
  }
}

/** Load the stored name and show it. */
function loadName() {
  userName = sanitise(localStorage.getItem(STORAGE_NAME_KEY) || '');
  nameDisplayEl.textContent = userName;
}

/** Show the name edit field. */
function showNameInput() {
  nameDisplayRow.hidden = true;
  nameInputRow.hidden   = false;
  nameInputEl.value = userName;
  nameInputEl.focus();
  nameInputEl.select();
}

/** Hide the name edit field. */
function hideNameInput() {
  nameDisplayRow.hidden = false;
  nameInputRow.hidden   = true;
}

/** Save the custom name. */
function saveName() {
  const name = sanitise(nameInputEl.value);
  userName = name;
  localStorage.setItem(STORAGE_NAME_KEY, name);
  nameDisplayEl.textContent = name;
  hideNameInput();
  // Force greeting refresh immediately
  greetingEl.textContent = getGreeting(new Date().getHours(), userName);
}

nameEditBtn.addEventListener('click', showNameInput);
nameSaveBtn.addEventListener('click', saveName);
nameCancelBtn.addEventListener('click', hideNameInput);
nameInputEl.addEventListener('keydown', e => {
  if (e.key === 'Enter')  saveName();
  if (e.key === 'Escape') hideNameInput();
});

loadName();
tickClock();
setInterval(tickClock, 1000);

/* ============================================================
   3. FOCUS TIMER  (custom duration)
   ============================================================ */

const STORAGE_SESSIONS_KEY   = 'dashboard_sessions';
const STORAGE_SESSION_DATE   = 'dashboard_session_date';
const STORAGE_DURATION_KEY   = 'dashboard_timer_duration'; // minutes

const timerMinutesEl    = document.getElementById('timer-minutes');
const timerSecondsEl    = document.getElementById('timer-seconds');
const timerStatusEl     = document.getElementById('timer-status');
const timerStartBtn     = document.getElementById('timer-start');
const timerStopBtn      = document.getElementById('timer-stop');
const timerResetBtn     = document.getElementById('timer-reset');
const sessionCountEl    = document.getElementById('session-count');
const sessionPluralEl   = document.getElementById('session-plural');
const durationInputEl   = document.getElementById('timer-duration-input');
const timerSetBtn       = document.getElementById('timer-set-btn');

/** Duration in seconds (derived from the saved/default minutes value). */
let timerDuration   = 25 * 60;
let timeRemaining   = timerDuration;
let timerInterval   = null;
let timerIsRunning  = false;

/** Render timeRemaining into the two span elements. */
function renderTimer() {
  const mins = Math.floor(timeRemaining / 60);
  const secs = timeRemaining % 60;
  timerMinutesEl.textContent = pad(mins);
  timerSecondsEl.textContent = pad(secs);
}

/** Load and apply the saved duration preference. */
function loadDuration() {
  const saved = parseInt(localStorage.getItem(STORAGE_DURATION_KEY) || '25', 10);
  const mins  = Math.min(120, Math.max(1, saved));
  timerDuration    = mins * 60;
  timeRemaining    = timerDuration;
  durationInputEl.value = mins;
  renderTimer();
}

/** Apply a new duration from the input field. */
function applyDuration() {
  if (timerIsRunning) return; // don't change while running
  let mins = parseInt(durationInputEl.value, 10);
  if (isNaN(mins) || mins < 1)   mins = 1;
  if (mins > 120)                mins = 120;
  durationInputEl.value = mins;
  timerDuration = mins * 60;
  timeRemaining = timerDuration;
  localStorage.setItem(STORAGE_DURATION_KEY, String(mins));
  renderTimer();
  timerStatusEl.textContent = `Timer set to ${mins} minute${mins !== 1 ? 's' : ''}. Ready!`;
}

/** Lock/unlock the duration controls while timer is active. */
function setDurationControlsLocked(locked) {
  durationInputEl.disabled = locked;
  timerSetBtn.disabled     = locked;
}

/** Load session count from localStorage, reset if it's a new day. */
function loadSessions() {
  const today      = new Date().toDateString();
  const storedDate = localStorage.getItem(STORAGE_SESSION_DATE);

  if (storedDate !== today) {
    localStorage.setItem(STORAGE_SESSION_DATE, today);
    localStorage.setItem(STORAGE_SESSIONS_KEY, '0');
  }

  const count = parseInt(localStorage.getItem(STORAGE_SESSIONS_KEY) || '0', 10);
  renderSessionCount(count);
}

/** Increment session count and persist. */
function incrementSessions() {
  const count = parseInt(localStorage.getItem(STORAGE_SESSIONS_KEY) || '0', 10) + 1;
  localStorage.setItem(STORAGE_SESSIONS_KEY, String(count));
  renderSessionCount(count);
}

/** @param {number} count */
function renderSessionCount(count) {
  sessionCountEl.textContent  = count;
  sessionPluralEl.textContent = count === 1 ? '' : 's';
}

/** Start the countdown. */
function startTimer() {
  if (timerIsRunning) return;
  timerIsRunning = true;

  document.body.classList.add('timer-running');
  timerStartBtn.disabled = true;
  timerStopBtn.disabled  = false;
  timerStatusEl.textContent = 'Focus mode — stay on task!';
  setDurationControlsLocked(true);

  timerInterval = setInterval(() => {
    if (timeRemaining <= 0) {
      clearInterval(timerInterval);
      timerIsRunning = false;
      document.body.classList.remove('timer-running');
      timerStartBtn.disabled = false;
      timerStopBtn.disabled  = true;
      timerStatusEl.textContent = '🎉 Session complete! Take a break.';
      timeRemaining = timerDuration;
      renderTimer();
      incrementSessions();
      setDurationControlsLocked(false);
      return;
    }
    timeRemaining--;
    renderTimer();

    if (timeRemaining <= 10) {
      timerStatusEl.textContent = `Almost done — ${timeRemaining} second${timeRemaining !== 1 ? 's' : ''} left!`;
    }
  }, 1000);
}

/** Stop (pause) the countdown. */
function stopTimer() {
  if (!timerIsRunning) return;
  clearInterval(timerInterval);
  timerIsRunning = false;
  document.body.classList.remove('timer-running');
  timerStartBtn.disabled = false;
  timerStopBtn.disabled  = true;
  timerStatusEl.textContent = "Paused. Resume whenever you're ready.";
  setDurationControlsLocked(false);
}

/** Reset to the current duration setting. */
function resetTimer() {
  stopTimer();
  timeRemaining = timerDuration;
  renderTimer();
  timerStatusEl.textContent = 'Ready to focus?';
}

timerStartBtn.addEventListener('click', startTimer);
timerStopBtn.addEventListener('click', stopTimer);
timerResetBtn.addEventListener('click', resetTimer);
timerSetBtn.addEventListener('click', applyDuration);
durationInputEl.addEventListener('keydown', e => { if (e.key === 'Enter') applyDuration(); });

loadDuration();
loadSessions();

/* ============================================================
   4. TO-DO LIST
   ============================================================ */

const STORAGE_TODOS_KEY = 'dashboard_todos';

const todoInputEl   = document.getElementById('todo-input');
const todoAddBtn    = document.getElementById('todo-add-btn');
const todoListEl    = document.getElementById('todo-list');
const todoEmptyEl   = document.getElementById('todo-empty');

const editModal     = document.getElementById('edit-modal');
const editInputEl   = document.getElementById('edit-input');
const editSaveBtn   = document.getElementById('edit-save-btn');
const editCancelBtn = document.getElementById('edit-cancel-btn');

/** @type {{ id: string, text: string, done: boolean }[]} */
let todos = [];
let editingId = null;

/** Load todos from localStorage. */
function loadTodos() {
  try {
    todos = JSON.parse(localStorage.getItem(STORAGE_TODOS_KEY)) || [];
  } catch {
    todos = [];
  }
  renderTodos();
}

/** Persist todos to localStorage. */
function saveTodos() {
  localStorage.setItem(STORAGE_TODOS_KEY, JSON.stringify(todos));
}

/** Render the full todo list. */
function renderTodos() {
  todoListEl.innerHTML = '';

  if (todos.length === 0) {
    todoEmptyEl.style.display = 'block';
    return;
  }
  todoEmptyEl.style.display = 'none';

  todos.forEach(todo => {
    const li = document.createElement('li');
    li.className = 'todo-item' + (todo.done ? ' done' : '');
    li.dataset.id = todo.id;

    // Checkbox
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'todo-checkbox';
    checkbox.checked = todo.done;
    checkbox.setAttribute('aria-label', 'Mark task complete');
    checkbox.addEventListener('change', () => toggleTodo(todo.id));

    // Text
    const textSpan = document.createElement('span');
    textSpan.className = 'todo-text';
    textSpan.textContent = todo.text;

    // Action buttons
    const actionsDiv = document.createElement('div');
    actionsDiv.className = 'todo-actions';

    const editBtn = document.createElement('button');
    editBtn.className = 'edit-btn';
    editBtn.textContent = 'Edit';
    editBtn.setAttribute('aria-label', 'Edit task');
    editBtn.addEventListener('click', () => openEditModal(todo.id));

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'delete-btn';
    deleteBtn.textContent = 'Delete';
    deleteBtn.setAttribute('aria-label', 'Delete task');
    deleteBtn.addEventListener('click', () => deleteTodo(todo.id));

    actionsDiv.appendChild(editBtn);
    actionsDiv.appendChild(deleteBtn);

    li.appendChild(checkbox);
    li.appendChild(textSpan);
    li.appendChild(actionsDiv);
    todoListEl.appendChild(li);
  });
}

/** Add a new task. */
function addTodo() {
  const text = sanitise(todoInputEl.value);
  if (!text) return;
  todos.push({ id: uid(), text, done: false });
  saveTodos();
  renderTodos();
  todoInputEl.value = '';
  todoInputEl.focus();
}

/** Toggle a task's done state. */
function toggleTodo(id) {
  const todo = todos.find(t => t.id === id);
  if (!todo) return;
  todo.done = !todo.done;
  saveTodos();
  renderTodos();
}

/** Delete a task. */
function deleteTodo(id) {
  todos = todos.filter(t => t.id !== id);
  saveTodos();
  renderTodos();
}

/** Open the edit modal for a task. */
function openEditModal(id) {
  const todo = todos.find(t => t.id === id);
  if (!todo) return;
  editingId = id;
  editInputEl.value = todo.text;
  editModal.hidden = false;
  editInputEl.focus();
  editInputEl.select();
}

/** Close the edit modal without saving. */
function closeEditModal() {
  editModal.hidden = true;
  editingId = null;
  editInputEl.value = '';
}

/** Save the edited task text. */
function saveEdit() {
  const text = sanitise(editInputEl.value);
  if (!text) return;
  const todo = todos.find(t => t.id === editingId);
  if (todo) {
    todo.text = text;
    saveTodos();
    renderTodos();
  }
  closeEditModal();
}

todoAddBtn.addEventListener('click', addTodo);
todoInputEl.addEventListener('keydown', e => { if (e.key === 'Enter') addTodo(); });

editSaveBtn.addEventListener('click', saveEdit);
editCancelBtn.addEventListener('click', closeEditModal);
editInputEl.addEventListener('keydown', e => {
  if (e.key === 'Enter')  saveEdit();
  if (e.key === 'Escape') closeEditModal();
});
editModal.addEventListener('click', e => { if (e.target === editModal) closeEditModal(); });

loadTodos();

/* ============================================================
   5. QUICK LINKS
   ============================================================ */

const STORAGE_LINKS_KEY = 'dashboard_links';

const linkNameInputEl = document.getElementById('link-name-input');
const linkUrlInputEl  = document.getElementById('link-url-input');
const linkAddBtn      = document.getElementById('link-add-btn');
const linksGridEl     = document.getElementById('links-grid');
const linksEmptyEl    = document.getElementById('links-empty');

/** @type {{ id: string, name: string, url: string }[]} */
let links = [];

/** Load links from localStorage. */
function loadLinks() {
  try {
    links = JSON.parse(localStorage.getItem(STORAGE_LINKS_KEY)) || [];
  } catch {
    links = [];
  }

  // Seed defaults on first load
  if (links.length === 0) {
    links = [
      { id: uid(), name: 'Google',  url: 'https://www.google.com' },
      { id: uid(), name: 'YouTube', url: 'https://www.youtube.com' },
      { id: uid(), name: 'GitHub',  url: 'https://www.github.com' },
    ];
    saveLinks();
  }
  renderLinks();
}

/** Persist links to localStorage. */
function saveLinks() {
  localStorage.setItem(STORAGE_LINKS_KEY, JSON.stringify(links));
}

/**
 * Build a Google favicon URL for a given site URL.
 * @param {string} url
 * @returns {string}
 */
function faviconUrl(url) {
  try {
    const origin = new URL(url).origin;
    return `https://www.google.com/s2/favicons?domain=${origin}&sz=32`;
  } catch {
    return '';
  }
}

/** Render all link chips. */
function renderLinks() {
  linksGridEl.innerHTML = '';

  if (links.length === 0) {
    linksEmptyEl.style.display = 'block';
    return;
  }
  linksEmptyEl.style.display = 'none';

  links.forEach(link => {
    const chip = document.createElement('a');
    chip.className = 'link-chip';
    chip.href      = link.url;
    chip.target    = '_blank';
    chip.rel       = 'noopener noreferrer';
    chip.dataset.id = link.id;

    const favicon = document.createElement('img');
    favicon.className = 'link-favicon';
    favicon.src    = faviconUrl(link.url);
    favicon.alt    = '';
    favicon.width  = 16;
    favicon.height = 16;
    favicon.addEventListener('error', () => { favicon.style.display = 'none'; });

    const nameSpan = document.createElement('span');
    nameSpan.textContent = link.name;

    const delBtn = document.createElement('button');
    delBtn.className = 'link-delete-btn';
    delBtn.textContent = '✕';
    delBtn.setAttribute('aria-label', `Remove ${link.name}`);
    delBtn.addEventListener('click', e => {
      e.preventDefault();
      deleteLink(link.id);
    });

    chip.appendChild(favicon);
    chip.appendChild(nameSpan);
    chip.appendChild(delBtn);
    linksGridEl.appendChild(chip);
  });
}

/**
 * Validate and normalise a URL string.
 * Prepends https:// if no protocol present.
 * @param {string} raw
 * @returns {string|null}
 */
function normaliseUrl(raw) {
  let url = raw.trim();
  if (!url) return null;
  if (!/^https?:\/\//i.test(url)) url = 'https://' + url;
  try {
    new URL(url);
    return url;
  } catch {
    return null;
  }
}

/** Flash a red border on an invalid input for 1.5 s. */
function flashError(el) {
  el.focus();
  el.style.borderColor = 'var(--danger)';
  setTimeout(() => { el.style.borderColor = ''; }, 1500);
}

/** Add a new quick link. */
function addLink() {
  const name = sanitise(linkNameInputEl.value);
  const url  = normaliseUrl(linkUrlInputEl.value);

  if (!name) { flashError(linkNameInputEl); return; }
  if (!url)  { flashError(linkUrlInputEl);  return; }

  links.push({ id: uid(), name, url });
  saveLinks();
  renderLinks();
  linkNameInputEl.value = '';
  linkUrlInputEl.value  = '';
  linkNameInputEl.focus();
}

/** Delete a quick link by id. */
function deleteLink(id) {
  links = links.filter(l => l.id !== id);
  saveLinks();
  renderLinks();
}

linkAddBtn.addEventListener('click', addLink);
linkUrlInputEl.addEventListener('keydown',  e => { if (e.key === 'Enter') addLink(); });
linkNameInputEl.addEventListener('keydown', e => { if (e.key === 'Enter') linkUrlInputEl.focus(); });

loadLinks();
