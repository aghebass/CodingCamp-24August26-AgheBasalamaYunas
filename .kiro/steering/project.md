# Life Dashboard — Project Steering

## Project Overview
A To-Do List Life Dashboard built as a static web app for the CodingCamp submission.
Built entirely with Kiro AI IDE using Vibe sessions.

## Tech Stack
- HTML5 (structure)
- CSS3 with CSS custom properties (styling)
- Vanilla JavaScript, no frameworks (logic)
- Browser localStorage API (data persistence)
- No build tools, no backend — open index.html directly in any browser

## File Structure
```
index.html          ← main dashboard page
css/styles.css      ← all styles (dark + light theme via CSS vars)
js/app.js           ← all JavaScript logic
.kiro/steering/     ← Kiro project context
```

## Features Built
### MVP
- Live clock (HH:MM:SS, updates every second)
- Time-based greeting (morning / afternoon / evening / night)
- To-Do List — add, edit, mark done, delete, persisted in localStorage
- Focus Timer — 25-min Pomodoro countdown with start/stop/reset
- Quick Links — add favourite sites, opens in new tab, favicon support, persisted in localStorage

### Challenge Features
- Light / Dark mode toggle — CSS custom properties swap via `data-theme` on `<html>`, preference saved to localStorage
- Custom name in greeting — user sets their name inline in the header, persisted in localStorage, injected into greeting
- Custom Pomodoro duration — number input (1–120 min) with Set button, locked while timer is running, persisted in localStorage

## Coding Conventions
- `'use strict'` in all JS files
- DOM elements selected once at the top of each section
- All user data sanitised with `sanitise()` before storage
- No inline event handlers in HTML — all listeners attached in JS
- CSS variables used for every colour so both themes stay consistent
- Responsive layout: 2-column grid collapses to 1-column on mobile (≤700px)

## localStorage Keys
| Key | Value |
|-----|-------|
| `dashboard_theme` | `"dark"` or `"light"` |
| `dashboard_username` | string |
| `dashboard_timer_duration` | number (minutes) |
| `dashboard_sessions` | number (today's completed sessions) |
| `dashboard_session_date` | date string for daily reset |
| `dashboard_todos` | JSON array of `{ id, text, done }` |
| `dashboard_links` | JSON array of `{ id, name, url }` |
