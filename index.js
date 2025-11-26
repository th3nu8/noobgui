/* ===== Noobs GUI — Pretty / Indented Version =====
   - Dark-themed AI message boxes
   - Monochrome Discord logo
   - Monochrome Controller icon
   - Keep original functionality (API proxy, backoff, MathJax, draggable, themes)
*/

(function () {
  // -------------------------
  // Configuration
  // -------------------------
  const apiUrl = "https://twilight-hill-3941.blueboltgamingyt.workers.dev";
  const discordUrl = "https://discord.gg/placeholder_invite";
  const proxyPlaceholderUrl = "https://www.google.com/search?q=uv+proxy+web+search+placeholder";

  // Preconfigured games
  const games = [
    { name: "Tetris", url: "https://www.google.com/search?q=online+tetris+game" },
    { name: "Snake", url: "https://www.google.com/search?q=online+snake+game" },
    { name: "2048", url: "https://www.google.com/search?q=online+2048+game" },
    { name: "Minesweeper", url: "https://www.google.com/search?q=online+minesweeper+game" }
  ];

  // Color themes (keeps original theme shapes)
  const colorThemes = {
    blue: { primary: "#4f46e5", secondary: "#818cf8", bg: "#1f2937", inputBg: "#4b5563", menuBg: "#374151", text: "#d1d5db" },
    orange: { primary: "#ea580c", secondary: "#fb923c", bg: "#1c1917", inputBg: "#44403c", menuBg: "#292524", text: "#e7e3df" },
    red: { primary: "#dc2626", secondary: "#f87171", bg: "#1f1f1f", inputBg: "#3f3f3f", menuBg: "#2a2a2a", text: "#e6e6e6" },
    white: { primary: "#059669", secondary: "#34d399", bg: "#f9fafb", inputBg: "#ffffff", menuBg: "#f3f4f6", text: "#1f2937" },
    black: { primary: "#6366f1", secondary: "#a5b4fc", bg: "#000000", inputBg: "#1a1a1a", menuBg: "#0a0a0a", text: "#d1d5db" }
  };

  let isGenerating = false;
  let currentColor = localStorage.getItem("noobsGuiColor") || "blue";

  // -------------------------
  // Utility: Fetch with backoff
  // -------------------------
  async function fetchWithBackoff(url, options, maxRetries = 5) {
    for (let i = 0; i < maxRetries; i++) {
      try {
        const response = await fetch(url, options);
        // If not 429 retry logic is bypassed and response returned.
        if (response.status !== 429) return response;
      } catch (err) {
        console.error("Fetch error (retrying):", err);
      }
      const delay = Math.pow(2, i) * 1000 + Math.random() * 1000;
      await new Promise((res) => setTimeout(res, delay));
    }
    throw new Error("API call failed after multiple retries.");
  }

  // -------------------------
  // Inject CSS (widget + dark message boxes)
  // -------------------------
  const css = `
    .noobs-widget {
      width: 90vw;
      max-width: 420px;
      height: 70vh;
      max-height: 720px;
      box-shadow: 0 10px 25px rgba(0,0,0,0.4);
      border-radius: 12px;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      z-index: 9999999;
      position: fixed;
      bottom: 16px;
      right: 16px;
      font-family: Inter, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial;
      transition: all 0.25s;
    }

    .noobs-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px;
      color: white;
      font-weight: 700;
      border-radius: 12px 12px 0 0;
      cursor: grab;
    }

    .noobs-title {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .noobs-title svg {
      width: 20px;
      height: 20px;
      color: white;
    }

    .noobs-messages {
      flex-grow: 1;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 8px;
      padding: 12px;
      background: rgba(255,255,255,0.02);
    }

    /* Message styles */
    .message {
      margin-bottom: 8px;
      border-radius: 12px;
      padding: 10px 12px;
      max-width: 85%;
      line-height: 1.4;
      white-space: pre-wrap;
      word-break: break-word;
    }

    /* User messages: aligned to right, primary color background */
    .user-message {
      margin-left: auto;
      color: white;
      border: 1px solid rgba(255,255,255,0.06);
      box-shadow: 0 6px 12px rgba(0,0,0,0.25);
    }

    /* AI messages: dark-themed boxes (requested) */
    .ai-message {
      margin-right: auto;
      background: linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0.01));
      border: 1px solid rgba(255,255,255,0.04);
      color: #d1d5db;
      box-shadow: 0 4px 10px rgba(0,0,0,0.35);
    }

    .ai-message.temporary {
      opacity: 0.85;
      font-style: italic;
    }

    .noobs-input-row {
      display: flex;
      gap: 8px;
      padding: 10px;
      align-items: center;
      border-top: 1px solid rgba(255,255,255,0.03);
    }

    #chat-input {
      flex-grow: 1;
      padding: 10px 12px;
      border-radius: 10px;
      border: none;
      outline: none;
      background: rgba(0,0,0,0.35);
      color: #e5e7eb;
      font-size: 14px;
      min-height: 38px;
    }

    #send-btn {
      padding: 8px 12px;
      border-radius: 10px;
      border: none;
      cursor: pointer;
      font-weight: 600;
    }

    .menu-bar {
      height: 52px;
      display: flex;
      justify-content: space-around;
      align-items: center;
      border-top: 1px solid rgba(255,255,255,0.03);
      background: rgba(0,0,0,0.08);
    }

    .menu-button {
      position: relative;
      cursor: pointer;
      padding: 6px 10px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
      color: #d1d5db;
      font-size: 11px;
      user-select: none;
    }

    .menu-button svg {
      width: 20px;
      height: 20px;
      display: block;
      color: currentColor; /* Monochrome icon uses currentColor */
    }

    .dropdown-content {
      position: absolute;
      bottom: 100%;
      left: 50%;
      transform: translateX(-50%);
      box-shadow: 0 -6px 16px rgba(0,0,0,0.4);
      border-radius: 8px 8px 0 0;
      min-width: 160px;
      opacity: 0;
      visibility: hidden;
      transition: opacity 0.18s ease, visibility 0.18s ease;
      padding: 6px 0;
      background: rgba(0,0,0,0.9);
      border: 1px solid rgba(255,255,255,0.03);
      z-index: 10000000;
    }

    .menu-button:hover .dropdown-content {
      opacity: 1;
      visibility: visible;
    }

    .dropdown-item {
      padding: 8px 12px;
      cursor: pointer;
      white-space: nowrap;
      color: #d1d5db;
      font-size: 13px;
    }

    .dropdown-item:hover {
      background: rgba(255,255,255,0.02);
    }

    .color-picker-item {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .color-dot {
      width: 16px;
      height: 16px;
      border-radius: 50%;
      border: 2px solid rgba(255,255,255,0.12);
    }

    /* small helpers */
    .text-lg { font-size: 1.05rem; }
    button:focus, input:focus { outline: none; }
  `;

  const styleEl = document.createElement("style");
  styleEl.innerHTML = css;
  document.head.appendChild(styleEl);

  // -------------------------
  // Helper: create SVG elements for icons (monochrome / currentColor)
  // Accepts array of path strings or single path
  // -------------------------
  function createSvg(paths, viewBox = "0 0 24 24") {
    const xmlns = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(xmlns, "svg");
    svg.setAttribute("viewBox", viewBox);
    svg.setAttribute("fill", "none");
    svg.setAttribute("stroke", "currentColor");
    svg.setAttribute("stroke-width", "1.5");
    svg.setAttribute("stroke-linecap", "round");
    svg.setAttribute("stroke-linejoin", "round");
    svg.style.width = "20px";
    svg.style.height = "20px";

    const pathsArray = Array.isArray(paths) ? paths : [paths];
    pathsArray.forEach((d) => {
      const path = document.createElementNS(xmlns, "path");
      path.setAttribute("d", d);
      svg.appendChild(path);
    });
    return svg;
  }

  // Monochrome Discord logo (glyph only)
  function discordSvg() {
    // This is a simplified monochrome glyph path collection
    const paths = [
      "M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.844-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.0371 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C2.95 9.0458 2.438 13.579 3.052 17.982c.015.0702.064.1462.127.1842 2.052.94 4.05 1.49 5.992 1.861.6.11 1.154-.26 1.285-.873.117-.55.205-1.128.297-1.672-2.384-.548-4.63-1.36-4.63-1.36-.314-.13-.64-.33-.92-.57 0 0-.07-.06-.03-.14.37-.56.66-1.15.9-1.76 3.01.87 6.27.87 9.28 0 .24.61.53 1.2.9 1.76.04.08-.03.14-.03.14-.28.24-.6.44-.92.57 0 0-2.25.81-4.63 1.36.09.47.18 1.01.29 1.66.13.62.69.99 1.29.87 1.94-.37 3.94-.92 6-1.86.064-.038.114-.114.13-.184.62-4.402.11-8.935-2.906-13.586a.061.061 0 00-.031-.028z"
    ];
    return createSvg(paths, "0 0 24 24");
  }

  // Monochrome controller icon
  function controllerSvg() {
    const paths = [
      "M6 10.5a1.5 1.5 0 100-3 1.5 1.5 0 000 3z",
      "M18 10.5a1.5 1.5 0 100-3 1.5 1.5 0 000 3z",
      "M21 13c-.8 4.5-3.5 6-7 6s-6.2-1.5-7-6C6 6 3 6 3 6s1.6-2 5-2 7 0 9 2c2 2 4 2 4 2s-1 3-3 7z"
    ];
    // We will use combined paths to create a stylized controller glyph
    return createSvg(paths, "0 0 24 24");
  }

  // Default header icon (simple circle / info)
  function defaultGlyph() {
    return createSvg(["M12 2a10 10 0 100 20 10 10 0 000-20z", "M11 10h2v6h-2z", "M11 7h2v2h-2z"], "0 0 24 24");
  }

  // -------------------------
  // Build Widget DOM
  // -------------------------
  // If widget already present toggle display
  if (document.getElementById("noobs-gui-widget")) {
    const w = document.getElementById("noobs-gui-widget");
    w.style.display = w.style.display === "none" ? "flex" : "none";
    return;
  }

  const widget = document.createElement("div");
  widget.id = "noobs-gui-widget";
  widget.className = "noobs-widget";

  // Header
  const header = document.createElement("div");
  header.className = "noobs-header";

  const titleGroup = document.createElement("div");
  titleGroup.className = "noobs-title";

  const glyph = defaultGlyph();
  glyph.style.color = "#ffffff";
  titleGroup.appendChild(glyph);

  const title = document.createElement("span");
  title.className = "text-lg";
  title.textContent = "Noobs Gui";
  titleGroup.appendChild(title);
  header.appendChild(titleGroup);

  const closeBtn = document.createElement("button");
  closeBtn.id = "close-widget-btn";
  closeBtn.innerHTML = "✕";
  closeBtn.style.background = "none";
  closeBtn.style.border = "none";
  closeBtn.style.color = "white";
  closeBtn.style.cursor = "pointer";
  closeBtn.style.fontSize = "1.25rem";
  header.appendChild(closeBtn);

  widget.appendChild(header);

  // Messages container
  const messages = document.createElement("div");
  messages.id = "chat-messages";
  messages.className = "noobs-messages";
  widget.appendChild(messages);

  // Input row
  const inputRow = document.createElement("div");
  inputRow.className = "noobs-input-row";

  const chatInput = document.createElement("input");
  chatInput.type = "text";
  chatInput.id = "chat-input";
  chatInput.placeholder = "Ask me anything...";
  inputRow.appendChild(chatInput);

  const sendBtn = document.createElement("button");
  sendBtn.id = "send-btn";
  sendBtn.textContent = "Send";
  inputRow.appendChild(sendBtn);

  widget.appendChild(inputRow);

  // Menu bar
  const menuBar = document.createElement("div");
  menuBar.className = "menu-bar";

  // Helper to create menu buttons (can be link or div)
  function createMenuButton(id, svgEl, label, isLink = false, href = "") {
    const btn = isLink ? document.createElement("a") : document.createElement("div");
    btn.className = "menu-button";
    btn.id = id;
    if (isLink) {
      btn.href = href;
      btn.target = "_blank";
      btn.rel = "noreferrer noopener";
    }
    // icon
    svgEl.style.display = "block";
    svgEl.style.margin = "0 auto";
    svgEl.style.color = "#d1d5db"; // monochrome look
    btn.appendChild(svgEl);

    // text label
    const lbl = document.createElement("span");
    lbl.textContent = label;
    btn.appendChild(lbl);

    return btn;
  }

  // Games button (controller icon)
  const gamesBtn = createMenuButton("games-menu", controllerSvg(), "Games");
  // Dropdown for games
  const gamesDropdown = document.createElement("div");
  gamesDropdown.className = "dropdown-content";
  gamesDropdown.id = "games-dropdown";
  games.forEach((g) => {
    const item = document.createElement("div");
    item.className = "dropdown-item";
    item.textContent = g.name;
    item.onclick = () => window.open(g.url, "_blank");
    gamesDropdown.appendChild(item);
  });
  gamesBtn.appendChild(gamesDropdown);
  menuBar.appendChild(gamesBtn);

  // Search button (magnifier)
  const searchSvg = createSvg(["M21 21l-4.35-4.35", "M11 19a8 8 0 100-16 8 8 0 000 16z"]);
  const searchBtn = createMenuButton("search-menu", searchSvg, "Search");
  menuBar.appendChild(searchBtn);

  // Settings button (gear)
  const gearSvg = createSvg([
    "M12 15.5a3.5 3.5 0 110-7 3.5 3.5 0 010 7z",
    "M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 11-4 0v-.09a1.65 1.65 0 00-1-1.51 1.65 1.65 0 00-1.82.33l-.06.06A2 2 0 113.27 17.8l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 110-4h.09a1.65 1.65 0 001.51-1 1.65 1.65 0 00-.33-1.82L4.2 3.27A2 2 0 116.99.44l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V1a2 2 0 114 0v.09a1.65 1.65 0 001 1.51h.09a1.65 1.65 0 001.82-.33l.06-.06A2 2 0 1120.73 6.2l-.06.06a1.65 1.65 0 00-.33 1.82V9c0 .4.15.78.44 1.06a1.65 1.65 0 00.33 1.82z"
  ]);
  const settingsBtn = createMenuButton("settings-menu", gearSvg, "Settings");

  // Settings dropdown (color choices)
  const settingsDropdown = document.createElement("div");
  settingsDropdown.className = "dropdown-content";
  settingsDropdown.id = "settings-dropdown";

  const colorOptions = [
    { name: "Blue", value: "blue", color: "#4f46e5" },
    { name: "Orange", value: "orange", color: "#ea580c" },
    { name: "Red", value: "red", color: "#dc2626" },
    { name: "White", value: "white", color: "#ffffff" },
    { name: "Black", value: "black", color: "#000000" }
  ];

  colorOptions.forEach((opt) => {
    const item = document.createElement("div");
    item.className = "dropdown-item color-picker-item";
    const dot = document.createElement("span");
    dot.className = "color-dot";
    dot.style.backgroundColor = opt.color;
    const label = document.createElement("span");
    label.textContent = opt.name;
    item.appendChild(dot);
    item.appendChild(label);
    item.onclick = (e) => {
      e.stopPropagation();
      currentColor = opt.value;
      localStorage.setItem("noobsGuiColor", currentColor);
      applyColorTheme(currentColor);
    };
    settingsDropdown.appendChild(item);
  });

  settingsBtn.appendChild(settingsDropdown);
  menuBar.appendChild(settingsBtn);

  // Discord button with monochrome glyph (link)
  const discordBtn = createMenuButton("discord-link", discordSvg(), "Discord", true, discordUrl);
  menuBar.appendChild(discordBtn);

  widget.appendChild(menuBar);

  // Append to body
  document.body.appendChild(widget);

  // -------------------------
  // Theme application
  // -------------------------
  function applyColorTheme(color) {
    const theme = colorThemes[color] || colorThemes.blue;
    // header
    const headerEl = widget.querySelector(".noobs-header");
    if (headerEl) headerEl.style.backgroundColor = theme.primary;
    // input and send
    const inputBg = widget.querySelector("#chat-input");
    if (inputBg) {
      inputBg.style.background = theme.inputBg;
      inputBg.style.color = theme.text || "#fff";
    }
    const send = widget.querySelector("#send-btn");
    if (send) {
      send.style.background = theme.primary;
      send.style.color = "#fff";
    }
    // messages area bg
    const msgArea = widget.querySelector(".noobs-messages");
    if (msgArea) msgArea.style.background = theme.bg;
    // menu bar
    const mb = widget.querySelector(".menu-bar");
    if (mb) mb.style.background = theme.menuBg;
    // ai message text color
    const aiMsgs = widget.querySelectorAll(".ai-message");
    aiMsgs.forEach((m) => {
      m.style.color = theme.text || "#d1d5db";
      m.style.background = "linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0.01))";
    });
    // user messages
    const userMsgs = widget.querySelectorAll(".user-message");
    userMsgs.forEach((m) => {
      m.style.background = theme.primary;
      m.style.color = "#fff";
    });

    // update menu buttons color
    const menuButtons = widget.querySelectorAll(".menu-button");
    menuButtons.forEach((btn) => {
      btn.style.color = theme.text || "#d1d5db";
    });
  }

  applyColorTheme(currentColor);

  // -------------------------
  // MathJax loader (optional)
  // -------------------------
  function loadMathJax() {
    if (window.MathJaxLoaded) return;
    window.MathJaxLoaded = true;
    const s = document.createElement("script");
    s.src = "https://cdnjs.cloudflare.com/ajax/libs/mathjax/3.2.2/es5/tex-mml-chtml.js";
    s.async = true;
    document.head.appendChild(s);
  }
  loadMathJax();

  // -------------------------
  // Markdown -> minimal HTML renderer
  // (keeps original simple replacements)
  // -------------------------
  function renderMarkdown(text) {
    if (!text) return "";
    let html = text
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.*?)\*/g, "<em>$1</em>")
      .replace(/^#+\s*(.*)/gm, "<strong>$1</strong>")
      .replace(/^(\d+)\.\s(.*?)/gm, "<br>$1. $2")
      .replace(/^(-|\*)\s(.*?)/gm, "<br>&bull; $2")
      .replace(/```(\w+)?\n([\s\S]*?)```/g, "<pre>$2</pre>")
      .replace(/\n\n/g, "<br><br>");
    return html;
  }

  // -------------------------
  // Message handling
  // -------------------------
  function addMessage(text, sender = "ai", isTemporary = false) {
    const msgDiv = document.createElement("div");
    msgDiv.className = `message ${sender}-message ${sender === "ai" ? "ai-message" : "user-message"}`;
    if (isTemporary) msgDiv.classList.add("temporary");
    msgDiv.innerHTML = renderMarkdown(text);
    messages.appendChild(msgDiv);
    messages.scrollTop = messages.scrollHeight;
    // MathJax typeset if loaded
    if (window.MathJax && window.MathJax.typesetPromise) {
      window.MathJax.typesetPromise([msgDiv]).catch((err) => console.error("MathJax error:", err));
    }
    return msgDiv;
  }

  function updateMessage(element, newText) {
    if (!element) return;
    element.innerHTML = renderMarkdown(newText);
    messages.scrollTop = messages.scrollHeight;
    if (window.MathJax && window.MathJax.typesetPromise) {
      window.MathJax.typesetPromise([element]).catch((err) => console.error("MathJax error:", err));
    }
  }

  // Initial greeting
  addMessage("Hello! I'm Noobs AI. Ask me a question to get started.", "ai");

  // -------------------------
  // Content generation
  // -------------------------
  async function generateContent(prompt) {
    if (!prompt || isGenerating) return;
    isGenerating = true;
    addMessage(prompt, "user");

    // temporary "Thinking..." message (ai)
    const temp = addMessage("Thinking...", "ai", true);

    // craft payload similar to original structure
    const payload = {
      contents: [{ parts: [{ text: prompt }] }],
      tools: [{ google_search: {} }],
      systemInstruction: {
        parts: [
          {
            text:
              "You are a helpful and concise browser assistant. Respond clearly and in Markdown format. Use Google Search for current events."
          }
        ]
      }
    };

    try {
      const response = await fetchWithBackoff(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      let generatedText = "Sorry, I encountered an issue. Please try again.";
      if (result.error) {
        generatedText = `Proxy Error: ${result.error}. Double-check your Cloudflare Worker deployment and GEMINI_API_KEY environment variable.`;
      } else if (result.candidates && result.candidates.length > 0 && result.candidates[0].content && result.candidates[0].content.parts.length > 0) {
        generatedText = result.candidates[0].content.parts[0].text || generatedText;
      } else if (result.output) {
        // attempt other possible shapes
        generatedText = result.output || generatedText;
      }

      updateMessage(temp, generatedText);
      temp.classList.remove("temporary");
    } catch (err) {
      console.error("Network Error:", err);
      updateMessage(temp, "Error: A network issue occurred. Ensure your Cloudflare Worker is deployed and its URL is correct.");
      temp.classList.remove("temporary");
    } finally {
      isGenerating = false;
    }
  }

  // -------------------------
  // Events: send button and enter key
  // -------------------------
  sendBtn.addEventListener("click", () => {
    const prompt = chatInput.value.trim();
    if (prompt && !isGenerating) {
      chatInput.value = "";
      generateContent(prompt);
    }
  });

  chatInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter" && !isGenerating) {
      sendBtn.click();
    }
  });

  // Search button behavior: open proxy placeholder page
  searchBtn.addEventListener("click", () => {
    const newWindow = window.open("about:blank", "_blank");
    if (newWindow) {
      const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
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
    <a href="${proxyPlaceholderUrl}" target="_top" style="display:inline-block;padding:10px 20px;background-color:#4f46e5;border-radius:8px;margin-top:20px;color:white;">Launch Proxy Search (Placeholder)</a>
    <p>Please replace the link with your actual proxy URL.</p>
  </div>
</body>
</html>`;
      newWindow.document.write(htmlContent);
      newWindow.document.close();
    }
  });

  // Close button
  closeBtn.addEventListener("click", () => {
    widget.style.display = "none";
  });

  // Games menu hover already handled through CSS; clicking outside handled by browser.

  // -------------------------
  // Dragging behavior (mouse + touch)
  // -------------------------
  let isDragging = false;
  let offsetX = 0;
  let offsetY = 0;
  let initialPositionSet = false;

  function setInitialPosition() {
    if (initialPositionSet) return;
    // center the widget initially
    if (widget.style.position !== "fixed") widget.style.position = "fixed";
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const w = widget.offsetWidth;
    const h = widget.offsetHeight;
    widget.style.left = vw / 2 - w / 2 + "px";
    widget.style.top = vh / 2 - h / 2 + "px";
    initialPositionSet = true;
  }
  setInitialPosition();
  window.addEventListener("resize", setInitialPosition);

  header.addEventListener("mousedown", (e) => {
    if (e.button !== 0) return;
    isDragging = true;
    const rect = widget.getBoundingClientRect();
    offsetX = e.clientX - rect.left;
    offsetY = e.clientY - rect.top;
    widget.style.cursor = "grabbing";
    widget.style.right = "auto";
    widget.style.bottom = "auto";
    e.preventDefault();
  });

  document.addEventListener("mousemove", (e) => {
    if (!isDragging) return;
    let newX = e.clientX - offsetX;
    let newY = e.clientY - offsetY;
    const maxLeft = window.innerWidth - widget.offsetWidth;
    const maxTop = window.innerHeight - widget.offsetHeight;
    newX = Math.max(0, Math.min(newX, maxLeft));
    newY = Math.max(0, Math.min(newY, maxTop));
    widget.style.left = newX + "px";
    widget.style.top = newY + "px";
  });

  document.addEventListener("mouseup", () => {
    isDragging = false;
    widget.style.cursor = "grab";
  });

  // Touch-based dragging
  header.addEventListener("touchstart", (e) => {
    const t = e.touches[0];
    isDragging = true;
    const rect = widget.getBoundingClientRect();
    offsetX = t.clientX - rect.left;
    offsetY = t.clientY - rect.top;
    widget.style.right = "auto";
    widget.style.bottom = "auto";
    e.preventDefault();
  });

  document.addEventListener("touchmove", (e) => {
    if (!isDragging) return;
    const t = e.touches[0];
    let newX = t.clientX - offsetX;
    let newY = t.clientY - offsetY;
    const maxLeft = window.innerWidth - widget.offsetWidth;
    const maxTop = window.innerHeight - widget.offsetHeight;
    newX = Math.max(0, Math.min(newX, maxLeft));
    newY = Math.max(0, Math.min(newY, maxTop));
    widget.style.left = newX + "px";
    widget.style.top = newY + "px";
    e.preventDefault();
  });

  document.addEventListener("touchend", () => {
    isDragging = false;
  });
})();
