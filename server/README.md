# CIVICLENS Backend (Node.js + Express + SQLite)

This is the backend server for **CIVICLENS — Intelligent Road Intelligence for Smarter Cities**.

## Features
- **Built-in SQLite Database**: Uses Node's native `DatabaseSync` (`node:sqlite`). Zero native build tools or configuration needed. Persists to `server/civiclens.sqlite`.
- **Pre-seeded Urban Data**: Includes 22 demonstration defect records, 4 maintenance crews, and 55 simulated sensor telemetry events across Jaipur, India.
- **Explainable Rule-Based Anomaly Detection**: Analyzes vibration ($g$), speed, and surface score. Automatically converts high-severity anomalies into road defects.
- **REST API Endpoints**:
  - `GET /api/db`: Hydrates full application state (defects, events, teams, assignments, history, priority weights, simulation status).
  - `POST /api/report`: Accepts citizen reports with GPS coordinates, photos, and descriptions.
  - `PATCH /api/defects/:id/status`: Transitions defects between workflow stages (`Reported` → `Under Inspection` → `Repair Scheduled` → `Resolved`).
  - `POST /api/defects/:id/assign`: Assigns defects to maintenance teams with urgency levels and notes.
  - `POST /api/teams`: Adds or updates maintenance team capacities and operating zones.
  - `POST /api/weights`: Updates custom priority formula weights.
  - `POST /api/sim/toggle`: Starts or pauses the background IoT telemetry stream.
  - `POST /api/sim/clear`: Clears dynamically generated simulated events.
  - `POST /api/demo/reset`: Resets database to clean seed state for hackathon presentations.

## Running the Server
From the root directory:
```bash
npm run server
```
Or for auto-reload during development:
```bash
npm run server:dev
```
The server will run on `http://localhost:5000`.
