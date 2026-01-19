// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
  // YOUR FIREBASE CONFIG KEYS HERE
  apiKey: "AIzaSyBJxpMlNjTO135euVsPtFm-mUePSgwatWs",
  authDomain: "glucocare-24dc6.firebaseapp.com",
  projectId: "glucocare-24dc6",
  storageBucket: "glucocare-24dc6.firebasestorage.app",
  messagingSenderId: "714247159932",
  appId: "1:714247159932:web:29428d10ab39e5a8de89f9"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };