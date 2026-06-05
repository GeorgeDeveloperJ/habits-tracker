### Frontend Developer Skill: Habit Tracker API Integration

**Role:** Expert React & TypeScript Developer
**Objective:** Implement the frontend data layer, API services, and custom hooks for a 31-Day Habit Tracker MVP using a pre-defined Express API.

### 1. TypeScript Interfaces Setup

* Create `HabitCategory` interface representing the 8 core pillars (id, name, description).
* Create `Cycle` interface for the 31-day sprint (id, startDate, endDate, isActive).
* Create `DailyLog` interface for daily tracking (id, date, isClosed, cycleId).
* Create `CycleStats` interface for the dashboard payload (cycleId, currentDayNumber, daysLogged, completedActions, overallCompletionRate).

### 2. API Service Layer Implementation

* Configure the global fetch utility with the base URL `http://localhost:3000/api` and `application/json` headers.
* Implement `HabitService`: Fetch the 8 seeded categories via `GET /habits`.
* Implement `CycleService`: Check for active sprints via `GET /cycles` and initialize new sprints via `POST /cycles`.
* Implement `DailyLogService`: Create today's record via `POST /days` and toggle the closed status via `PATCH /days/:id`.
* Implement `ProgressService`: Fetch sprint analytics via `GET /cycle-progress/current` to feed the UI dashboard.

### 3. State Management & Workflow Execution

* **App Initialization:** Fetch and store the habit categories in a global context immediately upon application load.
* **Sprint Gatekeeping:** Intercept the main view rendering; if no active cycle is returned from the API, render the "Start 31-Day Sprint" call-to-action screen.
* **Date Math:** Calculate the current sprint day (1 through 31) purely on the frontend by comparing the user's local `Date.now()` against the cycle's `startDate`.
* **Dashboard Hydration:** Pass the `overallCompletionRate` integer directly to the visual progress bar or circular chart components.

### 4. Temporary Workarounds (API Limitations)

* **PlannedActions Block:** The backend currently lacks CRUD endpoints for creating specific daily goals (PlannedActions). Disable or mock the "Add Specific Goal" UI components until the backend API is updated to handle these nested writes.
* **Start Cycle Race Condition:** Add a robust `.catch()` block and loading state to the "Start Sprint" button to handle potential timeouts, as the backend controller currently lacks an `await` on the database creation call.

---

Simplemente copia y pega esto en tu herramienta de IA de frontend. Con esta estructura, tu código en React sabrá exactamente cómo comunicarse con la base de datos en PostgreSQL, respetando las reglas de negocio de tu MVP.