import { SvgScene } from "../types";

const CACHE_KEY = 'echoes-of-the-bell-image-cache';

/**
 * Loads the image cache from localStorage.
 * @returns {Map<string, string | SvgScene>} The loaded cache.
 */
export const loadCacheFromStorage = (): Map<string, string | SvgScene> => {
    try {
        const storedCache = localStorage.getItem(CACHE_KEY);
        if (storedCache) {
            // The stored cache is an array of [key, value] pairs from Map.entries()
            const parsed = JSON.parse(storedCache);
            if (Array.isArray(parsed)) {
                return new Map(parsed);
            }
        }
    } catch (error) {
        console.error("Failed to load image cache from localStorage:", error);
        // In case of error, start with a fresh cache
    }
    return new Map();
};

/**
 * Saves the image cache to localStorage.
 * @param {Map<string, string | SvgScene>} cache The cache to save.
 */
export const saveCacheToStorage = (cache: Map<string, string | SvgScene>): void => {
    try {
        if (cache.size === 0) {
            localStorage.removeItem(CACHE_KEY);
            return;
        }
        // Convert Map to an array of [key, value] pairs for reliable JSON serialization
        const array = Array.from(cache.entries());
        localStorage.setItem(CACHE_KEY, JSON.stringify(array));
    } catch (error) {
        console.error("Failed to save image cache to localStorage:", error);
    }
};
