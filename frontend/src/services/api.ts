/**
 * Service layer for Habit Tracker API communication.
 * Adheres to the 31-Day Cycle data model.
 */

const API_BASE_URL = 'http://localhost:3000/api';

/**
 * Interface representing a fixed habit category.
 */
export interface HabitCategory {
  id: string;
  name: string;
  description: string;
  icon?: string; // Optional icon identifier for the UI
}

/**
 * Fetches the 8 fixed habit categories from the backend.
 * @returns A promise that resolves to an array of HabitCategory.
 * @throws Error if the network request fails.
 */
export const fetchHabitCategories = async (): Promise<HabitCategory[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/habits`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Error ${response.status}: Failed to fetch categories`);
    }

    return await response.json();
  } catch (error) {
    console.error('API Error [fetchHabitCategories]:', error);
    throw error;
  }
};

/**
 * Saves a specific goal for tomorrow for a given habit category.
 * @param categoryId - The ID of the habit category.
 * @param goal - The specific goal string.
 * @returns A promise that resolves when the goal is saved.
 */
export const saveDailyGoal = async (categoryId: string, goal: string): Promise<void> => {
  try {
    const response = await fetch(`${API_BASE_URL}/goals`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ categoryId, goal, date: 'tomorrow' }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Error ${response.status}: Failed to save goal`);
    }
  } catch (error) {
    console.error('API Error [saveDailyGoal]:', error);
    throw error;
  }
};
