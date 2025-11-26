(function () {
    // 1. Toggle Check: If widget exists, toggle visibility and exit.
    if (document.getElementById('noobs-gui-widget')) {
        const w = document.getElementById('noobs-gui-widget');
        w.style.display = (w.style.display === 'none' ? 'flex' : 'none');
        return;
    }

    // 2. Configuration & State
    const apiUrl = "https://twilight-hill-3941.blueboltgamingyt.workers.dev";
    let isGenerating = false;
    let currentColor = localStorage.getItem('noobsGuiColor') || 'blue';

    const defaultIconPath = 'M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm1 14h-2v-2h2v2zm0-4h-2V7h2v5z';

    const games = [
        { name: "Tetris", url: "https://www.google.com/search?q=online+tetris+game" },
        { name: "Snake", url: "https://www.google.com/search?q=online+snake+game" },
        { name: "2048", url: "https://www.google.com/search?q=online+2048+game" },
        { name: "Minesweeper", url: "https://www.google.com/search?q=online+minesweeper+game" }
    ];

    const discordUrl = "https://discord.gg/placeholder_invite";
    const proxyPlaceholderUrl = "https://www.google.com/search?q=uv+proxy+web+search+placeholder";

    const colorThemes = {
        blue: { primary: '#4f46e5', secondary: '#818cf8', bg: '#1f2937', inputBg: '#4b5563', menuBg: '#374151' },
        orange: { primary: '#ea580c', secondary: '#fb923c', bg: '#1c1917', inputBg: '#44403c', menuBg: '#292524' },
        red: { primary: '#dc2626', secondary: '#f87171', bg: '#1f1f1f', inputBg: '#3f3f3f', menuBg: '#2a2a2a' },
        white: { primary: '#059669', secondary: '#34d399', bg: '#f9fafb', inputBg: '#ffffff', menuBg: '#f3f4f6', text: '#1f2937' },
        black: { primary: '#6366f1', secondary: '#a5b4fc', bg: '#000000', inputBg: '#1a1a1a', menuBg: '#0a0a0a' }
    };

    // 3. Helper Functions
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

    const applyColorTheme = (color) => {
        const theme = colorThemes[color];
        const widget = document.getElementById('noobs-gui-widget');
        if (!widget) return;

        widget.style.backgroundColor = theme.bg;
        const header = widget.querySelector('.header');
        if (header) header.style.backgroundColor = theme.primary;

        const inputContainer = widget.querySelector('.chat-input-container');
        if (inputContainer) inputContainer.style.backgroundColor = theme.menuBg;

        const chatInput = widget.querySelector('#chat-input');
        if (chatInput) {
            chatInput.style.backgroundColor = theme.inputBg;
            chatInput.style.color = theme.text || '#ffffff';
            if (color === 'white') {
                chatInput.style.border = '1px solid #d1d5db';
            }
        }

        const sendBtn = widget.querySelector('#send-btn');
        if (sendBtn) sendBtn.style.backgroundColor = theme.primary;

        const menuBar = widget.querySelector('.menu-bar');
        if (menuBar) menuBar.style.backgroundColor = theme.menuBg;

        const aiMessages = widget.querySelectorAll('.ai-message');
        aiMessages.forEach(msg => {
            msg.style.backgroundColor = theme.menuBg;
            msg.style.color = theme.text || '#d1d5db';
        });

        const menuButtons = widget.querySelectorAll('.menu-button');
        menuButtons.forEach(btn => {
            btn.style.color = theme.text || '#9ca3af';
        });

        const dropdowns = widget.querySelectorAll('.dropdown-content');
        dropdowns.forEach(dd => {
            dd.style.backgroundColor = theme.bg;
            if (color === 'white') {
                dd.style.border = '1px solid #d1d5db';
            }
        });

        const dropdownItems = widget.querySelectorAll('.dropdown-item');
        dropdownItems.forEach(item => {
            item.style.color = theme.text || '#d1d5db';
        });
    };

    // 4. Styles (CSS)
    const css = ` 
        .widget-container { width:90vw; max-width:400px; height:70vh; max-height:700px; box-shadow:0 10px 25px rgba(0,0,0,0.3); border-radius:12px; overflow:hidden; display:flex; flex-direction:column; z-index:99999; position:fixed; bottom:16px; right:16px; font-family:'Inter',sans-serif; transition:all 0.3s } 
        .chat-input-container { display:flex; padding:8px; transition:background-color 0.3s } 
        .chat-messages { flex-grow:1; overflow-y:auto; padding:12px; display:flex; flex-direction:column } 
        .message { margin-bottom:8px; border-radius:8px; padding:8px 12px; max-width:85% } 
        .user-message { color:white; margin-left:auto } 
        .ai-message { margin-right:auto; transition:all 0.3s } 
        .menu-bar { height:50px; display:flex; justify-content:space-around; align-items:center; border-top:1px solid rgba(255,255,255,0.1); border-radius:0 0 12px 12px; transition:background-color 0.3s } 
        .menu-button { position:relative; cursor:pointer; padding:0 10px; transition:color 0.2s } 
        .menu-button:hover { opacity:0.8 } 
        .dropdown-content { position:absolute; bottom:100%; left:50%; transform:translateX(-50%); box-shadow:0 -4px 10px rgba(0,0,0,0.3); border-radius:8px 8px 0 0; min-width:150px; opacity:0; visibility:hidden; transition:opacity 0.2s,visibility 0.2s; padding:8px 0 } 
        .menu-button:hover .dropdown-content { opacity:1; visibility:visible } 
        .dropdown-item { padding:8px 12px; cursor:pointer; white-space:nowrap; transition:all 0.3s } 
        .dropdown-item:hover { opacity:0.8 } 
        #chat-input { flex-grow:1; padding:8px; border-radius:8px 0 0 8px; border:none; transition:all 0.3s } 
        #send-btn { padding:8px 16px; color:white; border-radius:0 8px 8px 0; border:none; transition:background-color 0.3s } 
        .header { display:flex; justify-content:space-between; align-items:center; padding:12px; color:white; font-weight:bold; border-radius:12px 12px 0 0; cursor:grab; transition:background-color 0.3s } 
        .color-picker-item { display:flex; align-items:center; gap:8px } 
        .color-dot { width:20px; height:20px; border-radius:50%; border:2px solid rgba(255,255,255,0.3) } 
    `;

    const style = document.createElement('style');
    style.innerHTML = css;
    document.head.appendChild(style);

    // 5. Build DOM Elements
    const widgetContainer = document.createElement('div');
    widgetContainer.id = 'noobs-gui-widget';
    widgetContainer.className = 'widget-container';

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

    const header = document.createElement('div');
    header.className = 'header';
    const titleSpan = document.createElement('span');
    titleSpan.className = 'text-lg';
    titleSpan.textContent = 'Noobs Gui';
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

    const messageContainer = document.createElement('div');
    messageContainer.id = 'chat-messages';
    messageContainer.className = 'chat-messages';
    widgetContainer.appendChild(messageContainer);

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

    const menuBar = document.createElement('div');
    menuBar.className = 'menu-bar';

    const gamesMenu = createMenuButton('games-menu', ['M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z', 'M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z'], 'Games');
    const searchMenu = createMenuButton('search-menu', 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z', 'Search');
    const settingsMenu = createMenuButton('settings-menu', 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37a1.724 1.724 0 002.572-1.065zM12 16a4 4 0 100-8 4 4 0 000 8z', 'Settings');
    const discordMenu = createMenuButton('discord-link', ['M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.325-.325z'], 'Discord', true, discordUrl);

    menuBar.appendChild(gamesMenu);
    menuBar.appendChild(searchMenu);
    menuBar.appendChild(settingsMenu);
    menuBar.appendChild(discordMenu);
    widgetContainer.appendChild(menuBar);

    document.body.appendChild(widgetContainer);
    loadMathJax();

    // 6. Interaction Logic
    function addMessage(text, sender, isTemporary = false) {
        const msgDiv = document.createElement('div');
        msgDiv.className = `message ${sender}-message`;
        msgDiv.style.whiteSpace = 'pre-wrap';
        msgDiv.innerHTML = renderMarkdown(text);
        if (sender === 'user') {
            const theme = colorThemes[currentColor];
            msgDiv.style.backgroundColor = theme.primary;
        }
        if (isTemporary) {
            msgDiv.id = 'temp-ai-message-' + Date.now();
        }
        messageContainer.appendChild(msgDiv);
        messageContainer.scrollTop = messageContainer.scrollHeight;
        if (window.MathJax && window.MathJax.typesetPromise) {
            window.MathJax.typesetPromise([msgDiv]).catch((err) => console.error('MathJax error:', err));
        }
        return msgDiv;
    }

    function updateMessage(element, newText) {
        element.innerHTML = renderMarkdown(newText);
        messageContainer.scrollTop = messageContainer.scrollHeight;
        if (window.MathJax && window.MathJax.typesetPromise) {
            window.MathJax.typesetPromise([element]).catch((err) => console.error('MathJax error:', err));
        }
    }

    addMessage("Hello! I'm Noobs AI. Ask me a question to get started.", 'ai');

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

    // 7. Dropdowns & Settings
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

    const settingsDropdown = document.createElement('div');
    settingsDropdown.id = 'settings-dropdown';
    settingsDropdown.className = 'dropdown-content';
    settingsMenu.appendChild(settingsDropdown);

    const colorOptions = [
        { name: 'Blue', value: 'blue', color: '#4f46e5' },
        { name: 'Orange', value: 'orange', color: '#ea580c' },
        { name: 'Red', value: 'red', color: '#dc2626' },
        { name: 'White', value: 'white', color: '#ffffff' },
        { name: 'Black', value: 'black', color: '#000000' }
    ];

    colorOptions.forEach(option => {
        const item = document.createElement('div');
        item.className = 'dropdown-item color-picker-item';
        const colorDot = document.createElement('span');
        colorDot.className = 'color-dot';
        colorDot.style.backgroundColor = option.color;
        const label = document.createElement('span');
        label.textContent = option.name;
        item.appendChild(colorDot);
        item.appendChild(label);
        item.onclick = (e) => {
            e.stopPropagation();
            currentColor = option.value;
            localStorage.setItem('noobsGuiColor', currentColor);
            applyColorTheme(currentColor);
        };
        settingsDropdown.appendChild(item);
    });

    applyColorTheme(currentColor);

    searchMenu.addEventListener('click', () => {
        const newWindow = window.open('about:blank', '_blank');
        if (newWindow) {
            const htmlContent = ` <!DOCTYPE html> <html> <head> <title>Proxy Search Launcher</title> <style> body{font-family:sans-serif;display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;margin:0;background-color:#1f2937;color:white} .card{background-color:#374151;padding:40px;border-radius:12px;box-shadow:0 4px 15px rgba(0,0,0,.4);text-align:center} h1{margin-bottom:20px;font-size:1.5em} a{color:#818cf8;text-decoration:none;font-weight:bold} a:hover{text-decoration:underline} p{margin-top:20px;color:#9ca3af} </style> </head> <body> <div class="card"> <h1>Proxy Search Placeholder</h1> <p>This button simulates opening a proxy like Ultraviolet/Interstellar.</p> <a href="${proxyPlaceholderUrl}" target="_top" style="display:block;padding:10px 20px;background-color:#4f46e5;border-radius:8px;margin-top:20px;">Launch Proxy Search (Placeholder)</a> <p>Please replace the link with your actual proxy URL.</p> </div> </body> </html>`;
            newWindow.document.write(htmlContent);
            newWindow.document.close();
        }
    });

    closeBtn.addEventListener('click', () => {
        widgetContainer.style.display = 'none';
    });

    // 8. Drag and Drop Logic
    let isDragging = false;
    let offsetX, offsetY;
    let initialPositionSet = false;

    const setInitialPosition = () => {
        if (!initialPositionSet) {
            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;
            const widgetWidth = widgetContainer.offsetWidth;
            const widgetHeight = widgetContainer.offsetHeight;
            if (widgetContainer.style.position === 'fixed') {
            } else {
                widgetContainer.style.position = 'fixed';
                widgetContainer.style.left = (viewportWidth / 2 - widgetWidth / 2) + 'px';
                widgetContainer.style.top = (viewportHeight / 2 - widgetHeight / 2) + 'px';
            }
            initialPositionSet = true;
        }
    };

    setInitialPosition();
    window.addEventListener('resize', setInitialPosition);

    header.addEventListener('mousedown', (e) => {
        if (e.button !== 0) return;
        isDragging = true;
        if (widgetContainer.style.position !== 'fixed') {
            widgetContainer.style.position = 'fixed';
        }
        const rect = widgetContainer.getBoundingClientRect();
        offsetX = e.clientX - rect.left;
        offsetY = e.clientY - rect.top;
        widgetContainer.style.right = 'auto';
        widgetContainer.style.bottom = 'auto';
        widgetContainer.style.cursor = 'grabbing';
        e.preventDefault();
    });

    document.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        let newX = e.clientX - offsetX;
        let newY = e.clientY - offsetY;
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
