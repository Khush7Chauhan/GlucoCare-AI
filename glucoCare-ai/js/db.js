import { db } from './firebase-config.js';
import { 
    collection, 
    addDoc, 
    getDocs, 
    query, 
    orderBy, 
    serverTimestamp 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// --- SAVE REPORT ---
export async function saveReportToHistory(userId, reportData) {
    try {
        // We store reports in a sub-collection: users/{userId}/reports
        const reportsRef = collection(db, "users", userId, "reports");
        
        await addDoc(reportsRef, {
            ...reportData,
            createdAt: serverTimestamp() // Let server set the time
        });
        
        console.log("Report saved successfully!");
        return true;
    } catch (error) {
        console.error("Error saving report:", error);
        return false;
    }
}

// --- GET HISTORY ---
export async function getUserHistory(userId) {
    const reportsRef = collection(db, "users", userId, "reports");
    
    // Order by newest first
    const q = query(reportsRef, orderBy("createdAt", "desc"));
    
    const querySnapshot = await getDocs(q);
    
    let history = [];
    querySnapshot.forEach((doc) => {
        history.push({
            id: doc.id,
            ...doc.data()
        });
    });
    return history;
}