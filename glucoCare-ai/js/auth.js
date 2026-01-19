import { auth } from './firebase-config.js';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  onAuthStateChanged,
  deleteUser
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// Signup Logic
async function handleSignup(email, password) {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    window.location.href = "dashboard.html"; // Redirect on success
  } catch (error) {
    alert("Signup Error: " + error.message);
  }
}

// Delete Account Logic
async function deleteAccount() {
  const user = auth.currentUser;
  if (user) {
    const confirmDelete = confirm("Are you sure? This cannot be undone.");
    if (confirmDelete) {
      try {
        await deleteUser(user);
        alert("Account deleted.");
        window.location.href = "index.html";
      } catch (error) {
        // Force re-login if sensitive operation fails
        alert("Please log in again to verify before deleting.");
      }
    }
  }
}

// Global Auth Listener (Put this in dashboard.js too)
onAuthStateChanged(auth, (user) => {
  if (user) {
    console.log("User is signed in:", user.uid);
  } else {
    // If on dashboard but not logged in, boot them out
    if(window.location.pathname.includes("dashboard.html")) {
        window.location.href = "index.html";
    }
  }
});