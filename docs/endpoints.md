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

## 🔐 Authentication

Send the session token as `Authorization: Bearer <token>` on authenticated requests. Requests that send an email accept a `language` of `en` or `es` and default to English.

### Register and sign in

Send `{ email, password, language? }` to `POST /api/auth/register` to start signup. A successful request returns `202 Accepted` with a verification challenge. The user is created after verification.

Send the same fields to `POST /api/auth/login`. Verified accounts receive `200 OK` with `data: { token, id, email }`. For an unverified account with a valid password, the API sends a code and returns the same `202 Accepted` response as signup.

```json
{
  "success": true,
  "code": "verification_required",
  "data": {
    "challengeId": "e7b049d9-7158-49c7-876a-3507c30932bb",
    "email": "user@example.com",
    "deliveryFailed": false
  }
}
```

If `deliveryFailed` is true, offer to resend the code after the cooldown. Invalid credentials return `401`. Invalid signup inputs and duplicate accounts return `400`. Requests requiring email delivery return `503` when SMTP is unconfigured.

### Verify an email address

Send `{ challengeId, code }` to `POST /api/auth/verify-email`. Treat the six-digit code as a string to preserve leading zeroes. Codes expire after 10 minutes or five incorrect guesses. On success, the API returns `data: { token, id, email }` with `201 Created` for a new account or `200 OK` for an existing account. An invalid, expired, or used code returns `400`.

Send `{ challengeId, language? }` to `POST /api/auth/resend-verification` to replace the code. The API returns the same `202 Accepted` response and enforces a 60-second cooldown per email. A rate-limited request returns `429` with a `Retry-After` header.

### Recover a password

Send `{ email, language? }` to `POST /api/auth/forgot-password`. A successful response is generic. A matching account receives a link by email. Send `{ token, password }` to `POST /api/auth/reset-password` to use the link and invalidate existing sessions. The user then signs in with the new password.

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

### Cycle history pagination

`GET /api/cycles/history` returns up to 20 cycles in descending start date and ID order, with summary counts and a nullable `nextCursor`. Send a non-null cursor as `?cursor=<id>` for the next page. Open a cycle through `GET /api/cycle-progress/<id>` for its logs and actions.
