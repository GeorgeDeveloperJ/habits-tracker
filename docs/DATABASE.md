# 🗄️ Database Architecture (Prisma)

Our backend utilizes **Prisma ORM** with a **PostgreSQL** database. The schema is designed to enforce the 31-day sprint logic and track daily atomic habits.

## 🗺️ Core Models

The database is built around 4 main entities:

1. **`HabitCategory` (The 8 Pillars):**
   - Represents the fundamental areas of life (Learning, Physical Health, Nutrition, etc.).
   - These are pre-seeded into the database and rarely change.

2. **`Cycle` (The Sprint):**
   - Represents the 31-day tracking period. 
   - Contains a boolean `isActive` flag to easily query the current ongoing sprint.

3. **`DailyLog` (The Day):**
   - Represents a single day within an active `Cycle`.
   - Acts as the container for all specific actions planned for that date.

4. **`PlannedAction` (The Specific Goals):**
   - The lowest level entity. Represents a user's specific written goal for a day (e.g., "Read 10 pages of Clean Code").
   - Ties together a `DailyLog` (when it happens) and a `HabitCategory` (what pillar it belongs to).
   - Contains the critical `isCompleted` boolean toggled by the frontend.

## 🛠️ Essential Commands

To interact with the database during development:

``` bash
# Apply schema changes to the database
npx prisma migrate dev --name <descriptive_name>

# Populate the database with the 8 default Habit Categories
npx prisma db seed

# Open the visual database viewer in your browser (http://localhost:5555)
npx prisma studio
```