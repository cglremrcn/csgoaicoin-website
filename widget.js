(function () {
    // Create the host element
    const host = document.createElement('div');
    host.id = 'csgoai-chat-widget';
    document.body.appendChild(host);

    // Create Shadow DOM
    const shadow = host.attachShadow({ mode: 'open' });

    // Styles
    const style = document.createElement('style');
    style.textContent = `
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600&family=Orbitron:wght@400;700&display=swap');

        :root {
            /* CT Theme (Tactical Blue/Cyan) */
            --primary-color: #00b4d8; /* Cyan/Blue */
            --secondary-color: #0077b6; /* Deep Blue */
            --accent-color: #48cae4; /* Light Cyan */
            --bg-color: #020406; /* Very Dark Navy */
            --text-color: #e0fbfc;
            --glass-bg: rgba(2, 4, 6, 0.85);
            --glass-border: rgba(0, 180, 216, 0.3);
            --neon-glow: 0 0 10px rgba(0, 180, 216, 0.5);
            --msg-user-bg: linear-gradient(135deg, #0077b6, #0096c7);
            --msg-bot-bg: rgba(0, 180, 216, 0.1);
            --font-main: 'Inter', sans-serif;
            --font-tech: 'Orbitron', sans-serif;
        }

        /* T Theme (Terrorist - Aggressive Orange/Red) */
        .theme-t {
            --primary-color: #ff9f1c; /* Orange */
            --secondary-color: #d00000; /* Red */
            --accent-color: #ffbf69; /* Light Orange */
            --glass-border: rgba(255, 159, 28, 0.3);
            --neon-glow: 0 0 10px rgba(255, 159, 28, 0.5);
            --msg-user-bg: linear-gradient(135deg, #d00000, #ff9f1c);
            --msg-bot-bg: rgba(255, 159, 28, 0.1);
        }

        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }

        .widget-container {
            font-family: var(--font-main);
            position: fixed;
            bottom: 180px;
            right: 30px;
            z-index: 99999;
            display: flex;
            flex-direction: column;
            align-items: flex-end;
            opacity: 0;
            visibility: hidden;
            transition: opacity 0.5s ease, visibility 0.5s ease;
            cursor: auto !important; 
        }

        .widget-container.visible {
            opacity: 1;
            visibility: visible;
        }

        /* Scanline Effect */
        .scanlines {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: linear-gradient(
                to bottom,
                rgba(255,255,255,0),
                rgba(255,255,255,0) 50%,
                rgba(0,0,0,0.1) 50%,
                rgba(0,0,0,0.1)
            );
            background-size: 100% 4px;
            pointer-events: none;
            z-index: 0;
            opacity: 0.3;
        }

        /* Notification Bubble */
        .notification-bubble {
            background: var(--primary-color);
            color: #000;
            padding: 8px 12px;
            border-radius: 4px; /* More angular */
            font-family: var(--font-tech);
            font-size: 12px;
            font-weight: bold;
            margin-bottom: 10px;
            box-shadow: 0 4px 10px rgba(0,0,0,0.3), var(--neon-glow);
            opacity: 0;
            transform: translateY(10px);
            transition: all 0.3s ease;
            position: relative;
            pointer-events: none;
            border: 1px solid rgba(255,255,255,0.3);
        }

        .notification-bubble.show {
            opacity: 1;
            transform: translateY(0);
        }

        .notification-bubble::after {
            content: '';
            position: absolute;
            bottom: -6px;
            right: 20px;
            width: 12px;
            height: 12px;
            background: var(--primary-color);
            transform: rotate(45deg);
            border-bottom: 1px solid rgba(255,255,255,0.3);
            border-right: 1px solid rgba(255,255,255,0.3);
        }

        /* Chat Button */
        .chat-button {
            width: 56px;
            height: 56px;
            border-radius: 50%; /* Keep circular for main button */
            background: linear-gradient(135deg, var(--secondary-color), var(--primary-color));
            border: 2px solid rgba(255,255,255,0.2);
            cursor: pointer;
            box-shadow: 0 4px 20px rgba(0,0,0,0.4), 
                        0 0 20px rgba(0, 180, 216, 0.3),
                        inset 0 1px 0 rgba(255,255,255,0.2);
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            position: relative;
            overflow: visible;
            animation: button-breathing 3s ease-in-out infinite;
        }
        
        @keyframes button-breathing {
            0%, 100% {
                box-shadow: 0 4px 20px rgba(0,0,0,0.4), 
                            0 0 20px rgba(0, 180, 216, 0.3),
                            inset 0 1px 0 rgba(255,255,255,0.2);
            }
            50% {
                box-shadow: 0 4px 25px rgba(0,0,0,0.5), 
                            0 0 35px rgba(0, 180, 216, 0.5),
                            0 0 50px rgba(0, 180, 216, 0.2),
                            inset 0 1px 0 rgba(255,255,255,0.3);
            }
        }
        
        .chat-button::before {
            content: '';
            position: absolute;
            inset: -3px;
            border-radius: 50%;
            background: linear-gradient(135deg, var(--primary-color), var(--accent-color));
            z-index: -1;
            opacity: 0;
            transition: opacity 0.3s ease;
            animation: rotate-border 4s linear infinite;
        }
        
        @keyframes rotate-border {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        
        .chat-button:hover::before {
            opacity: 0.7;
        }

        .chat-button:hover {
            transform: scale(1.1) translateY(-2px);
            box-shadow: 0 8px 30px rgba(0,0,0,0.5), 
                        0 0 40px rgba(0, 180, 216, 0.6);
            animation: none;
        }

        .chat-button svg {
            width: 26px;
            height: 26px;
            fill: white;
            transition: transform 0.3s ease;
            filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));
        }

        .chat-button.open svg {
            transform: rotate(90deg);
        }

        /* Chat Window */
        .chat-window {
            width: 320px;
            height: 480px;
            background: linear-gradient(135deg, rgba(2, 4, 6, 0.95) 0%, rgba(10, 15, 20, 0.92) 100%);
            backdrop-filter: blur(25px);
            -webkit-backdrop-filter: blur(25px);
            border: 1px solid rgba(0, 180, 216, 0.15);
            border-radius: 16px;
            margin-bottom: 15px;
            display: flex;
            flex-direction: column;
            overflow: hidden;
            box-shadow: 0 25px 60px rgba(0, 0, 0, 0.6),
                        0 0 30px rgba(0, 180, 216, 0.1),
                        inset 0 1px 0 rgba(255, 255, 255, 0.05);
            opacity: 0;
            transform: translateY(20px) scale(0.9);
            pointer-events: none;
            transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
            transform-origin: bottom right;
            cursor: default;
            position: relative;
        }
        
        .chat-window::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 100px;
            background: linear-gradient(180deg, rgba(0, 180, 216, 0.08) 0%, transparent 100%);
            pointer-events: none;
            z-index: 0;
        }

        .chat-window.active {
            opacity: 1;
            transform: translateY(0) scale(1);
            pointer-events: all;
        }

        /* Header */
        .chat-header {
            padding: 10px 12px;
            background: rgba(0,0,0,0.4);
            border-bottom: 1px solid var(--glass-border);
            display: flex;
            align-items: center;
            justify-content: space-between;
            position: relative;
            z-index: 2;
        }

        .header-title {
            font-family: var(--font-tech);
            font-weight: 700;
            color: var(--primary-color);
            font-size: 12px;
            display: flex;
            align-items: center;
            gap: 6px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            text-shadow: 0 0 10px var(--primary-color);
        }

        .status-dot {
            width: 8px;
            height: 8px;
            background: #00ff00;
            border-radius: 50%;
            box-shadow: 0 0 5px #00ff00;
            animation: pulse 2s infinite;
        }
        
        @keyframes pulse {
            0% { box-shadow: 0 0 0 0 rgba(0, 255, 0, 0.7); }
            70% { box-shadow: 0 0 0 6px rgba(0, 255, 0, 0); }
            100% { box-shadow: 0 0 0 0 rgba(0, 255, 0, 0); }
        }

        .header-actions {
            display: flex;
            gap: 5px;
        }

        .icon-btn {
            background: rgba(255,255,255,0.05);
            border: 1px solid var(--glass-border);
            color: var(--primary-color);
            border-radius: 4px;
            padding: 4px;
            width: 26px;
            height: 26px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: all 0.2s;
        }

        .icon-btn:hover {
            background: var(--primary-color);
            color: #000;
            box-shadow: 0 0 10px var(--primary-color);
        }

        .icon-btn svg {
            width: 14px;
            height: 14px;
            fill: currentColor;
        }

        .theme-btn {
            background: rgba(255,255,255,0.05);
            border: 1px solid var(--glass-border);
            color: var(--primary-color);
            border-radius: 4px;
            padding: 4px 8px;
            font-size: 9px;
            cursor: pointer;
            font-family: var(--font-tech);
            transition: all 0.2s;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        .theme-btn:hover {
            background: var(--primary-color);
            color: #000;
            box-shadow: 0 0 10px var(--primary-color);
        }

        /* Messages Area */
        .chat-messages {
            flex: 1;
            padding: 12px;
            overflow-y: auto;
            display: flex;
            flex-direction: column;
            gap: 10px;
            scrollbar-width: thin;
            scrollbar-color: var(--primary-color) transparent;
            position: relative;
            z-index: 1;
        }

        .chat-messages::-webkit-scrollbar {
            width: 4px;
        }

        .chat-messages::-webkit-scrollbar-thumb {
            background-color: var(--primary-color);
            border-radius: 2px;
        }

        .message {
            max-width: 88%;
            padding: 8px 10px;
            border-radius: 4px; /* Tech look */
            font-size: 12px;
            line-height: 1.5;
            color: #eee;
            animation: fadeIn 0.3s ease;
            word-wrap: break-word;
            word-break: break-word;
            position: relative;
        }
        
        /* Tech corner accent for bot messages */
        .message.bot::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            width: 0;
            height: 0;
            border-top: 8px solid var(--primary-color);
            border-right: 8px solid transparent;
            opacity: 0.7;
        }

        .message a {
            color: var(--accent-color);
            text-decoration: none;
            border-bottom: 1px dotted var(--accent-color);
            font-weight: bold;
            pointer-events: auto;
            cursor: pointer;
            transition: all 0.2s;
        }
        
        .message a:hover {
            background: rgba(255,255,255,0.1);
            border-bottom-style: solid;
            padding: 0 2px;
        }

        .message strong {
            color: var(--primary-color);
            font-weight: 700;
        }

        .message code {
            background: rgba(0,0,0,0.5);
            padding: 2px 6px;
            border-radius: 2px;
            font-family: 'Courier New', monospace;
            color: var(--accent-color);
            border: 1px solid rgba(255,255,255,0.1);
        }

        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }

        .message.bot {
            align-self: flex-start;
            background: var(--msg-bot-bg);
            border: 1px solid var(--glass-border);
        }

        .message.user {
            align-self: flex-end;
            background: var(--msg-user-bg);
            box-shadow: 0 4px 15px rgba(0,0,0,0.2);
            color: white;
            border: 1px solid rgba(255,255,255,0.1);
        }

        /* Quick Chips */
        .quick-chips {
            padding: 6px 10px;
            display: flex;
            gap: 5px;
            flex-wrap: wrap;
            justify-content: flex-end;
            position: relative;
            z-index: 2;
        }
        
        .chip {
            background: rgba(0,0,0,0.3);
            border: 1px solid var(--glass-border);
            color: var(--primary-color);
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 9px;
            cursor: pointer;
            transition: all 0.2s;
            font-family: var(--font-tech);
            text-transform: uppercase;
            letter-spacing: 0.3px;
        }

        .chip:hover {
            background: var(--primary-color);
            color: #000;
            box-shadow: 0 0 10px var(--primary-color);
            transform: translateY(-2px);
        }

        /* Input Area */
        .chat-input-area {
            padding: 10px;
            border-top: 1px solid var(--glass-border);
            display: flex;
            gap: 8px;
            background: rgba(0, 0, 0, 0.4);
            position: relative;
            z-index: 2;
        }

        .chat-input {
            flex: 1;
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid var(--glass-border);
            border-radius: 4px;
            padding: 8px 10px;
            color: white;
            font-family: var(--font-main);
            font-size: 12px;
            outline: none;
            transition: all 0.3s;
        }

        .chat-input:focus {
            border-color: var(--primary-color);
            background: rgba(255, 255, 255, 0.1);
            box-shadow: 0 0 10px rgba(0, 180, 216, 0.1);
        }

        .send-btn {
            background: var(--primary-color);
            border: none;
            width: 34px;
            height: 34px;
            border-radius: 4px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: all 0.2s;
            box-shadow: 0 0 10px rgba(0, 180, 216, 0.3);
        }

        .send-btn:hover {
            transform: scale(1.05);
            box-shadow: 0 0 20px rgba(0, 180, 216, 0.6);
            background: var(--accent-color);
        }

        .send-btn svg {
            width: 16px;
            height: 16px;
            fill: #000;
        }

        /* Typing Indicator */
        .typing-indicator {
            display: flex;
            gap: 4px;
            padding: 10px 15px;
            background: rgba(255, 255, 255, 0.05);
            border-radius: 4px;
            align-self: flex-start;
            margin-bottom: 10px;
            display: none;
            margin-left: 20px;
            border: 1px solid var(--glass-border);
        }

        .typing-dot {
            width: 4px;
            height: 4px;
            background: var(--primary-color);
            border-radius: 50%;
            animation: bounce 1.4s infinite ease-in-out both;
        }

        .typing-dot:nth-child(1) { animation-delay: -0.32s; }
        .typing-dot:nth-child(2) { animation-delay: -0.16s; }

        @keyframes bounce {
            0%, 80%, 100% { transform: scale(0); }
            40% { transform: scale(1); }
        }

        /* Logo Styles */
        .bubble-logo {
            width: 20px;
            height: 20px;
            vertical-align: middle;
            margin-left: 5px;
        }

        .header-logo {
            width: 18px;
            height: 18px;
            margin-right: 5px;
            filter: drop-shadow(0 0 5px var(--primary-color));
        }

        /* Shake Animation */
        @keyframes shake {
            0% { transform: translate(1px, 1px) rotate(0deg); }
            10% { transform: translate(-1px, -2px) rotate(-1deg); }
            20% { transform: translate(-3px, 0px) rotate(1deg); }
            30% { transform: translate(3px, 2px) rotate(0deg); }
            40% { transform: translate(1px, -1px) rotate(1deg); }
            50% { transform: translate(-1px, 2px) rotate(-1deg); }
            60% { transform: translate(-3px, 1px) rotate(0deg); }
            70% { transform: translate(3px, 1px) rotate(-1deg); }
            80% { transform: translate(-1px, -1px) rotate(1deg); }
            90% { transform: translate(1px, 2px) rotate(0deg); }
            100% { transform: translate(1px, -2px) rotate(-1deg); }
        }
        
        .shake-effect {
            animation: shake 0.5s;
            animation-iteration-count: 1;
        }

        /* Flashbang Effect */
        .flashbang-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: white;
            z-index: 10000;
            opacity: 0;
            pointer-events: none;
            transition: opacity 2.5s ease-out;
        }
        .flashbang-active {
            opacity: 1;
            transition: none; /* Instant white */
        }

        /* Rank Badge */
        .rank-badge {
            font-size: 0.6em;
            background: rgba(255, 255, 255, 0.1);
            padding: 2px 4px;
            border-radius: 3px;
            margin-left: 5px;
            color: var(--accent-color);
            border: 1px solid var(--accent-color);
            vertical-align: middle;
        }

        /* Chart Container */
        .chart-container {
            width: 100%;
            height: 300px;
            border-radius: 8px;
            overflow: hidden;
            margin-top: 10px;
            border: 1px solid var(--glass-border);
            background: #000;
        }
        
        .chart-frame {
            width: 100%;
            height: 100%;
            border: none;
        }

        /* Mobile Responsive */
        /* Mobile Responsive (Bottom Sheet Style) */
        /* Mobile Responsive (Bottom Sheet Style) */
        @media (max-width: 768px) {
            .widget-container {
                position: fixed !important;
                top: auto !important;
                left: 0 !important;
                width: 100% !important;
                height: auto !important;
                right: 0 !important;
                bottom: 0 !important;
                z-index: 999999;
                pointer-events: none; /* Let clicks pass through to site */
                display: flex;
                flex-direction: column;
                justify-content: flex-end;
                align-items: flex-end;
                padding: 0;
                background: transparent;
            }

            .chat-button {
                position: fixed;
                bottom: 20px;
                right: 20px;
                width: 50px;
                height: 50px;
                pointer-events: auto; /* Re-enable clicks */
                z-index: 1000000;
                box-shadow: 0 4px 20px rgba(0,0,0,0.6);
            }

            .notification-bubble {
                position: fixed !important;
                bottom: 85px !important;
                right: 20px !important;
                margin-bottom: 0 !important;
                z-index: 999999;
                max-width: 200px;
            }

            /* Hide button when chat is open */
            .chat-button.open {
                display: none !important;
            }

            .chat-window {
                position: fixed !important;
                bottom: 0 !important;
                left: 0 !important;
                right: 0 !important;
                width: 100% !important;
                height: 60vh !important;
                max-height: 450px !important;
                min-height: 350px !important;
                border-radius: 16px 16px 0 0 !important;
                margin: 0 !important;
                background: rgba(2, 4, 6, 0.98);
                border: none;
                border-top: 2px solid var(--glass-border);
                transform-origin: bottom center;
                pointer-events: auto; /* Re-enable clicks */
                z-index: 1000001;
                /* Reset desktop transform */
                transform: translateY(100%);
                opacity: 0;
                transition: transform 0.3s cubic-bezier(0.19, 1, 0.22, 1), opacity 0.3s ease;
            }

            .chat-window.active {
                transform: translateY(0) !important;
                opacity: 1 !important;
            }

            .chat-header {
                padding: 8px 12px;
            }

            .header-title {
                font-size: 11px;
            }

            .chat-messages {
                padding: 8px;
                gap: 8px;
            }

            .chat-input-area {
                padding: 8px;
                padding-bottom: max(12px, env(safe-area-inset-bottom));
            }

            /* Show Close Button on Mobile */
            #closeChat {
                display: flex !important;
            }

            /* Better Readability on Mobile */
            .message {
                font-size: 13px;
                padding: 10px 12px;
                max-width: 85%;
            }

            .chat-input {
                font-size: 14px;
                padding: 10px 12px;
            }

            .send-btn {
                width: 36px;
                height: 36px;
            }

            .quick-chips {
                padding: 4px 8px;
                gap: 4px;
            }

            .chip {
                font-size: 8px;
                padding: 4px 6px;
            }

            /* Narrow Screen Optimizations (Galaxy S8+, iPhone SE, etc.) */
            @media (max-width: 380px) {
                .chat-window {
                    height: 55vh !important;
                    max-height: 400px !important;
                }

                .chat-header {
                    padding: 6px 10px !important;
                }

                .header-title {
                    font-size: 10px !important;
                }

                .header-logo {
                    width: 16px !important;
                    height: 16px !important;
                    margin-right: 4px !important;
                }

                .rank-badge {
                    display: none !important; /* Hide rank on very small screens to save space */
                }

                .theme-btn {
                    font-size: 0 !important; /* Hide text */
                    padding: 4px !important;
                    width: 28px !important;
                    height: 28px !important;
                    display: flex !important;
                    align-items: center !important;
                    justify-content: center !important;
                }

                .theme-btn::after {
                    content: '☯'; /* Icon for theme switch */
                    font-size: 14px !important;
                }

                .quick-chips {
                    flex-wrap: nowrap !important;
                    overflow-x: auto !important;
                    justify-content: flex-start !important;
                    padding-bottom: 4px !important;
                    -webkit-overflow-scrolling: touch;
                }

                .chip {
                    flex: 0 0 auto !important; /* Don't shrink */
                    font-size: 9px !important;
                    padding: 5px 8px !important;
                }
                
                /* Hide scrollbar for chips */
                .quick-chips::-webkit-scrollbar {
                    display: none;
                }

                .message {
                    font-size: 12px;
                    padding: 8px 10px;
                }

                .chat-input {
                    font-size: 13px;
                    padding: 8px 10px;
                }
            }
        }
    `;

    // HTML Structure
    const container = document.createElement('div');
    container.className = 'widget-container';
    container.innerHTML = `
        <div class="flashbang-overlay"></div>
        <div class="chat-window">
            <div class="scanlines"></div>
            <div class="chat-header">
                <div class="header-title">
                    <span class="status-dot"></span>
                    <img src="logos/csgo_coinlogo3.png" class="header-logo" alt="CSAI">
                    Agent Rush
                    <span class="rank-badge" id="userRank">Silver I</span>
                </div>
                <div class="header-actions">
                    <button class="icon-btn" id="clearChat" title="Clear Chat">
                        <svg viewBox="0 0 24 24"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"></path></svg>
                    </button>
                    <button class="icon-btn" id="closeChat" title="Close Chat" style="display: none;">
                        <svg viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"></path></svg>
                    </button>
                    <button class="theme-btn" id="themeToggle">SWITCH TEAM</button>
                </div>
            </div>
            <div class="chat-messages">
                <!-- Messages will be loaded here -->
            </div>
            <div class="typing-indicator">
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
            </div>
            <div class="quick-chips">
                <div class="chip">💰 Price?</div>
                <div class="chip">📊 Chart</div>
                <div class="chip">🚀 Roadmap</div>
                <div class="chip">🛒 How to Buy</div>
                <div class="chip">🦄 Uniswap Link</div>
                <div class="chip">🔗 Raydium Link</div>
                <div class="chip">📄 Whitepaper</div>
            </div>
            <div class="chat-input-area">
                <input type="text" class="chat-input" placeholder="Type your command...">
                <button class="send-btn">
                    <svg viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"></path></svg>
                </button>
            </div>
        </div>
        <div class="notification-bubble"> Yo! Agent Rush here! <img src="logos/csgo_coinlogo3.png" class="bubble-logo" alt="AI"></div>
        <button class="chat-button">
            <svg viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"></path></svg>
        </button>
    `;

    // ... (rest of the code)

    // --- GAME LOGIC START ---
    const ranks = [
        "Silver I", "Silver II", "Silver III", "Silver IV", "Silver Elite", "Silver Elite Master",
        "Gold Nova I", "Gold Nova II", "Gold Nova III", "Gold Nova Master",
        "Master Guardian I", "Master Guardian II", "MGE", "DMG",
        "Legendary Eagle", "LEM", "Supreme", "Global Elite"
    ];

    let currentXp = parseInt(localStorage.getItem('csgoai_xp')) || 0;
    let rankIndex = parseInt(localStorage.getItem('csgoai_rank')) || 0;
    const xpPerLevel = 50; // Easy to level up for fun

    function updateRankDisplay() {
        const rankEl = container.querySelector('#userRank');
        if (rankEl) {
            rankEl.textContent = ranks[rankIndex] || "Global Elite";
            // Color change for high ranks
            if (rankIndex >= 13) rankEl.style.borderColor = '#ffd700'; // Gold for high ranks
            else rankEl.style.borderColor = 'var(--accent-color)';
        }
    }

    function addXp(amount) {
        currentXp += amount;
        const nextLevelXp = (rankIndex + 1) * xpPerLevel;

        if (currentXp >= nextLevelXp && rankIndex < ranks.length - 1) {
            rankIndex++;
            currentXp = 0; // Reset XP for next level (or keep accumulating, simpler to reset here)

            // Level Up Notification
            setTimeout(() => {
                const levelUpMsg = `<strong>🏆 RANK UP!</strong><br>You are now <strong>${ranks[rankIndex]}</strong>!`;
                addMessageToUI(levelUpMsg, 'bot');
                playSound();
            }, 1000);
        }

        localStorage.setItem('csgoai_xp', currentXp);
        localStorage.setItem('csgoai_rank', rankIndex);
        updateRankDisplay();
    }

    // Initialize Rank
    updateRankDisplay();
    // --- GAME LOGIC END ---

    shadow.appendChild(style);
    shadow.appendChild(container);

    // Logic
    const chatWindow = shadow.querySelector('.chat-window');
    const chatButton = shadow.querySelector('.chat-button');
    const input = shadow.querySelector('.chat-input');
    const sendBtn = shadow.querySelector('.send-btn');
    const messagesContainer = shadow.querySelector('.chat-messages');
    const typingIndicator = shadow.querySelector('.typing-indicator');
    const themeToggle = shadow.querySelector('#themeToggle');
    const clearChatBtn = shadow.querySelector('#clearChat');
    const closeChatBtn = shadow.querySelector('#closeChat');
    const chips = shadow.querySelectorAll('.chip');
    const notificationBubble = shadow.querySelector('.notification-bubble');

    let isOpen = false;
    let messageHistory = [];
    let isCT = true; // Default CT Theme
    let audioCtx = null;

    // Game State
    let isDefusing = false;
    let bombTimer = null;
    let bombWire = null;

    // Init Audio Context (must be triggered by user interaction)
    function initAudio() {
        if (!audioCtx) {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (audioCtx.state === 'suspended') {
            audioCtx.resume();
        }
    }

    // Play Beep Sound (Pure JS, no file needed)
    function playSound() {
        if (!audioCtx) initAudio();
        if (!audioCtx) return;

        try {
            const oscillator = audioCtx.createOscillator();
            const gainNode = audioCtx.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioCtx.destination);

            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(800, audioCtx.currentTime); // Frequency
            gainNode.gain.setValueAtTime(0.05, audioCtx.currentTime); // Volume
            gainNode.gain.exponentialRampToValueAtTime(0.00001, audioCtx.currentTime + 0.15); // Fade out

            oscillator.start();
            oscillator.stop(audioCtx.currentTime + 0.15);
        } catch (e) {
            console.log("Audio play failed", e);
        }
    }

    // Load History from LocalStorage
    function loadHistory() {
        const saved = localStorage.getItem('csgoai_chat_history');
        if (saved) {
            messageHistory = JSON.parse(saved);
            messageHistory.forEach(msg => {
                // Don't re-type history, just show it
                addMessageToUI(msg.content, msg.role === 'assistant' ? 'bot' : 'user', false);
            });
        } else {
            // Initial Welcome Message
            const welcomeMsg = "<strong>Welcome Agent!</strong> 🕵️‍♂️<br>I am <strong>CSAI</strong>. How can I assist your mission today?";
            addMessageToUI(welcomeMsg, 'bot', false);
            messageHistory.push({ role: 'assistant', content: welcomeMsg });
            saveHistory();
        }
    }

    function saveHistory() {
        localStorage.setItem('csgoai_chat_history', JSON.stringify(messageHistory));
    }

    // Clear History
    clearChatBtn.addEventListener('click', () => {
        localStorage.removeItem('csgoai_chat_history');
        messageHistory = [];
        messagesContainer.innerHTML = '';
        const welcomeMsg = "<strong>Chat Cleared.</strong><br>Ready for new orders, Agent.";
        addMessageToUI(welcomeMsg, 'bot', true);
        messageHistory.push({ role: 'assistant', content: welcomeMsg });
        saveHistory();
    });

    // Markdown Parser (Improved)
    function parseMarkdown(text) {
        if (!text) return '';

        let html = text;

        // 1. Markdown Links: [Label](URL)
        // We process these first to ensure we don't break them when auto-linking raw URLs later.
        html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" style="color: var(--accent-color); text-decoration: underline;">$1</a>');

        // 2. Raw URLs that are NOT inside an anchor tag
        // We look for http/https that is NOT preceded by 'href="' or '">'
        // This regex ensures we don't double-link URLs that were just linked in step 1.
        html = html.replace(/(?<!href="|">)(https?:\/\/[^\s<]+)/g, (match) => {
            return `<a href="${match}" target="_blank" style="color: var(--accent-color); text-decoration: underline;">${match}</a>`;
        });

        // 3. Bold: **text**
        html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');

        // 4. Italic: *text*
        html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');

        // 5. Code: `text`
        html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

        // 6. Newlines
        html = html.replace(/\n/g, '<br>');

        return html;
    }

    // Toggle Theme
    themeToggle.addEventListener('click', () => {
        isCT = !isCT;
        if (isCT) {
            container.classList.remove('theme-t');
            themeToggle.textContent = 'SWITCH TEAM (CT)';
            themeToggle.style.borderColor = '#667eea';
        } else {
            container.classList.add('theme-t');
            themeToggle.textContent = 'SWITCH TEAM (T)';
            themeToggle.style.borderColor = '#ff9900';
        }
    });

    // Close Chat
    if (closeChatBtn) {
        closeChatBtn.addEventListener('click', () => {
            isOpen = false;
            chatWindow.classList.remove('active');
            chatButton.classList.remove('open');
        });
    }

    // Toggle Chat
    chatButton.addEventListener('click', () => {
        isOpen = !isOpen;
        chatWindow.classList.toggle('active', isOpen);
        chatButton.classList.toggle('open', isOpen);
        notificationBubble.classList.remove('show'); // Hide bubble when opened

        if (isOpen) {
            initAudio(); // Initialize audio context on first interaction
            input.focus();
            playSound();
        }
    });

    // Add Message to UI (with optional typing effect)
    function addMessageToUI(text, sender, animate = true) {
        const div = document.createElement('div');
        div.className = `message ${sender}`;
        messagesContainer.appendChild(div);

        const htmlContent = parseMarkdown(text);

        // CRITICAL FIX: If the message contains a link, DISABLE typing animation.
        // The typing animation appends HTML tags incrementally (e.g. <a href...>), 
        // which causes the browser to auto-close them immediately, breaking the link structure.
        if (htmlContent.includes('<a')) {
            animate = false;
        }

        if (sender === 'bot' && animate) {
            // Typing Effect for Bot (Only for text without links)
            let i = 0;
            const typeInterval = setInterval(() => {
                // If we are inside a tag, append the whole tag
                if (htmlContent[i] === '<') {
                    const tagEnd = htmlContent.indexOf('>', i);
                    if (tagEnd !== -1) {
                        div.innerHTML += htmlContent.substring(i, tagEnd + 1);
                        i = tagEnd + 1;
                    } else {
                        div.innerHTML += htmlContent[i];
                        i++;
                    }
                } else {
                    div.innerHTML += htmlContent[i];
                    i++;
                }

                messagesContainer.scrollTop = messagesContainer.scrollHeight;

                if (i >= htmlContent.length) {
                    clearInterval(typeInterval);
                    playSound(); // Sound on completion
                }
            }, 10); // Faster typing
        } else {
            // Instant render for user, history, or MESSAGES WITH LINKS
            div.innerHTML = htmlContent;
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
            if (sender === 'bot' && isOpen) playSound();
        }
    }

    // Send Message
    async function sendMessage(customText = null) {
        const text = customText || input.value.trim();
        if (!text) return;

        // Add user message
        addMessageToUI(text, 'user');
        input.value = '';
        messageHistory.push({ role: 'user', content: text });
        saveHistory();

        // Show typing
        typingIndicator.style.display = 'flex';
        messagesContainer.scrollTop = messagesContainer.scrollHeight;

        const lowerText = text.toLowerCase().trim();

        // --- 💣 DEFUSE MINIGAME LOGIC START ---
        if (isDefusing) {
            clearTimeout(bombTimer);
            isDefusing = false;

            if (lowerText.includes(bombWire)) {
                // WIN
                addMessageToUI(`✅ <strong>BOMB DEFUSED!</strong><br>Counter-Terrorists Win! (+50 XP)`, 'bot');
                messageHistory.push({ role: 'assistant', content: "Bomb Defused! +50 XP" });
                addXp(50);
                playSound();
            } else {
                // LOSE
                const overlay = container.querySelector('.flashbang-overlay');
                overlay.style.background = 'red';
                overlay.classList.add('flashbang-active');
                setTimeout(() => {
                    overlay.classList.remove('flashbang-active');
                    setTimeout(() => overlay.style.background = 'white', 500);
                }, 200);

                addMessageToUI(`💥 <strong>BOOM!</strong><br>Wrong wire! The bomb exploded.`, 'bot');
                messageHistory.push({ role: 'assistant', content: "Bomb Exploded!" });
                playSound();
            }
            saveHistory();
            typingIndicator.style.display = 'none';
            return;
        }

        // Trigger Defuse Game
        if (lowerText === 'defuse' || lowerText === 'bomb' || lowerText === 'bomba') {
            // Only CTs can defuse!
            if (!isCT) {
                addMessageToUI(`❌ <strong>Access Denied!</strong><br>Terrorists plant the bomb, they don't defuse it! Switch to CT side.`, 'bot');
                messageHistory.push({ role: 'assistant', content: "Access Denied: Terrorists cannot defuse." });
                saveHistory();
                typingIndicator.style.display = 'none';
                playSound();
                return;
            }

            isDefusing = true;
            const wires = ['red', 'blue', 'green'];
            bombWire = wires[Math.floor(Math.random() * wires.length)];

            const defuseMsg = `
                ⚠️ <strong>BOMB PLANTED!</strong> ⚠️<br>
                Quick! Cut the correct wire:<br>
                <span style="color: #ff4444">🟥 RED</span> | <span style="color: #4444ff">🟦 BLUE</span> | <span style="color: #44ff44">🟩 GREEN</span><br>
                <em>(Type the color name!)</em>
            `;
            addMessageToUI(defuseMsg, 'bot', false);
            messageHistory.push({ role: 'assistant', content: "Bomb Planted! Cut the wire!" });
            saveHistory();
            typingIndicator.style.display = 'none';
            playSound();

            // 10 Second Timer
            bombTimer = setTimeout(() => {
                if (isDefusing) {
                    isDefusing = false;
                    const overlay = container.querySelector('.flashbang-overlay');
                    overlay.style.background = 'red';
                    overlay.classList.add('flashbang-active');
                    setTimeout(() => {
                        overlay.classList.remove('flashbang-active');
                        setTimeout(() => overlay.style.background = 'white', 500);
                    }, 200);

                    addMessageToUI(`💥 <strong>TIME'S UP!</strong><br>Terrorists Win.`, 'bot');
                    messageHistory.push({ role: 'assistant', content: "Time's up! Bomb Exploded." });
                    saveHistory();
                    playSound();
                }
            }, 10000);
            return;
        }
        // --- 💣 DEFUSE MINIGAME LOGIC END ---

        // 🕵️‍♂️ Easter Egg: sv_cheats 1
        if (lowerText === 'sv_cheats 1') {
            setTimeout(() => {
                const cheatMsg = "<strong>God Mode Activated! 🚀</strong><br>Unlimited power unlocked.";
                addMessageToUI(cheatMsg, 'bot');
                messageHistory.push({ role: 'assistant', content: "God Mode Activated! 🚀" });
                saveHistory();

                // Trigger Shake
                chatWindow.classList.add('shake-effect');
                setTimeout(() => chatWindow.classList.remove('shake-effect'), 500);

                typingIndicator.style.display = 'none';
                playSound();
            }, 600); // Slight delay for realism
            return;
        }

        // 🔫 Easter Egg: rush b
        if (lowerText === 'rush b' || lowerText === 'rush b!') {
            setTimeout(() => {
                // FIX: Use double quotes for href so parseMarkdown ignores it
                const rushMsg = '<strong>Don\'t Stop! Go Go Go! 🔫</strong><br><a href="https://raydium.io/swap/?inputMint=CS1iCxPUextoJYCGhNfKpWaw1odfpxJNZBr6sodfCexB&outputMint=sol" target="_blank" style="color: #00ff00; font-weight: bold;">BUY NOW ON RAYDIUM</a>';
                addMessageToUI(rushMsg, 'bot', false);
                messageHistory.push({ role: 'assistant', content: rushMsg });
                saveHistory();
                typingIndicator.style.display = 'none';
                playSound();
            }, 600);
            return;
        }

        // 🦄 Feature: Uniswap Link
        if (lowerText.includes('uniswap')) {
            setTimeout(() => {
                const uniswapMsg = '<strong>Trade on Uniswap (Ethereum) 🦄</strong><br><a href="https://app.uniswap.org/explore/tokens/ethereum/0x2bab03dcec62324496e000cce2cf4c916d93b289?inputCurrency=NATIVE" target="_blank" style="color: #ff00ff; font-weight: bold;">OPEN UNISWAP</a>';
                addMessageToUI(uniswapMsg, 'bot', false);
                messageHistory.push({ role: 'assistant', content: "Shared Uniswap Link." });
                saveHistory();
                typingIndicator.style.display = 'none';
                playSound();
            }, 600);
            return;
        }

        // 📊 Feature: Live Chart
        if (lowerText.includes('grafik') || lowerText.includes('chart') || lowerText.includes('fiyat')) {
            setTimeout(() => {
                const chartMsg = `
                    <strong>Live Market Data 📊</strong><br>
                    <div class="chart-container" style="height: auto; padding: 15px; text-align: center; background: rgba(0,0,0,0.5);">
                        <p style="margin-bottom: 10px; font-size: 0.9em; color: #ccc;">View real-time price action on DexScreener:</p>
                        <a href="https://dexscreener.com/solana/7tjvhxm2ujdyobx83gtgjbjyhn1gqxvl9mc5qtofns5p" target="_blank" class="theme-btn" style="display: inline-block; width: auto; padding: 8px 20px; text-decoration: none;">
                            📈 Open Live Chart
                        </a>
                    </div>
                `;
                addMessageToUI(chartMsg, 'bot', false);
                messageHistory.push({ role: 'assistant', content: "Shared Live Chart Link." });
                saveHistory();
                typingIndicator.style.display = 'none';
                playSound();
            }, 800);
            return;
        }

        // 💣 Easter Egg: flashbang
        if (lowerText === 'flashbang') {
            const overlay = container.querySelector('.flashbang-overlay');
            overlay.classList.add('flashbang-active');
            playSound(); // Reuse beep or add noise if available

            setTimeout(() => {
                overlay.classList.remove('flashbang-active');
            }, 100); // Start fading out almost immediately

            addMessageToUI("<em>*Tinnitus ringing sound*</em> 😵", 'bot');
            typingIndicator.style.display = 'none';
            return;
        }

        // 📦 Easter Egg: open case
        if (lowerText === 'open case' || lowerText === 'kasa aç' || lowerText === 'case') {
            setTimeout(() => {
                const items = [
                    // Common (Consumer Grade) - Grey #b0c3d9
                    { name: "P250 | Sand Dune", color: "#b0c3d9", rarity: "Consumer Grade" },
                    { name: "MAG-7 | Storm", color: "#b0c3d9", rarity: "Consumer Grade" },
                    { name: "SCAR-20 | Sand Mesh", color: "#b0c3d9", rarity: "Consumer Grade" },
                    { name: "MP9 | Storm", color: "#b0c3d9", rarity: "Consumer Grade" },
                    { name: "Nova | Polar Mesh", color: "#b0c3d9", rarity: "Consumer Grade" },

                    // Uncommon (Industrial Grade) - Light Blue #5e98d9
                    { name: "Glock-18 | Groundwater", color: "#5e98d9", rarity: "Industrial Grade" },
                    { name: "MP7 | Olive Plaid", color: "#5e98d9", rarity: "Industrial Grade" },
                    { name: "USP-S | Forest Leaves", color: "#5e98d9", rarity: "Industrial Grade" },

                    // Rare (Mil-Spec) - Blue #4b69ff
                    { name: "SSG 08 | Abyss", color: "#4b69ff", rarity: "Mil-Spec" },
                    { name: "Glock-18 | Candy Apple", color: "#4b69ff", rarity: "Mil-Spec" },
                    { name: "MAC-10 | Fade", color: "#4b69ff", rarity: "Mil-Spec" },

                    // Mythical (Restricted) - Purple #8847ff
                    { name: "USP-S | Cortex", color: "#8847ff", rarity: "Restricted" },
                    { name: "M4A1-S | Decimator", color: "#8847ff", rarity: "Restricted" },
                    { name: "AK-47 | Redline", color: "#8847ff", rarity: "Restricted" },
                    { name: "AWP | Atheris", color: "#8847ff", rarity: "Restricted" },

                    // Legendary (Classified) - Pink #d32ce6
                    { name: "M4A4 | Neo-Noir", color: "#d32ce6", rarity: "Classified" },
                    { name: "USP-S | Kill Confirmed", color: "#d32ce6", rarity: "Classified" },
                    { name: "AK-47 | Vulcan", color: "#d32ce6", rarity: "Classified" },
                    { name: "Desert Eagle | Printstream", color: "#d32ce6", rarity: "Classified" },

                    // Ancient (Covert) - Red #eb4b4b
                    { name: "AWP | Dragon Lore", color: "#eb4b4b", rarity: "Covert" },
                    { name: "AK-47 | Wild Lotus", color: "#eb4b4b", rarity: "Covert" },
                    { name: "M4A4 | Howl", color: "#eb4b4b", rarity: "Covert" },
                    { name: "AWP | Gungnir", color: "#eb4b4b", rarity: "Covert" },
                    { name: "AK-47 | Gold Arabesque", color: "#eb4b4b", rarity: "Covert" },

                    // Exceedingly Rare (Gold) - Gold #ffd700
                    { name: "★ Karambit | Doppler Ruby", color: "#ffd700", rarity: "Rare Special Item" },
                    { name: "★ Butterfly Knife | Fade", color: "#ffd700", rarity: "Rare Special Item" },
                    { name: "★ M9 Bayonet | Lore", color: "#ffd700", rarity: "Rare Special Item" },
                    { name: "★ Sport Gloves | Pandora's Box", color: "#ffd700", rarity: "Rare Special Item" },
                    { name: "★ AWP | Dragon Lore (Souvenir)", color: "#ffd700", rarity: "Rare Special Item" }





                ];

                // Weighted Random Logic
                let item;
                const roll = Math.random() * 100;

                if (roll < 50) { // 50% Consumer
                    const pool = items.filter(i => i.rarity === "Consumer Grade");
                    item = pool[Math.floor(Math.random() * pool.length)];
                } else if (roll < 75) { // 25% Industrial
                    const pool = items.filter(i => i.rarity === "Industrial Grade");
                    item = pool[Math.floor(Math.random() * pool.length)];
                } else if (roll < 90) { // 15% Mil-Spec
                    const pool = items.filter(i => i.rarity === "Mil-Spec");
                    item = pool[Math.floor(Math.random() * pool.length)];
                } else if (roll < 97) { // 7% Restricted
                    const pool = items.filter(i => i.rarity === "Restricted");
                    item = pool[Math.floor(Math.random() * pool.length)];
                } else if (roll < 99) { // 2% Classified
                    const pool = items.filter(i => i.rarity === "Classified");
                    item = pool[Math.floor(Math.random() * pool.length)];
                } else if (roll < 99.8) { // 0.8% Covert
                    const pool = items.filter(i => i.rarity === "Covert");
                    item = pool[Math.floor(Math.random() * pool.length)];
                } else { // 0.2% Gold (Knife/Gloves)
                    const pool = items.filter(i => i.rarity === "Rare Special Item");
                    item = pool[Math.floor(Math.random() * pool.length)];
                }

                const caseMsg = `
                    <strong>📦 Case Opened!</strong><br>
                    You found: <span style="color: ${item.color}; font-weight: bold; text-shadow: 0 0 5px ${item.color};">${item.name}</span><br>
                    <span style="font-size: 0.8em; color: #888;">(${item.rarity})</span>
                `;
                addMessageToUI(caseMsg, 'bot', false);
                messageHistory.push({ role: 'assistant', content: `Opened case: ${item.name}` });
                saveHistory();
                typingIndicator.style.display = 'none';
                playSound();
            }, 1000); // Suspense delay
            return;
        }

        // Add XP for every user message
        addXp(10);

        try {
            const WORKER_URL = 'https://csgoai-chatbot.csgoai-official.workers.dev';

            const response = await fetch(WORKER_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ messages: messageHistory })
            });

            const data = await response.json();

            typingIndicator.style.display = 'none';

            let reply = "";
            if (data.response) {
                reply = data.response;
            } else if (data.choices && data.choices[0]) {
                reply = data.choices[0].message.content;
            } else if (data.error) {
                reply = "Error: " + data.error;
            } else {
                reply = "Error: Could not get response.";
            }

            addMessageToUI(reply, 'bot');
            messageHistory.push({ role: 'assistant', content: reply });
            saveHistory();

        } catch (error) {
            console.error(error);
            typingIndicator.style.display = 'none';
            addMessageToUI("Sorry, connection lost. Retrying...", 'bot');
        }
    }

    // Event Listeners
    sendBtn.addEventListener('click', () => sendMessage());
    input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendMessage();
    });

    // Chip Click Handlers
    chips.forEach(chip => {
        chip.addEventListener('click', () => {
            sendMessage(chip.textContent);
        });
    });

    // Init
    loadHistory();

    // Show widget after Loading Screen (Sync with index.html loader)
    window.addEventListener('load', () => {
        setTimeout(() => {
            container.classList.add('visible');
        }, 3000); // 2000ms load + 500ms fade + 500ms buffer
    });

    // Show notification after 8 seconds
    setTimeout(() => {
        if (!isOpen) {
            notificationBubble.classList.add('show');
            playSound();
        }
    }, 8000);

})();
