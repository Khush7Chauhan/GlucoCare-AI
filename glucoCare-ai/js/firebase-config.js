// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
  // YOUR FIREBASE CONFIG KEYS HERE
  apiKey: "AIzaSyBJxpMXXXXXXXXXXXXXXXXXX",
  authDomain: "glucocareXXXXXXXXXXXX",
  projectId: "glucocarXXXXXXXXXX",
  storageBucket: "glucocareXXXXXXXXXXXXXXXXXX",
  messagingSenderId: "714XXXXXXXXXXXX",
  appId: "1:714247159XXXXXXXXXXXXXXXXXXXXX"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };