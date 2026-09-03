import { openDB, IDBPDatabase } from 'idb';

// Define the type for punchState
interface PunchState {
    id?: string; // Optional since it's added in the function
    isPunchIn: boolean;
    startTime: string;
    endTime?: string; // Optional, since it may not be set until punch out
    totalTime: string;
    timestamp?: number; // Optional, used for restoring punch state
}

// Initialize the database
export async function initDB(): Promise<IDBPDatabase> {
    return openDB('punchDB', 1, {
        upgrade(db) {
            if (!db.objectStoreNames.contains('punchState')) {
                db.createObjectStore('punchState', { keyPath: 'id' });
            }
        },
    });
}

// Save punchState to IndexedDB
export async function setPunchStateInDB(punchState: PunchState): Promise<void> {
    const db = await initDB();
    await db.put('punchState', { id: 'current', ...punchState });
}

// Get punchState from IndexedDB
export async function getPunchStateFromDB(): Promise<PunchState | undefined> {
    const db = await initDB();
    return await db.get('punchState', 'current');
}

// Remove punchState from IndexedDB
export async function removePunchStateFromDB(): Promise<void> {
    const db = await initDB();
    return await db.delete('punchState', 'current');
}
