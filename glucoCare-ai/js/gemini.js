const API_KEY = "AIzaSyDeo_gMtFxzD_PYj3T9tIQGD-lVNpeFAl4";

// First, let's check what models are available
async function listAvailableModels() {
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`
    );
    const data = await response.json();
    console.log("Available models:", data);
    return data.models || [];
  } catch (error) {
    console.error("Error listing models:", error);
    return [];
  }
}

export async function analyzeBloodReport(ocrText, language) {
  try {
    // First check available models
    const models = await listAvailableModels();
    console.log("Checking available models...");
    
    // Try different model endpoints in order of preference
    const modelsToTry = [
      'gemini-1.5-flash-latest',
      'gemini-1.5-flash',
      'gemini-1.5-pro-latest', 
      'gemini-1.5-pro',
      'gemini-pro',
      'gemini-pro-vision'
    ];
    
    let workingModel = null;
    
    // Find first working model from available models
    if (models.length > 0) {
      for (let model of models) {
        if (model.name && model.supportedGenerationMethods?.includes('generateContent')) {
          workingModel = model.name.replace('models/', '');
          console.log("Found working model:", workingModel);
          break;
        }
      }
    }
    
    // Fallback: try the models list if API didn't return available models
    if (!workingModel) {
      workingModel = 'gemini-1.5-flash-latest';
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${workingModel}:generateContent?key=${API_KEY}`;
    
    console.log("Attempting to use model:", workingModel);

    const prompt = `
You are Glucocare AI, an expert endocrinologist and health advisor.

I have performed OCR on a patient's blood test report. The text might contain spelling errors or formatting artifacts from the scanning process.

Here is the raw OCR text:
"""
${ocrText}
"""

Your Task:
1. Identify the key health markers, especially diabetic indicators (Glucose, HbA1c, Insulin, Cholesterol, etc.)
2. Correct any obvious OCR errors (e.g., 'mq/dL' -> 'mg/dL', 'qlucose' -> 'glucose')
3. Assess the diabetic risk level and overall health status based on standard medical guidelines
4. Provide actionable, personalized advice in ${language} language

Output Format:
Return ONLY valid HTML (no markdown, no code blocks, no backticks).
Structure your response using these HTML tags:

<div style="font-family: Arial, sans-serif; line-height: 1.6;">
  <h3 style="color: #d9534f;">🚨 Risk Assessment</h3>
  <p><strong>Overall Status:</strong> [Normal/Pre-diabetic/Diabetic/At Risk]</p>
  <p>[Brief explanation of their condition]</p>
  
  <h3 style="color: #5bc0de;">📊 Key Findings</h3>
  <ul>
    <li><strong>[Marker Name]:</strong> [Value] - [Normal/High/Low] ([Explanation])</li>
  </ul>
  
  <h3 style="color: #5cb85c;">🥗 Dietary Recommendations</h3>
  <ul>
    <li>[Specific food/meal advice]</li>
    <li>[What to avoid]</li>
    <li>[Meal timing suggestions]</li>
  </ul>
  
  <h3 style="color: #f0ad4e;">💪 Exercise & Lifestyle</h3>
  <ul>
    <li>[Specific exercise recommendations]</li>
    <li>[Activity duration and frequency]</li>
    <li>[Lifestyle modifications]</li>
  </ul>
  
  <h3 style="color: #0275d8;">⚕️ Medical Advice</h3>
  <p>[When to consult a doctor, monitoring recommendations]</p>
</div>

Important:
- Use inline CSS styles for colors and formatting
- Be empathetic and encouraging in tone
- Provide specific, actionable advice
- All text must be in ${language} language
- Return ONLY the HTML, no explanatory text before or after
`;

    const requestBody = {
      contents: [{
        parts: [{
          text: prompt
        }]
      }]
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("API Response Error:", errorData);
      throw new Error(`API Error (${response.status}): ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    console.log("API Response:", data);
    
    // Extract the generated text
    let htmlOutput = data.candidates[0].content.parts[0].text;
    
    // Clean up any markdown artifacts
    htmlOutput = htmlOutput.replace(/```html/g, '').replace(/```/g, '').trim();
    
    return htmlOutput;
    
  } catch (error) {
    console.error("Gemini API Error:", error);
    
    // Return user-friendly error message as HTML
    return `
      <div style="padding: 20px; background: #fff3cd; border: 1px solid #ffc107; border-radius: 8px; color: #856404;">
        <h3>⚠️ API Configuration Issue</h3>
        <p><strong>Your API key appears to be invalid or expired.</strong></p>
        <p style="margin-top: 15px;">${error.message || 'Unknown error occurred'}</p>
        
        <div style="background: white; padding: 15px; border-radius: 5px; margin-top: 20px;">
          <h4 style="margin-top: 0; color: #0275d8;">🔧 How to Fix This:</h4>
          <ol style="line-height: 1.8;">
            <li><strong>Get a new API key:</strong>
              <ul>
                <li>Visit <a href="https://aistudio.google.com/app/apikey" target="_blank" style="color: #0275d8;">Google AI Studio</a></li>
                <li>Sign in with your Google account</li>
                <li>Click "Get API Key" or "Create API Key"</li>
                <li>Copy your new key</li>
              </ul>
            </li>
            <li><strong>Update your code:</strong>
              <ul>
                <li>Open <code>gemini.js</code></li>
                <li>Replace the <code>API_KEY</code> value with your new key</li>
                <li>Save and refresh the page</li>
              </ul>
            </li>
          </ol>
        </div>
        
        <div style="background: #f8d7da; padding: 10px; border-radius: 5px; margin-top: 15px; font-size: 0.9em;">
          <strong>⚠️ Security Note:</strong> Never share your API key publicly or commit it to GitHub. 
          Consider using environment variables for production apps.
        </div>
      </div>
    `;
  }
}