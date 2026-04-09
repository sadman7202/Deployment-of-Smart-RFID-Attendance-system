Smart RFID Attendance System – Project Summary
Overview

The Smart RFID Attendance System is an IoT-based solution that automates student attendance tracking using an ESP32 microcontroller, an RC522 RFID reader, and a web-based dashboard. It replaces manual attendance with a fast, reliable, and near real-time digital system.

How the System Works

The system operates through three connected layers:

Hardware Layer (ESP32 + RFID + LCD)
The RC522 RFID reader scans a student’s card and captures its unique UID.
The ESP32 processes this UID, maps it to a student name, and displays feedback on the 16x2 I2C LCD.
It then sends the attendance data (UID, name, date, time) over WiFi.
Cloud Layer (Google Apps Script + Google Sheets)
The ESP32 sends data to a deployed Google Apps Script Web App.
The script stores each record as a new row in Google Sheets.
When requested with mode=read, it returns the stored data as JSON.
Web Layer (Render + Node.js Dashboard)
A Node.js backend hosted on Render fetches data from the Apps Script.
It processes and serves the data through API endpoints.
A simple frontend displays attendance records, supports search/filtering, and updates automatically.
Data Flow

ESP32 → Apps Script → Google Sheets → Render Backend → Web Dashboard

Card scan triggers data upload.
Google Sheets acts as the database.
The website reads and displays updated data within seconds.
Execution & Deployment

To run the system:

1. Hardware Setup
Connect ESP32, RC522, and LCD using SPI and I2C pins.
Upload firmware with WiFi credentials and Apps Script URL.
2. Google Apps Script Setup
Deploy the script as a Web App.
Enable public access.
Use it for both writing (ESP32) and reading (website).
3. Backend Deployment (Render)
Upload the project to GitHub.
Deploy the render-deploy folder on Render.
Configure environment variables like:
GOOGLE_APPS_SCRIPT_URL
REFRESH_INTERVAL_MS
4. Access the Dashboard
Open the Render URL on your phone or browser.
View live attendance records and updates.
Implementation Highlights
Uses WiFi-enabled ESP32 for real-time communication
Google Sheets as a lightweight database
Apps Script as an API layer
Node.js backend with polling + Server-Sent Events (SSE) for near real-time updates
Simple, beginner-friendly frontend (HTML/CSS/JS)
Verdict

This project is a practical, scalable, and cost-effective IoT solution for attendance management. It avoids complex infrastructure by leveraging Google Sheets and cloud deployment, making it ideal for university-level implementation. While not fully real-time (due to polling delays), it achieves efficient near real-time performance with minimal setup.
