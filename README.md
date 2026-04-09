**How It Works**

This project has three moving parts that work together:

1. The RFID hardware captures the card UID.
2. Google Apps Script stores and serves the attendance data from Google Sheets.
3. The Render-hosted Node.js website reads that sheet and shows the live records on your phone.

The key idea is that the phone never talks to the ESP32 directly. The ESP32 writes to Google Sheets, and the website reads from Google Sheets through the Apps Script web app.

**Data Flow**

When you tap a card on the RC522 reader, the ESP32 collects the card UID and sends it over WiFi to your Google Apps Script URL. That script writes a new row into the Google Sheet with UID, student name, date, and time. Then the website, which is deployed on Render, periodically asks the Apps Script for the latest records in read mode and refreshes the table in the browser.

So the flow is:

ESP32 -> Apps Script write URL -> Google Sheet -> Render backend -> Website on your phone

**Hardware Side**

The hardware does one job: scan the RFID card and send the scan details.

- RC522 reads the card UID.
- ESP32 formats the scan data.
- ESP32 sends the data to the Apps Script URL using an HTTP request.
- The request usually includes UID, student name, date, and time.

That is the only role of the hardware. It does not store the records permanently.

**Google Sheets Side**

Google Sheets is the database.

The Apps Script file at scripts/google-apps-script-attendance.gs does two jobs:

1. Write mode
- If the ESP32 sends normal parameters like UID and name, the script appends a row to the Attendance sheet.
- If the sheet is empty, it creates the header row automatically.

2. Read mode
- If the website calls the script with `mode=read`, it returns the attendance rows as JSON.
- That JSON is what the Node backend reads.

This is why your Google Apps Script must be deployed as a Web App and set to allow access.

**Backend Side**

The backend is the middle layer between Google Sheets and the website.

The main file is render-deploy/server.js.

What it does:
- Loads environment variables from `.env`.
- Starts the Express server.
- Serves the frontend files.
- Exposes API routes like `/attendance` and `/events`.
- Handles optional login if auth is enabled.
- Starts polling the Apps Script source automatically.

The attendance logic itself lives in render-deploy/src/services/attendanceService.js.

That service:
- Calls your Apps Script URL.
- Appends `mode=read` so it gets JSON from the sheet.
- Parses the response.
- Normalizes date and time values.
- Stores the latest records in memory.
- Detects when data changes.
- Notifies connected browsers through server-sent events.

So the backend is not the database. It is a reader and presenter of Google Sheets data.

**Frontend Side**

The website is the page you open on your phone.

The main frontend files are:
- render-deploy/public/index.html
- render-deploy/public/app.js
- render-deploy/public/styles.css

What the frontend does:
- Loads the attendance data from `/attendance`.
- Shows it in a table.
- Displays total records.
- Lets you search by student name or UID.
- Lets you filter by date.
- Highlights the most recently scanned student.
- Listens to `/events` so it can refresh automatically.

Because this is a plain HTML/CSS/JS frontend, it is simple and beginner-friendly.

**Real-Time Behavior**

This is not direct hardware-to-browser communication. The real-time effect comes from polling plus SSE.

Here is how it behaves:
1. The backend polls the Apps Script read endpoint every few seconds.
2. If the data changed, the backend emits an SSE update.
3. The browser receives the event and fetches the latest data again.
4. The table updates without manual refresh in many cases.

The timing is controlled by `REFRESH_INTERVAL_MS` in Render environment variables.

So it is “near real-time.” If you set the interval to 5 seconds, the dashboard usually updates within a few seconds after a new scan.

**Deployment Structure**

The Render-ready app is packaged in render-deploy.

Important files there:
- render-deploy/package.json
- render-deploy/server.js
- render-deploy/render.yaml
- render-deploy/.env.example

That folder is meant to be pushed to GitHub as the repo root for Render deployment.

**What Happens When You Open the Website**

When you open the Render URL on your phone:
1. Render starts the Node app.
2. Express serves the dashboard page.
3. The browser requests `/attendance`.
4. The backend fetches JSON from Google Apps Script.
5. The backend returns the records to the browser.
6. The browser renders the table.

If a new RFID card is scanned later, the sheet changes, the backend notices, and the browser updates.

**Optional Login**

If `AUTH_ENABLED=true`, the project adds a simple admin login.

Files involved:
- render-deploy/src/routes/auth.js
- render-deploy/public/login.html
- render-deploy/public/login.js

In that mode:
- Users go to `/login`.
- After login, they see `/dashboard`.
- Session cookies keep them logged in.

If `AUTH_ENABLED=false`, the site opens directly.

**Configuration That Controls the System**

These environment variables decide how the app behaves:
- `GOOGLE_APPS_SCRIPT_URL` = your Apps Script web app URL
- `APPS_SCRIPT_READ_QUERY` = usually `mode=read`
- `REFRESH_INTERVAL_MS` = how often the backend polls
- `USE_LOCAL_SAMPLE_DATA` = fallback for local testing
- `AUTH_ENABLED` = turns login on or off
- `SESSION_SECRET` = session security key

These are documented in render-deploy/.env.example.

**Simple Summary**

In one sentence: the ESP32 writes attendance to Google Sheets through Apps Script, Render hosts the website, the backend reads the sheet through Apps Script, and your phone sees the live attendance table.


1. a diagram of the full architecture,
2. a line-by-line explanation of the Apps Script file,
3. or a beginner deployment checklist for Render and GitHub.
