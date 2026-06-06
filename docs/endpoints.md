# 📡 API Endpoints

This document outlines the RESTful API endpoints for the Habit Tracker backend, built with Node.js, Express, Prisma ORM, and PostgreSQL.

---

## 🩺 System Health

### Check API Health
Retrieves the running status of the Habit Tracker backend service.

*   **URL:** `/api/health`
*   **Method:** `GET`
*   **URL Parameters:** None
*   **Body Payload:** None
*   **Success Response:** `200 OK`
    ```json
    {
      "status": "success",
      "message": "Habit tracker API is running"
    }
    ```
*   **Error Handling:**
    *   `500 Internal Server Error`: Express/server-level failures.

---

## 🏷️ Habit Categories

The `HabitCategory` model represents the 8 fundamental habit pillars (such as learning, physical health, etc.) pre-seeded in the database.

### Retrieve Habit Categories
Fetches all fundamental habit pillars/categories configured in the system.

*   **URL:** `/api/habits`
*   **Method:** `GET`
*   **URL Parameters:** None
*   **Body Payload:** None
*   **Success Response:** `200 OK`
    ```json
    {
      "sucess": true,
      "data": [
        {
          "id": "7b049d97-158a-49c7-876a-3507c30932bb",
          "name": "Physical Health",
          "description": "Exercise, nutrition, and sleep",
          "createdAt": "2026-06-06T13:24:49.000Z",
          "updatedAt": "2026-06-06T13:24:49.000Z"
        }
      ]
    }
    ```
    > [!NOTE]
    > Note the spelling of the JSON key `"sucess": true` (with one 'c') returned by the controller.
*   **Error Handling:**
    *   `500 Internal Server Error`: Returned when the database query fails.
        ```json
        {
          "sucess": false,
          "message": "Error fetching habits"
        }
        ```

---

## 📅 Sprints & Cycles

Cycles represent the 31-day sprints during which users track their atomic habits.

### Start a New Cycle
Initiates a new 31-day habit tracking sprint. The backend automatically sets the `endDate` to exactly 31 days from the current timestamp.

*   **URL:** `/api/cycles`
*   **Method:** `POST`
*   **URL Parameters:** None
*   **Body Payload:** None (the fields `startDate`, `endDate`, and `isActive` are handled automatically by the backend).
*   **Success Response:** `200 OK`
    ```json
    {
      "success": true,
      "message": "Cycle started succesfully",
      "data": {
        "id": "e8a93e3d-6bd3-4f9e-bc43-9844e1a0b3f5",
        "startDate": "2026-06-06T13:24:49.000Z",
        "endDate": "2026-07-07T13:24:49.000Z",
        "isActive": true,
        "createdAt": "2026-06-06T13:24:49.000Z",
        "updatedAt": "2026-06-06T13:24:49.000Z"
      }
    }
    ```
*   **Error Handling:**
    *   `500 Internal Server Error`: Returned when a database or server failure occurs.
        ```json
        {
          "success": false,
          "message": "Error starting cycle"
        }
        ```

### Get Current Cycle
Retrieves the details of the first cycle record in the database.

*   **URL:** `/api/cycles`
*   **Method:** `GET`
*   **URL Parameters:** None
*   **Body Payload:** None
*   **Success Response:** `200 OK`
    ```json
    {
      "success": true,
      "data": {
        "id": "e8a93e3d-6bd3-4f9e-bc43-9844e1a0b3f5",
        "startDate": "2026-06-06T13:24:49.000Z",
        "endDate": "2026-07-07T13:24:49.000Z",
        "isActive": true,
        "createdAt": "2026-06-06T13:24:49.000Z",
        "updatedAt": "2026-06-06T13:24:49.000Z"
      }
    }
    ```
*   **Error Handling:**
    *   `500 Internal Server Error`: Returned when the database query fails.
        ```json
        {
          "success": false,
          "message": "Error fetching current cycle"
        }
        ```

---

## 📊 Cycle Progress

### Get Cycle Progress Stats
Calculates completion rates and aggregates daily logs for the currently active cycle.
*Note: Although the endpoint includes a `:cycleId` parameter in the route, the controller queries the active cycle using the current date.*

