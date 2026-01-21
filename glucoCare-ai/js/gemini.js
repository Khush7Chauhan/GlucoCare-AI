// ======================================================
//  gemini.js – GEMINI 2.5 FLASH VERSION
// ======================================================

// YOUR API KEY
const API_KEY = "AIzaSyAx6_lUpbH4h5aXXXXXXXXXXXXXXXXX";

// 🔧 EXACT MODEL NAME FROM YOUR SCREENSHOT
const MODEL_NAME = "gemini-2.5-flash"; 

// ======================================================
//  1️⃣ BLOOD REPORT ANALYSIS
// ======================================================
export async function analyzeBloodReport(ocrText, language) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${API_KEY}`;

  const prompt = `
    You are Glucocare AI, an expert endocrinologist.
    Analyze this blood report text:
    """${ocrText}"""
    
    User Language: ${language}
    
    Provide output in this HTML format (no markdown):
    <div>
      <h3 style="color:#d9534f">🚨 Risk Assessment</h3>
      <p>[Summary of status]</p>
      
      <h3 style="color:#0275d8">🥗 Diet Plan</h3>
      <ul>
        <li>[Specific food advice]</li>
      </ul>
      
      <h3 style="color:#5cb85c">💪 Workout</h3>
      <ul>
        <li>[Exercise advice]</li>
      </ul>
    </div>
  `;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      // If 2.5 flash is in a specific beta, the error might be helpful
      throw new Error(errorData.error.message);
    }

    const data = await response.json();
    return data.candidates[0].content.parts[0].text;

  } catch (error) {
    console.error("Analysis Error:", error);
    return `<div style="color:red; padding:10px; border:1px solid red;">
              <strong>Error:</strong> ${error.message}
            </div>`;
  }
}

// ======================================================
//  2️⃣ CHATBOT LOGIC
// ======================================================
export async function getChatResponse(userMessage, reportContext) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${API_KEY}`;

  let context = "";
  if(reportContext) {
    context = `Context: User's blood report text: "${reportContext.substring(0, 1000)}..." \n`;
  }

  const prompt = `
    ${context}
    User asks: "${userMessage}"
    Answer as a medical assistant. Keep it short (under 50 words).
  `;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    });

    if (!response.ok) throw new Error("API Error");

    const data = await response.json();
    return data.candidates[0].content.parts[0].text;

  } catch (error) {
    return "Error: Could not reach AI.";
  }
}

// ======================================================
//  3️⃣ FOOD SCANNER (VISION)
// ======================================================
export async function analyzeFood(base64Image) {
  // Using gemini-2.5-flash for vision as well
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${API_KEY}`;

  const prompt = `
    You are an expert Dietitian.
    1. Identify the food.
    2. Estimate GI Score and Sugar.
    3. Verdict: Safe, Moderate, or Avoid for diabetics?
    
    Output HTML:
    <div>
      <h3 style="margin:0;">🍽️ [Food Name]</h3>
      <p><strong>Verdict:</strong> [Verdict]</p>
      <ul>
        <li><strong>GI Score:</strong> [Low/High]</li>
        <li><strong>Advice:</strong> [1 sentence tip]</li>
      </ul>
    </div>
  `;

  // Payload for Multimodal Request (Text + Image)
  const payload = {
    contents: [{
      parts: [
        { text: prompt },
        {
          inline_data: {
            mime_type: "image/jpeg",
            data: base64Image
          }
        }
      ]
    }]
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
       const err = await response.json();
       throw new Error(err.error.message);
    }

    const data = await response.json();
    return data.candidates[0].content.parts[0].text;

  } catch (error) {
    console.error("Food Scan Error:", error);
    return `<p style="color:red">Error identifying food: ${error.message}</p>`;
  }
}