import { auth } from './firebase-config.js';
import { 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword,
    signInWithPopup,
    GoogleAuthProvider
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// --- DOM ELEMENTS ---
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const loginBtn = document.getElementById('login-btn');
const signupBtn = document.getElementById('signup-btn');
const googleBtn = document.getElementById('google-btn');
const errorMessage = document.getElementById('error-message');

// --- Helper: Show Error ---
function showError(message) {
    errorMessage.innerText = message;
    errorMessage.style.display = 'block';
}

function clearError() {
    errorMessage.innerText = '';
    errorMessage.style.display = 'none';
}

// --- LOGIN HANDLER ---
loginBtn.addEventListener('click', async () => {
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    
    if (!email || !password) {
        showError("Please enter both email and password");
        return;
    }

    try {
        clearError();
        loginBtn.innerText = "Logging in...";
        loginBtn.disabled = true;
        
        await signInWithEmailAndPassword(auth, email, password);
        
        // Redirect to dashboard on success
        window.location.href = "dashboard.html";
        
    } catch (error) {
        console.error("Login error:", error);
        loginBtn.innerText = "Login";
        loginBtn.disabled = false;
        
        // User-friendly error messages
        if (error.code === 'auth/invalid-credential') {
            showError("Invalid email or password");
        } else if (error.code === 'auth/user-not-found') {
            showError("No account found with this email");
        } else if (error.code === 'auth/wrong-password') {
            showError("Incorrect password");
        } else if (error.code === 'auth/invalid-email') {
            showError("Invalid email format");
        } else {
            showError(error.message);
        }
    }
});

// --- SIGNUP HANDLER ---
signupBtn.addEventListener('click', async () => {
    const email = emailInput.value.trim();
    const password = passwordInput.value;

    if (!email || !password) {
        showError("Please enter both email and password");
        return;
    }

    if (password.length < 6) {
        showError("Password must be at least 6 characters");
        return;
    }

    try {
        clearError();
        signupBtn.innerText = "Creating Account...";
        signupBtn.disabled = true;
        
        await createUserWithEmailAndPassword(auth, email, password);
        
        // Redirect to dashboard on success
        window.location.href = "dashboard.html";
        
    } catch (error) {
        console.error("Signup error:", error);
        signupBtn.innerText = "Create Account";
        signupBtn.disabled = false;
        
        // User-friendly error messages
        if (error.code === 'auth/email-already-in-use') {
            showError("This email is already registered. Please login instead.");
        } else if (error.code === 'auth/invalid-email') {
            showError("Invalid email format");
        } else if (error.code === 'auth/weak-password') {
            showError("Password is too weak. Use at least 6 characters.");
        } else {
            showError(error.message);
        }
    }
});

// --- GOOGLE SIGN IN ---
googleBtn.addEventListener('click', async () => {
    try {
        clearError();
        googleBtn.innerText = "Signing in...";
        googleBtn.disabled = true;
        
        const provider = new GoogleAuthProvider();
        await signInWithPopup(auth, provider);
        
        // Redirect to dashboard on success
        window.location.href = "dashboard.html";
        
    } catch (error) {
        console.error("Google sign-in error:", error);
        googleBtn.innerText = "Sign in with Google";
        googleBtn.disabled = false;
        
        if (error.code === 'auth/popup-closed-by-user') {
            showError("Sign-in cancelled");
        } else {
            showError("Google sign-in failed: " + error.message);
        }
    }
});

// --- Allow Enter key to trigger login ---
passwordInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        loginBtn.click();
    }
});