*   **URL:** `/api/cycle-progress/:cycleId`
*   **Method:** `GET`
*   **URL Parameters:**
    *   `cycleId` (string, UUID): The ID of the cycle to query progress for.
*   **Body Payload:** None
*   **Success Response:** `200 OK`
    ```json
    {
      "success": true,
      "stats": {
        "cycleId": "e8a93e3d-6bd3-4f9e-bc43-9844e1a0b3f5",
        "currentDayNumber": 1,
        "daysLogged": 1,
        "completedActions": 2,
        "overallCompletionRate": 67
      },
      "logs": [
        {
          "id": "fb593d14-3a21-4f10-9cb4-8d486d34e2c8",
          "date": "2026-06-06T13:24:49.000Z",
          "isClosed": false,
          "cycleId": "e8a93e3d-6bd3-4f9e-bc43-9844e1a0b3f5",
          "createdAt": "2026-06-06T13:24:49.000Z",
          "updatedAt": "2026-06-06T13:24:49.000Z",
          "plans": [
            {
              "id": "a9042b4d-3b52-4fe0-94d1-db29ee74659b",
              "description": "Read 10 pages of Clean Code",
              "isCompleted": true,
              "logId": "fb593d14-3a21-4f10-9cb4-8d486d34e2c8",
              "categoryId": "7b049d97-158a-49c7-876a-3507c30932bb",
              "createdAt": "2026-06-06T13:24:49.000Z",
              "updatedAt": "2026-06-06T13:24:49.000Z"
            }
          ]
        }
      ]
    }
    ```
*   **Error Handling:**
    *   `400 Bad Request`: Returned when no active cycle exists (where the end date is greater than or equal to the current time) to calculate progress.
        ```json
        {
          "message": "No active cycle found to calculate stats."
        }
        ```
    *   `500 Internal Server Error`: Returned when server or database queries fail.
        ```json
        {
          "message": "Internal server error"
        }
        ```

---

## 📆 Daily Logs

Daily logs serve as the container for specific habit actions planned for a single calendar day within a cycle.

### Create a Daily Log
Creates a new log entry for the current day. The backend automatically resolves the active cycle context (matching `endDate` greater than or equal to the current timestamp) and links the daily log to it.

*   **URL:** `/api/days`
*   **Method:** `POST`
*   **URL Parameters:** None
*   **Body Payload:** None
*   **Success Response:** `201 Created`
    ```json
    {
      "id": "fb593d14-3a21-4f10-9cb4-8d486d34e2c8",
      "date": "2026-06-06T13:24:49.000Z",
      "isClosed": false,
      "cycleId": "e8a93e3d-6bd3-4f9e-bc43-9844e1a0b3f5",
      "createdAt": "2026-06-06T13:24:49.000Z",
      "updatedAt": "2026-06-06T13:24:49.000Z"
    }
    ```
*   **Error Handling:**
    *   `400 Bad Request`: Returned if there is no active cycle found.
        ```json
        {
          "message": "No active cycle found"
        }
        ```
    *   `500 Internal Server Error`: Returned on internal failure.
        ```json
        {
          "message": "Internal server error"
        }
        ```

### Retrieve All Daily Logs
Fetches all daily logs recorded across all cycles.

*   **URL:** `/api/days`
*   **Method:** `GET`
*   **URL Parameters:** None
*   **Body Payload:** None
*   **Success Response:** `200 OK`
    ```json
    [
      {
        "id": "fb593d14-3a21-4f10-9cb4-8d486d34e2c8",
        "date": "2026-06-06T13:24:49.000Z",
        "isClosed": false,
        "cycleId": "e8a93e3d-6bd3-4f9e-bc43-9844e1a0b3f5",
        "createdAt": "2026-06-06T13:24:49.000Z",
        "updatedAt": "2026-06-06T13:24:49.000Z"
      }
    ]
    ```
*   **Error Handling:**
    *   `500 Internal Server Error`: Returned on database query failures.
        ```json
        {
          "message": "Internal server error"
        }
        ```

