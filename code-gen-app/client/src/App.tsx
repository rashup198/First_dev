import { useState, useRef } from 'react';
import axios from 'axios';
import { SparklesIcon, CodeBracketIcon, EyeIcon } from '@heroicons/react/24/outline';
import './index.css';

interface GeneratedCode {
  html: string;
  css: string;
  js: string;
}

function App() {
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('preview');
  const [generatedCode, setGeneratedCode] = useState<GeneratedCode>({
    html: '',
    css: '',
    js: ''
  });

  const iframeRef = useRef<HTMLIFrameElement>(null);

  const generateCode = async () => {
    if (!prompt.trim()) {
      setError('Please enter a prompt');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      console.log('Sending request with prompt:', prompt);
      const response = await axios.post('http://localhost:5002/api/generate', { 
        prompt: prompt 
      }, {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 60000 // 60 second timeout
      });
      
      console.log('Received response:', response.data);
      
      if (!response.data) {
        throw new Error('Empty response from server');
      }
      
      setGeneratedCode({
        html: response.data.html || '',
        css: response.data.css || '',
        js: response.data.js || ''
      });
      
      setActiveTab('preview');
    } catch (error: any) {
      console.error('Error generating code:', error);
      
      let errorMessage = 'Failed to generate code';
      if (error?.response) {
        // Server responded with an error
        errorMessage = error.response.data?.error || errorMessage;
        if (error.response.data?.message) {
          errorMessage += `: ${error.response.data.message}`;
        }
      } else if (error?.request) {
        // Request was made but no response
        errorMessage = 'No response from server. Is the server running?';
      } else if (error?.message) {
        // Something else went wrong
        errorMessage = error.message;
      }
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Generate the HTML content for the iframe
  const iframeContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>${generatedCode.css || ''}</style>
      </head>
      <body>${generatedCode.html || ''}
        <script>${generatedCode.js || ''}</script>
      </body>
    </html>
  `;

  return (
    <div className="app">
      <header className="header">
        <div className="header-container">
          <div className="logo-container">
            <SparklesIcon className="logo-icon" />
            <h1 className="logo-text">CodeGen AI</h1>
          </div>
        </div>
      </header>

      <main className="main-content">
        <div className="prompt-form">
          <div className="input-group">
            <div className="input-wrapper">
              <input
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe the component or page you want to create..."
                className="input"
                disabled={isLoading}
                onKeyDown={(e) => e.key === 'Enter' && generateCode()}
              />
              {error && <p className="error-message">{error}</p>}
            </div>
            <button
              onClick={generateCode}
              disabled={isLoading}
              className="btn btn-primary"
            >
              {isLoading ? (
                <>
                  <svg className="icon-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <SparklesIcon className="icon" />
                  <span>Generate</span>
                </>
              )}
            </button>
          </div>
        </div>

        {(generatedCode.html || generatedCode.css || generatedCode.js) && (
          <div className="tabs-container">
            <div className="tabs">
              <button
                onClick={() => setActiveTab('preview')}
                className={`tab ${activeTab === 'preview' ? 'active' : ''}`}
              >
                <EyeIcon className="icon" />
                <span>Preview</span>
              </button>
              <button
                onClick={() => setActiveTab('code')}
                className={`tab ${activeTab === 'code' ? 'active' : ''}`}
              >
                <CodeBracketIcon className="icon" />
                <span>Code</span>
              </button>
            </div>

            <div className="tab-content">
              {activeTab === 'preview' ? (
                <iframe
                  ref={iframeRef}
                  title="Preview"
                  className="preview-iframe"
                  sandbox="allow-scripts"
                  srcDoc={iframeContent}
                />
              ) : (
                <div className="code-container">
                  {generatedCode.html && (
                    <div className="code-section">
                      <h3>HTML</h3>
                      <pre className="code-block">
                        <code>{generatedCode.html}</code>
                      </pre>
                    </div>
                  )}
                  {generatedCode.css && (
                    <div className="code-section">
                      <h3>CSS</h3>
                      <pre className="code-block">
                        <code>{generatedCode.css}</code>
                      </pre>
                    </div>
                  )}
                  {generatedCode.js && (
                    <div className="code-section">
                      <h3>JavaScript</h3>
                      <pre className="code-block">
                        <code>{generatedCode.js}</code>
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      <footer className="footer">
        <div className="container">
          <p>AI-Powered Code Generation Tool - Built with React, TypeScript, and Gemini API</p>
        </div>
      </footer>
    </div>
  );
}

export default App;
