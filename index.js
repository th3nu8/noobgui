// Noobs GUI Main Script - HOST THIS FILE PUBLICLY (e.g., GitHub Gist, GitHub Pages)
// This function must be globally accessible for the loader bookmarklet to work.
window.pocketAssistantInit = function() {
    // 1. Check if the widget is already present
    if (document.getElementById('pocket-assistant-widget')) {
        const w = document.getElementById('pocket-assistant-widget');
        // Toggle visibility
        w.style.display = (w.style.display === 'none' ? 'flex' : 'none');
        return;
    }

    // --- Configuration ---
    // NOTE: This URL must be your deployed Cloudflare Worker URL
    const apiUrl = "https://twilight-hill-3941.blueboltgamingyt.workers.dev";
    let isGenerating = false;
    const defaultTheme = 'blue';
    const games = [
        { name: "Tetris", url: "https://www.google.com/search?q=online+tetris+game" },
        { name: "Snake", url: "https://www.google.com/search?q=online+snake+game" },
        { name: "2048", url: "https://www.google.com/search?q=online+2048+game" },
        { name: "Minesweeper", url: "https://www.google.com/search?q=online+minesweeper+game" }
    ];
    const discordUrl = "https://discord.gg/placeholder_invite";
    const proxyPlaceholderUrl = "https://www.google.com/search?q=uv+proxy+web+search+placeholder";
    
    // Theme Definitions
    const themeConfigurations = {
        'blue': { '--primary-bg': '#1f2937', '--secondary-bg': '#374151', '--accent-color': '#4f46e5', '--text-color': '#d1d5db', '--border-color': '#4b5563' },
        'red': { '--primary-bg': '#3c0d0d', '--secondary-bg': '#5a1e1e', '--accent-color': '#dc2626', '--text-color': '#fef2f2', '--border-color': '#7f1d1d' },
        'white': { '--primary-bg': '#f9fafb', '--secondary-bg': '#e5e7eb', '--accent-color': '#3b82f6', '--text-color': '#1f2937', '--border-color': '#d1d5db' },
        'orange': { '--primary-bg': '#3d1a00', '--secondary-bg': '#5c3100', '--accent-color': '#f97316', '--text-color': '#fef3c7', '--border-color': '#8c4a00' },
        'black': { '--primary-bg': '#000000', '--secondary-bg': '#1f1f1f', '--accent-color': '#6366f1', '--text-color': '#f3f4f6', '--border-color': '#333333' }
    };
    
    // Function to apply the selected theme
    const applyTheme = (themeName) => {
        const theme = themeConfigurations[themeName] || themeConfigurations[defaultTheme];
        const root = document.documentElement;
        for (const [key, value] of Object.entries(theme)) {
            root.style.setProperty(key, value);
        }
        localStorage.setItem('noobsgui-theme', themeName);
    };

    // --- API and Utility Functions ---

    async function fetchWithBackoff(url, options, maxRetries = 5) {
        for (let i = 0; i < maxRetries; i++) {
            try {
                const response = await fetch(url, options);
                if (response.status !== 429) {
                    return response;
                }
            } catch (error) {
                console.error('Fetch error (retrying):', error);
            }
            const delay = Math.pow(2, i) * 1000 + Math.random() * 1000;
            await new Promise(resolve => setTimeout(resolve, delay));
        }
        throw new Error("API call failed after multiple retries.");
    }

    async function generateContent(prompt) {
        if (isGenerating) return;

        isGenerating = true;
        addMessage(prompt, 'user');

        const loadingMsg = addMessage("Thinking...", 'ai', true);

        const payload = {
            contents: [{ parts: [{ text: prompt }] }],
            tools: [{ "google_search": {} }],
            systemInstruction: {
                parts: [{ text: "You are a helpful and concise browser assistant. Respond clearly and in Markdown format. Use Google Search for current events." }]
            },
        };

        try {
            const response = await fetchWithBackoff(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const result = await response.json();
            let generatedText = "Sorry, I encountered an issue. Please try again.";

            if (result.error) {
                generatedText = `Proxy Error: ${result.error}. Double-check your Cloudflare Worker deployment and the GEMINI_API_KEY environment variable. If you get 'Method not allowed', ensure you are typing a question and clicking the 'Send' button, not just clicking the bookmarklet again.`;
            } else if (result.candidates && result.candidates.length > 0 &&
                       result.candidates[0].content && result.candidates[0].content.parts.length > 0) {
                generatedText = result.candidates[0].content.parts[0].text || generatedText;
            }

            updateMessage(loadingMsg, generatedText);

        } catch (error) {
            console.error('Network Error:', error);
            updateMessage(loadingMsg, "Error: A network issue occurred. Ensure your Cloudflare Worker is deployed and its URL is correctly entered in the bookmarklet code.");
        } finally {
            isGenerating = false;
        }
    }

    const loadMathJax = () => {
        if (window.MathJaxLoaded) return;
        window.MathJaxLoaded = true;

        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/mathjax/3.2.2/es5/tex-mml-chtml.js';
        script.async = true;
        document.head.appendChild(script);
    };

    const renderMarkdown = (text) => {
        let html = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
        html = html.replace(/^#+\s*(.*)/gm, '<strong>$1</strong>');
        html = html.replace(/^(\d+)\.\s(.*?)/gm, '<br>$1. $2');
        html = html.replace(/^(-|\*)\s(.*?)/gm, '<br>&bull; $2');
        html = html.replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre>$2</pre>');
        html = html.replace(/\n\n/g, '<br><br>');
        return html;
    };


    // --- UI Setup ---

    // The CSS now uses variables for theme colors
    const css = `
:root {
    --primary-bg: #1f2937;
    --secondary-bg: #374151;
    --accent-color: #4f46e5;
    --text-color: #d1d5db;
    --border-color: #4b5563;
}
.widget-container{
    width:90vw;max-width:400px;height:70vh;max-height:700px;box-shadow:0 10px 25px rgba(0,0,0,0.3);
    border-radius:12px;overflow:hidden;display:flex;flex-direction:column;
    background-color:var(--primary-bg);z-index:99999;position:fixed;bottom:16px;right:16px;font-family:'Inter',sans-serif;
}
.chat-input-container{display:flex;padding:8px;background-color:var(--secondary-bg)}
.chat-messages{flex-grow:1;overflow-y:auto;padding:12px;display:flex;flex-direction:column}
.message{margin-bottom:8px;border-radius:8px;padding:8px 12px;max-width:85%}
.user-message{background-color:var(--accent-color);color:white;margin-left:auto}
.ai-message{background-color:var(--secondary-bg);color:var(--text-color);margin-right:auto}
.menu-bar{height:50px;display:flex;justify-content:space-around;align-items:center;background-color:var(--secondary-bg);border-top:1px solid var(--border-color);border-radius:0 0 12px 12px}
.menu-button{position:relative;cursor:pointer;padding:0 10px;color:var(--text-color);transition:color 0.2s}
.menu-button:hover{color:var(--accent-color)}
.dropdown-content{position:absolute;bottom:100%;left:50%;transform:translateX(-50%);background-color:var(--primary-bg);box-shadow:0 -4px 10px rgba(0,0,0,0.3);border-radius:8px 8px 0 0;min-width:150px;opacity:0;visibility:hidden;transition:opacity 0.2s,visibility 0.2s;padding:8px 0}
.menu-button:hover .dropdown-content{opacity:1;visibility:visible}
.dropdown-item{padding:8px 12px;cursor:pointer;color:var(--text-color);white-space:nowrap}
.dropdown-item:hover{background-color:var(--border-color)}
#chat-input{flex-grow:1;padding:8px;border-radius:8px 0 0 8px;border:none;background-color:var(--border-color);color:var(--text-color)}
#send-btn{padding:8px 16px;background-color:var(--accent-color);color:white;border-radius:0 8px 8px 0;border:none}
.header{display:flex;justify-content:space-between;align-items:center;padding:12px;background-color:var(--accent-color);color:white;font-weight:bold;border-radius:12px 12px 0 0;cursor:grab}
.settings-menu-container{position:relative;}
.settings-menu-btn{background:none;border:none;color:white;cursor:pointer;font-size:1.5rem;margin-left:8px;}
.settings-dropdown{
    position:absolute;top:100%;right:0;background-color:var(--primary-bg);
    box-shadow:0 4px 10px rgba(0,0,0,0.3);border-radius:0 0 8px 8px;
    min-width:150px;opacity:0;visibility:hidden;z-index:100000;
}
.settings-menu-container:hover .settings-dropdown, .settings-menu-container.active .settings-dropdown{
    opacity:1;visibility:visible;
}
    `;

    // Inject CSS
    const style = document.createElement('style');
    style.innerHTML = css;
    document.head.appendChild(style);

    // Apply saved theme or default theme
    const savedTheme = localStorage.getItem('noobsgui-theme') || defaultTheme;
    applyTheme(savedTheme);


    // Create main container
    const widgetContainer = document.createElement('div');
    widgetContainer.id = 'pocket-assistant-widget';
    widgetContainer.className = 'widget-container';

    // Header
    const header = document.createElement('div');
    header.className = 'header';

    const titleSpan = document.createElement('span');
    titleSpan.className = 'text-lg';
    titleSpan.textContent = 'Noobs GUI'; // Updated title
    header.appendChild(titleSpan);
