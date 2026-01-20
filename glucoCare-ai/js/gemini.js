// ======================================================
//  gemini.js – WORKING VERSION (Using gemini-pro)
// ======================================================

const API_KEY = "AIzaSyCU8reXf_8AuqHMx47nNcTCtmJeI9K6Uys";

// 🔧 FIXED: Using "gemini-pro" (most compatible model)
// Alternative: Try "gemini-1.5-pro" if gemini-pro doesn't work
const MODEL = "gemini-2.5-flash";

let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 6000;

async function waitForRateLimit() {
  const now = Date.now();
  const diff = now - lastRequestTime;
  if (diff < MIN_REQUEST_INTERVAL) {
    await new Promise(r => setTimeout(r, MIN_REQUEST_INTERVAL - diff));
  }
  lastRequestTime = Date.now();
}

// ======================================================
//  FETCH WITH RETRY
// ======================================================
async function fetchWithRetry(url, options, retries = 2) {
  for (let i = 0; i <= retries; i++) {
    try {
      await waitForRateLimit();
      const res = await fetch(url, options);

      if (res.status === 429 && i < retries) {
        await new Promise(r => setTimeout(r, (i + 1) * 4000));
        continue;
      }

      return res;
    } catch (err) {
      if (i === retries) throw err;
      await new Promise(r => setTimeout(r, (i + 1) * 3000));
    }
  }
  throw new Error("Max retries exceeded");
}

// ======================================================
//  1️⃣ BLOOD REPORT ANALYSIS
// ======================================================
export async function analyzeBloodReport(ocrText, language) {
  try {
    if (!ocrText || ocrText.length < 5) {
      throw new Error("Invalid OCR text");
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`;

    const prompt = `You are Glucocare AI, an expert endocrinologist.

OCR TEXT:
"""
${ocrText}
"""

Analyze diabetes markers and give advice in ${language}.
Return clean HTML only with the following structure:
- Summary of key findings
- Blood glucose levels analysis
- HbA1c interpretation (if available)
- Recommendations
- Diet and lifestyle advice`;

    const res = await fetchWithRetry(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.6,
          maxOutputTokens: 2048
        }
      })
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error("API Error Response:", errorText);
      throw new Error(`API Error ${res.status}`);
    }

    const data = await res.json();
    const html = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!html) throw new Error("Empty AI response");

    return html.replace(/```html|```/g, "").trim();

  } catch (err) {
    console.error("Analyze Error:", err);
    return renderErrorHTML(err);
  }
}

// ======================================================
//  2️⃣ CHATBOT
// ======================================================
export async function getChatResponse(userMessage, reportContext) {
  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`;

    let prompt = `You are a medical AI assistant helping with diabetes management.\n`;

    if (reportContext) {
      prompt += `Based on this blood report:\n"""${reportContext.substring(0, 500)}"""\n\n`;
    }

    prompt += `User question: ${userMessage}\n\nProvide a helpful, concise answer (under 80 words).`;

    const res = await fetchWithRetry(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.6,
          maxOutputTokens: 512
        }
      })
    });

    if (!res.ok) {
      console.error("Chat API Error:", res.status);
      return "⚠️ AI unavailable. Try again.";
    }

    const data = await res.json();
    return data?.candidates?.[0]?.content?.parts?.[0]?.text || "No response.";

  } catch (err) {
    console.error("Chat Error:", err);
    return "⚠️ Connection issue.";
  }
}

// ======================================================
//  3️⃣ FOOD SCANNER (VISION)
// ======================================================
export async function analyzeFood(base64Image) {
  try {
    // Note: gemini-pro does NOT support vision
    // We need to use gemini-pro-vision for images
    const visionModel = "gemini-pro-vision";
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${visionModel}:generateContent?key=${API_KEY}`;

    const prompt = `Analyze this food image for diabetic patients.

Provide:
1. Food items identified
2. Estimated total carbohydrates
3. Glycemic index rating (Low/Medium/High)
4. Portion size recommendation for diabetics
5. Overall recommendation (Safe/Moderate/Avoid)

Return as clean HTML.`;

    const res = await fetchWithRetry(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
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
        }],
        generationConfig: {
          temperature: 0.4,
          maxOutputTokens: 1024
        }
      })
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error("Food API Error:", errorText);
      
      // Fallback message if vision model fails
      if (res.status === 404) {
        return `<div style="padding:15px;background:#fff3cd;border-radius:8px">
          <h3>📸 Vision Model Unavailable</h3>
          <p>The food scanner requires the vision model (gemini-pro-vision).</p>
          <p>Please verify this model is available in your API key settings.</p>
        </div>`;
      }
      
      throw new Error(`API Error ${res.status}`);
    }

    const data = await res.json();
    const html = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!html) throw new Error("Food analysis failed");

    return `<div style="padding:15px;background:#f8f9fa;border-radius:8px">${html.replace(/```/g, "")}</div>`;

  } catch (err) {
    console.error("Food Error:", err);
    return renderErrorHTML(err);
  }
}

// ======================================================
//  ERROR UI
// ======================================================
function renderErrorHTML(error) {
  return `
    <div style="padding:15px;border:1px solid #ffc107;background:#fff3cd;border-radius:8px">
      <h3>⚠️ Connection Issue</h3>
      <p><strong>Error:</strong> ${error.message}</p>
      <p style="font-size:0.9em;color:#555">
        Troubleshooting steps:<br>
        1. Check browser console (F12) for details<br>
        2. Verify API key is active<br>
        3. Try the test page to find working models<br>
        4. Wait 1 minute and try again
      </p>
    </div>
  `;
}