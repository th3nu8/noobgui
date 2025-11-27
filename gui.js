(function() {
    // 1. Check if it already exists to prevent duplicates
    if (document.getElementById('my-ai-gui-root')) {
        console.log("AI GUI is already running.");
        return;
    }

    // --- Configuration ---
    // NOTE: This worker is still used for the chat assistant functionality.
    const WORKER_URL = 'https://twilight-hill-3941.blueboltgamingyt.workers.dev';
    
    // ⭐ NEW CONFIGURATION: SET YOUR GAMES WEBSITE URL HERE ⭐
    const GAMES_WEBSITE_URL = 'https://www.noobsplayground.space/games.html'; 
    // IMPORTANT: Replace the placeholder above with the actual URL of the website you want to embed.
    // --- End Configuration ---

    // 2. Create Host and Shadow DOM
    const host = document.createElement('div');
    host.id = 'my-ai-gui-root';
    host.style.position = 'fixed'; 
    host.style.bottom = '20px';
    host.style.right = '20px';
    host.style.zIndex = '999999';
    document.body.appendChild(host);

    const shadow = host.attachShadow({ mode: 'open' });

    // 3. Define Styles (Updated for iFrame)
    const style = document.createElement('style');
    style.textContent = `
        :host {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            position: fixed;
            bottom: 20px;
            right: 20px;
            z-index: 999999;
        }

        .container {
            width: 320px;
            height: 480px;
            background-color: #2c2f33;
            color: #f6f6f7;
            border-radius: 10px;
            display: grid;
            grid-template-rows: 40px 1fr 50px 60px;
            box-shadow: 0 8px 16px rgba(0,0,0,0.4);
            overflow: hidden;
            border: 1px solid #444;
            transition: height 0.3s, width 0.3s;
        }

        /* --- Header/Drag Bar Styles --- */
        #gui-header {
            padding: 0 10px;
            background-color: #23272a;
            color: #ffffff;
            cursor: grab;
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-top-left-radius: 10px;
            border-top-right-radius: 10px;
        }
        #gui-header:active {
            cursor: grabbing;
        }
        .header-controls button {
            background: none;
            border: none;
            color: #99aab5;
            font-weight: bold;
            font-size: 16px;
            margin-left: 5px;
            cursor: pointer;
            padding: 2px 5px;
            line-height: 1;
        }
        .close-btn:hover {
            color: #ff0000;
        }
        
        /* Minimized State */
        .minimized {
            height: 40px;
            width: 320px;
        }
        .minimized .chat-area, 
        .minimized .input-area,
        .minimized .nav-bar {
            display: none;
        }

        /* --- CHAT AREA AND MESSAGE STYLES --- */
        .chat-area {
            padding: 10px;
            overflow-y: auto;
            display: flex; 
            flex-direction: column;
            gap: 8px;
            background-color: #36393f;
        }
        
        .message-wrapper {
            display: flex; 
            width: 100%; 
        }
        
        .message {
            padding: 8px 12px;
            border-radius: 18px; 
            font-size: 13px;
            line-height: 1.4;
            word-wrap: break-word;
            width: fit-content; 
            max-width: 75%; 
        }
        
        .user-msg-wrapper {
            justify-content: flex-end; 
        }

        .ai-msg-wrapper {
            justify-content: flex-start; 
        }

        .user-msg {
            background-color: #7289da;
            color: white;
            border-bottom-right-radius: 4px; 
        }

        .ai-msg {
            background-color: #4f545c;
            color: #ffffff;
            border-bottom-left-radius: 4px; 
        }
        
        /* --- Input and Nav Bar Styles --- */
        .input-area {
            padding: 8px 10px;
            background-color: #2f3136;
            display: flex;
            gap: 5px;
        }
        input {
            flex-grow: 1;
            padding: 8px 12px;
            border-radius: 20px;
            border: 1px solid #444;
            background: #40444b;
            color: white;
            outline: none;
            font-size: 14px;
        }
        button.send-btn {
            background: #7289da;
            border: none;
            color: white;
            padding: 8px 15px;
            border-radius: 20px;
            cursor: pointer;
            font-weight: bold;
            transition: background 0.2s;
        }
        button.send-btn:hover {
            background: #677bc4;
        }

        .nav-bar {
            height: 60px;
            background-color: #23272a;
            display: flex;
            justify-content: space-around;
            align-items: center;
            border-top: 1px solid #36393f;
        }
        .nav-btn {
            background: none;
            border: none;
            cursor: pointer;
            display: flex;
            flex-direction: column;
            align-items: center;
            opacity: 0.8;
            color: #99aab5;
            font-size: 10px;
            transition: opacity 0.2s;
        }
        .nav-btn:hover {
            opacity: 1;
            color: white;
        }
        .nav-btn svg {
            width: 20px;
            height: 20px;
            fill: currentColor;
            margin-bottom: 2px;
        }
        .discord-btn svg {
            fill: #7289da;
        }

        /* --- IFRAME GAME WINDOW STYLES --- */
        #game-library-window {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 800px; /* Made wider for a better website view */
            height: 600px; /* Made taller for a better website view */
            background-color: #23272a;
            border-radius: 15px;
            box-shadow: 0 15px 30px rgba(0,0,0,0.7);
            z-index: 1000000;
            display: grid;
            grid-template-rows: 40px 1fr; /* Header, iFrame content */
            overflow: hidden;
            border: 2px solid #7289da;
        }

        #game-header {
            background-color: #2c2f33;
            color: white;
            padding: 0 10px;
            font-size: 18px;
            font-weight: bold;
            display: flex;
            justify-content: space-between;
            align-items: center;
            cursor: grab; 
        }
        #game-header .close-btn {
            color: #99aab5;
            cursor: pointer;
            font-size: 20px;
            line-height: 1;
            background: none;
            border: none;
            padding: 5px;
        }
        #game-header .close-btn:hover {
            color: #ff0000;
        }
        
        #game-iframe-container {
            width: 100%;
            height: 100%;
        }

        #game-iframe-container iframe {
            width: 100%;
            height: 100%;
            border: none;
            display: block;
        }
        
        /* --- Markdown and HTML Rendering Styles --- (Kept for chat functionality) */
        .markdown-content {
            padding: 0;
            margin: 0;
            width: 100%;
        }
        .markdown-content ul {
            list-style-type: disc;
            padding-left: 20px;
            margin: 5px 0;
            width: 100%;
        }
        .markdown-content li {
            margin-bottom: 5px;
            padding-left: 5px;
        }
        /* ... (rest of markdown styles are the same) ... */
    `;
    shadow.appendChild(style);

    // 4. Define Icons (SVG Paths)
    const icons = {
        game: '<path d="M21,6H3C1.9,6,1,6.9,1,8v8c0,1.1,0.9,2,2,2h18c1.1,0,2-0.9,2-2V8C23,6.9,22.1,6,21,6z M10,13H8v2H6v-2H4v-2h2V9h2v2h2V13z M14,13.5c-0.83,0-1.5-0.67-1.5-1.5s0.67-1.5,1.5-1.5s1.5,0.67,1.5,1.5S14.83,13.5,14,13.5z M18,10.5c-0.83,0-1.5-0.67-1.5-1.5s0.67-1.5,1.5-1.5s1.5,0.67,1.5,1.5S18.83,10.5,18,10.5z"/>',
        browser: '<path d="M12,2C6.48,2,2,6.48,2,12s4.48,10,10,10s10-4.48,10-10S17.52,2,12,2z M11,19.93C7.05,19.44,4,16.08,4,12s3.05-7.44,7-7.93V19.93z M13,4.07C16.95,4.56,20,7.92,20,12s-3.05,7.44-7,7.93V4.07z"/>',
        settings: '<path d="M19.14,12.94c0.04-0.3,0.06-0.61,0.06-0.94c0-0.32-0.02-0.64-0.07-0.94l2.03-1.58c0.18-0.14,0.23-0.41,0.12-0.61 l-1.92-3.32c-0.12-0.22-0.37-0.29-0.59-0.22l-2.39,0.96c-0.5-0.38-1.03-0.7-1.62-0.94L14.4,2.81c-0.04-0.24-0.24-0.41-0.48-0.41 h-3.84c-0.24,0-0.43,0.17-0.47,0.41L9.25,5.35C8.66,5.59,8.12,5.92,7.63,6.29L5.24,5.33c-0.22-0.08-0.47,0-0.59,0.22L2.74,8.87 C2.62,9.08,2.66,9.34,2.86,9.48l2.03,1.58C4.84,11.36,4.8,11.69,4.8,12s0.02,0.64,0.07,0.94l-2.03,1.58 c-0.18,0.14-0.23,0.41-0.12,0.61l1.92,3.32c0.12,0.22,0.37,0.29,0.59,0.22l2.39-0.96c0.5,0.38,1.03,0.7,1.62,0.94l0.36,2.54 c0.05,0.24,0.24,0.41,0.48,0.41h3.84c0.24,0,0.43-0.17,0.47-0.41l0.36-2.54c0.59-0.24,1.13-0.56,1.62-0.94l2.39,0.96 c0.22,0.08,0.47,0,0.59-0.22l1.92-3.32c0.12-0.22,0.07-0.47-0.12-0.61L19.14,12.94z M12,15.6c-1.98,0-3.6-1.62-3.6-3.6 s1.62-3.6,3.6-3.6s3.6,1.62,3.6,3.6S13.98,15.6,12,15.6z"/>',
        discord: '<path d="M19.27 5.33C17.94 4.71 16.5 4.26 15 4a.09.09 0 0 0-.07.03c-.18.33-.39.76-.53 1.09a16.09 16.09 0 0 0-4.8 0c-.14-.34-.35-.76-.54-1.09c-.01-.02-.04-.03-.07-.03c-1.5.26-2.93.71-4.27 1.33c-.01 0-.02.01-.03.02c-2.72 4.07-3.47 8.03-3.1 11.95c0 .02.01.04.03.05c1.8 1.32 3.53 2.12 5.2 2.65c.03.01.06 0 .07-.02c.4-.55.76-1.13 1.07-1.74c.02-.04 0-.08-.04-.09c-.57-.22-1.11-.48-1.64-.78c-.04-.02-.04-.08.01-.11c.11-.08.22-.17.33-.25c.02-.02.05-.02.07-.01c3.44 1.57 7.15 1.57 10.55 0c.02-.01.05-.01.07.01c.11.09.22.17.33.26c.04.03.04.09-.01.11c-.52.31-1.07.56-1.64.78c-.04.01-.05.05-.04.09c.32.61.68 1.19 1.07 1.74c.03.01.06.02.09.01c1.72-.53 3.45-1.33 5.25-2.65c.02-.01.03-.03.03-.05c.44-4.53-.6-8.5-3.26-12.06a.06.06 0 0 0-.02-.02zM8.52 14.91c-1.03 0-1.89-.95-1.89-2.12s.84-2.12 1.89-2.12c1.06 0 1.9.96 1.89 2.12c0 1.17-.84 2.12-1.89 2.12zm6.97 0c-1.03 0-1.89-.95-1.89-2.12s.84-2.12 1.89-2.12c1.06 0 1.9.96 1.89 2.12c0 1.17-.85 2.12-1.89 2.12z"/>'
    };

    // 5. Build HTML Structure
    const container = document.createElement('div');
    container.className = 'container';
    container.innerHTML = `
        <div id="gui-header">
            <span>AI Assistant</span>
            <div class="header-controls">
                <button id="min-btn" title="Minimize">—</button>
                <button id="close-btn" class="close-btn" title="Exit">x</button>
            </div>
        </div>
        <div class="chat-area" id="chat-log">
            <div class="message-wrapper ai-msg-wrapper"><div class="message ai-msg">Hello! I am connected via your secure Cloudflare Worker. How can I help?</div></div>
        </div>
        <div class="input-area">
            <input type="text" id="user-input" placeholder="Ask AI..." />
            <button class="send-btn" id="send-btn">Send</button>
        </div>
        <div class="nav-bar">
            <button class="nav-btn" title="Games" id="game-library-btn"><svg viewBox="0 0 24 24">${icons.game}</svg>Games</button>
            <button class="nav-btn" title="Browser" onclick="console.log('Browser Clicked: Add your browser/proxy logic here.')"><svg viewBox="0 0 24 24">${icons.browser}</svg>Browser</button>
            <button class="nav-btn" title="Settings" onclick="alert('Settings Clicked: Implement your GUI settings here.')"><svg viewBox="0 0 24 24">${icons.settings}</svg>Settings</button>
            <button class="nav-btn discord-btn" title="Discord" onclick="window.open('https://discord.com', '_blank')"><svg viewBox="0 0 24 24">${icons.discord}</svg>Discord</button>
        </div>
    `;
    shadow.appendChild(container);

    // 6. Get Elements
    const chatLog = shadow.getElementById('chat-log');
    const input = shadow.getElementById('user-input');
    const sendBtn = shadow.getElementById('send-btn');
    const guiContainer = shadow.querySelector('.container');
    const guiRoot = host; 
    const guiHeader = shadow.getElementById('gui-header');
    const minBtn = shadow.getElementById('min-btn');
    const closeBtn = shadow.getElementById('close-btn');
    const gameLibraryBtn = shadow.getElementById('game-library-btn');


    // 7. Core UI Functions
    
    // --- Message Rendering ---
    function addMessage(text, type) { 
        const wrapper = document.createElement('div');
        wrapper.className = `message-wrapper ${type}-wrapper`;
        
        const div = document.createElement('div');
        div.className = `message ${type} markdown-content`;

        let htmlText = text;
        // Simplified Markdown parsing (same as before)
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

    // --- AI Interaction Logic ---
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
    
    // --- Game Library Function (iFrame Implementation) ---

    /**
     * Creates and displays the Game Library UI window using an iFrame.
     */
    function showGameLibrary() {
        // Prevent opening duplicates
        if (shadow.getElementById('game-library-window')) return;
        
        if (!GAMES_WEBSITE_URL || GAMES_WEBSITE_URL === 'https://example.com/your-games-homepage/') {
            alert("Error: Please update the GAMES_WEBSITE_URL variable in gui.js with your actual games website link.");
            return;
        }

        const libraryWindow = document.createElement('div');
        libraryWindow.id = 'game-library-window';
        libraryWindow.innerHTML = `
            <div id="game-header">
                <span>🎮 Games Library (Embedded)</span>
                <button class="close-btn" id="game-close-btn">x</button>
            </div>
            <div id="game-iframe-container">
                <iframe src="${GAMES_WEBSITE_URL}"></iframe>
            </div>
        `;
        
        shadow.appendChild(libraryWindow);
        
        // Setup Dragging for the new window
        dragElement(libraryWindow, shadow.getElementById('game-header'));

        // Close button listener
        shadow.getElementById('game-close-btn').addEventListener('click', () => {
            libraryWindow.remove();
        });
        
        // --- IMPORTANT NOTE ON IFRAMES ---
        // If your games website uses security headers (like X-Frame-Options or Content-Security-Policy) 
        // to prevent embedding, the iframe will likely be blank or show an error. 
        // If this happens, you will need to modify the headers on your games website server.
    }


    // 8. Dragging, Minimize, and Close Functions

    // --- Dragging Logic (Updated to handle both main GUI and Game Window) ---
    function dragElement(elmnt, dragHandle) {
        let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
        
        dragHandle.onmousedown = dragMouseDown;

        function dragMouseDown(e) {
            e = e || window.event;
            e.preventDefault();
            
            pos3 = e.clientX;
            pos4 = e.clientY;
            
            window.onmouseup = closeDragElement;
            window.onmousemove = elementDrag;
            
            document.body.style.cursor = 'grabbing';
            dragHandle.style.cursor = 'grabbing';
        }

        function elementDrag(e) {
            e = e || window.event;
            e.preventDefault();
            
            pos1 = pos3 - e.clientX;
            pos2 = pos4 - e.clientY;
            pos3 = e.clientX;
            pos4 = e.clientY;
            
            // Allow the element to be moved relative to its current screen position
            elmnt.style.top = (elmnt.offsetTop - pos2) + "px";
            elmnt.style.left = (elmnt.offsetLeft - pos1) + "px";
            
            // Clear fixed positioning properties (bottom/right) if they exist
            elmnt.style.bottom = 'auto';
            elmnt.style.right = 'auto';
            
            // If it was the Game Library window, clear the transform property
            if (elmnt.id === 'game-library-window') {
                 elmnt.style.transform = 'none';
            }
        }

        function closeDragElement() {
            window.onmouseup = null;
            window.onmousemove = null;
            
            document.body.style.cursor = 'default';
            dragHandle.style.cursor = 'grab';
        }
    }
    
    // --- Minimize Logic ---
    function toggleMinimize() {
        guiContainer.classList.toggle('minimized');
        if (guiContainer.classList.contains('minimized')) {
            minBtn.textContent = '☐';
        } else {
            minBtn.textContent = '—';
        }
    }

    // --- Close Logic ---
    function closeGui() {
        guiRoot.remove();
        // Also remove any floating windows if the main UI is closed
        const libraryWindow = shadow.getElementById('game-library-window');
        if (libraryWindow) libraryWindow.remove();
    }


    // 9. Event Listeners
    sendBtn.addEventListener('click', handleSend);
    input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !sendBtn.disabled) {
            handleSend();
        }
    });

    // Game Library Button now calls the iFrame function
    gameLibraryBtn.addEventListener('click', showGameLibrary);

    minBtn.addEventListener('click', toggleMinimize);
    closeBtn.addEventListener('click', closeGui);

    // Initialize dragging on the host element using the header as the handle
    dragElement(guiRoot, guiHeader);
})();
