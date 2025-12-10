
import { WorksheetData, GenerationConfig } from "../types";

const CACHE_VERSION = 'v1.4';
const CACHE_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 Hours

// === HostGator MySQL API Endpoint ===
// Ensure this URL is correct and supports CORS from your domain.
const API_BASE_URL: string = 'https://educationalresource.org/worksheet_api/cache_api.php'; 

interface CacheEntry {
    timestamp: number;
    data: WorksheetData;
    version: string;
}

/**
 * Generates a deterministic key based on the generation parameters.
 * Identical requests produce identical keys.
 */
export function getCacheKey(config: GenerationConfig, existingPassage?: { title: string, content: string }): string {
    // Only include properties that affect content generation
    const keyObj = {
        standards: config.selectedStandards.slice().sort(),
        counts: config.standardCounts,
        subcategories: config.selectedSubcategories,
        names: config.studentNames ? config.studentNames.trim() : '',
        topic: config.customTopic ? config.customTopic.trim() : '',
        len: config.passageLength,
        extContext: existingPassage ? { t: existingPassage.title, c: existingPassage.content.length } : null
    };
    
    // Create a hash-like string
    const rawString = JSON.stringify(keyObj);
    
    // Simple hash function for shorter keys
    let hash = 0;
    for (let i = 0; i < rawString.length; i++) {
        const char = rawString.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    
    return `ws_${CACHE_VERSION}_${Math.abs(hash)}`;
}

/**
 * Hybrid Get: Checks LocalStorage first (speed), then MySQL API (global sharing).
 */
export async function getFromCache(key: string): Promise<WorksheetData | null> {
    const now = Date.now();

    // 1. Check Local Cache (Level 1 - Browser)
    try {
        const localItem = localStorage.getItem(key);
        if (localItem) {
            const entry: CacheEntry = JSON.parse(localItem);
            if (now - entry.timestamp < CACHE_EXPIRY_MS && entry.version === CACHE_VERSION) {
                console.log("⚡ Local Cache Hit");
                return entry.data;
            } else {
                localStorage.removeItem(key);
            }
        }
    } catch (e) { console.warn("Local cache read error", e); }

    // 2. Check Server Cache (Level 2 - HostGator MySQL)
    if (!API_BASE_URL) return null;

    try {
        // GET request to read the cache
        const response = await fetch(`${API_BASE_URL}?key=${encodeURIComponent(key)}`, {
            method: 'GET',
            mode: 'cors', // Explicitly require CORS
            headers: { 'Accept': 'application/json' }
        });
        
        if (response.status === 200) {
            console.log("✨ GLOBAL CACHE HIT (MySQL)! Cost saved.");
            const data = await response.json() as WorksheetData;
            
            // Re-hydrate local cache so next time it is instant
            const entry: CacheEntry = {
                timestamp: Date.now(),
                data: data,
                version: CACHE_VERSION
            };
            try { localStorage.setItem(key, JSON.stringify(entry)); } catch (e) {}

            return data;
        }
    } catch (e) {
        // Suppress "Failed to fetch" which occurs if API is down or blocked by CORS/Privacy blockers
        console.warn("Global cache API unreachable (Network/CORS). Skipping.");
    }

    return null;
}

/**
 * Hybrid Set: Saves to both LocalStorage and MySQL API.
 */
export async function saveToCache(key: string, data: WorksheetData): Promise<void> {
    // 1. Save Local
    const entry: CacheEntry = {
        timestamp: Date.now(),
        data: data,
        version: CACHE_VERSION
    };

    try {
        // Cleanup old keys if too many
        if (localStorage.length > 50) {
            Object.keys(localStorage).forEach(k => {
                if (k.startsWith('ws_')) localStorage.removeItem(k);
            });
        }
        localStorage.setItem(key, JSON.stringify(entry));
    } catch (e) { console.warn("Local save failed", e); }

    // 2. Save Server (HostGator MySQL)
    if (!API_BASE_URL) return;

    try {
        // POST request to write the cache
        await fetch(API_BASE_URL, {
            method: 'POST',
            mode: 'cors',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ cache_key: key, worksheet_data: data }) 
        });
        console.log("☁️ Saved to MySQL Cache");
    } catch (e) {
        // Suppress "Failed to fetch" errors on write
        console.warn("Global cache write failed (Network/CORS).");
    }
}
