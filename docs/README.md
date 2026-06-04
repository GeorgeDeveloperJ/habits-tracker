# ⚡ Proactive 31-Day Habit Tracker

## 💻 Tech Stack

**Backend Engine**

![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Express.js](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=for-the-badge&logo=prisma&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)

**Frontend App**

![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)


More than just a tracker: a **31-day planning engine**. 

Traditional habit trackers focus on passive logging—checking a box for what you already did. This project enforces **proactive discipline**. It tracks 8 core pillars of your life by requiring you to define specific, actionable goals for the *next* day, ensuring that tomorrow's success is mapped out tonight.

## ✨ Core Features
* **31-Day Sprints:** Build momentum through defined, month-long cycles.
* **The 8 Core Pillars:** Fixed foundational habits (Learning, Physical Health, Nutrition, Mindfulness, Work/Focus, Finances, Organization, Rest).
* **Proactive Planning Engine:** You cannot "close" today until you have planned actionable tasks for tomorrow's 8 pillars.
* **Modern Tech Stack:** Fully typed end-to-end using TypeScript.

## 🏗️ Architecture
This project is structured as a monorepo containing two isolated environments:
* **Backend:** Node.js, Express, TypeScript, Prisma ORM, and PostgreSQL.
* **Frontend:** React, Vite, TypeScript, and Tailwind CSS.

## 🚀 Getting Started

### Prerequisites
* [Node.js](https://nodejs.org/) (v18 or higher)
* [PostgreSQL](https://www.postgresql.org/) running locally or in the cloud.

### 1. Clone the repository
```bash
git clone https://github.com/your-username/habits-tracker.git
cd habits-tracker
```

### 2. Backend Setup
Navigate to the backend directory and install dependencies:
```bash
cd backend
npm install
```
Set up your environment variables by copying the example file:
```bash
cp .env.example .env
```
*(Update the `DATABASE_URL` in your `.env` file with your PostgreSQL credentials).*

Run the database migrations and seed the 8 core habits:
```bash
npx prisma migrate dev --name init
npx prisma db seed
```
Start the development server:
```bash
npm run dev
```
The API will be available at `http://localhost:3000`.

### 3. Frontend Setup
Open a new terminal tab, navigate to the frontend directory, and install dependencies:
```bash
cd frontend
npm install
```
Start the Vite development server:
```bash
npm run dev
```
The application will be available at `http://localhost:5173`.

## 📜 License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.