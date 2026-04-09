# 📡 Smart RFID Attendance System

A complete **IoT-based attendance management system** using **ESP32, RFID (RC522), Google Sheets, and a live web dashboard**. This project enables automated, real-time attendance tracking with minimal infrastructure.

---

## 🚀 Features

* 📶 RFID-based student identification
* ⚡ Fast and contactless attendance logging
* ☁️ Google Sheets as cloud database
* 🌐 Live web dashboard (hosted on Render)
* 🔄 Near real-time updates (Polling + SSE)
* 🔍 Search and filter functionality
* 📱 Mobile-friendly interface
* 🔐 Optional authentication system

---

## 🏗️ System Architecture

```
ESP32 → Google Apps Script → Google Sheets → Node.js Backend → Web Dashboard
```

### 🔄 Data Flow

1. RFID card is scanned via RC522
2. ESP32 reads UID and sends data via WiFi
3. Google Apps Script stores data in Google Sheets
4. Backend fetches data from Apps Script
5. Website displays attendance records live

---

## 🔌 Hardware Components

* ESP32 (38-pin)
* RC522 RFID Module
* 16x2 I2C LCD Display
* (Optional) Buzzer
* Jumper wires & power supply

---

## 🔧 Pin Configuration

### 🟢 RFID RC522 → ESP32 (SPI)

| RC522    | ESP32   |
| -------- | ------- |
| SDA (SS) | GPIO 13 |
| SCK      | GPIO 18 |
| MOSI     | GPIO 23 |
| MISO     | GPIO 19 |
| RST      | GPIO 27 |
| 3.3V     | 3V3     |
| GND      | GND     |

### 🔵 I2C LCD → ESP32

| LCD | ESP32   |
| --- | ------- |
| VCC | 5V      |
| GND | GND     |
| SDA | GPIO 21 |
| SCL | GPIO 22 |

### 🟡 Optional Buzzer

| Buzzer | ESP32  |
| ------ | ------ |
| +      | GPIO 4 |
| -      | GND    |

---

## ⚠️ Important Notes

* RFID **must use 3.3V (NOT 5V)**
* LCD typically uses **5V**
* Use **hardware SPI pins** for stable RFID communication
* I2C pins recommended: **GPIO 21 (SDA), GPIO 22 (SCL)**

---

## 🧠 How It Works

### 1. Hardware Layer

* Scans RFID card UID
* Matches UID to student name
* Sends data to cloud via HTTP

### 2. Cloud Layer (Google Apps Script)

* Receives attendance data
* Stores it in Google Sheets
* Provides JSON API (`mode=read`)

### 3. Backend Layer (Node.js - Render)

* Fetches data from Apps Script
* Processes and caches records
* Emits updates using Server-Sent Events

### 4. Frontend Layer

* Displays attendance table
* Supports search & filtering
* Updates automatically without refresh

---

## ⚙️ Setup & Installation

### 🔹 1. Clone Repository

```bash
git clone https://github.com/sadman7202/Deployment-of-Smart-RFID-Attendance-system.git
cd Deployment-of-Smart-RFID-Attendance-system
```

---

### 🔹 2. Google Apps Script Setup

* Open `scripts/google-apps-script-attendance.gs`
* Deploy as **Web App**
* Set access to: **Anyone**
* Copy the Web App URL

---

### 🔹 3. ESP32 Configuration

* Add your:

  * WiFi SSID & Password
  * Google Apps Script URL

* Upload code via Arduino IDE

---

### 🔹 4. Backend Deployment (Render)

* Push project to GitHub
* Deploy `render-deploy` folder on Render

#### Environment Variables:

```env
GOOGLE_APPS_SCRIPT_URL=your_script_url
APPS_SCRIPT_READ_QUERY=mode=read
REFRESH_INTERVAL_MS=5000
AUTH_ENABLED=false
SESSION_SECRET=your_secret
```

---

### 🔹 5. Run the System

* Power the ESP32
* Scan RFID card
* Open Render URL on browser
* View live attendance updates

---

## 🔄 Real-Time Behavior

* Backend polls Google Sheets every few seconds
* Detects new entries
* Sends updates via SSE
* Dashboard refreshes automatically

⏱ Typical delay: **2–5 seconds**

---

## 📁 Project Structure

```
├── scripts/
│   └── google-apps-script-attendance.gs
├── render-deploy/
│   ├── server.js
│   ├── package.json
│   ├── render.yaml
│   ├── .env.example
│   ├── src/
│   │   ├── routes/
│   │   └── services/
│   └── public/
│       ├── index.html
│       ├── app.js
│       └── styles.css
```

---

## 🔐 Optional Authentication

Enable login system:

```env
AUTH_ENABLED=true
```

* Access `/login`
* Redirect to `/dashboard` after login
* Session-based authentication

---

## ✅ Advantages

* Low cost and easy to deploy
* No dedicated database required
* Scalable for university use
* Beginner-friendly architecture

---

## ⚠️ Limitations

* Not fully real-time (uses polling)
* Depends on Google Apps Script latency
* Requires stable WiFi connection

---

## 📌 Future Improvements

* Replace polling with WebSockets
* Add cloud database (Firebase/MongoDB)
* Mobile app integration
* Face recognition backup system
* Admin analytics dashboard

---

## 📜 License

This project is open-source and available under the MIT License.

---

## 👨‍💻 Author

**Sadman Sakib**
📧 [royalsakib2@gmail.com](mailto:royalsakib2@gmail.com)
🌐 GitHub: [https://github.com/sadman7202](https://github.com/sadman7202)

