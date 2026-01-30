import { z } from 'zod';

export const storage = {
  get<T>(key: string, schema: z.ZodSchema<T>): T | null {
    try {
      const item = localStorage.getItem(key);
      if (!item) return null;

      const parsed = JSON.parse(item);
      const validated = schema.safeParse(parsed);

      if (!validated.success) {
        console.error(`Invalid data for key "${key}":`, validated.error);
        localStorage.removeItem(key); // Clear corrupted data
        return null;
      }

      return validated.data;
    } catch (error) {
      console.error(`Failed to read "${key}":`, error);
      localStorage.removeItem(key);
      return null;
    }
  },

  set<T>(key: string, value: T, schema?: z.ZodSchema<T>): boolean {
    try {
      // Validate before saving (optional but recommended)
      if (schema) {
        const validated = schema.safeParse(value);
        if (!validated.success) {
          console.error('Validation failed:', validated.error);
          return false;
        }
      }

      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error(`Failed to save "${key}":`, error);
      return false;
    }
  },
};
