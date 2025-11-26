(function() {
    // 1. Check if it already exists to prevent duplicates
    if (document.getElementById('my-ai-gui-root')) {
        console.log("AI GUI is already running.");
        return;
    }

    // --- Configuration ---
    // This is your Cloudflare Worker URL (the secure proxy)
    const WORKER_URL = 'https://twilight-hill-3941.blueboltgamingyt.workers.dev';
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

    // 3. Define Styles
    const style = document.createElement('style');
    style.textContent = `
        :host {
            font-family: sans-serif;
        }
        .container {
            width: 350px;
            height: 500px;
            background-color: #1e1e1e;
            color: white;
            border-radius: 12px;
            display: flex;
            flex-direction: column;
            box-shadow: 0 10px 25px rgba(0,0,0,0.5);
            overflow: hidden;
            border: 1px solid #333;
        }
        .chat-area {
            flex-grow: 1;
            padding: 15px;
            overflow-y: auto;
            display: flex;
            flex-direction: column;
            gap: 10px;
        }
        .message {
            padding: 8px 12px;
            border-radius: 8px;
            max-width: 80%;
            font-size: 14px;
            line-height: 1.4;
            white-space: pre-wrap;
        }
        .user-msg {
            background-color: #007bff;
            align-self: flex-end;
        }
        .ai-msg {
            background-color: #333;
            align-self: flex-start;
        }
        .input-area {
            padding: 10px;
            background-color: #252525;
            display: flex;
            gap: 5px;
        }
        input {
            flex-grow: 1;
            padding: 8px;
            border-radius: 4px;
            border: 1px solid #444;
            background: #1e1e1e;
            color: white;
            outline: none;
        }
        button.send-btn {
            background: #007bff;
            border: none;
            color: white;
            padding: 8px 12px;
            border-radius: 4px;
            cursor: pointer;
            transition: background-color 0.2s;
        }
        button.send-btn:hover:not(:disabled) {
            background-color: #0056b3;
        }
        button.send-btn:disabled {
            background-color: #555;
            cursor: not-allowed;
        }
        .nav-bar {
            height: 60px;
            background-color: #111;
            display: flex;
            justify-content: space-around;
            align-items: center;
            border-top: 1px solid #333;
        }
        .nav-btn {
            background: none;
            border: none;
            cursor: pointer;
            display: flex;
            flex-direction: column;
            align-items: center;
            opacity: 0.7;
            transition: opacity 0.2s;
            color: white;
            font-size: 10px;
        }
        .nav-btn:hover {
            opacity: 1;
        }
        .nav-btn svg {
            width: 24px;
            height: 24px;
            fill: white;
            margin-bottom: 2px;
        }
        .discord-btn svg {
            fill: #5865F2;
        }
        /* --- New Markdown and HTML Rendering Styles --- */

        /* Target the container holding the rendered message */
        .markdown-content {
            /* Override default padding, reset margins for internal elements */
            padding: 10px 15px; /* Adjust padding to give space around content */
            margin: 0;
        }

        /* Fix for list indentation and spacing */
        .markdown-content ul {
            list-style-type: disc; /* Ensure dots are used */
            padding-left: 20px;   /* Pull the list closer to the left edge */
            margin-top: 5px;
            margin-bottom: 5px;
        }
        .markdown-content li {
            margin-bottom: 5px;
            padding-left: 5px;
        }

        /* Style for Headings (to remove the huge default spacing) */
        .markdown-content h2 {
            font-size: 1.2em;
            margin-top: 15px;
            margin-bottom: 8px;
            border-bottom: 1px solid #444; /* Optional visual separator */
            padding-bottom: 5px;
        }

        /* Style for Display Math */
        .math-display {
            display: block;
            text-align: center;
            padding: 10px 0;
            font-size: 1.1em;
            font-family: serif;
        }
        
        /* Style for horizontal rules */
        .markdown-content hr {
            border: none;
            border-top: 1px solid #555;
            margin: 10px 0;
        }
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
        <div class="chat-area" id="chat-log">
            <div class="message ai-msg">Hello! I am connected via your secure Cloudflare Worker. How can I help?</div>
        </div>
        <div class="input-area">
            <input type="text" id="user-input" placeholder="Ask AI..." />
            <button class="send-btn" id="send-btn">Send</button>
        </div>
        <div class="nav-bar">
            <button class="nav-btn" title="Games" onclick="console.log('Games Clicked: Add your games logic here.')"><svg viewBox="0 0 24 24">${icons.game}</svg>Games</button>
            <button class="nav-btn" title="Browser" onclick="console.log('Browser Clicked: Add your browser/proxy logic here.')"><svg viewBox="0 0 24 24">${icons.browser}</svg>Browser</button>
            <button class="nav-btn" title="Settings" onclick="alert('Settings Clicked: Implement your GUI settings here.')"><svg viewBox="0 0 24 24">${icons.settings}</svg>Settings</button>
            <button class="nav-btn discord-btn" title="Discord" onclick="window.open('https://discord.com', '_blank')"><svg viewBox="0 0 24 24">${icons.discord}</svg>Discord</button>
        </div>
    `;
    shadow.appendChild(container);

    // 6. AI Interaction Logic
    const chatLog = shadow.getElementById('chat-log');
    const input = shadow.getElementById('user-input');
    const sendBtn = shadow.getElementById('send-btn');
    
    function addMessage(text, className) {
        const div = document.createElement('div');
        div.className = `message ${className} markdown-content`; // Add new class for styling
        
        // --- FIX: Advanced Markdown and LaTeX Parsing ---
        let htmlText = text;

        // 1. Replace double asterisks (**) with bold tags (<b>)
        htmlText = htmlText.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>');
        
        // 2. Replace Heading Level 2 (##) with H2 tags
        htmlText = htmlText.replace(/^##\s*(.*)$/gm, '<h2>$1</h2>');
        // Note: You can add more levels (e.g., /^\#\s*(.*)$/gm for <h1>) if needed.

        // 3. Replace single asterisks (*) or dashes (-) for list items with <li> tags
        // This regex captures * or - at the start of a line and wraps the text in <li>
        htmlText = htmlText.replace(/^[*-]\s+(.*)/gm, '<li>$1</li>');
        
        // 4. Wrap all generated <li> items in an unordered list (<ul>)
        // This is necessary for correct list rendering and indenting.
        if (htmlText.includes('<li>')) {
            htmlText = `<ul>${htmlText}</ul>`;
        }

        // 5. Wrap display math ($$...$$) in a block element for better rendering
        htmlText = htmlText.replace(/\$\$(.*?)\$\$/gs, '<div class="math-display">$1</div>');
        
        // 6. Horizontal Rules (---)
        htmlText = htmlText.replace(/^---/gm, '<hr>');

        // Use innerHTML to render the HTML/Markdown
        div.innerHTML = htmlText; 
        
        chatLog.appendChild(div);
        chatLog.scrollTop = chatLog.scrollHeight;
        return div;
    }
    async function handleSend() {
        const text = input.value.trim();
        if (!text) return;

        addMessage(text, 'user-msg');
        input.value = '';
        
        input.disabled = true;
        sendBtn.disabled = true;
        const loadingMsg = addMessage('AI is typing...', 'ai-msg');

        try {
            // 1. Send request to the secure worker proxy
            const response = await fetch(WORKER_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ message: text }) // Send simple payload
            });

            loadingMsg.remove();
            
            if (!response.ok) {
                // If the worker returns an HTTP error, read the error body as text for debugging
                const errorText = await response.text();
                throw new Error(`Worker HTTP Error (${response.status}): ${errorText.substring(0, 100)}...`);
            }
            
            // *** CRITICAL FIX: Use .text() because the Worker is now structured to send a PLAIN TEXT string ***
            const data = await response.text(); 
            
            addMessage(data, 'ai-msg');

        } catch (err) {
            loadingMsg.remove();
            addMessage('**Connection/Request Error:** ' + err.message, 'ai-msg');
        } finally {
            input.disabled = false;
            sendBtn.disabled = false;
            input.focus();
        }
    }

    sendBtn.addEventListener('click', handleSend);
    input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !sendBtn.disabled) {
            handleSend();
        }
    });

})();
