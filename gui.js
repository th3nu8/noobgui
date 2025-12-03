(function() {
    // 1. Prevent duplicates
    if (document.getElementById('my-ai-gui-root')) {
        console.log("AI GUI is already running.");
        return;
    }

    // --- Configuration ---
    const WORKER_URL = 'https://twilight-hill-3941.blueboltgamingyt.workers.dev';
    const GAMES_WEBSITE_URL = 'https://www.noobsplayground.space/games.html';
    const PROXY_URL = 'browser.html'; 
    
    // ⭐ Dead Simple Chat Embed ⭐
    const DEAD_SIMPLE_CHAT_IFRAME_HTML = `
        <iframe 
            src="https://deadsimplechat.com/6Z5TGAHW9" 
            width="100%" 
            height="100%" 
            frameborder="0"
            style="border: none; display: block;">
        </iframe>
    `;
    // ⭐ End Chat Embed ⭐

    // ⭐ Partner Links Configuration ⭐
    const PARTNER_LINKS = [
        { name: "t9 OS", url: "https://t9os.vercel.app" },
        { name: "Refined Stuff", url: "https://educationallearning.azurewebsites.net/" },
        { name: "Axiom", url: "https://ultralight.mwbread.com/" }
    ];
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

    // ⭐ Utility: Get a setting from localStorage (handles boolean conversion) ⭐
    function getSetting(key, defaultValue) {
        const value = localStorage.getItem(key);
        if (value === null) return defaultValue;
        if (typeof defaultValue === 'boolean') {
            return value === 'true';
        }
        return value;
    }
    
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
            justify-self: end; /* Moves controls to the right */
            grid-column: 3 / 4; /* Right column */
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
            grid-template-rows: 40px 1fr 50px 0px; /* Default layout: Header, Chat, Input, Nav (0px) */
            box-shadow: 0 8px 16px rgba(0,0,0,0.4);
            overflow: hidden;
            border: 1px solid var(--gui-bg-main);
            transition: height 0.3s, width 0.3s;
            /* --- CENTERING STYLES (for AI Chat) --- */
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%); 
            /* --- END CENTERING STYLES --- */
        }

        /* Class to minimize/hide main chat (only used by the minimize button now) */
        .hide-chat .chat-area,
        .hide-chat .input-area {
            display: none !important;
        }
        .hide-chat {
            grid-template-rows: 40px 0px 0px 0px; 
            height: 40px; 
        }


        /* Header / drag bar */
        #gui-header {
            padding: 0 10px;
            background-color: var(--gui-bg-header);
            color: var(--gui-text-main);
            border-top-left-radius: 10px;
            border-top-right-radius: 10px;
            /* Use Grid for reliable 3-column layout */
            display: grid !important; 
            grid-template-columns: auto 1fr auto; /* Dropdown, Title, Controls */
            align-items: center;
            gap: 10px;
        }
        
        .header-menu {
            /* This column holds the dropdown */
            display: flex;
            align-items: center;
            grid-column: 1 / 2;
        }
        .header-title {
            text-align: center;
            font-size: 16px;
            font-weight: bold;
            grid-column: 2 / 3; /* Center column */
        }
        
        .close-btn:hover { color: #ff0000; }

        /* Minimized */
        .minimized { height: 40px; width: 320px; }
        .minimized .chat-area, .minimized .input-area { display: none; }
        /* Hide the old nav-bar area entirely */
        .nav-bar { display: none !important; height: 0 !important; }

        /* Chat area (Applies to both Main and Floating Chat) */
        .chat-area {
            padding: 10px;
            overflow-y: auto;
            display: flex;
            flex-direction: column;
            gap: 8px;
            background-color: var(--gui-bg-secondary);
        }

        .message-wrapper { 
            display: flex; 
            width: 100%; 
            flex-direction: column; /* Allow header span on its own line */
        }
        .message { 
            padding: 8px 12px; border-radius: 18px; font-size: 13px; line-height: 1.4; word-wrap: break-word; width: fit-content; max-width: 75%; 
            margin-top: 2px; /* Space between message and optional timestamp/header */
        }
        /* Message alignment classes (used in wrapper) */
        .user-msg-wrapper { align-items: flex-end; }
        .ai-msg-wrapper { align-items: flex-start; }

        /* User Message: Note: Colors are now set inline in JS for highest priority. */
        .user-msg { 
            /* background-color and color are now applied via JS for robustness */
            border-bottom-right-radius: 4px; 
        }
        /* AI/Friend Message: Background color is set here, but reinforced by JS inline style */
        .ai-msg { 
            background-color: #5865f2 !important; 
            /* color is now applied via JS for robustness */
            border-bottom-left-radius: 4px; 
        }

        /* Input & send area */
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
            color: white !important; /* FIX: Ensure input text is white */
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
        
        /* Dropdown button style inherited from .nav-btn, but placed in the header */
        .nav-btn {
            opacity: 0.8;
            color: #99aab5;
            font-size: 14px; /* Adjusted size for header */
            padding: 5px;
            display: flex;
            align-items: center;
            transition: opacity 0.2s;
        }
        .nav-btn:hover { opacity: 1; color: white; }
        .nav-btn svg { width: 18px; height: 18px; fill: currentColor; margin-right: 5px; }

        /* --- NEW DROPDOWN STYLES --- */
        .dropdown-menu-container {
            position: relative;
            pointer-events: auto !important;
            z-index: 1000001; /* Ensure dropdown is above floating windows */
        }

        .dropdown-toggle {
            background: var(--gui-bg-secondary); /* Use secondary BG for in-header button */
            color: var(--gui-text-main);
            padding: 5px 10px;
            border-radius: 5px;
            font-weight: bold;
            transition: background-color 0.2s;
            display: flex;
            align-items: center;
            gap: 5px;
        }
        .dropdown-toggle:hover {
            background-color: var(--gui-accent-hover);
        }

        .dropdown-content {
            display: none;
            position: absolute;
            top: 100%; /* Position below the toggle button */
            left: 0;
            min-width: 160px;
            background-color: var(--gui-bg-main);
            border: 1px solid var(--gui-accent);
            border-top: none;
            border-radius: 0 0 5px 5px;
            box-shadow: 0 4px 8px rgba(0,0,0,0.3);
            overflow: hidden;
            pointer-events: auto !important;
        }

        .dropdown-content.show {
            display: block;
        }

        .dropdown-content button {
            width: 100%;
            text-align: left;
            padding: 10px 15px;
            background: transparent;
            color: var(--gui-text-main);
            transition: background-color 0.15s;
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 14px;
        }
        
        .dropdown-content button:hover {
            background-color: var(--gui-bg-input);
            color: var(--gui-accent);
        }

        .dropdown-content button svg { 
            width: 16px; 
            height: 16px; 
            fill: currentColor; 
        }
        /* --- END NEW DROPDOWN STYLES --- */

        /* Floating Window Styles (Shared for Games, Proxy, Settings, Partners, and now CHAT) */
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
            height: 350px; 
            grid-template-rows: 40px 1fr;
        }
        
        /* Partners Window Size */
        #partners-window {
            width: 400px;
            height: 450px;
        }

        /* ⭐ User Chat Window Size for Iframe ⭐ */
        #chat-window {
            width: 450px;
            height: 650px;
            grid-template-rows: 40px 1fr; /* Header + Iframe Content */
        }
        #chat-window-content {
            /* This is the container for the iframe */
            width: 100%;
            height: 100%;
        }
        /* ⭐ END NEW CHAT STYLES ⭐ */

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

        /* Settings Content & Partners Content (Flex-based scrollable body) */
        .settings-content, .partners-content {
            padding: 20px;
            background-color: var(--gui-bg-secondary);
            color: var(--gui-text-main);
            display: flex;
            flex-direction: column;
            gap: 15px;
            overflow-y: auto;
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
        
        /* Toggle Switch Styling */
        .switch {
            position: relative;
            display: inline-block;
            width: 34px;
            height: 20px;
        }

        .switch input { 
            opacity: 0;
            width: 0;
            height: 0;
        }

        .slider {
            position: absolute;
            cursor: pointer;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-color: #ccc;
            transition: .4s;
            border-radius: 20px;
        }

        .slider:before {
            position: absolute;
            content: "";
            height: 16px;
            width: 16px;
            left: 2px;
            bottom: 2px;
            background-color: white;
            transition: .4s;
            border-radius: 50%;
        }

        input:checked + .slider {
            background-color: var(--gui-accent);
        }

        input:focus + .slider {
            box-shadow: 0 0 1px var(--gui-accent);
        }

        input:checked + .slider:before {
            transform: translateX(14px);
        }
        
        /* Iframe Styles */
        .iframe-container { width: 100%; height: 100%; }
        .iframe-container iframe { width: 100%; height: 100%; border: none; display: block; }

        /* Partners Link Styles */
        .partners-content h3 {
            border-bottom: 2px solid var(--gui-accent);
            padding-bottom: 5px;
            margin-bottom: 10px;
        }

        .partner-link-item {
            background-color: var(--gui-bg-main);
            padding: 10px 15px;
            border-radius: 8px;
            transition: background-color 0.2s;
        }

        .partner-link-item:hover {
            background-color: var(--gui-bg-input);
        }
        
        .partner-link-item a {
            display: block;
            color: var(--gui-accent);
            text-decoration: none;
            font-weight: bold;
            font-size: 16px;
        }

        /* Markdown */
        .markdown-content ul { list-style-type: disc; padding-left: 20px; margin: 5px 0; }
        .markdown-content li { margin-bottom: 5px; padding-left: 5px; }
        .markdown-content pre { 
            background: #23272a; 
            padding: 10px; 
            border-radius: 5px; 
            overflow-x: auto; 
            white-space: pre-wrap;
            word-wrap: break-word;
        }
    `;
    shadow.appendChild(style);

    // 5. Build HTML (Main GUI)
    const container = document.createElement('div');
    container.className = 'container';
    container.innerHTML = `
        <div id="gui-header">
            <div class="header-menu">
                <div class="dropdown-menu-container" id="main-dropdown">
                    <button class="dropdown-toggle" title="Menu">
                        ☰
                    </button>
                    <div class="dropdown-content" id="main-dropdown-content">
                    </div>
                </div>
            </div>

            <span class="header-title">Noobs GUI v1.2</span>
            
            <div class="header-controls">
                <button id="min-btn" title="Minimize">—</button>
                <button id="close-btn" class="close-btn" title="Exit">x</button>
            </div>
        </div>
        <div class="chat-area" id="main-chat-log">
            <div class="message-wrapper ai-msg-wrapper"><div class="message ai-msg">Hello! I'm Noob's AI, how can I help you?</div></div>
        </div>
        <div class="input-area" id="main-input-area">
            <input type="text" id="user-input" placeholder="Ask AI..." />
            <button class="send-btn" id="send-btn">Send</button>
        </div>
    `;
    shadow.appendChild(container);

    // 6. Query elements
    const chatLog = shadow.getElementById('main-chat-log'); 
    const input = shadow.getElementById('user-input');
    const sendBtn = shadow.getElementById('send-btn');
    const guiContainer = shadow.querySelector('.container');
    const guiHeader = shadow.getElementById('gui-header');
    const minBtn = shadow.getElementById('min-btn');
    const closeBtn = shadow.getElementById('close-btn');
    const mainDropdown = shadow.getElementById('main-dropdown');
    const dropdownToggle = mainDropdown.querySelector('.dropdown-toggle');
    const dropdownContent = shadow.getElementById('main-dropdown-content');

    // ⭐ Utility: Drag element ⭐
    function dragElement(elmnt, dragHandle) {
        let offsetX = 0, offsetY = 0, initialMouseX = 0, initialMouseY = 0; // Renamed pos variables for clarity
        
        function clamp(value, min, max) {
            return Math.min(Math.max(value, min), max);
        }
        
        dragHandle.onmousedown = dragMouseDown;

        function dragMouseDown(e) {
            // Prevent dragging if clicking controls
            if (e.target.closest('.window-controls') || e.target.closest('.dropdown-menu-container') || e.target.tagName.toLowerCase() === 'button') return;
            e = e || window.event;
            e.preventDefault();
            
            // --- FIX START: Calculate and store the initial offset ---
            
            // 1. Get the element's current on-screen position (rect)
            const rect = elmnt.getBoundingClientRect();
            
            // 2. Set the element to fixed position without transform, using its current screen position
            // This is CRITICAL to stop the element from snapping.
            elmnt.style.position = 'fixed'; 
            elmnt.style.top = rect.top + 'px';
            elmnt.style.left = rect.left + 'px';
            elmnt.style.transform = 'none'; // Remove the centering transform
            
            // 3. Store the difference between the mouse position and the element's top-left corner
            initialMouseX = e.clientX;
            initialMouseY = e.clientY;
            
            offsetX = e.clientX - rect.left; // Distance from element's left edge to mouse
            offsetY = e.clientY - rect.top;   // Distance from element's top edge to mouse

            // Set z-index high for dragging
            elmnt.style.zIndex = '1000002'; 

            // Start listening for drag events
            shadow.ownerDocument.onmouseup = closeDragElement;
            shadow.ownerDocument.onmousemove = elementDrag;
        }

        function elementDrag(e) {
            e = e || window.event;
            e.preventDefault();
            
            // Calculate the new element position by subtracting the stored offset
            let newLeft = e.clientX - offsetX;
            let newTop = e.clientY - offsetY;
            
            // --- FIX END ---

            const boundsX = window.innerWidth - elmnt.offsetWidth;
            const boundsY = window.innerHeight - elmnt.offsetHeight;
            
            elmnt.style.top = clamp(newTop, 0, boundsY) + "px";
            elmnt.style.left = clamp(newLeft, 0, boundsX) + "px";
        }

        function closeDragElement() {
            // Restore z-index or handle any other cleanup
            elmnt.style.zIndex = '999999'; 
            shadow.ownerDocument.onmouseup = null;
            shadow.ownerDocument.onmousemove = null;
        }
    }
    
    // 7. Message rendering 
    function addMessage(text, type, logElement = chatLog) { 
        const wrapper = document.createElement('div');
        wrapper.className = `message-wrapper ${type}-wrapper`;
        const div = document.createElement('div');
        
        // Add timestamp/sender only for the user-to-user chat window
        if (logElement.id === 'user-chat-log') {
            const sender = type === 'user-msg' ? `You` : `Friend`;
            const header = document.createElement('span');
            header.style.fontSize = '10px';
            header.style.color = '#99aab5';
            header.style.padding = '0 12px';
            header.textContent = `${sender} (${new Date().toLocaleTimeString()})`;
            wrapper.prepend(header); 
        }

        div.className = `message ${type.replace('-msg', '')} markdown-content`;

        // ⭐ INLINE STYLES: This forces colors for highest priority ⭐
        if (type === 'user-msg') {
            // User Message: Force white text and accent background
            const accentColor = host.style.getPropertyValue('--gui-accent'); 
            if (accentColor) {
                div.style.backgroundColor = accentColor;
            }
            div.style.color = 'white'; 
        } else if (type === 'ai-msg') { 
            // AI/Friend Message: Enforce both background and text color
            const mainTextColor = host.style.getPropertyValue('--gui-text-main') || 'white';
            div.style.color = mainTextColor;
            div.style.backgroundColor = '#5865f2'; // <-- FIXED: Explicitly set background color for AI/Friend box
        }
        // ⭐ END INLINE STYLES ⭐

        let htmlText = text;
        // Simple Markdown conversion
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
        logElement.appendChild(wrapper); 
        logElement.scrollTop = logElement.scrollHeight;
        return div;
    }

    // ⭐ AI Interaction Handler (Only for main GUI) ⭐
    async function handleAISend(inputElement, sendBtnElement, logElement) {
        const text = inputElement.value.trim();
        if (!text) return;

        addMessage(text, 'user-msg', logElement);
        inputElement.value = '';

        inputElement.disabled = true;
        sendBtnElement.disabled = true;

        const loadingMsg = addMessage('AI is typing...', 'ai-msg', logElement);

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
            addMessage(data, 'ai-msg', logElement);

        } catch (err) {
            loadingMsg.parentElement.remove();
            addMessage('**Connection/Request Error:** ' + err.message, 'ai-msg', logElement);
        } finally {
            inputElement.disabled = false;
            sendBtnElement.disabled = false;
            inputElement.focus();
        }
    }
    
    // 8. AI interaction (main UI)
    sendBtn.addEventListener('click', () => handleAISend(input, sendBtn, chatLog));
    input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleAISend(input, sendBtn, chatLog);
    });
    
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

    // ⭐ UTILITY: Close All Floating Windows ⭐
    function closeAllFloatingWindows() {
        shadow.querySelectorAll('.floating-window').forEach(win => {
            if (getFullscreenElement() === win) {
                document.exitFullscreen();
            }
            win.remove();
        });
    }

    // 9. Floating Window Creator
    function createFloatingWindow(id, title, innerHTML, width = '800px', height = '600px', controls = '') {
        if (shadow.getElementById(id)) return;
        
        // Ensure only one non-utility window is open at a time (except settings/partners)
        shadow.querySelectorAll('.floating-window').forEach(win => {
            if (win.id !== 'settings-panel' && win.id !== 'partners-window') {
                 if (getFullscreenElement() === win) {
                    document.exitFullscreen();
                 }
                win.remove();
            }
        });

        const windowDiv = document.createElement('div');
        windowDiv.id = id;
        windowDiv.className = 'floating-window';
        windowDiv.style.width = width;
        windowDiv.style.height = height;
        
        // Default controls: Fullscreen, Close
        const defaultControls = `
            <button class="fullscreen-btn" title="Toggle Fullscreen">
                <p>+</p>
            </button>
            <button class="close-btn" title="Close">
                <svg viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
            </button>
        `;

        windowDiv.innerHTML = `
            <div class="floating-window-header" id="${id}-header">
                <span class="window-title">${title}</span>
                <div class="window-controls">
                    ${controls || defaultControls}
                </div>
            </div>
            <div id="${id}-content">${innerHTML}</div>
        `;
        
        shadow.appendChild(windowDiv);

        const header = shadow.getElementById(`${id}-header`);
        dragElement(windowDiv, header);

        // Close button listener
        windowDiv.querySelector('.close-btn').addEventListener('click', () => {
             if (getFullscreenElement() === windowDiv) {
                document.exitFullscreen();
             }
            windowDiv.remove();
        });

        // Fullscreen button listener
        const fullscreenBtn = windowDiv.querySelector('.fullscreen-btn');
        if (fullscreenBtn) {
            fullscreenBtn.addEventListener('click', () => {
                toggleFullscreen(windowDiv);
                
                // Update icon when state changes (requires listener on document)
                const updateIcon = () => {
                    if (getFullscreenElement() === windowDiv) {
                        fullscreenBtn.innerHTML = `<svg viewBox="0 0 24 24">${icons.exitFullscreen}</svg>`;
                        windowDiv.classList.add('is-fullscreen');
                    } else {
                        fullscreenBtn.innerHTML = `<svg viewBox="0 0 24 24">${icons.fullscreen}</svg>`;
                        windowDiv.classList.remove('is-fullscreen');
                    }
                };
                
                // Listen globally for fullscreen changes
                const doc = windowDiv.ownerDocument;
                doc.removeEventListener('fullscreenchange', updateIcon);
                doc.addEventListener('fullscreenchange', updateIcon);
                doc.removeEventListener('webkitfullscreenchange', updateIcon);
                doc.addEventListener('webkitfullscreenchange', updateIcon);
            });
        }
        
        return windowDiv;
    }

    // 10. Utility: Open Specific Windows
    function openGamesWindow() {
        createFloatingWindow(
            'games-window',
            'Games',
            `<div class="iframe-container"><iframe src="${GAMES_WEBSITE_URL}"></iframe></div>`
        );
        closeDropdown();
    }

    function openProxyWindow() {
        createFloatingWindow(
            'proxy-window',
            'Browser',
            `<div class="iframe-container"><iframe src="${PROXY_URL}"></iframe></div>`
        );
        closeDropdown();
    }
    
    // ⭐ NEW: Open Dead Simple Chat Window ⭐
    function openUserChatWindow() {
        // ID: 'chat-window' is used for styling
        createFloatingWindow(
            'chat-window',
            'Chat',
            `<div id="chat-window-content" class="iframe-container">${DEAD_SIMPLE_CHAT_IFRAME_HTML}</div>`,
            '450px',
            '650px'
        );
        closeDropdown();
    }

    function openPartnersWindow() {
        const linksHtml = PARTNER_LINKS.map(p => `
            <div class="partner-link-item"><a href="${p.url}" target="_blank">${p.name}</a></div>
        `).join('');

        createFloatingWindow(
            'partners-window',
            'Partner Links',
            `<div class="partners-content">
                <h3>Partners</h3>
                ${linksHtml}
            </div>`,
            '400px',
            '280px',
            // Simple close button only
            `<button class="close-btn" title="Close">
                <svg viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
            </button>`
        );
        closeDropdown();
    }

    // 11. Dropdown Menu Logic
    function populateDropdown() {
        dropdownContent.innerHTML = `
            <button id="menu-chat-btn">
                Chat
            </button>
            <button id="menu-games-btn">
                Games
            </button>
            <button id="menu-proxy-btn">
                Browser
            </button>
            <hr style="border-color: #4f545c; margin: 5px 0;">
            <button id="menu-partners-btn">
                Partners
            </button>
            <button id="menu-settings-btn">
                Settings
            </button>
        `;

        // Attach listeners to newly created buttons
        shadow.getElementById('menu-chat-btn').addEventListener('click', openUserChatWindow); // ⭐ NEW LISTENER ⭐
        shadow.getElementById('menu-games-btn').addEventListener('click', openGamesWindow);
        shadow.getElementById('menu-proxy-btn').addEventListener('click', openProxyWindow);
        shadow.getElementById('menu-partners-btn').addEventListener('click', openPartnersWindow);
        shadow.getElementById('menu-settings-btn').addEventListener('click', openSettingsPanel);
    }
    
    function toggleDropdown() {
        dropdownContent.classList.toggle('show');
    }

    function closeDropdown() {
        dropdownContent.classList.remove('show');
    }

    dropdownToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleDropdown();
    });

    shadow.ownerDocument.addEventListener('click', (e) => {
        if (!mainDropdown.contains(e.target)) {
            closeDropdown();
        }
    });

    // 12. Settings Panel Logic (Same as before)
    function saveColor(key, value) {
        localStorage.setItem(key, value);
        host.style.setProperty(key, value, 'important');
    }

    function openSettingsPanel() {
        const settingsWindow = createFloatingWindow(
            'settings-panel',
            'Settings',
            `<div class="settings-content" id="settings-content"></div>`,
            '350px',
            '570px'
        );
        closeDropdown();
        
        if (!settingsWindow) return;

        const content = settingsWindow.querySelector('.settings-content');
        
        // Color Pickers
        const colorSettings = Object.keys(DEFAULT_COLORS).map(key => {
            const label = key.replace('--gui-', '').replace(/-/g, ' ');
            const currentValue = host.style.getPropertyValue(key) || DEFAULT_COLORS[key];
            return `
                <div class="setting-group">
                    <label>${label.charAt(0).toUpperCase() + label.slice(1)} Color</label>
                    <div class="color-input-wrapper">
                        <input type="color" id="color-picker-${key.slice(2)}" value="${currentValue}" data-css-var="${key}">
                        <div class="color-swatch" style="background-color: ${currentValue};"></div>
                    </div>
                </div>
            `;
        }).join('');
        
        // Fullscreen Toggle (If needed)
        const currentFsPref = getSetting('gui-fullscreen-on-load', false);
        const fullscreenSetting = `
            <div class="setting-group">
                <label>Fullscreen Games/Proxy on Open</label>
                <label class="switch">
                    <input type="checkbox" id="fs-toggle" ${currentFsPref ? 'checked' : ''}>
                    <span class="slider"></span>
                </label>
            </div>
        `;

        content.innerHTML = `
            <h2>Appearance</h2>
            ${colorSettings}
            <hr style="border-color: #4f545c;">
            <h2>Behavior</h2>
            ${fullscreenSetting}
            <button id="reset-colors-btn" style="background: #f04747; color: white; padding: 10px; border-radius: 5px; font-weight: bold; margin-top: 10px;">Reset Colors to Default</button>
        `;
        
        // Attach color change listeners
        content.querySelectorAll('input[type="color"]').forEach(input => {
            const swatch = input.nextElementSibling;
            input.addEventListener('input', (e) => {
                const key = e.target.dataset.cssVar;
                const value = e.target.value;
                saveColor(key, value);
                swatch.style.backgroundColor = value;
            });
        });
        
        // Attach Fullscreen Toggle listener
        content.querySelector('#fs-toggle').addEventListener('change', (e) => {
            const isChecked = e.target.checked;
            localStorage.setItem('gui-fullscreen-on-load', isChecked);
        });

        // Attach Reset button listener
        content.querySelector('#reset-colors-btn').addEventListener('click', () => {
            for (const key in DEFAULT_COLORS) {
                saveColor(key, DEFAULT_COLORS[key]);
                shadow.getElementById(`color-picker-${key.slice(2)}`).value = DEFAULT_COLORS[key];
                shadow.getElementById(`color-picker-${key.slice(2)}`).nextElementSibling.style.backgroundColor = DEFAULT_COLORS[key];
            }
        });
    }

    // 13. Initialization & Main Controls
    dragElement(guiContainer, guiHeader);

    minBtn.addEventListener('click', () => {
        guiContainer.classList.toggle('hide-chat');
        // Close any floating windows when minimizing the main GUI
        if (guiContainer.classList.contains('hide-chat')) {
             closeAllFloatingWindows();
        }
    });

    closeBtn.addEventListener('click', () => {
        closeAllFloatingWindows();
        host.remove();
    });

    // Populate dropdown menu on load
    populateDropdown();

})();
