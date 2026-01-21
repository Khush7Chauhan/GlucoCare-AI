import { auth } from './firebase-config.js';
import { 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword,
    signInWithPopup,
    GoogleAuthProvider,
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import { analyzeBloodReport, getChatResponse, analyzeFood } from './gemini.js';
import { saveReportToHistory, getUserHistory } from './db.js';
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

const analyzeBtn = document.getElementById('analyze-btn');
const chatBtn = document.getElementById('send-chat-btn');
const scanFoodBtn = document.getElementById('scan-food-btn');
const userDisplay = document.getElementById('user-display');

const dashboardTab = document.getElementById('dashboard-tab');
const reportsTab = document.getElementById('reports-tab');
const uploadSection = document.getElementById('upload-section');
const resultSection = document.getElementById('result-section');

let currentReportContext = ""; 
let currentUser = null;

onAuthStateChanged(auth, (user) => {
    if (user) {
        currentUser = user;
        if(userDisplay) userDisplay.innerText = user.email;
        
        if (document.getElementById('history-list')) {
            refreshHistory(user.uid);
        }
    } else {
        
        if (window.location.pathname.includes('dashboard.html')) {
            window.location.href = "index.html";
        }
    }
});


window.logout = async () => {
    await signOut(auth);
    window.location.href = "index.html";
};


if (dashboardTab && reportsTab) {
    dashboardTab.addEventListener('click', () => {
        
        dashboardTab.classList.add('active');
        reportsTab.classList.remove('active');
        
        if (uploadSection) uploadSection.classList.remove('hidden');
        if (resultSection) resultSection.classList.add('hidden');
    });

    reportsTab.addEventListener('click', () => {
        reportsTab.classList.add('active');
        dashboardTab.classList.remove('active');
        
        if (uploadSection) uploadSection.classList.add('hidden');
        
        if (resultSection && resultSection.classList.contains('hidden')) {
            resultSection.classList.remove('hidden');
            document.getElementById('gemini-output').innerHTML = 
                '<p style="text-align: center; color: #a3aed0; padding: 40px;">Select a report from the sidebar to view its analysis.</p>';
            document.getElementById('chat-section').classList.add('hidden');
        }
    });
}

if (analyzeBtn) {
    analyzeBtn.addEventListener('click', async () => {
        const fileInput = document.getElementById('report-file');
        const lang = document.getElementById('language-select').value;
        const statusText = document.getElementById('status-text');
        const progressBar = document.getElementById('progress-bar');
        const progressContainer = document.getElementById('progress-container');
        const chatSection = document.getElementById('chat-section');

        if(fileInput.files.length === 0) return alert("Please select a file!");
        const file = fileInput.files[0];

        progressContainer.style.display = 'block';
        progressBar.style.width = '0%';
        resultSection.classList.add('hidden');
        chatSection.classList.add('hidden');
        
        try {
            statusText.innerText = "Scanning image text (OCR)...";
            progressBar.style.width = "30%";
            
            const worker = await Tesseract.createWorker('eng');
            const ret = await worker.recognize(file);
            const ocrText = ret.data.text;
            await worker.terminate();

            currentReportContext = ocrText; 
            console.log("Context saved:", currentReportContext.substring(0, 50) + "...");

            if(!ocrText || ocrText.length < 5) throw new Error("Image too blurry.");

            statusText.innerText = "Consulting Glucocare AI...";
            progressBar.style.width = "60%";
            
            const aiResponseHTML = await analyzeBloodReport(ocrText, lang);

            statusText.innerText = "Saving data...";
            progressBar.style.width = "90%";
            
            await saveReportToHistory(currentUser.uid, {
                fileName: file.name,
                language: lang,
                ocrTextSnippet: ocrText.substring(0, 100),
                analysisResult: aiResponseHTML
            });

            progressBar.style.width = "100%";
            statusText.innerText = "Done!";
            
            document.getElementById('gemini-output').innerHTML = aiResponseHTML;
            resultSection.classList.remove('hidden');
            chatSection.classList.remove('hidden'); 
            
            refreshHistory(currentUser.uid);

        } catch (error) {
            console.error(error);
            statusText.innerText = "Error: " + error.message;
            statusText.style.color = "red";
            progressBar.style.backgroundColor = "red";
        }
    });
}

if (chatBtn) {
    chatBtn.addEventListener('click', async () => {
        const input = document.getElementById('chat-input');
        const chatWindow = document.getElementById('chat-window');
        const userMsg = input.value.trim();

        if (!userMsg) return;

        chatWindow.innerHTML += `
            <div class="msg-container-right">
                <div class="user-msg">${userMsg}</div>
            </div>`;
        
        input.value = "";
        chatWindow.scrollTop = chatWindow.scrollHeight;

        const loadingId = "loading-" + Date.now();
        chatWindow.innerHTML += `
            <div class="msg-container-left" id="${loadingId}">
                <div class="bot-msg">Thinking...</div>
            </div>`;
        chatWindow.scrollTop = chatWindow.scrollHeight;

        try {
        
            const aiResponse = await getChatResponse(userMsg, currentReportContext);
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



if (scanFoodBtn) {
    scanFoodBtn.addEventListener('click', async () => {
        const fileInput = document.getElementById('food-file');
        const resultDiv = document.getElementById('food-result');

        if (fileInput.files.length === 0) return alert("Please select a food image first!");
        const file = fileInput.files[0];
        scanFoodBtn.innerText = "Scanning...";
        scanFoodBtn.disabled = true;
        resultDiv.style.display = 'block';
        resultDiv.innerHTML = "<p>🔍 AI is analyzing your food...</p>";

        try {
            const base64String = await fileToBase64(file);
            
            const aiResponse = await analyzeFood(base64String);
            
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

async function refreshHistory(uid) {
    const list = document.getElementById('history-list');
    if (!list) return;

    list.innerHTML = "<li>Loading...</li>";
    const history = await getUserHistory(uid);
    list.innerHTML = ""; 

    if(history.length === 0) {
        list.innerHTML = "<li style='text-align:center; color:rgba(255,255,255,0.5); padding: 10px;'>No past reports found.</li>";
        return;
    }

    history.forEach(report => {
        const li = document.createElement('li');
        li.className = 'history-item';
        const dateStr = report.createdAt ? new Date(report.createdAt.seconds * 1000).toLocaleDateString() : "Just now";
        
        li.innerHTML = `
            <div style="margin-bottom: 5px;"><strong>${dateStr}</strong></div>
            <div style="font-size: 0.75rem; color: rgba(255,255,255,0.7); margin-bottom: 8px;">${report.fileName}</div>
            <button class="view-btn">View Report</button>
        `;
        
        li.querySelector('.view-btn').addEventListener('click', () => {
            if (reportsTab) {
                reportsTab.classList.add('active');
                dashboardTab.classList.remove('active');
            }
            
            if (uploadSection) uploadSection.classList.add('hidden');
            
            document.getElementById('gemini-output').innerHTML = report.analysisResult;
            resultSection.classList.remove('hidden');
            document.getElementById('chat-section').classList.remove('hidden');
            currentReportContext = report.ocrTextSnippet || "";
            
            resultSection.scrollIntoView({ behavior: 'smooth' });
        });

        list.appendChild(li);
    });
}

function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            const base64String = reader.result.split(',')[1];
            resolve(base64String);
        };
        reader.onerror = error => reject(error);
    });
}

const speakBtn = document.getElementById('speak-btn');
let isSpeaking = false;

if (speakBtn) {
    speakBtn.addEventListener('click', () => {
        const resultText = document.getElementById('gemini-output').innerText;
        
        if (!resultText) return alert("No analysis to read yet!");

        if (isSpeaking) {
            window.speechSynthesis.cancel();
            speakBtn.innerHTML = "<span>🔊</span> Listen";
            isSpeaking = false;
            return;
        }

        const speech = new SpeechSynthesisUtterance(resultText);
        speech.lang = 'en-US';
        speech.rate = 1;
        speech.pitch = 1;

        speakBtn.innerHTML = "<span>⏸️</span> Stop";
        isSpeaking = true;

        speech.onend = () => {
            speakBtn.innerHTML = "<span>🔊</span> Listen";
            isSpeaking = false;
        };

        window.speechSynthesis.speak(speech);
    });
}