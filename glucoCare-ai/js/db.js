import { db } from './firebase-config.js';
import { 
    collection, 
    addDoc, 
    getDocs, 
    query, 
    orderBy, 
    serverTimestamp 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

export async function saveReportToHistory(userId, reportData) {
    try {
        const reportsRef = collection(db, "users", userId, "reports");
        
        await addDoc(reportsRef, {
            ...reportData,
            createdAt: serverTimestamp() 
        });
        
        console.log("Report saved successfully!");
        return true;
    } catch (error) {
        console.error("Error saving report:", error);
        return false;
    }
}

export async function getUserHistory(userId) {
    const reportsRef = collection(db, "users", userId, "reports");
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