### Update a Daily Log
Updates an existing daily log. This is commonly used to close a daily log (preventing further action additions/modifications).

*   **URL:** `/api/days/:id`
*   **Method:** `PATCH`
*   **URL Parameters:**
    *   `id` (string, UUID): The ID of the daily log.
*   **Body Payload:**
    ```json
    {
      "isClosed": true
    }
    ```
    > [!IMPORTANT]
    > **Protected Fields:** The backend automatically intercepts and prevents updates to `id`, `date`, and `cycleId` by deleting them from the request payload before updating the database.
*   **Success Response:** `200 OK`
    ```json
    {
      "id": "fb593d14-3a21-4f10-9cb4-8d486d34e2c8",
      "date": "2026-06-06T13:24:49.000Z",
      "isClosed": true,
      "cycleId": "e8a93e3d-6bd3-4f9e-bc43-9844e1a0b3f5",
      "createdAt": "2026-06-06T13:24:49.000Z",
      "updatedAt": "2026-06-06T13:24:49.000Z"
    }
    ```
*   **Error Handling:**
    *   `400 Bad Request`: Returned if there is no active cycle found.
        ```json
        {
          "message": "No active cycle found"
        }
        ```
    *   `500 Internal Server Error`: Returned on internal database failures.
        ```json
        {
          "message": "Internal server error"
        }
        ```

---

## 🎯 Habit Actions

Habit actions (`PlannedActions`) are the daily atomic goals set by the user, linked to a specific habit category and a daily log.

### Create a Daily Goal / Action
Creates a specific action for the current active day. The backend automatically associates the action with the most recently created `DailyLog` context.

*   **URL:** `/api/actions`
*   **Method:** `POST`
*   **URL Parameters:** None
*   **Body Payload:**
    ```json
    {
      "categoryId": "7b049d97-158a-49c7-876a-3507c30932bb",
      "description": "Read 10 pages of Clean Code"
    }
    ```
*   **Success Response:** `201 Created`
    ```json
    {
      "success": true,
      "message": "Action created successfully",
      "data": {
        "id": "a9042b4d-3b52-4fe0-94d1-db29ee74659b",
        "description": "Read 10 pages of Clean Code",
        "isCompleted": false,
        "logId": "fb593d14-3a21-4f10-9cb4-8d486d34e2c8",
        "categoryId": "7b049d97-158a-49c7-876a-3507c30932bb",
        "createdAt": "2026-06-06T13:24:49.000Z",
        "updatedAt": "2026-06-06T13:24:49.000Z"
      }
    }
    ```
*   **Error Handling:**
    *   `400 Bad Request`: Returned when no DailyLog exists in the system to link the action to.
        ```json
        {
          "success": false,
          "message": "No daily log found to associate the action with"
        }
        ```
    *   `500 Internal Server Error`: Returned when server or database insertion fails.
        ```json
        {
          "success": false,
          "message": "Error creating action"
        }
        ```

### Toggle Action Completion Status
Toggles or updates the completion status (`isCompleted`) of a planned action.

*   **URL:** `/api/actions/:id`
*   **Method:** `PATCH`
*   **URL Parameters:**
    *   `id` (string, UUID): The ID of the planned action to modify.
*   **Body Payload:**
    ```json
    {
      "isCompleted": true
    }
    ```
*   **Success Response:** `200 OK`
    ```json
    {
      "success": true,
      "message": "Action updated successfully",
      "data": {
        "id": "a9042b4d-3b52-4fe0-94d1-db29ee74659b",
        "description": "Read 10 pages of Clean Code",
        "isCompleted": true,
        "logId": "fb593d14-3a21-4f10-9cb4-8d486d34e2c8",
        "categoryId": "7b049d97-158a-49c7-876a-3507c30932bb",
        "createdAt": "2026-06-06T13:24:49.000Z",
        "updatedAt": "2026-06-06T13:24:49.000Z"
      }
    }
    ```
*   **Error Handling:**
    *   `500 Internal Server Error`: Returned when the database update fails.
        ```json
        {
          "success": false,
          "message": "Error updating action"
        }
        ```
