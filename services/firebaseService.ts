import { ref, push, get, child, serverTimestamp, query, orderByChild, equalTo, limitToFirst, update } from "firebase/database";
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

export const findRecordByUniqueId = async (data: KycData): Promise<SavedKycData | null> => {
    const uniqueId = data.nationalId || data.passportNumber;
    if (!uniqueId) {
        return null;
    }
    const searchField = data.nationalId ? 'nationalId' : 'passportNumber';

    try {
        const recordsRef = ref(db, 'records');
        // Fetch all records instead of performing a server-side query.
        const snapshot = await get(recordsRef);

        if (snapshot.exists()) {
            const records: SavedKycData[] = [];
            const allData = snapshot.val();
            for (const key in allData) {
                records.push({ id: key, ...allData[key] });
            }
            
            // Perform the search on the client-side to find the duplicate.
            const foundRecord = records.find(record => record[searchField as keyof KycData] === uniqueId);
            
            return foundRecord || null;
        }
        return null;
    } catch (error) {
        console.error("Error finding record by unique ID:", error);
        throw new Error("Could not search the database for duplicates.");
    }
};

export const updateKycRecord = async (recordId: string, data: KycData): Promise<void> => {
    try {
        const recordRef = ref(db, `records/${recordId}`);
        const recordWithTimestamp = {
            ...data,
            timestamp: serverTimestamp(),
        };
        await update(recordRef, recordWithTimestamp);
    } catch (error) {
        console.error("Error updating data in Firebase:", error);
        throw new Error("Could not update the record in the database.");
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