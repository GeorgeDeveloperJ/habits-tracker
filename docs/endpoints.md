# 📡 API Endpoints

This document outlines the RESTful API endpoints for the Habit Tracker backend, built with Express and Prisma. 

---

## 🎯 Habit Actions

The Habit Actions feature allows users to set specific, text-based daily goals (`PlannedActions`) for each of their 8 habit pillars and track their completion status.

### 1. Create a Daily Goal
Creates a specific action for the current active day. The backend automatically resolves the current `DailyLog` context.

* **URL:** `/api/actions`
* **Method:** `POST`
* **Body Payload:**
```json
  {
    "categoryId": "uuid-string-of-the-habit-category",
    "description": "Read 10 pages of Clean Code"
  }