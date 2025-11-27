(function() {
    // 1. Prevent duplicates
    if (document.getElementById('my-ai-gui-root')) {
        console.log("AI GUI is already running.");
        return;
    }

    // --- Configuration ---
    const WORKER_URL = 'https://twilight-hill-3941.blueboltgamingyt.workers.dev';
    const GAMES_WEBSITE_URL = 'https://www.noobsplayground.space/games.html';
    const PROXY_URL = 'https://scramjet.mercurywork.shop/'; // Your updated proxy URL
    // --- End Configuration ---
    
    // --- Default & Saved Colors ---
    const DEFAULT_COLORS = {
        // Base colors (Dark Discord theme)
        '--gui-bg-main': '#2c2f33',    
        '--gui-bg-secondary': '#36393f', 
        '--gui-bg-header': '#23272a',  
        '--gui-bg-input': '#40444b',   
        '--gui-text-main': '#f6f6f7',  
        // Accent colors
        '--gui-accent': '#7289da',     
        '--gui-accent-hover': '#677bc4'
    };

    // Load saved colors from local storage or use defaults
    function loadColors() {
        const savedColors = {};
        for (const key in DEFAULT_COLORS) {
            savedColors[key] = localStorage.getItem(key) || DEFAULT_COLORS[key];
        }
        return savedColors;
    }
    const currentColors = loadColors();
    // --- End Color Setup ---

    // 2. Create Host and Shadow DOM
    const host = document.createElement('div');
    host.id = 'my-ai-gui-root';
    
    // Apply initial colors to host using inline CSS variables
    let styleVariables = '';
    for (const [key, value] of Object.entries(currentColors)) {
        styleVariables += `${key}: ${value} !important;`;
    }
    host.style.cssText = styleVariables;
    
    // CRITICAL STYLES ON HOST 
    host.style.setProperty('position', 'fixed', 'important');
    host.style.setProperty('z-index', '999999', 'important');
    
    document.body.appendChild(host);

    const shadow = host.attachShadow({ mode: 'open' });

    // 3. Styles (safe reset + UI styles)
    const style = document.createElement('style');
    style.textContent = `
        :host {
          all: initial !important;
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif !important;
          position: fixed !important;
          z-index: 999999 !important;
          display: block !important;
        }

        /* Basic safe reset */
        *, *::before, *::after {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }

        button, input, [id], [class] {
          all: unset;
          box-sizing: border-box;
          display: revert;
        }

        button { cursor: pointer; }
        input { outline: none; }

        /* Drag handles */
        #gui-header,
        .floating-window-header {
          pointer-events: auto !important;
          user-select: none !important;
          cursor: grab !important;
          display: flex !important;
          justify-content: space-between;
          align-items: center;
        }
        #gui-header:active,
        .floating-window-header:active {
          cursor: grabbing !important;
        }
        
        /* FIX: Main GUI header controls horizontal */
        .header-controls {
            display: flex;
            align-items: center;
        }
        
        /* Control buttons in headers */
        .header-controls button,
        .floating-window-header .window-controls button {
          pointer-events: auto !important;
          cursor: pointer !important;
          color: #99aab5;
          margin-left: 5px;
          font-size: 16px;
          padding: 2px 5px;
          line-height: 1;
          display: flex;
          align-items: center;
          font-weight: bold;
        }
        .header-controls button:hover,
        .window-controls button:hover {
            color: white;
        }
        .window-controls .close-btn:hover {
            color: #ff0000;
        }
        .window-controls button svg {
            width: 18px;
            height: 18px;
            fill: currentColor;
        }

        /* UI container styles using CSS variables */
        .container {
          width: 320px;
          height: 480px;
          background-color: var(--gui-bg-main);
          color: var(--gui-text-main);
          border-radius: 10px;
          display: grid;
          grid-template-rows: 40px 1fr 50px 60px;
          box-shadow: 0 8px 16px rgba(0,0,0,0.4);
          overflow: hidden;
          border: 1px solid var(--gui-bg-main);
          transition: height 0.3s, width 0.3s;
          /* --- CENTERING STYLES --- */
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          /* --- END CENTERING STYLES --- */
        }

        /* Header / drag bar */
        #gui-header {
          padding: 0 10px;
          background-color: var(--gui-bg-header);
          color: var(--gui-text-main);
          border-top-left-radius: 10px;
          border-top-right-radius: 10px;
        }
        .header-controls button {
          font-weight: bold;
        }
        .close-btn:hover { color: #ff0000; }

        /* Minimized */
        .minimized { height: 40px; width: 320px; }
        .minimized .chat-area, .minimized .input-area, .minimized .nav-bar { display: none; }

        /* Chat area */
        .chat-area {
          padding: 10px;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 8px;
          background-color: var(--gui-bg-secondary);
        }

        .message-wrapper { display: flex; width: 100%; }
        .message { 
          padding: 8px 12px; border-radius: 18px; font-size: 13px; line-height: 1.4; word-wrap: break-word; width: fit-content; max-width: 75%; 
        }
        .user-msg-wrapper { justify-content: flex-end; }
        .ai-msg-wrapper { justify-content: flex-start; }

        .user-msg { background-color: var(--gui-accent); color: white; border-bottom-right-radius: 4px; }
        .ai-msg { background-color: #4f545c; color: var(--gui-text-main); border-bottom-left-radius: 4px; }

        /* Input & nav */
        .input-area {
          padding: 8px 10px;
          background-color: var(--gui-bg-secondary);
          display: flex;
          gap: 5px; 
        }
        input {
          flex-grow: 1;
          padding: 8px 12px;
          border-radius: 20px;
          border: 1px solid #444;
          background: var(--gui-bg-input);
          color: white;
          font-size: 14px;
        }
        button.send-btn {
          background: var(--gui-accent);
          border: none;
          color: white;
          padding: 8px 15px;
          border-radius: 20px;
          font-weight: bold;
          transition: background 0.2s;
        }
        button.send-btn:hover { background: var(--gui-accent-hover); }

        .nav-bar {
          height: 60px;
          background-color: var(--gui-bg-header);
          display: flex;
          justify-content: space-around;
          align-items: center;
          border-top: 1px solid var(--gui-bg-secondary);
        }
        .nav-btn {
          opacity: 0.8;
          color: #99aab5;
          font-size: 10px;
          transition: opacity 0.2s;
        }
        .nav-btn:hover { opacity: 1; color: white; }
        .nav-btn svg { width: 20px; height: 20px; fill: currentColor; margin-bottom: 2px; }
        .discord-btn svg { fill: var(--gui-accent); }
        
        /* Floating Window Styles (Shared for Games, Proxy, Settings) */
        .floating-window {
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 800px;
          height: 600px;
          background-color: var(--gui-bg-header);
          border-radius: 15px;
          box-shadow: 0 15px 30px rgba(0,0,0,0.7);
          z-index: 1000000;
          display: grid;
          grid-template-rows: 40px 1fr;
          overflow: hidden;
          border: 2px solid var(--gui-accent);
          transition: width 0.3s, height 0.3s, border-radius 0.3s, transform 0s;
        }
        
        /* Fullscreen Class */
        .floating-window:fullscreen,
        .floating-window:-webkit-full-screen,
        .floating-window:-moz-full-screen,
        .floating-window:-ms-full-screen {
            top: 0 !important;
            left: 0 !important;
            width: 100vw !important;
            height: 100vh !important;
            transform: none !important;
            border-radius: 0 !important;
            border: none !important;
            z-index: 99999999 !important;
        }

        #settings-panel {
            width: 350px;
            height: 300px;
            grid-template-rows: 40px 1fr;
        }
        
        /* Window Header Styles (Shared) */
        .floating-window-header {
          background-color: var(--gui-bg-main);
          color: var(--gui-text-main);
          padding: 0 10px;
          font-size: 18px;
          font-weight: bold;
        }

        /* Ensure window controls are horizontal */
        .window-controls {
            display: flex;
            align-items: center;
        }

        /* Settings Content */
        .settings-content {
            padding: 20px;
            background-color: var(--gui-bg-secondary);
            color: var(--gui-text-main);
            display: flex;
            flex-direction: column;
            gap: 15px;
        }

        .setting-group {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 5px 0;
            border-bottom: 1px solid #4f545c;
        }
        .setting-group label {
            font-size: 14px;
            font-weight: 600;
        }
        
        /* Custom Color Input Styling */
        .color-input-wrapper {
            width: 40px;
            height: 25px;
            border: 2px solid var(--gui-accent);
            border-radius: 4px;
            overflow: hidden;
            position: relative;
        }
        .color-input-wrapper input[type="color"] {
            position: absolute;
            top: -5px;
            left: -5px;
            width: 150%;
            height: 150%;
            opacity: 0;
            cursor: pointer;
        }
        .color-swatch {
            width: 100%;
            height: 100%;
            border-radius: 2px;
            pointer-events: none;
            transition: background-color 0.2s;
        }


        /* Iframe Styles */
        .iframe-container { width: 100%; height: 100%; }
        .iframe-container iframe { width: 100%; height: 100%; border: none; display: block; }

        /* Markdown */
        .markdown-content ul { list-style-type: disc; padding-left: 20px; margin: 5px 0; }
        .markdown-content li { margin-bottom: 5px; padding-left: 5px; }
    `;
    shadow.appendChild(style);

    // 4. Icons
    const icons = {
        game: '<path d="M21,6H3C1.9,6,1,6.9,1,8v8c0,1.1,0.9,2,2,2h18c1.1,0,2-0.9,2-2V8C23,6.9,22.1,6,21,6z M10,13H8v2H6v-2H4v-2h2V9h2v2h2V13z M14,13.5c-0.83,0-1.5-0.67-1.5-1.5s0.67-1.5,1.5-1.5s1.5,0.67,1.5,1.5S14.83,13.5,14,13.5z M18,10.5c-0.83,0-1.5-0.67-1.5-1.5s0.67-1.5,1.5-1.5s1.5,0.67,1.5,1.5S18.83,10.5,18,10.5z"/>',
        browser: '<path d="M12,2C6.48,2,2,6.48,2,12s4.48,10,10,10s10-4.48,10-10S17.52,2,12,2z M11,19.93C7.05,19.44,4,16.08,4,12s3.05-7.44,7-7.93V19.93z M13,4.07C16.95,4.56,20,7.92,20,12s-3.05,7.44-7,7.93V4.07z"/>',
        settings: '<path d="M19.14,12.94c0.04-0.3,0.06-0.61,0.06-0.94c0-0.32-0.02-0.64-0.07-0.94l2.03-1.58c0.18-0.14,0.23-0.41,0.12-0.61 l-1.92-3.32c-0.12-0.22-0.37-0.29-0.59-0.22l-2.39,0.96c-0.5-0.38-1.03-0.7-1.62-0.94L14.4,2.81c-0.04-0.24-0.24-0.41-0.48-0.41 h-3.84c-0.24,0-0.43,0.17-0.47,0.41L9.25,5.35C8.66,5.59,8.12,5.92,7.63,6.29L5.24,5.33c-0.22-0.08-0.47,0-0.59,0.22L2.74,8.87 C2.62,9.08,2.66,9.34,2.86,9.48l2.03,1.58C4.84,11.36,4.8,11.69,4.8,12s0.02,0.64,0.07,0.94l-2.03,1.58 c-0.18,0.14-0.23,0.41-0.12,0.61l1.92,3.32c0.12,0.22,0.37,0.29,0.59,0.22l2.39-0.96c0.5,0.38,1.03,0.7,1.62,0.94l0.36,2.54 c0.05,0.24,0.24,0.41,0.48,0.41h3.84c0.24,0,0.43-0.17,0.47-0.41l0.36-2.54c0.59-0.24,1.13-0.56,1.62-0.94l2.39,0.96 c0.22,0.08,0.47,0,0.59-0.22l1.92-3.32c0.12-0.22,0.07-0.47-0.12-0.61L19.14,12.94z M12,15.6c-1.98,0-3.6-1.62-3.6-3.6 s1.62-3.6,3.6-3.6s3.6,1.62,3.6,3.6S13.98,15.6,12,15.6z"/>',
        discord: '<path d="M19.27 5.33C17.94 4.71 16.5 4.26 15 4a.09.09 0 0 0-.07.03c-.18.33-.39.76-.53 1.09a16.09 16.09 0 0 0-4.8 0c-.14-.34-.35-.76-.54-1.09c-.01-.02-.04-.03-.07-.03c-1.5.26-2.93.71-4.27 1.33c-.01 0-.02.01-.03.02c-2.72 4.07-3.47 8.03-3.1 11.95c0 .02.01.04.03.05c1.8 1.32 3.53 2.12 5.2 2.65c.03.01.06 0 .07-.02c.4-.55.76-1.13 1.07-1.74c.02-.04 0-.08-.04-.09c-.57-.22-1.11-.48-1.64-.78c-.04-.02-.04-.08.01-.11c.11-.08.22-.17.33-.25c.02-.02.05-.02.07-.01c3.44 1.57 7.15 1.57 10.55 0c.02-.01.05-.01.07.01c.11.09.22.17.33.26c.04.03.04.09-.01.11c-.52.31-1.07.56-1.64.78c-.04.01-.05.05-.04.09c.32.61.68 1.19 1.07 1.74c.03.01.06.02.09.01c1.72-.53 3.45-1.33 5.25-2.65c.02-.01.03-.03.03-.05c.44-4.53-.6-8.5-3.26-12.06a.06.06 0 0 0-.02-.02zM8.52 14.91c-1.03 0-1.89-.95-1.89-2.12s.84-2.12 1.89-2.12c1.06 0 1.9.96 1.89 2.12c0 1.17-.84 2.12-1.89 2.12zm6.97 0c-1.03 0-1.89-.95-1.89-2.12s.84-2.12 1.89-2.12c1.06 0 1.9.96 1.89 2.12c0 1.17-.85 2.12-1.89 2.12z"/>',
        fullscreen: '<path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/>',
        exitFullscreen: '<path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z"/>'
    };

    // 5. Build HTML
    const container = document.createElement('div');
    container.className = 'container';
    container.innerHTML = `
        <div id="gui-header">
            <span>Noobs GUI v1.0</span>
            <div class="header-controls">
                <button id="min-btn" title="Minimize">—</button>
                <button id="close-btn" class="close-btn" title="Exit">x</button>
            </div>
        </div>
        <div class="chat-area" id="chat-log">
            <div class="message-wrapper ai-msg-wrapper"><div class="message ai-msg">Hell! Im Noob's AI, how can i help you?</div></div>
        </div>
        <div class="input-area">
            <input type="text" id="user-input" placeholder="Ask AI..." />
            <button class="send-btn" id="send-btn">Send</button>
        </div>
        <div class="nav-bar">
            <button class="nav-btn" title="Games" id="game-library-btn"><svg viewBox="0 0 24 24">${icons.game}</svg>Games</button>
            <button class="nav-btn" title="Proxy Browser" id="browser-btn"><svg viewBox="0 0 24 24">${icons.browser}</svg>Browser</button>
            <button class="nav-btn" title="Settings" id="settings-btn"><svg viewBox="0 0 24 24">${icons.settings}</svg>Settings</button>
            <button class="nav-btn discord-btn" title="Discord" id="discord-btn"><svg viewBox="0 0 24 24">${icons.discord}</svg>Discord</button>
        </div>
    `;
    shadow.appendChild(container);

    // 6. Query elements
    const chatLog = shadow.getElementById('chat-log');
    const input = shadow.getElementById('user-input');
    const sendBtn = shadow.getElementById('send-btn');
    const guiContainer = shadow.querySelector('.container');
    const guiHeader = shadow.getElementById('gui-header');
    const minBtn = shadow.getElementById('min-btn');
    const closeBtn = shadow.getElementById('close-btn');
    const gameLibraryBtn = shadow.getElementById('game-library-btn');
    const browserBtn = shadow.getElementById('browser-btn');
    const settingsBtn = shadow.getElementById('settings-btn');
    const discordBtn = shadow.getElementById('discord-btn');

    // 7. Message rendering
    function addMessage(text, type) {
        const wrapper = document.createElement('div');
        wrapper.className = `message-wrapper ${type}-wrapper`;
        const div = document.createElement('div');
        div.className = `message ${type} markdown-content`;

        let htmlText = text;
        // Simple Markdown conversion (bold, headers, lists, horizontal rules, and math)
        htmlText = htmlText.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>');
        htmlText = htmlText.replace(/^##\s*(.*)$/gm, '<h2>$1</h2>');
        htmlText = htmlText.replace(/^[*-]\s+(.*)/gm, '<li>$1</li>');
        if (htmlText.includes('<li>') && !htmlText.includes('<ul>')) {
             htmlText = `<ul>${htmlText}</ul>`;
        }
        htmlText = htmlText.replace(/\$\$(.*?)\$\$/gs, '<div class="math-display">$1</div>');
        htmlText = htmlText.replace(/^---/gm, '<hr>');

        div.innerHTML = htmlText;

        wrapper.appendChild(div);
        chatLog.appendChild(wrapper);
        chatLog.scrollTop = chatLog.scrollHeight;
        return div;
    }

    // 8. AI interaction
    async function handleSend() {
        const text = input.value.trim();
        if (!text) return;

        addMessage(text, 'user-msg');
        input.value = '';

        input.disabled = true;
        sendBtn.disabled = true;

        const loadingMsg = addMessage('AI is typing...', 'ai-msg');

        try {
            const response = await fetch(WORKER_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: text })
            });

            loadingMsg.parentElement.remove();

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Worker HTTP Error (${response.status}): ${errorText.substring(0, 100)}...`);
            }

            const data = await response.text();
            addMessage(data, 'ai-msg');

        } catch (err) {
            loadingMsg.parentElement.remove();
            addMessage('**Connection/Request Error:** ' + err.message, 'ai-msg');
        } finally {
            input.disabled = false;
            sendBtn.disabled = false;
            input.focus();
        }
    }
    
    // ⭐ FULLSCREEN TOGGLE LOGIC ⭐
    function getFullscreenElement() {
        return document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement || document.msFullscreenElement;
    }

    function toggleFullscreen(element) {
        const isFullscreen = getFullscreenElement() === element;

        if (isFullscreen) {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            } else if (document.webkitExitFullscreen) { 
                document.webkitExitFullscreen();
            } else if (document.mozCancelFullScreen) { 
                document.mozCancelFullScreen();
            } else if (document.msExitFullscreen) { 
                document.msExitFullscreen();
            }
        } else {
            if (element.requestFullscreen) {
                element.requestFullscreen();
            } else if (element.webkitRequestFullscreen) { 
                element.webkitRequestFullscreen();
            } else if (element.mozRequestFullScreen) { 
                element.mozRequestFullScreen();
            } else if (element.msRequestFullscreen) { 
                element.msRequestFullscreen();
            }
        }
    }

    // 9. Floating Window Creator
    function createFloatingWindow(id, title, innerHTML, width = '800px', height = '600px', controls = '') {
        if (shadow.getElementById(id)) return;
        
        const floatingWindow = document.createElement('div');
        floatingWindow.id = id;
        floatingWindow.className = 'floating-window'; 
        floatingWindow.style.width = width;
        floatingWindow.style.height = height;
        
        floatingWindow.innerHTML = `
            <div class="floating-window-header">
                <span>${title}</span>
                <div class="window-controls">
                    ${controls}
                    <button class="close-btn" id="${id}-close-btn">x</button>
                </div>
            </div>
            ${innerHTML}
        `;
        
        shadow.appendChild(floatingWindow);
        
        // Setup Dragging
        const header = floatingWindow.querySelector('.floating-window-header');
        dragElement(floatingWindow, header);

        // Close button listener
        shadow.getElementById(`${id}-close-btn`).addEventListener('click', () => {
            if (getFullscreenElement() === floatingWindow) {
                document.exitFullscreen();
            }
            floatingWindow.remove();
        });
        
        return floatingWindow;
    }

    // 9a. Game library (iframe)
    function showGameLibrary() {
        const iframeHTML = `<div class="iframe-container"><iframe src="${GAMES_WEBSITE_URL}"></iframe></div>`;
        if (!GAMES_WEBSITE_URL || GAMES_WEBSITE_URL.includes('your-games-homepage')) {
             alert("Error: Please update the GAMES_WEBSITE_URL variable.");
             return;
        }
        createFloatingWindow('game-library-window', '🎮 Games', iframeHTML, '800px', '600px');
    }
    
    // 9b. Proxy Browser (iframe)
    function showProxyWindow() {
        if (!PROXY_URL || PROXY_URL.includes('holyub.com')) {
             alert("Error: Please update the PROXY_URL variable with your actual link.");
             return;
        }
        
        const iframeHTML = `<div class="iframe-container"><iframe id="proxy-iframe" src="${PROXY_URL}" allow="fullscreen" allowfullscreen></iframe></div>`;
        
        // Controls: Fullscreen button
        const controls = `
            <button id="proxy-fullscreen-btn" title="Fullscreen">
                <svg viewBox="0 0 24 24">${icons.fullscreen}</svg>
            </button>
        `;
        
        const panel = createFloatingWindow('proxy-browser-window', '🌐 Browser', iframeHTML, '800px', '600px', controls);
        if (!panel) return;
        
        // Attach Fullscreen Listener
        const fsBtn = shadow.getElementById('proxy-fullscreen-btn');
        fsBtn.addEventListener('click', () => {
            toggleFullscreen(panel);
        });

        // Listen for native exit (Escape key, etc.) to restore button icon state
        const fullscreenChangeHandler = () => {
             const isFullscreen = getFullscreenElement() === panel;
             if (isFullscreen) {
                fsBtn.innerHTML = `<svg viewBox="0 0 24 24">${icons.exitFullscreen}</svg>`;
                fsBtn.title = "Exit Fullscreen";
             } else {
                fsBtn.innerHTML = `<svg viewBox="0 0 24 24">${icons.fullscreen}</svg>`;
                fsBtn.title = "Fullscreen";
             }
        };

        // Attach listeners to the shadow root's owner document (the main page)
        shadow.ownerDocument.addEventListener('fullscreenchange', fullscreenChangeHandler);
        shadow.ownerDocument.addEventListener('webkitfullscreenchange', fullscreenChangeHandler);
        shadow.ownerDocument.addEventListener('mozfullscreenchange', fullscreenChangeHandler);
        shadow.ownerDocument.addEventListener('msfullscreenchange', fullscreenChangeHandler);
        
        // Clean up listeners when the panel is removed
        panel.addEventListener('remove', () => {
            shadow.ownerDocument.removeEventListener('fullscreenchange', fullscreenChangeHandler);
            shadow.ownerDocument.removeEventListener('webkitfullscreenchange', fullscreenChangeHandler);
            shadow.ownerDocument.removeEventListener('mozfullscreenchange', fullscreenChangeHandler);
            shadow.ownerDocument.removeEventListener('msfullscreenchange', fullscreenChangeHandler);
        });
    }

    // 9c. Settings Panel
    function applyColor(cssVariable, color) {
        host.style.setProperty(cssVariable, color, 'important');
        localStorage.setItem(cssVariable, color);
    }
    
    function showSettingsPanel() {
        const savedAccent = localStorage.getItem('--gui-accent') || DEFAULT_COLORS['--gui-accent'];
        const savedBg = localStorage.getItem('--gui-bg-main') || DEFAULT_COLORS['--gui-bg-main'];
        
        const contentHTML = `
            <div class="settings-content">
                <h3>Theme Customization</h3>
                <div class="setting-group">
                    <label for="bg-color-input">Background Color:</label>
                    <div class="color-input-wrapper">
                        <div class="color-swatch" style="background-color: ${savedBg};"></div>
                        <input type="color" id="bg-color-input" value="${savedBg}" data-variable="--gui-bg-main">
                    </div>
                </div>
                <div class="setting-group">
                    <label for="accent-color-input">Accent Color:</label>
                    <div class="color-input-wrapper">
                        <div class="color-swatch" style="background-color: ${savedAccent};"></div>
                        <input type="color" id="accent-color-input" value="${savedAccent}" data-variable="--gui-accent">
                    </div>
                </div>
            </div>
        `;

        const panel = createFloatingWindow('settings-panel', '⚙️ Settings', contentHTML, '350px', '300px');
        if (!panel) return;
        
        panel.addEventListener('input', (e) => {
            const input = e.target;
            if (input.type === 'color') {
                const variable = input.getAttribute('data-variable');
                const color = input.value;
                
                const swatch = input.closest('.color-input-wrapper').querySelector('.color-swatch');
                if (swatch) swatch.style.backgroundColor = color;
                
                const adjustColor = (hex, amount) => {
                    let num = parseInt(hex.slice(1), 16), amt = Math.round(2.55 * amount);
                    let R = (num >> 16) + amt;
                    let G = (num >> 8 & 0x00FF) + amt;
                    let B = (num & 0x0000FF) + amt;
                    return `#${(0x1000000 + (R<255?R<1?0:R:255)*0x10000 + (G<255?G<1?0:G:255)*0x100 + (B<255?B<1?0:B:255)).toString(16).slice(1)}`;
                };
                
                if (variable === '--gui-accent') {
                    const hoverColor = adjustColor(color, -10); 
                    applyColor(variable, color);
                    applyColor('--gui-accent-hover', hoverColor);
                } else if (variable === '--gui-bg-main') {
                    const headerColor = adjustColor(color, -5); 
                    const secondaryColor = adjustColor(color, 5); 

                    applyColor(variable, color);
                    applyColor('--gui-bg-header', headerColor);
                    applyColor('--gui-bg-secondary', secondaryColor);
                    applyColor('--gui-bg-input', adjustColor(color, 10)); 
                }
            }
        });
        
    }


    // 10. Dragging (FIXED)
    function dragElement(elmnt, dragHandle) {
        let pos3 = 0, pos4 = 0; // Mouse position on click
        let offsetX = 0, offsetY = 0; // Initial mouse offset relative to element top-left
        
        dragHandle.onmousedown = dragMouseDown;

        function dragMouseDown(e) {
            // Prevent dragging if the window is in fullscreen mode
            if (getFullscreenElement() === elmnt) return;

            e = e || window.event;
            e.preventDefault();
            
            // Get the current mouse position
            pos3 = e.clientX;
            pos4 = e.clientY;
            
            // --- FIX: Calculate the initial mouse offset relative to the element's visual position ---
            const rect = elmnt.getBoundingClientRect();
            offsetX = e.clientX - rect.left;
            offsetY = e.clientY - rect.top;

            // Apply 'none' to transform and auto to top/left/right/bottom to start the manual positioning
            elmnt.style.transform = 'none';
            elmnt.style.bottom = 'auto';
            elmnt.style.right = 'auto';
            
            // Set the *initial* position based on where it visually sits (no jump!)
            elmnt.style.top = rect.top + "px";
            elmnt.style.left = rect.left + "px";
            // --- END FIX ---
            
            window.onmouseup = closeDragElement;
            window.onmousemove = elementDrag;
            
            document.body.style.cursor = 'grabbing';
            dragHandle.style.cursor = 'grabbing !important';
        }

        function elementDrag(e) {
            e = e || window.event;
            e.preventDefault();
            
            // The new position is the current mouse position minus the initial offset
            let newLeft = e.clientX - offsetX;
            let newTop = e.clientY - offsetY;
            
            // --- BOUNDARY CHECKING AND CLAMPING ---
            
            const minLeft = 0; 
            const minTop = 0; 
            
            const maxWidth = window.innerWidth - elmnt.offsetWidth; 
            const maxHeight = window.innerHeight - elmnt.offsetHeight; 

            // Clamp the new positions
            newLeft = Math.max(minLeft, Math.min(newLeft, maxWidth));
            newTop = Math.max(minTop, Math.min(newTop, maxHeight));
            
            // Apply the new clamped position
            elmnt.style.top = newTop + "px";
            elmnt.style.left = newLeft + "px";
        }

        function closeDragElement() {
            window.onmouseup = null;
            window.onmousemove = null;
            
            document.body.style.cursor = 'default';
            dragHandle.style.cursor = 'grab !important';
        }
    }


    // 11. Minimize & close
    function toggleMinimize() {
        guiContainer.classList.toggle('minimized');
        if (guiContainer.classList.contains('minimized')) {
            minBtn.textContent = '☐';
        } else {
            minBtn.textContent = '—';
        }
    }

    function closeGui() {
        host.remove();
        // Ensure all child windows are removed cleanly
        shadow.querySelectorAll('.floating-window').forEach(win => win.remove());
        
        // If the main window was the fullscreen element (unlikely but safe check)
        if (document.fullscreenElement) {
             document.exitFullscreen();
        }
    }

    // 12. Wire up events
    sendBtn.addEventListener('click', handleSend);
    input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !sendBtn.disabled) handleSend();
    });

    gameLibraryBtn.addEventListener('click', showGameLibrary);
    browserBtn.addEventListener('click', showProxyWindow);
    settingsBtn.addEventListener('click', showSettingsPanel); 
    discordBtn.addEventListener('click', () => window.open('https://discord.gg/8BFU7tphfP', '_blank'));

    minBtn.addEventListener('click', toggleMinimize);
    closeBtn.addEventListener('click', closeGui);

    // Initialize dragging on the main GUI container
    dragElement(guiContainer, guiHeader);
})();
