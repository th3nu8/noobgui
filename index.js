// Pocket Assistant Main Script - HOST THIS FILE PUBLICLY (e.g., GitHub Gist, GitHub Pages)
// The bookmarklet loader will fetch and execute this file.

(function() {
    // Check if the widget is already present (prevents running the entire script twice)
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

    // NEW SETTINGS:
    let currentTheme = localStorage.getItem('paTheme') || 'dark'; // Load from storage or default to dark
    // SVG icon path for the widget header (A simple 'information' or 'assistant' icon)
    const defaultIconPath = 'M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm1 14h-2v-2h2v2zm0-4h-2V7h2v5z'; 

    // Menu Item Placeholders
    const games = [
        { name: "Tetris", url: "https://www.google.com/search?q=online+tetris+game" },
        { name: "Snake", url: "https://www.google.com/search?q=online+snake+game" },
        { name: "2048", url: "https://www.google.com/search?q=online+2048+game" },
        { name: "Minesweeper", url: "https://www.google.com/search?q=online+minesweeper+game" }
    ];
    const discordUrl = "https://discord.gg/placeholder_invite";
    const proxyPlaceholderUrl = "https://www.google.com/search?q=uv+proxy+web+search+placeholder";


    // --- API and Utility Functions ---

    // Function to handle retries for API calls (Exponential Backoff)
    async function fetchWithBackoff(url, options, maxRetries = 5) {
        for (let i = 0; i < maxRetries; i++) {
            try {
                const response = await fetch(url, options);
                // If not a rate limit error (429), return the response immediately
                if (response.status !== 429) {
                    return response;
                }
            } catch (error) {
                console.error('Fetch error (retrying):', error);
            }
            // Wait with exponential backoff and jitter
            const delay = Math.pow(2, i) * 1000 + Math.random() * 1000;
            await new Promise(resolve => setTimeout(resolve, delay));
        }
        throw new Error("API call failed after multiple retries.");
    }

    // Function to call the Gemini API via the proxy worker
    async function generateContent(prompt) {
        if (isGenerating) return;

        isGenerating = true;
        addMessage(prompt, 'user');

        const loadingMsg = addMessage("Thinking...", 'ai', true);

        const payload = {
            contents: [{ parts: [{ text: prompt }] }],
            // Enable Google Search grounding
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

    // Function to load MathJax for rendering LaTeX/Math
    const loadMathJax = () => {
        if (window.MathJaxLoaded) return;
        window.MathJaxLoaded = true;

        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/mathjax/3.2.2/es5/tex-mml-chtml.js';
        script.async = true;
        document.head.appendChild(script);
    };

    // Function to convert basic Markdown to HTML
    const renderMarkdown = (text) => {
        // 1. Bold: **text** -> <strong>text</strong>
        let html = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        // 2. Italics: *text* -> <em>text</em>
        html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
        // 3. Headings (Simple bolding): # Title -> <strong>Title</strong>
        html = html.replace(/^#+\s*(.*)/gm, '<strong>$1</strong>');
        // 4. Numbered Lists: 1. Item -> <br>1. Item
        html = html.replace(/^(\d+)\.\s(.*?)/gm, '<br>$1. $2');
        // 5. Bullet Points: - Item or * Item -> <br>&bull; Item
        html = html.replace(/^(-|\*)\s(.*?)/gm, '<br>&bull; $2');
        // 6. Code Blocks: ```code``` -> <pre>code</pre>
        html = html.replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre>$2</pre>');
        // 7. Newlines to <br> (for paragraphs)
        html = html.replace(/\n\n/g, '<br><br>');
        return html;
    };


    // --- UI Setup ---

    const css = `
.widget-container{width:90vw;max-width:400px;height:70vh;max-height:700px;box-shadow:0 10px 25px rgba(0,0,0,0.3);border-radius:12px;overflow:hidden;display:flex;flex-direction:column;background-color:#1f2937;z-index:99999;position:fixed;bottom:16px;right:16px;font-family:'Inter',sans-serif;transition:background-color 0.3s}
.chat-input-container{display:flex;padding:8px;background-color:#374151;transition:background-color 0.3s}
.chat-messages{flex-grow:1;overflow-y:auto;padding:12px;display:flex;flex-direction:column}
.message{margin-bottom:8px;border-radius:8px;padding:8px 12px;max-width:85%}
.user-message{background-color:#4f46e5;color:white;margin-left:auto}
.ai-message{background-color:#374151;color:#d1d5db;margin-right:auto;transition:background-color 0.3s, color 0.3s}
.menu-bar{height:50px;display:flex;justify-content:space-around;align-items:center;background-color:#374151;border-top:1px solid #4b5563;border-radius:0 0 12px 12px;transition:background-color 0.3s}
.menu-button{position:relative;cursor:pointer;padding:0 10px;color:#9ca3af;transition:color 0.2s}
.menu-button:hover{color:#d1d5db}
.dropdown-content{position:absolute;bottom:100%;left:50%;transform:translateX(-50%);background-color:#1f2937;box-shadow:0 -4px 10px rgba(0,0,0,0.3);border-radius:8px 8px 0 0;min-width:150px;opacity:0;visibility:hidden;transition:opacity 0.2s,visibility 0.2s;padding:8px 0;transition:background-color 0.3s}
.menu-button:hover .dropdown-content{opacity:1;visibility:visible}
.dropdown-item{padding:8px 12px;cursor:pointer;color:#d1d5db;white-space:nowrap;transition:background-color 0.3s, color 0.3s}
.dropdown-item:hover{background-color:#4b5563}
#chat-input{flex-grow:1;padding:8px;border-radius:8px 0 0 8px;border:none;background-color:#4b5563;color:white;transition:background-color 0.3s, color 0.3s}
#send-btn{padding:8px 16px;background-color:#4f46e5;color:white;border-radius:0 8px 8px 0;border:none;transition:background-color 0.3s}
.header{display:flex;justify-content:space-between;align-items:center;padding:12px;background-color:#4f46e5;color:white;font-weight:bold;border-radius:12px 12px 0 0;cursor:grab;transition:background-color 0.3s}

/* --- Light Mode Styles --- */
.widget-container.light-theme{background-color:#f9fafb;box-shadow:0 10px 25px rgba(0,0,0,0.15);border:1px solid #e5e7eb}
.widget-container.light-theme .header{background-color:#10b981} /* Brighter header for light theme */
.widget-container.light-theme .chat-input-container, .widget-container.light-theme .menu-bar{background-color:#f3f4f6}
.widget-container.light-theme #chat-input{background-color:white;color:#1f2937;border:1px solid #d1d5db;border-radius:8px}
.widget-container.light-theme #send-btn{background-color:#10b981}
.widget-container.light-theme .ai-message{background-color:#e5e7eb;color:#1f2937}
.widget-container.light-theme .menu-button{color:#6b7280}
.widget-container.light-theme .menu-button:hover{color:#374151}
.widget-container.light-theme .dropdown-content{background-color:#f9fafb;box-shadow:0 -4px 10px rgba(0,0,0,0.1);border:1px solid #d1d5db}
.widget-container.light-theme .dropdown-item{color:#1f2937}
.widget-container.light-theme .dropdown-item:hover{background-color:#e5e7eb}

/* --- Theme Toggle Switch Styles --- */
.toggle-switch{display:flex;align-items:center;justify-content:space-between;padding:8px 12px;cursor:pointer;user-select:none;}
.toggle-label{color:inherit;font-size:14px;}
.slider{position:relative;display:inline-block;width:34px;height:20px;border-radius:10px;background-color:#ccc;transition:0.4s;cursor:pointer}
.slider:before{position:absolute;content:"";height:12px;width:12px;left:4px;bottom:4px;background-color:white;transition:0.4s;border-radius:50%}
.hidden-checkbox:checked + .slider{background-color:#4f46e5}
.hidden-checkbox:checked + .slider:before{-webkit-transform:translateX(14px);-ms-transform:translateX(14px);transform:translateX(14px)}
.hidden-checkbox{display:none}
    `;

    // Inject CSS
    const style = document.createElement('style');
    style.innerHTML = css;
    document.head.appendChild(style);

    // Create main container
    const widgetContainer = document.createElement('div');
    widgetContainer.id = 'pocket-assistant-widget';
    widgetContainer.className = 'widget-container';

    // Apply initial theme based on localStorage
    if (currentTheme === 'light') {
        widgetContainer.classList.add('light-theme');
    }

    // SVG Icon Creation Helper (Refactored to handle paths cleanly)
    const createSvg = (d, text) => {
        const xmlns = 'http://www.w3.org/2000/svg';
        const svg = document.createElementNS(xmlns, 'svg');
        svg.setAttribute('class', 'w-6 h-6 inline-block');
        svg.setAttribute('fill', 'none');
        svg.setAttribute('stroke', 'currentColor');
        svg.setAttribute('viewBox', '0 0 24 24');
        svg.setAttribute('style', 'width:24px;height:24px;');

        const paths = Array.isArray(d) ? d : [d];
        paths.forEach(pathD => {
            const path = document.createElementNS(xmlns, 'path');
            path.setAttribute('stroke-linecap', 'round');
            path.setAttribute('stroke-linejoin', 'round');
            path.setAttribute('stroke-width', '2');
            path.setAttribute('d', pathD);
            svg.appendChild(path);
        });

        const span = document.createElement('span');
        span.style.cssText = 'font-size: 10px; display: block; margin-top: -4px;';
        span.textContent = text;
        return { icon: svg, text: span };
    };

    // Menu Button Factory
    const createMenuButton = (id, iconDs, text, isLink = false, href = '') => {
        const btn = isLink ? document.createElement('a') : document.createElement('div');
        btn.id = id;
        btn.className = 'menu-button';
        if (isLink) {
            btn.href = href;
            btn.target = '_blank';
        }
        const { icon, text: span } = createSvg(iconDs, text);
        btn.appendChild(icon);
        btn.appendChild(span);
        return btn;
    };

    // --- Header Setup ---
    const header = document.createElement('div');
    header.className = 'header';

    const titleSpan = document.createElement('span');
    titleSpan.className = 'text-lg';
    titleSpan.textContent = 'Pocket Assistant';

    // NEW: Add Icon to the header (using the defined path)
    const { icon: headerIcon } = createSvg(defaultIconPath, '');
    headerIcon.setAttribute('stroke-width', '1.5');
    headerIcon.style.cssText = 'width: 20px; height: 20px; margin-right: 8px; color: white;';

    const titleGroup = document.createElement('div');
    titleGroup.style.display = 'flex';
    titleGroup.style.alignItems = 'center';
    titleGroup.appendChild(headerIcon);
    titleGroup.appendChild(titleSpan);

    header.appendChild(titleGroup);

    const closeBtn = document.createElement('button');
    closeBtn.id = 'close-widget-btn';
    closeBtn.textContent = '×';
    closeBtn.style.cssText = 'font-size: 1.5rem; background: none; border: none; color: white; cursor: pointer; line-height: 1;';
    header.appendChild(closeBtn);

    widgetContainer.appendChild(header);

    // Message Display Area
    const messageContainer = document.createElement('div');
    messageContainer.id = 'chat-messages';
    messageContainer.className = 'chat-messages';
    widgetContainer.appendChild(messageContainer);

    // Input Area
    const inputContainer = document.createElement('div');
    inputContainer.className = 'chat-input-container';

    const chatInput = document.createElement('input');
    chatInput.type = 'text';
    chatInput.id = 'chat-input';
    chatInput.placeholder = 'Ask me anything...';
    inputContainer.appendChild(chatInput);

    const sendBtn = document.createElement('button');
    sendBtn.id = 'send-btn';
    sendBtn.textContent = 'Send';
    inputContainer.appendChild(sendBtn);

    widgetContainer.appendChild(inputContainer);


    // Menu Bar
    const menuBar = document.createElement('div');
    menuBar.className = 'menu-bar';

    // Create Menu Items
    const gamesMenu = createMenuButton('games-menu', ['M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z', 'M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z'], 'Games');
    const searchMenu = createMenuButton('search-menu', 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z', 'Search');
    const settingsMenu = createMenuButton('settings-menu', 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37a1.724 1.724 0 002.572-1.065zM12 16a4 4 0 100-8 4 4 0 000 8z', 'Settings'); // New Settings Button
    const discordMenu = createMenuButton('discord-link', ['M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.325-.325z'], 'Discord', true, discordUrl);

    menuBar.appendChild(gamesMenu);
    menuBar.appendChild(searchMenu);
    menuBar.appendChild(settingsMenu); // Add Settings
    menuBar.appendChild(discordMenu);
    widgetContainer.appendChild(menuBar);

    // Append to body and start MathJax load
    document.body.appendChild(widgetContainer);
    loadMathJax();

    // --- Theme Logic ---
    const toggleTheme = () => {
        const isLight = widgetContainer.classList.toggle('light-theme');
        currentTheme = isLight ? 'light' : 'dark';
        localStorage.setItem('paTheme', currentTheme);
        // Update the checkbox state manually
        const checkbox = document.getElementById('theme-toggle-checkbox');
        if (checkbox) {
            checkbox.checked = isLight;
        }
    };

    // --- Chat Logic ---

    function addMessage(text, sender, isTemporary = false) {
        const msgDiv = document.createElement('div');
        msgDiv.className = `message ${sender}-message`;
        msgDiv.style.whiteSpace = 'pre-wrap'; // Preserve formatting like newlines
        msgDiv.innerHTML = renderMarkdown(text);

        if (isTemporary) {
            msgDiv.id = 'temp-ai-message-' + Date.now();
        }

        messageContainer.appendChild(msgDiv);
        messageContainer.scrollTop = messageContainer.scrollHeight;

        // Trigger MathJax rendering on the new message
        if (window.MathJax && window.MathJax.typesetPromise) {
            window.MathJax.typesetPromise([msgDiv]).catch((err) => console.error('MathJax error:', err));
        }

        return msgDiv;
    }

    function updateMessage(element, newText) {
        element.innerHTML = renderMarkdown(newText);
        messageContainer.scrollTop = messageContainer.scrollHeight;

        // Retrigger MathJax on the updated message
        if (window.MathJax && window.MathJax.typesetPromise) {
            window.MathJax.typesetPromise([element]).catch((err) => console.error('MathJax error:', err));
        }
    }

    // Initial welcome message
    addMessage("Hello! I'm your Pocket Assistant. Ask me a question to get started. Don't forget to check out the new Settings menu!", 'ai');

    // Event listeners
    sendBtn.addEventListener('click', () => {
        const prompt = chatInput.value.trim();
        if (prompt && !isGenerating) {
            generateContent(prompt);
            chatInput.value = '';
        }
    });

    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !isGenerating) {
            sendBtn.click();
        }
    });

    // Games Dropdown
    const gamesDropdown = document.createElement('div');
    gamesDropdown.id = 'games-dropdown';
    gamesDropdown.className = 'dropdown-content';
    gamesMenu.appendChild(gamesDropdown);

    games.forEach(game => {
        const item = document.createElement('div');
        item.className = 'dropdown-item';
        item.textContent = game.name;
        item.onclick = () => { window.open(game.url, '_blank'); };
        gamesDropdown.appendChild(item);
    });
    
    // --- Settings Dropdown ---
    const settingsDropdown = document.createElement('div');
    settingsDropdown.id = 'settings-dropdown';
    settingsDropdown.className = 'dropdown-content';
    settingsMenu.appendChild(settingsDropdown);

    // Theme Toggle UI element
    const themeToggleContainer = document.createElement('div');
    themeToggleContainer.className = 'toggle-switch dropdown-item'; // Use dropdown-item style for padding
    themeToggleContainer.onclick = (e) => {
        e.stopPropagation(); // Prevent the dropdown from closing immediately
        toggleTheme();
    };

    const themeLabel = document.createElement('span');
    themeLabel.className = 'toggle-label';
    themeLabel.textContent = 'Light Mode';

    const themeCheckbox = document.createElement('input');
    themeCheckbox.type = 'checkbox';
    themeCheckbox.id = 'theme-toggle-checkbox';
    themeCheckbox.className = 'hidden-checkbox';
    themeCheckbox.checked = currentTheme === 'light';

    const themeSlider = document.createElement('span');
    themeSlider.className = 'slider';

    themeToggleContainer.appendChild(themeLabel);
    themeToggleContainer.appendChild(themeCheckbox);
    themeToggleContainer.appendChild(themeSlider);

    settingsDropdown.appendChild(themeToggleContainer);


    // Search Placeholder Button
    searchMenu.addEventListener('click', () => {
        const newWindow = window.open('about:blank', '_blank');
        if (newWindow) {
            const htmlContent = `
<!DOCTYPE html>
<html>
<head>
<title>Proxy Search Launcher</title>
<style>
body{font-family:sans-serif;display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;margin:0;background-color:#1f2937;color:white}
.card{background-color:#374151;padding:40px;border-radius:12px;box-shadow:0 4px 15px rgba(0,0,0,.4);text-align:center}
h1{margin-bottom:20px;font-size:1.5em}
a{color:#818cf8;text-decoration:none;font-weight:bold}
a:hover{text-decoration:underline}
p{margin-top:20px;color:#9ca3af}
</style>
</head>
<body>
<div class="card">
    <h1>Proxy Search Placeholder</h1>
    <p>This button simulates opening a proxy like Ultraviolet/Interstellar.</p>
    <a href="${proxyPlaceholderUrl}" target="_top" style="display:block;padding:10px 20px;background-color:#4f46e5;border-radius:8px;margin-top:20px;">Launch Proxy Search (Placeholder)</a>
    <p>Please replace the link with your actual proxy URL.</p>
</div>
</body>
</html>`;
            newWindow.document.write(htmlContent);
            newWindow.document.close();
        }
    });

    // Close Button
    closeBtn.addEventListener('click', () => {
        widgetContainer.style.display = 'none';
    });


    // Dragging Logic
    let isDragging = false;
    let offsetX, offsetY;
    let initialPositionSet = false; // Flag to prevent multiple initial position settings

    // Function to set the widget's initial position centered on the screen the first time it opens
    const setInitialPosition = () => {
        if (!initialPositionSet) {
            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;
            const widgetWidth = widgetContainer.offsetWidth;
            const widgetHeight = widgetContainer.offsetHeight;

            // Use right/bottom styles established in CSS, but fallback to centered if needed
            if (widgetContainer.style.position === 'fixed') {
                // Keep the default bottom/right position defined in CSS
            } else {
                widgetContainer.style.position = 'fixed';
                widgetContainer.style.left = (viewportWidth / 2 - widgetWidth / 2) + 'px';
                widgetContainer.style.top = (viewportHeight / 2 - widgetHeight / 2) + 'px';
            }
            initialPositionSet = true;
        }
    };
    
    // Call on load (it's fine to call this even if CSS sets position)
    setInitialPosition();
    window.addEventListener('resize', setInitialPosition); // Re-center on resize, though position:fixed bottom/right works better

    header.addEventListener('mousedown', (e) => {
        // Only start dragging if the primary button is pressed
        if (e.button !== 0) return;
        
        isDragging = true;
        
        // Ensure widget is positioned absolutely/fixed for dragging
        if (widgetContainer.style.position !== 'fixed') {
            widgetContainer.style.position = 'fixed';
        }
        
        // Calculate offset relative to the viewport
        const rect = widgetContainer.getBoundingClientRect();
        offsetX = e.clientX - rect.left;
        offsetY = e.clientY - rect.top;
        
        // Disable default bottom/right CSS positioning during drag
        widgetContainer.style.right = 'auto';
        widgetContainer.style.bottom = 'auto';

        widgetContainer.style.cursor = 'grabbing';
        e.preventDefault(); // Prevent text selection
    });

    document.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        
        // Calculate new position
        let newX = e.clientX - offsetX;
        let newY = e.clientY - offsetY;
        
        // Clamp position to viewport bounds (basic)
        const maxLeft = window.innerWidth - widgetContainer.offsetWidth;
        const maxTop = window.innerHeight - widgetContainer.offsetHeight;
        
        newX = Math.max(0, Math.min(newX, maxLeft));
        newY = Math.max(0, Math.min(newY, maxTop));
        
        widgetContainer.style.left = newX + 'px';
        widgetContainer.style.top = newY + 'px';
    });

    document.addEventListener('mouseup', () => {
        isDragging = false;
        widgetContainer.style.cursor = 'grab';
    });
    
    // Add touch support for dragging
    header.addEventListener('touchstart', (e) => {
        const touch = e.touches[0];
        isDragging = true;
        
        if (widgetContainer.style.position !== 'fixed') {
            widgetContainer.style.position = 'fixed';
        }
        
        const rect = widgetContainer.getBoundingClientRect();
        offsetX = touch.clientX - rect.left;
        offsetY = touch.clientY - rect.top;
        
        widgetContainer.style.right = 'auto';
        widgetContainer.style.bottom = 'auto';
        e.preventDefault();
    });

    document.addEventListener('touchmove', (e) => {
        if (!isDragging) return;
        const touch = e.touches[0];
        
        let newX = touch.clientX - offsetX;
        let newY = touch.clientY - offsetY;
        
        const maxLeft = window.innerWidth - widgetContainer.offsetWidth;
        const maxTop = window.innerHeight - widgetContainer.offsetHeight;
        
        newX = Math.max(0, Math.min(newX, maxLeft));
        newY = Math.max(0, Math.min(newY, maxTop));
        
        widgetContainer.style.left = newX + 'px';
        widgetContainer.style.top = newY + 'px';
        e.preventDefault();
    });

    document.addEventListener('touchend', () => {
        isDragging = false;
    });

})();
