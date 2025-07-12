import { useState, useRef, useCallback, useMemo } from 'react';
import axios, { AxiosError } from 'axios';
import { SparklesIcon, CodeBracketIcon, EyeIcon } from '@heroicons/react/24/outline';
import './index.css';

interface GeneratedCode {
  html: string;
  css: string;
  js: string;
}

enum TabView {
  PREVIEW = 'preview',
  CODE = 'code',
}

const API_ENDPOINT = 'http://localhost:5002/api/generate';
const REQUEST_TIMEOUT = 60000;

function App() {
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<TabView>(TabView.PREVIEW);
  const [generatedCode, setGeneratedCode] = useState<GeneratedCode>({
    html: '',
    css: '',
    js: '',
  });

  const iframeRef = useRef<HTMLIFrameElement>(null);

  const handleApiError = useCallback((error: unknown): string => {
    console.error('API Error:', error);
    
    if (axios.isAxiosError(error)) {
      return error.response?.data?.error?.message || 
             error.response?.data?.error ||
             error.message ||
             'Server responded with an error';
    }
    
    if (error instanceof Error) {
      return error.message;
    }
    
    return 'Unknown network error occurred';
  }, []);

  const generateCode = useCallback(async () => {
    if (!prompt.trim()) {
      setError('Please enter a prompt');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await axios.post<GeneratedCode>(
        API_ENDPOINT,
        { prompt },
        {
          headers: { 'Content-Type': 'application/json' },
          timeout: REQUEST_TIMEOUT,
        }
      );

      setGeneratedCode({
        html: response.data.html || '',
        css: response.data.css || '',
        js: response.data.js || '',
      });
      
      setActiveTab(TabView.PREVIEW);
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setIsLoading(false);
    }
  }, [prompt, handleApiError]);

  const iframeContent = useMemo(() => (
    `<!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>${generatedCode.css}</style>
      </head>
      <body>${generatedCode.html}
        <script>${generatedCode.js}</script>
      </body>
    </html>`
  ), [generatedCode]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      generateCode();
    }
  };

  const hasGeneratedContent = useMemo(() => (
    Boolean(generatedCode.html || generatedCode.css || generatedCode.js)
  ), [generatedCode]);

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="header-content">
          <div className="logo">
            <SparklesIcon className="logo-icon" aria-hidden="true" />
            <h1 className="logo-text">CodeGen AI</h1>
          </div>
        </div>
      </header>

      <main className="main-content">
        <section className="prompt-section">
          <div className="input-container">
            <div className="input-group">
              <input
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Describe the component or page you want to create..."
                className="prompt-input"
                disabled={isLoading}
                aria-label="Code generation prompt"
              />
              <button
                onClick={generateCode}
                disabled={isLoading}
                className="generate-button"
                aria-busy={isLoading}
              >
                {isLoading ? (
                  <>
                    <span className="spinner" aria-hidden="true" />
                    <span>Generating...</span>
                  </>
                ) : (
                  <>
                    <SparklesIcon className="button-icon" aria-hidden="true" />
                    <span>Generate</span>
                  </>
                )}
              </button>
            </div>
            {error && <p className="error-message" role="alert">{error}</p>}
          </div>
        </section>

        {hasGeneratedContent && (
          <section className="result-section" aria-live="polite">
            <div className="tab-controls">
              <button
                onClick={() => setActiveTab(TabView.PREVIEW)}
                className={`tab-button ${activeTab === TabView.PREVIEW ? 'active' : ''}`}
                aria-selected={activeTab === TabView.PREVIEW}
              >
                <EyeIcon className="tab-icon" />
                <span>Preview</span>
              </button>
              <button
                onClick={() => setActiveTab(TabView.CODE)}
                className={`tab-button ${activeTab === TabView.CODE ? 'active' : ''}`}
                aria-selected={activeTab === TabView.CODE}
              >
                <CodeBracketIcon className="tab-icon" />
                <span>Code</span>
              </button>
            </div>

            <div className="tab-content">
              {activeTab === TabView.PREVIEW ? (
                <iframe
                  ref={iframeRef}
                  title="Generated Code Preview"
                  className="preview-frame"
                  sandbox="allow-scripts"
                  srcDoc={iframeContent}
                />
              ) : (
                <div className="code-view">
                  {generatedCode.html && (
                    <div className="code-block">
                      <h3 className="code-header">HTML</h3>
                      <pre className="code-content"><code>{generatedCode.html}</code></pre>
                    </div>
                  )}
                  {generatedCode.css && (
                    <div className="code-block">
                      <h3 className="code-header">CSS</h3>
                      <pre className="code-content"><code>{generatedCode.css}</code></pre>
                    </div>
                  )}
                  {generatedCode.js && (
                    <div className="code-block">
                      <h3 className="code-header">JavaScript</h3>
                      <pre className="code-content"><code>{generatedCode.js}</code></pre>
                    </div>
                  )}
                </div>
              )}
            </div>
          </section>
        )}
      </main>

      <footer className="app-footer">
  <p>Made with ❤️ by Priyanshu • Powered by React, TypeScript & AI</p>
</footer>

    </div>
  );
}

export default App;