import { auth } from './firebase-config.js';
import { 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword,
    signInWithPopup,
    GoogleAuthProvider,
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// Import your Gemini and DB functions
// UPDATED: Added analyzeFood to the import
import { analyzeBloodReport, getChatResponse, analyzeFood } from './gemini.js';
import { saveReportToHistory, getUserHistory } from './db.js';


// ==========================================
//  PART 1: AUTHENTICATION LOGIC (Login Page)
// ==========================================

const loginBtn = document.getElementById('login-btn');
const signupBtn = document.getElementById('signup-btn');
const googleBtn = document.getElementById('google-btn');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const errorMessage = document.getElementById('error-message');

function showError(message) {
    if(errorMessage) {
        errorMessage.innerText = message;
        errorMessage.style.display = 'block';
    } else {
        alert(message);
    }
}

// 1. Login
if (loginBtn) {
    loginBtn.addEventListener('click', async () => {
        const email = emailInput.value.trim();
        const password = passwordInput.value;
        
        if (!email || !password) return showError("Please enter both email and password");

        try {
            loginBtn.innerText = "Logging in...";
            loginBtn.disabled = true;
            await signInWithEmailAndPassword(auth, email, password);
            window.location.href = "dashboard.html"; 
        } catch (error) {
            console.error("Login error:", error);
            loginBtn.innerText = "Login";
            loginBtn.disabled = false;
            showError(error.message);
        }
    });
}

// 2. Signup
if (signupBtn) {
    signupBtn.addEventListener('click', async () => {
        const email = emailInput.value.trim();
        const password = passwordInput.value;

        if (!email || !password) return showError("Please enter both email and password");
        if (password.length < 6) return showError("Password must be 6+ chars");

        try {
            signupBtn.innerText = "Creating...";
            signupBtn.disabled = true;
            await createUserWithEmailAndPassword(auth, email, password);
            window.location.href = "dashboard.html";
        } catch (error) {
            console.error("Signup error:", error);
            signupBtn.innerText = "Create Account";
            signupBtn.disabled = false;
            showError(error.message);
        }
    });
}

// 3. Google Sign-In
if (googleBtn) {
    googleBtn.addEventListener('click', async () => {
        try {
            googleBtn.innerText = "Signing in...";
            const provider = new GoogleAuthProvider();
            await signInWithPopup(auth, provider);
            window.location.href = "dashboard.html";
        } catch (error) {
            console.error(error);
            googleBtn.innerText = "Sign in with Google";
            showError(error.message);
        }
    });
}


// ==========================================
//  PART 2: DASHBOARD LOGIC (Dashboard Page)
// ==========================================

const analyzeBtn = document.getElementById('analyze-btn');
const chatBtn = document.getElementById('send-chat-btn');
// NEW: Get the Food Scanner button
const scanFoodBtn = document.getElementById('scan-food-btn');
const userDisplay = document.getElementById('user-display');

// Global variable to store the report text for the chatbot
let currentReportContext = ""; 
let currentUser = null;

// 1. Check Auth State & Load History
onAuthStateChanged(auth, (user) => {
    if (user) {
        currentUser = user;
        if(userDisplay) userDisplay.innerText = user.email;
        
        // Only load history if we are on the dashboard
        if (document.getElementById('history-list')) {
            refreshHistory(user.uid);
        }
    } else {
        // If we are on dashboard but not logged in, redirect to login
        if (window.location.pathname.includes('dashboard.html')) {
            window.location.href = "index.html";
        }
    }
});

// 2. Global Logout Function
window.logout = async () => {
    await signOut(auth);
    window.location.href = "index.html";
};


// 3. REPORT ANALYSIS LOGIC (OCR + Gemini)
if (analyzeBtn) {
    analyzeBtn.addEventListener('click', async () => {
        const fileInput = document.getElementById('report-file');
        const lang = document.getElementById('language-select').value;
        const statusText = document.getElementById('status-text');
        const progressBar = document.getElementById('progress-bar');
        const progressContainer = document.getElementById('progress-container');
        const resultSection = document.getElementById('result-section');
        const chatSection = document.getElementById('chat-section');

        if(fileInput.files.length === 0) return alert("Please select a file!");
        const file = fileInput.files[0];

        // Reset UI
        progressContainer.style.display = 'block';
        progressBar.style.width = '0%';
        resultSection.classList.add('hidden');
        chatSection.classList.add('hidden');
        
        try {
            // STEP A: OCR
            statusText.innerText = "Scanning image text (OCR)...";
            progressBar.style.width = "30%";
            
            const worker = await Tesseract.createWorker('eng');
            const ret = await worker.recognize(file);
            const ocrText = ret.data.text;
            await worker.terminate();

            // SAVE CONTEXT FOR CHATBOT
            currentReportContext = ocrText; 
            console.log("Context saved:", currentReportContext.substring(0, 50) + "...");

            if(!ocrText || ocrText.length < 5) throw new Error("Image too blurry.");

            // STEP B: Gemini Analysis
            statusText.innerText = "Consulting Glucocare AI...";
            progressBar.style.width = "60%";
            
            const aiResponseHTML = await analyzeBloodReport(ocrText, lang);

            // STEP C: Save to History
            statusText.innerText = "Saving data...";
            progressBar.style.width = "90%";
            
            await saveReportToHistory(currentUser.uid, {
                fileName: file.name,
                language: lang,
                ocrTextSnippet: ocrText.substring(0, 100),
                analysisResult: aiResponseHTML
            });

            // STEP D: Show Results
            progressBar.style.width = "100%";
            statusText.innerText = "Done!";
            
            document.getElementById('gemini-output').innerHTML = aiResponseHTML;
            resultSection.classList.remove('hidden');
            chatSection.classList.remove('hidden'); // Enable Chatbot
            
            refreshHistory(currentUser.uid);

        } catch (error) {
            console.error(error);
            statusText.innerText = "Error: " + error.message;
            statusText.style.color = "red";
            progressBar.style.backgroundColor = "red";
        }
    });
}


// 4. CHATBOT LOGIC
if (chatBtn) {
    chatBtn.addEventListener('click', async () => {
        const input = document.getElementById('chat-input');
        const chatWindow = document.getElementById('chat-window');
        const userMsg = input.value.trim();

        if (!userMsg) return;

        // A. Display User Message
        chatWindow.innerHTML += `
            <div class="msg-container-right">
                <div class="user-msg">${userMsg}</div>
            </div>`;
        
        input.value = "";
        chatWindow.scrollTop = chatWindow.scrollHeight;

        // B. Show "Thinking..."
        const loadingId = "loading-" + Date.now();
        chatWindow.innerHTML += `
            <div class="msg-container-left" id="${loadingId}">
                <div class="bot-msg">Thinking...</div>
            </div>`;
        chatWindow.scrollTop = chatWindow.scrollHeight;

        try {
            // C. Call Gemini Chat
            // We pass 'currentReportContext' so AI knows about the blood report
            const aiResponse = await getChatResponse(userMsg, currentReportContext);

            // D. Display AI Response
            document.getElementById(loadingId).remove();
            chatWindow.innerHTML += `
                <div class="msg-container-left">
                    <div class="bot-msg">${aiResponse}</div>
                </div>`;
            
        } catch (err) {
            console.error(err);
            document.getElementById(loadingId).innerText = "Error connecting to AI.";
        }
        
        chatWindow.scrollTop = chatWindow.scrollHeight;
    });
}


// 5. FOOD SCANNER LOGIC (NEW)
if (scanFoodBtn) {
    scanFoodBtn.addEventListener('click', async () => {
        const fileInput = document.getElementById('food-file');
        const resultDiv = document.getElementById('food-result');

        if (fileInput.files.length === 0) return alert("Please select a food image first!");
        const file = fileInput.files[0];

        // UI Updates
        scanFoodBtn.innerText = "Scanning...";
        scanFoodBtn.disabled = true;
        resultDiv.style.display = 'block';
        resultDiv.innerHTML = "<p>🔍 AI is analyzing your food...</p>";

        try {
            // A. Convert Image to Base64 (Required for Gemini Vision)
            const base64String = await fileToBase64(file);
            
            // B. Call Gemini
            const aiResponse = await analyzeFood(base64String);
            
            // C. Display Result
            resultDiv.innerHTML = aiResponse;

        } catch (error) {
            console.error(error);
            resultDiv.innerHTML = `<p style="color:red">Error scanning food: ${error.message}</p>`;
        } finally {
            scanFoodBtn.innerText = "Scan Food";
            scanFoodBtn.disabled = false;
        }
    });
}


// ==========================================
//  PART 3: HELPER FUNCTIONS
// ==========================================

async function refreshHistory(uid) {
    const list = document.getElementById('history-list');
    if (!list) return; // Exit if list doesn't exist (e.g. login page)

    list.innerHTML = "<li>Loading...</li>";
    const history = await getUserHistory(uid);
    list.innerHTML = ""; 

    if(history.length === 0) {
        list.innerHTML = "<li>No past reports found.</li>";
        return;
    }

    history.forEach(report => {
        const li = document.createElement('li');
        const dateStr = report.createdAt ? new Date(report.createdAt.seconds * 1000).toLocaleDateString() : "Just now";
        
        li.innerHTML = `
            <span><strong>${dateStr}</strong> - ${report.fileName}</span>
            <button class="view-btn">View</button>
        `;
        
        li.querySelector('.view-btn').addEventListener('click', () => {
            // Restore the Analysis
            document.getElementById('gemini-output').innerHTML = report.analysisResult;
            document.getElementById('result-section').classList.remove('hidden');
            
            // Allow chatting about this old report (if we saved the snippet/text)
            // Note: If you want full context, you need to save full OCR text in 'db.js'
            document.getElementById('chat-section').classList.remove('hidden'); 
            
            document.getElementById('result-section').scrollIntoView({ behavior: 'smooth' });
        });

        list.appendChild(li);
    });
}

// HELPER: Convert File to Base64 (Required for Gemini Vision)
function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            // Remove the "data:image/jpeg;base64," prefix so we just get the string
            const base64String = reader.result.split(',')[1];
            resolve(base64String);
        };
        reader.onerror = error => reject(error);
    });
}
// ==========================================
//  PART 6: VOICE ASSISTANT LOGIC (NEW)
// ==========================================

const speakBtn = document.getElementById('speak-btn');
let isSpeaking = false;

if (speakBtn) {
    speakBtn.addEventListener('click', () => {
        // 1. Get the text to read
        const resultText = document.getElementById('gemini-output').innerText;
        
        if (!resultText) return alert("No analysis to read yet!");

        // 2. Toggle Logic (Stop if already speaking)
        if (isSpeaking) {
            window.speechSynthesis.cancel();
            speakBtn.innerHTML = "🔊 Listen";
            isSpeaking = false;
            return;
        }

        // 3. Create Speech Object
        const speech = new SpeechSynthesisUtterance(resultText);
        
        // Optional: Customize Voice
        speech.lang = 'en-US'; // Default to English
        speech.rate = 1;       // Normal speed
        speech.pitch = 1;      // Normal pitch

        // 4. Update Button UI
        speakBtn.innerHTML = "Cc Stop";
        isSpeaking = true;

        // 5. Handle "Finish" event
        speech.onend = () => {
            speakBtn.innerHTML = "🔊 Listen";
            isSpeaking = false;
        };

        // 6. Speak
        window.speechSynthesis.speak(speech);
    });
}