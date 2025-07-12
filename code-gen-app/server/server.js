require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const app = express();
const PORT = process.env.PORT || 5002;
// Initialize Google's Generative AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
// Middleware
app.use(cors());
app.use(express.json());
// POST /api/generate — Accepts a prompt and returns HTML, CSS, and JS
app.post('/api/generate', async (req, res) => {
  const { prompt } = req.body;
  if (!prompt) {
    return res.status(400).json({ error: 'Prompt is required in the request body.' });
  }
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    const generationPrompt = `
    You're a senior frontend developer and designer.
    Create a fully responsive, modern landing page for the following concept:
    "${prompt}"
    It should have:
    - A bold hero section with large headline, subheading, CTA button, and product image or background
    - A feature grid with icons, titles, and descriptions
    - Testimonials or social proof section
    - A clean footer with links and copyright
    **Design Requirements**
    - Use Flexbox and Grid for layout
    - Use modern fonts (e.g., Inter, system-ui)
    - Include padding, margins, hover effects, subtle transitions
    - Use modern color schemes (e.g., soft neutrals, gradients, or accent colors)
    - Add box shadows and rounded corners for a card-like appearance
    - Use media queries to ensure mobile responsiveness
    **Functionality**
    - Button click should scroll to feature section
    - JavaScript should be minimal, modular, and clean
    - Make interactive elements accessible (e.g. button roles, aria labels)
    **Output Format — very important**
    Return the result exactly like this:
    HTML:
    <!DOCTYPE html>
    <html>
      <head>...</head>
      <body>...</body>
    </html>
    CSS:
    <style>
    /* All styling here */
    </style>
    JavaScript:
    <script>
    /* All scripts here */
    </script>
    Do not include explanations. Just return the code blocks.
    `;
    console.log('Sending request to Gemini API...');
    const result = await model.generateContent(generationPrompt);
    const response = await result.response;
    console.log('Received response from Gemini API');
    if (!response) {
      throw new Error('No response from Gemini API');
    }
    const rawText = await response.text();
    console.log('Raw response:', rawText);
    // Extract sections using regex
    try {
      const htmlMatch = rawText.match(/<html[\s\S]*?<\/html>/i) || [''];
      const styleMatch = rawText.match(/<style[\s\S]*?<\/style>/gi) || [''];
      const scriptMatch = rawText.match(/<script[\s\S]*?<\/script>/gi) || [''];
      const resultObj = {
        html: htmlMatch[0].trim(),
        css: styleMatch.join('\n').trim(),
        js: scriptMatch.join('\n').trim()
      };
      console.log('Parsed response:', JSON.stringify(resultObj, null, 2));
      res.json(resultObj);
    } catch (parseError) {
      console.error('Error parsing response:', parseError);
      console.error('Raw response that failed to parse:', rawText);
      throw new Error(`Failed to parse API response: ${parseError.message}`);
    }
  } catch (error) {
    console.error('Error generating content:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      error: 'Failed to generate content',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});
// Start the server
app.listen(PORT, () => {
  console.log(`:rocket: Server is live at http://localhost:${PORT}`);
});

