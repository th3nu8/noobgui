(function() {
    // 1. Prevent duplicates
    if (document.getElementById('my-ai-gui-root')) {
        console.log("AI GUI is already running.");
        return;
    }

    // --- Configuration ---
    const WORKER_URL = 'https://twilight-hill-3941.blueboltgamingyt.workers.dev';
    const GAMES_WEBSITE_URL = 'https://www.noobsplayground.space/games.html';
    const PROXY_URL = 'https://scramjet.mercurywork.shop/'; 
    
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

        /* ⭐ NEW: User Chat Window Size and Grid Layout ⭐ */
        #chat-window {
            width: 450px;
            height: 650px;
            display: grid; /* Overrides default floating-window grid-template-rows */
            grid-template-rows: 40px 1fr; 
        }
        #chat-window-content {
            display: grid;
            grid-template-rows: 1fr 50px;
            overflow: hidden;
            height: 100%;
        }
        /* ⭐ END NEW ⭐ */

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
    `;
    shadow.appendChild(style);

    // 4. Icons 
    const icons = {
        menu: '<path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/>',
        chat: '<path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 14v-2h8v2H6zm10-3H6V9h10v2z"/>',
        game: '<path d="M21,6H3C1.9,6,1,6.9,1,8v8c0,1.1,0.9,2,2,2h18c1.1,0,2-0.9,2-2V8C23,6.9,22.1,6,21,6z M10,13H8v2H6v-2H4v-2h2V9h2v2h2V13z M14,13.5c-0.83,0-1.5-0.67-1.5-1.5s0.67-1.5,1.5-1.5s1.5,0.67,1.5,1.5S14.83,13.5,14,13.5z M18,10.5c-0.83,0-1.5-0.67-1.5-1.5s0.67-1.5,1.5-1.5s1.5,0.67,1.5,1.5S18.83,10.5,18,10.5z"/>',
        browser: '<path d="M12,2C6.48,2,2,6.48,2,12s4.48,10,10,10s10-4.48,10-10S17.52,2,12,2z M11,19.93C7.05,19.44,4,16.08,4,12s3.05-7.44,7-7.93V19.93z M13,4.07C16.95,4.56,20,7.92,20,12s-3.05,7.44-7,7.93V4.07z"/>',
        link: '<path d="M17,7h-4V5h4c1.65,0,3,1.35,3,3v8c0,1.65-1.35,3-3,3h-4v-2h4c0.55,0,1-0.45,1-1V8C18,7.45,17.55,7,17,7z M8,5C6.35,5,5,6.35,5,8v8c0,0.55,0.45,1,1,1h4v2H6c-1.65,0-3-1.35-3-3V8C3,6.35,4.35,5,6,5H8z M15,11h-6V9h6V11z"/>',
        settings: '<path d="M19.14,12.94c0.04-0.3,0.06-0.61,0.06-0.94c0-0.32-0.02-0.64-0.07-0.94l2.03-1.58c0.18-0.14,0.23-0.41,0.12-0.61 l-1.92-3.32c-0.12-0.22-0.37-0.29-0.59-0.22l-2.39,0.96c-0.5-0.38-1.03-0.7-1.62-0.94L14.4,2.81c-0.04-0.24-0.24-0.41-0.48-0.41 h-3.84c-0.24,0-0.43,0.17-0.47,0.41L9.25,5.35C8.66,5.59,8.12,5.92,7.63,6.29L5.24,5.33c-0.22-0.08-0.47,0-0.59,0.22L2.74,8.87 C2.62,9.08,2.66,9.34,2.86,9.48l2.03,1.58C4.84,11.36,4.8,11.69,4.8,12s0.02,0.64,0.07,0.94l-2.03,1.58 c-0.18,0.14-0.23,0.41-0.12,0.61l1.92,3.32c0.12,0.22,0.37,0.29,0.59,0.22l2.39-0.96c0.5,0.38,1.03,0.7,1.62,0.94l0.36,2.54 c0.05,0.24,0.24,0.41,0.48,0.41h3.84c0.24,0,0.43-0.17,0.47-0.41l0.36-2.54c0.59-0.24,1.13-0.56,1.62-0.94l2.39,0.96 c0.22,0.08,0.47,0,0.59-0.22l1.92-3.32c0.12-0.22,0.07-0.47-0.12-0.61L19.14,12.94z M12,15.6c-1.98,0-3.6-1.62-3.6-3.6 s1.62-3.6,3.6-3.6s3.6,1.62,3.6,3.6S13.98,15.6,12,15.6z"/>',
        discord: '<path d="M19.27 5.33C17.94 4.71 16.5 4.26 15 4a.09.09 0 0 0-.07.03c-.18.33-.39.76-.53 1.09a16.09 16.09 0 0 0-4.8 0c-.14-.34-.35-.76-.54-1.09c-.01-.02-.04-.03-.07-.03c-1.5.26-2.93.71-4.27 1.33c-.01 0-.02.01-.03.02c-2.72 4.07-3.47 8.03-3.1 11.95c0 .02.01.04.03.05c1.8 1.32 3.53 2.12 5.2 2.65c.03.01.06 0 .07-.02c.4-.55.76-1.13 1.07-1.74c.02-.04 0-.08-.04-.09c-.57-.22-1.11-.48-1.64-.78c-.04-.02-.04-.08.01-.11c.11-.08.22-.17.33-.25c.02-.02.05-.02.07-.01c3.44 1.57 7.15 1.57 10.55 0c.02-.01.05-.01.07.01c.11.09.22.17.33.26c.04.03.04.09-.01.11c-.52.31-1.07.56-1.64.78c-.04.01-.05.05-.04.09c.32.61.68 1.19 1.07 1.74c.03.01.06.02.09.01c1.72-.53 3.45-1.33 5.25-2.65c.02-.01.03-.03.03-.05c.44-4.53-.6-8.5-3.26-12.06a.06.06 0 0 0-.02-.02zM8.52 14.91c-1.03 0-1.89-.95-1.89-2.12s.84-2.12 1.89-2.12c1.06 0 1.9.96 1.89 2.12c0 1.17-.84 2.12-1.89 2.12zm6.97 0c-1.03 0-1.89-.95-1.89-2.12s.84-2.12 1.89-2.12c1.06 0 1.9.96 1.89 2.12c0 1.17-.85 2.12-1.89 2.12z"/>',
        fullscreen: '<path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/>',
        exitFullscreen: '<path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z"/>'
    };

    // 5. Build HTML (Main GUI)
    const container = document.createElement('div');
    container.className = 'container';
    container.innerHTML = `
        <div id="gui-header">
            <div class="header-menu">
                <div class="dropdown-menu-container" id="main-dropdown">
                    <button class="dropdown-toggle" title="Menu">
                        <svg viewBox="0 0 24 24">${icons.menu}</svg>
                        Menu
                    </button>
                    <div class="dropdown-content" id="main-dropdown-content">
                    </div>
                </div>
            </div>

            <span class="header-title">Noobs GUI v1.1</span>
            
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
        let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
        
        function clamp(value, min, max) {
            return Math.min(Math.max(value, min), max);
        }
        
        dragHandle.onmousedown = dragMouseDown;

        function dragMouseDown(e) {
            if (e.target.closest('.window-controls') || e.target.closest('.dropdown-menu-container') || e.target.tagName.toLowerCase() === 'button') return;
            e = e || window.event;
            e.preventDefault();
            
            const style = window.getComputedStyle(elmnt);
            let currentTop = parseFloat(style.top);
            let currentLeft = parseFloat(style.left);
            if (style.transform.includes('translate')) {
                const transformMatrix = new DOMMatrix(style.transform);
                currentTop = window.innerHeight / 2 + transformMatrix.m42;
                currentLeft = window.innerWidth / 2 + transformMatrix.m41;
            }

            pos3 = e.clientX;
            pos4 = e.clientY;
            
            elmnt.style.position = 'fixed'; 
            elmnt.style.top = currentTop + 'px';
            elmnt.style.left = currentLeft + 'px';
            elmnt.style.transform = 'none'; 
            elmnt.style.zIndex = '1000002';

            shadow.ownerDocument.onmouseup = closeDragElement;
            shadow.ownerDocument.onmousemove = elementDrag;
        }

        function elementDrag(e) {
            e = e || window.event;
            e.preventDefault();

            pos1 = pos3 - e.clientX;
            pos2 = pos4 - e.clientY;
            pos3 = e.clientX;
            pos4 = e.clientY;

            let newTop = elmnt.offsetTop - pos2;
            let newLeft = elmnt.offsetLeft - pos1;

            const boundsX = window.innerWidth - elmnt.offsetWidth;
            const boundsY = window.innerHeight - elmnt.offsetHeight;
            
            elmnt.style.top = clamp(newTop, 0, boundsY) + "px";
            elmnt.style.left = clamp(newLeft, 0, boundsX) + "px";
        }

        function closeDragElement() {
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

    // ⭐ User-to-User Chat Handler (Simulated) ⭐
    function handleUserChatSend(inputElement, sendBtnElement, logElement) {
        const text = inputElement.value.trim();
        if (!text) return;

        // 1. User sends message
        addMessage(text, 'user-msg', logElement);
        inputElement.value = '';

        // 2. Simulate friend response (uses 'ai-msg' style for contrast)
        setTimeout(() => {
            const friendResponse = `I received your message: **"${text.substring(0, 50)}${text.length > 50 ? '...' : ''}"** (This is a simulated response.)`;
            addMessage(friendResponse, 'ai-msg', logElement);
        }, 1500);
        
        inputElement.focus();
    }
    // ⭐ END NEW CHAT HANDLER ⭐

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
        shadow.querySelectorAll('.floating-window:not(#settings-panel):not(#partners-window)').forEach(win => {
             // Only close if it's NOT the chat-window being opened (prevents flicker if re-opening)
             if (win.id !== id) {
                if (getFullscreenElement() === win) {
                    document.exitFullscreen();
                }
                win.remove();
             }
        });
        
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
            
            // NOTE: Removed logic to restore the main chat visibility, as it is no longer hidden
        });
        
        return floatingWindow;
    }
    
    // ⭐ Function to open the User Chat Window - No longer hides main chat ⭐
    function openChatWindow() {
        if (shadow.getElementById('chat-window')) return;

        // HTML structure for the new user chat UI
        const chatWindowHTML = `
            <div id="chat-window-content">
                <div class="chat-area" id="user-chat-log">
                    <div class="message-wrapper ai-msg-wrapper"><div class="message ai-msg">
                        **Welcome to User Chat!** Since this is a client-side script, 
                        your messages will be echoed back as a simulated "Friend" response.
                    </div></div>
                </div>
                
                <div class="input-area">
                    <input type="text" id="user-chat-input" placeholder="Chat with friend..." />
                    <button class="send-btn" id="user-chat-send-btn">Send</button>
                </div>
            </div>
        `;

        // Create the window
        const chatWindow = createFloatingWindow('chat-window', '💬 User Chat', chatWindowHTML, '450px', '650px');
        if (!chatWindow) return;

        // Get elements from the new shadow-dom window
        const userChatInput = chatWindow.querySelector('#user-chat-input');
        const userChatSendBtn = chatWindow.querySelector('#user-chat-send-btn');
        const userChatLog = chatWindow.querySelector('#user-chat-log');

        // Attach event listeners to the new chat controls
        userChatSendBtn.addEventListener('click', () => handleUserChatSend(userChatInput, userChatSendBtn, userChatLog));
        userChatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') handleUserChatSend(userChatInput, userChatSendBtn, userChatLog);
        });
        userChatInput.focus(); 
    }
    // ⭐ END MODIFIED CHAT WINDOW FUNCTION ⭐

    // 9a. Game library (iframe)
    function showGameLibrary() {
        const url = GAMES_WEBSITE_URL;
        if (!url || url.includes('your-games-homepage')) {
            alert("Error: Please update the GAMES_WEBSITE_URL variable.");
            return;
        }

        const openInNewTab = getSetting('open-in-new-tab', false);

        if (openInNewTab) {
            const newWindow = window.open('about:blank', '_blank');
            if (newWindow) {
                newWindow.document.write(`
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <title>Games Library</title>
                        <style>
                            body, html { margin: 0; padding: 0; width: 100%; height: 100%; overflow: hidden; }
                            iframe { border: none; width: 100%; height: 100%; display: block; }
                        </style>
                    </head>
                    <body>
                        <iframe src="${url}"></iframe>
                    </body>
                    </html>
                `);
                newWindow.document.close();
            } else {
                alert("Could not open new tab. Please allow pop-ups for this site.");
            }
        } else {
            const iframeHTML = `<div class="iframe-container"><iframe src="${url}"></iframe></div>`;
            createFloatingWindow('game-library-window', '🎮 Games', iframeHTML, '800px', '600px');
        }
    }
    
    // 9b. Proxy Browser (iframe)
    function showProxyWindow() {
        const url = PROXY_URL;
        if (!url || url.includes('holyub.com')) {
            alert("Error: Please update the PROXY_URL variable with your actual link.");
            return;
        }
        
        const openInNewTab = getSetting('open-in-new-tab', false);

        if (openInNewTab) {
            const newWindow = window.open('about:blank', '_blank');
            if (newWindow) {
                newWindow.document.write(`
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <title>Proxy Browser</title>
                        <style>
                            body, html { margin: 0; padding: 0; width: 100%; height: 100%; overflow: hidden; }
                            iframe { border: none; width: 100%; height: 100%; display: block; }
                        </style>
                    </head>
                    <body>
                        <iframe src="${url}" allow="fullscreen" allowfullscreen></iframe>
                    </body>
                    </html>
                `);
                newWindow.document.close();
            } else {
                alert("Could not open new tab. Please allow pop-ups for this site.");
            }
            return;
        }
        
        const iframeHTML = `<div class="iframe-container"><iframe id="proxy-iframe" src="${url}" allow="fullscreen" allowfullscreen></iframe></div>`;
        
        const controls = `
            <button id="proxy-fullscreen-btn" title="Fullscreen">
                <svg viewBox="0 0 24 24">${icons.fullscreen}</svg>
            </button>
        `;
        
        const panel = createFloatingWindow('proxy-browser-window', '🌐 Browser', iframeHTML, '800px', '600px', controls);
        if (!panel) return;
        
        const fsBtn = shadow.getElementById('proxy-fullscreen-btn');
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

        fsBtn.addEventListener('click', () => {
            toggleFullscreen(panel);
        });

        shadow.ownerDocument.addEventListener('fullscreenchange', fullscreenChangeHandler);
        shadow.ownerDocument.addEventListener('webkitfullscreenchange', fullscreenChangeHandler);
        shadow.ownerDocument.addEventListener('mozfullscreenchange', fullscreenChangeHandler);
    }

    // 9c. Partners Window
    function showPartnersWindow() {
        let linksHTML = `<h3>Community & Partner Links</h3>`;
        
        if (PARTNER_LINKS.length === 0) {
            linksHTML += '<p>No partner links configured. Please edit the PARTNER_LINKS array in the script.</p>';
        } else {
            PARTNER_LINKS.forEach(partner => {
                linksHTML += `
                    <div class="partner-link-item">
                        <a href="${partner.url}" target="_blank" rel="noopener noreferrer">${partner.name}</a>
                    </div>
                `;
            });
        }

        const contentHTML = `<div class="partners-content">${linksHTML}</div>`;

        createFloatingWindow('partners-window', '🔗 Partners', contentHTML, '400px', '450px');
    }

    // 9d. Settings Panel
    function applyColor(cssVariable, color) {
        host.style.setProperty(cssVariable, color, 'important');
        localStorage.setItem(cssVariable, color);
    }
    
    function showSettingsPanel() {
        const savedAccent = localStorage.getItem('--gui-accent') || DEFAULT_COLORS['--gui-accent'];
        const savedBg = localStorage.getItem('--gui-bg-main') || DEFAULT_COLORS['--gui-bg-main'];
        const openInNewTabChecked = getSetting('open-in-new-tab', false) ? 'checked' : '';
        
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
                <hr>
                <h3>Functionality</h3>
                <div class="setting-group">
                    <label for="new-tab-toggle">Open Games/Browser in New Tab</label>
                    <label class="switch">
                        <input type="checkbox" id="new-tab-toggle" ${openInNewTabChecked} data-setting-key="open-in-new-tab">
                        <span class="slider"></span>
                    </label>
                </div>
                <div class="setting-group">
                    <button id="reset-colors-btn" class="send-btn" style="width: 100%; background: #f04747; margin-top: 10px;">Reset Colors</button>
                </div>
            </div>
        `;

        const panel = createFloatingWindow('settings-panel', '⚙️ Settings', contentHTML, '350px', '350px');
        if (!panel) return;
        
        ['bg-color-input', 'accent-color-input'].forEach(id => {
            const inputEl = shadow.getElementById(id);
            const swatch = inputEl.parentElement.querySelector('.color-swatch');

            inputEl.addEventListener('input', (e) => {
                const color = e.target.value;
                const cssVar = e.target.getAttribute('data-variable');
                applyColor(cssVar, color);
                swatch.style.backgroundColor = color;
                
                if (cssVar === '--gui-accent') {
                    const baseColor = parseInt(color.substring(1), 16);
                    const r = (baseColor >> 16) & 255;
                    const g = (baseColor >> 8) & 255;
                    const b = baseColor & 255;
                    const darkerR = Math.max(0, r - 20);
                    const darkerG = Math.max(0, g - 20);
                    const darkerB = Math.max(0, b - 20);
                    const darkerHex = `#${((1 << 24) + (darkerR << 16) + (darkerG << 8) + darkerB).toString(16).slice(1)}`;

                    applyColor('--gui-accent-hover', darkerHex);
                }
            });
        });

        shadow.getElementById('reset-colors-btn').addEventListener('click', () => {
            for (const key in DEFAULT_COLORS) {
                localStorage.removeItem(key);
                host.style.removeProperty(key);
            }
            alert('Colors reset to default. Re-open settings to see changes.');
            panel.remove();
        });

        shadow.getElementById('new-tab-toggle').addEventListener('change', (e) => {
            const settingKey = e.target.getAttribute('data-setting-key');
            localStorage.setItem(settingKey, e.target.checked);
        });
    }

    // 10. Dropdown Population and Event Listeners
    function populateDropdown() {
        const dropdownButtons = [
            // ⭐ MODIFIED: Button now calls openChatWindow()
            { name: "User Chat", id: "chat-nav-btn", icon: icons.chat, handler: openChatWindow }, 
            { name: "Games", id: "game-library-nav-btn", icon: icons.game, handler: showGameLibrary },
            { name: "Proxy Browser", id: "browser-nav-btn", icon: icons.browser, handler: showProxyWindow },
            { name: "Partners", id: "partners-nav-btn", icon: icons.link, handler: showPartnersWindow },
            { name: "Settings", id: "settings-nav-btn", icon: icons.settings, handler: showSettingsPanel },
            { name: "Discord", id: "discord-nav-btn", icon: icons.discord, handler: () => window.open('https://discord.gg/your-invite-link', '_blank') }
        ];

        dropdownContent.innerHTML = ''; 
        
        dropdownButtons.forEach(btn => {
            const button = document.createElement('button');
            button.id = btn.id;
            button.title = btn.name;
            const iconSVG = `<svg viewBox="0 0 24 24">${icons[btn.icon] || btn.icon}</svg>`; // Use object or direct SVG path
            button.innerHTML = `${iconSVG}${btn.name}`;
            button.addEventListener('click', (event) => {
                event.stopPropagation();
                btn.handler();
                dropdownContent.classList.remove('show'); // Close dropdown after click
            });
            dropdownContent.appendChild(button);
        });
    }

    // 10a. Main GUI controls logic 
    minBtn.addEventListener('click', () => {
        guiContainer.classList.toggle('minimized');
        // If minimized, ensure floating chat is closed to avoid clutter
        if (guiContainer.classList.contains('minimized')) {
             shadow.getElementById('chat-window')?.remove();
             guiContainer.classList.remove('hide-chat'); // Clean up the state
        }
    });
    
    closeBtn.addEventListener('click', () => {
        host.remove();
    });

    // Dropdown Toggle Listener
    dropdownToggle.addEventListener('click', (event) => {
        event.stopPropagation();
        dropdownContent.classList.toggle('show');
    });

    // Close dropdown if user clicks anywhere else
    document.addEventListener('click', () => {
        dropdownContent.classList.remove('show');
    });
    shadow.addEventListener('click', (e) => {
        if (!mainDropdown.contains(e.target)) {
             dropdownContent.classList.remove('show');
        }
    });

    // 11. Initial setup
    dragElement(guiContainer, guiHeader);
    populateDropdown();
})();
