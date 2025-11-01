
import { ref, push, get, child, serverTimestamp } from "firebase/database";
import { db } from '../firebase';
import { KycData, SavedKycData } from '../types';

export const saveKycData = async (data: KycData): Promise<void> => {
    try {
        const recordWithTimestamp = {
            ...data,
            timestamp: serverTimestamp(),
        };
        await push(ref(db, 'records'), recordWithTimestamp);
    } catch (error) {
        console.error("Error saving data to Firebase:", error);
        throw new Error("Could not save the record to the database.");
    }
};

export const getKycRecords = async (): Promise<SavedKycData[]> => {
    try {
        const snapshot = await get(child(ref(db), 'records'));
        if (snapshot.exists()) {
            const records: SavedKycData[] = [];
            const data = snapshot.val();
            for (const key in data) {
                records.push({ id: key, ...data[key] });
            }
            // Sort by most recent first
            return records.sort((a, b) => b.timestamp - a.timestamp);
        } else {
            return [];
        }
    } catch (error) {
        console.error("Error fetching data from Firebase:", error);
        throw new Error("Could not fetch records from the database.");
    }
};
