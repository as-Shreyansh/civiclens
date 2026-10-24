# CIVICLENS — Intelligent Road Intelligence for Smarter Cities

AI + IoT-Inspired Smart Road Monitoring & Priority Dispatch Platform.  
Built for the Smart Cities & IoT / Open Innovation Hackathon.

---

## 🌟 Overview & Architecture

CIVICLENS is a full-stack smart city operations platform that detects potential road defects, analyzes road condition reports, ranks hazardous locations by urgency using an explainable priority scoring formula, visualizes them geographically, and dispatches municipal repair crews.

### 🔄 The End-to-End Workflow:
```
Simulated IoT Sensors / Citizen Reports
               │
               ▼
   Rule-Based Anomaly Detection
               │
               ▼
     0–100 Priority Scoring
  (Severity 40%, Safety 30%, Frequency 20%, Wait Time 10%)
               │
               ▼
    Interactive Leaflet / OSM Map
               │
               ▼
   Municipal Maintenance Dispatch & Route Optimization
               │
               ▼
   Lifecycle Tracking (Reported → Under Inspection → Repair Scheduled → Resolved)
```

---

## 🚀 Quick Start Guide

### Prerequisites
- Node.js (v20+ recommended, tested on Node v24)
- npm

### ⚡ Start Everything with ONE Command:
```bash
npm start
```
This single command automatically launches both servers concurrently:
- **Backend API & SQLite Database**: `http://localhost:5000`
- **Frontend Web App**: `http://localhost:8080`

*(Press `Ctrl + C` at any time to cleanly stop both servers).*

---

### Or Run Them Individually:
* **Terminal 1 (Backend API):** `npm run server`
* **Terminal 2 (Frontend App):** `npm run dev`

---

## 📱 Application Modules & Routes

1. **Public Landing Page (`/`)**: High-level problem statement, live KPI statistics, and 3-step workflow.
2. **Citizen Reporting (`/report`)**: Mobile-friendly defect reporting form with interactive map pin picker, GPS locator, severity rating, and photo upload. Generates a unique tracking ID (`CL-XXXXXX`).
3. **Citizen Status Tracking (`/track`)**: Allows citizens to look up real-time repair progress using their Report ID.
4. **Operations Dashboard (`/dashboard`)**: Command center with KPI metrics, severity distribution chart, 30-day trend chart, sortable/searchable defect tables, and IoT stream controls.
5. **Interactive GIS Map (`/map`)**: Leaflet/OpenStreetMap display with severity-colored hazard markers, popup metrics, and filtering.
6. **Defect Intelligence (`/intelligence`)**: Transparent rule-based anomaly detection analyzing vibration ($g$), speed, and road surface anomalies.
7. **Priority Engine (`/priorities`)**: Explainable 0–100 ranking engine with configurable prototype weights.
8. **Dispatcher & Route Planner (`/dispatch`)**: Work order assignment, team capacity management, nearest-neighbor route estimation, and CSV worklist export.
9. **Teams Management (`/teams`)**: View and configure municipal maintenance crews and zone capacities.
10. **Defect Deep Dive (`/defects/:id`)**: Comprehensive audit trail, lifecycle transitions, and telemetry logs.
11. **Methodology & About (`/about`)**: Architecture, mathematical formulations, and hackathon prototype disclosures.

---

## 🎯 3-Minute Hackathon Demo Script

1. **Minute 1: The Problem & Citizen Input**
   - Open `/` (Landing Page): *"Municipal road maintenance is often reactive and slow. Citizens report potholes on scattered channels, while field inspectors lack real-time prioritization."*
   - Go to `/report`: Submit a new citizen report (e.g. on *MI Road, Jaipur*). Show the generated tracking ID (`CL-XXXXXX`).
2. **Minute 2: Real-Time Intelligence & Prioritization**
   - Switch to `/dashboard`: Show the newly created report appearing in the database instantly.
   - Start the **Simulated IoT Stream**: Show live vibration events coming in and rule-based anomaly detection flagging surface spikes.
   - Click `/map`: View the color-coded markers and click a critical defect pin to inspect its score.
   - Go to `/priorities`: Explain the explainable 4-factor formula (Severity, Safety Risk, Citizen Frequency, Waiting Time).
3. **Minute 3: Dispatch & Resolution**
   - Open `/dispatch`: Assign the top-priority defect to *Delta Rapid Response Team*.
   - Transition its status from *Reported* → *Under Inspection* → *Repair Scheduled*.
   - Click **Download CSV** to demonstrate how maintenance teams get field work orders.
   - Conclude: *"CIVICLENS bridges citizen awareness and municipal operations with transparent, data-driven dispatch."*

---

## ⚖️ Implemented vs. Simulated Notice
- **Implemented**: Full React frontend, TanStack Router, Leaflet GIS mapping, Recharts analytics, Node.js + Express backend, SQLite persistence, and rule-based anomaly detection.
- **Simulated**: Vehicle IoT sensor feeds are algorithmically generated using realistic accelerometer physics thresholds; coordinates are seeded demo locations in Jaipur, India.
