
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBJxpMlNjTO1XXXXXXXXXXXXXXXXXXXX",
  authDomain: "glucocare-24XXXXXXXXXXXXXXXXXX",
  projectId: "glucoXXXXXXXXXXXXXXXXX",
  storageBucket: "glucocXXXXXXXXXXXXXXXXX",
  messagingSenderId: "71424XXXXXXXXXXX",
  appId: "1:71424715993XXXXXXXXXXXXXXXXXXXXX"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };