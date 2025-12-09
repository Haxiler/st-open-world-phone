(function () {
    const SETTING_KEY = "open_world_phone_data";
    
    // 表情包字典 (请保留你之前那个 53 个表情的完整列表，这里只写几个示例占位)
    const EMOJI_DB = [
        { label: "打招呼", url: "https://sharkpan.xyz/f/LgwT7/AC229A80203166B292155ADA057DE423_0.gif" },
        { label: "开心", url: "https://sharkpan.xyz/f/aVwtY/0CBEE9105C7A98E0E6162A79CCD09EFA_0.gif" },
        // ... (请把你的完整列表粘贴回来) ...
    ];

    const State = {
        contacts: {}, 
        currentChat: null,
        isOpen: false,
        isDragging: false,
        showEmoji: false,
        lastProcessedMsgId: -1,
        userName: "User" // 默认用户名
    };

    function init() {
        console.log("[OW Phone] Init v2.1 - Auto Username Detect");
        loadData();
        
        const layout = `
        <div id="ow-phone-toggle" title="打开手机">
            💬<span id="ow-main-badge" class="ow-badge" style="display:none">0</span>
        </div>
        <div id="ow-phone-container" class="ow-hidden">
            <div id="ow-phone-header">
                <div class="ow-header-icon" id="ow-back-btn" style="display:none">❮</div>
                <div id="ow-header-title">通讯录</div>
                <div class="ow-header-icon" id="ow-add-btn" title="添加好友">➕</div>
                <div class="ow-header-icon" id="ow-close-btn" title="关闭">✖</div>
            </div>
            <div id="ow-phone-body"></div>
            <div id="ow-chat-footer" style="display:none">
                <div id="ow-input-row">
                    <input id="ow-input" placeholder="输入信息..." autocomplete="off">
                    <div class="ow-footer-icon" id="ow-emoji-btn">☺</div>
                    <button id="ow-send-btn">发送</button>
                </div>
                <div id="ow-emoji-panel" style="display:none"></div>
            </div>
        </div>
        `;
        $('body').append(layout);

        renderEmojiPanel();
        bindEvents();
        
        const chatObserver = new MutationObserver(() => {
            setTimeout(processRawChatData, 100);
        });
        
        const chatLog = document.getElementById('chat');
        if (chatLog) chatObserver.observe(chatLog, { childList: true, subtree: true });
        
        renderContactList();
    }

    function processRawChatData() {
        if (!window.SillyTavern || !window.SillyTavern.getContext) return;
        
        const context = window.SillyTavern.getContext();
        
        // === 关键修复：动态获取你的名字 ===
        // 酒馆里你的名字可能存在 context.name 或 context.user_name 里
        if (context.name) State.userName = context.name;
        else if (context.user_name) State.userName = context.user_name;
        
        if (!context.chat || context.chat.length === 0) return;

        const lastMsgObj = context.chat[context.chat.length - 1];
        const currentMsgId = context.chat.length; 
        
        if (State.lastProcessedMsgId === currentMsgId) return;
        State.lastProcessedMsgId = currentMsgId;

        const rawText = lastMsgObj.mes; 
        parseCommands(rawText);
    }

    function parseCommands(text) {
        // 1. 加好友
        const addRegex = /\[ADD_CONTACT:\s*(.+?)\]/g;
        let addMatch;
        while ((addMatch = addRegex.exec(text)) !== null) {
            const name = addMatch[1].trim();
            if (!State.contacts[name]) {
                State.contacts[name] = { messages: [], unread: 0, color: getRandomColor() };
                saveData();
                toastr.success(`📱 自动添加好友: ${name}`);
                if(State.isOpen && !State.currentChat) renderContactList();
            }
        }

        // 2. 短信解析
        const smsRegex = /\[SMS:\s*(.+?)\s*->\s*(.+?)\s*\|\s*(.+?)\]/g;
        let smsMatch;
        
        while ((smsMatch = smsRegex.exec(text)) !== null) {
            let sender = smsMatch[1].trim();
            let receiver = smsMatch[2].trim();
            let content = smsMatch[3].trim();

            // === 核心判断升级：使用动态获取的 State.userName ===
            // 只要发送者等于 "短昼" (State.userName)，就认定是用户发的
            const isSenderUser = (
                sender === State.userName || 
                sender === '我' || 
                sender.toLowerCase() === 'user' || 
                sender === 'User' || 
                sender === '{{user}}'
            );
            
            const isReceiverUser = (
                receiver === State.userName || 
                receiver === '我' || 
                receiver.toLowerCase() === 'user' || 
                receiver === 'User' || 
                receiver === '{{user}}'
            );

            // 1. 别人发给我 (显示在左边)
            if (!isSenderUser && isReceiverUser) {
                content = parseEmojiContent(content);
                addMessageLocal(sender, content, 'recv');
            }
            
            // 2. 我发给别人 (显示在右边)
            // 即使是 AI 代发的 [SMS: 短昼->魏德...]，也会因为 sender==="短昼" 而进入这里
            else if (isSenderUser && !isReceiverUser) {
                content = parseEmojiContent(content);
                addMessageLocal(receiver, content, 'sent');
            }
            
            // 3. (可选) 如果你以后想看 NPC 互聊，可以在这里加 else
        }
    }

    function parseEmojiContent(text) {
        const emojiMatch = text.match(/\[表情:\s*(.+?)\]/);
        if (emojiMatch) {
            const label = emojiMatch[1].trim();
            const found = EMOJI_DB.find(e => e.label === label);
            if (found) return `<img src="${found.url}" class="ow-msg-img">`;
        }
        return text;
    }

    function handleUserSend() {
        const input = document.getElementById('ow-input');
        const text = input.value.trim();
        const target = State.currentChat; 

        if (!text || !target) return;

        addMessageLocal(target, text, 'sent');
        input.value = '';

        // 构造指令 (这里依然用 {{user}} 占位符最稳妥，因为酒馆发送时会自动替换成你的名字)
        const command = `\n[SMS: {{user}}->${target} | ${text}]`;
        appendToMainInput(command);
    }

    function sendEmoji(item) {
        const target = State.currentChat;
        if (!target) return;

        const imgHtml = `<img src="${item.url}" class="ow-msg-img">`;
        addMessageLocal(target, imgHtml, 'sent');
        $('#ow-emoji-panel').hide();

        const command = `\n[SMS: {{user}}->${target} | [表情: ${item.label}]]`;
        appendToMainInput(command);
    }

    function appendToMainInput(text) {
        const textarea = document.getElementById('send_textarea');
        if (!textarea) return;
        let currentVal = textarea.value;
        if (currentVal.length > 0 && !currentVal.endsWith('\n')) currentVal += '\n';
        textarea.value = currentVal + text;
        textarea.dispatchEvent(new Event('input', { bubbles: true }));
        textarea.focus();
        toastr.info(`短信已填入，请发送`);
    }
    
    // --- 删除消息功能 (v1.4新增的，这里保留) ---
    function deleteMessage(contactName, index) {
        if (!State.contacts[contactName]) return;
        State.contacts[contactName].messages.splice(index, 1);
        saveData();
        renderChat(contactName);
        toastr.success("消息已删除");
    }

    function addMessageLocal(name, content, type) {
        if (!State.contacts[name]) {
            State.contacts[name] = { messages: [], unread: 0, color: getRandomColor() };
        }
        
        const msgs = State.contacts[name].messages;
        const lastMsg = msgs[msgs.length - 1];

        // 2秒防重
        if (lastMsg && lastMsg.content === content && lastMsg.type === type) {
            if (Date.now() - lastMsg.time < 2000) return;
        }

        msgs.push({ type: type, content: content, time: Date.now() });

        if (type === 'recv' && State.currentChat !== name) {
            State.contacts[name].unread++;
        }
        
        saveData();
        updateMainBadge();
        
        if (State.isOpen) {
            if (State.currentChat === name) renderChat(name);
            else if (!State.currentChat) renderContactList();
        }
    }

    // === UI 渲染函数 (复用) ===
    function bindEvents() {
        $('#ow-phone-toggle').click(() => togglePhone(true));
        $('#ow-close-btn').click(() => togglePhone(false));
        $('#ow-back-btn').click(() => { renderContactList(); });
        $('#ow-add-btn').click(() => {
            const name = prompt("【添加好友】请输入对方的名字：");
            if (name && name.trim()) {
                const cleanName = name.trim();
                if (!State.contacts[cleanName]) {
                    State.contacts[cleanName] = { messages: [], unread: 0, color: getRandomColor() };
                    saveData();
                }
                renderChat(cleanName);
            }
        });
        $('#ow-send-btn').click(handleUserSend);
        $('#ow-input').keypress((e) => { if(e.key === 'Enter') handleUserSend(); });
        $('#ow-emoji-btn').click(() => { $('#ow-emoji-panel').slideToggle(150); });

        const header = document.getElementById('ow-phone-header');
        const container = document.getElementById('ow-phone-container');
        let offset = {x:0, y:0};
        header.onmousedown = (e) => {
            if (e.target.classList.contains('ow-header-icon')) return;
            State.isDragging = true;
            offset.x = e.clientX - container.offsetLeft;
            offset.y = e.clientY - container.offsetTop;
            header.style.cursor = 'grabbing';
        };
        document.onmouseup = () => { State.isDragging = false; header.style.cursor = 'grab'; };
        document.onmousemove = (e) => {
            if(!State.isDragging) return;
            e.preventDefault();
            container.style.left = (e.clientX - offset.x) + 'px';
            container.style.top = (e.clientY - offset.y) + 'px';
            container.style.bottom = 'auto';
            container.style.right = 'auto';
        };
    }

    function togglePhone(show) {
        State.isOpen = show;
        if (show) {
            $('#ow-phone-container').removeClass('ow-hidden');
            $('#ow-phone-toggle').hide();
            if (State.currentChat) renderChat(State.currentChat);
            else renderContactList();
        } else {
            $('#ow-phone-container').addClass('ow-hidden');
            $('#ow-phone-toggle').show();
        }
        updateMainBadge();
    }

    function renderContactList() {
        State.currentChat = null;
        $('#ow-header-title').text("通讯录");
        $('#ow-back-btn').hide();
        $('#ow-add-btn').show(); 
        $('#ow-close-btn').show();
        $('#ow-chat-footer').hide();
        $('#ow-emoji-panel').hide();
        
        const body = $('#ow-phone-body');
        body.empty();
        const names = Object.keys(State.contacts);
        if (names.length === 0) {
            body.html(`<div class="ow-empty-state"><div style="font-size:40px; margin-bottom:10px;">📭</div>暂无联系人<br>点击右上角 ➕ 添加好友</div>`);
            return;
        }
        names.forEach(name => {
            const info = State.contacts[name];
            const lastMsg = info.messages[info.messages.length - 1];
            let preview = lastMsg ? lastMsg.content : "暂无消息";
            if (preview.includes('<img')) preview = '[图片]';
            const item = $(`
                <div class="ow-contact-item">
                    <div class="ow-avatar" style="background:${info.color || '#555'}">
                        ${name[0].toUpperCase()}
                        ${info.unread > 0 ? `<div class="ow-badge">${info.unread}</div>` : ''}
                    </div>
                    <div class="ow-info">
                        <div class="ow-name">${name}</div>
                        <div class="ow-preview">${preview}</div>
                    </div>
                </div>
            `);
            item.click(() => renderChat(name));
            // 右键删除联系人
            item.on('contextmenu', (e) => {
                e.preventDefault();
                if(confirm(`确定要删除联系人 ${name} 吗？`)) {
                    delete State.contacts[name];
                    saveData();
                    renderContactList();
                }
            });
            body.append(item);
        });
    }

    function renderChat(name) {
        State.currentChat = name;
        if(State.contacts[name]) State.contacts[name].unread = 0;
        updateMainBadge();
        saveData();
        $('#ow-header-title').text(name);
        $('#ow-back-btn').show(); 
        $('#ow-add-btn').hide();  
        $('#ow-chat-footer').show();
        $('#ow-emoji-panel').hide();
        const body = $('#ow-phone-body');
        body.empty();
        
        const view = $('<div class="ow-chat-view"></div>');
        const msgs = State.contacts[name]?.messages || [];
        
        msgs.forEach((msg, index) => {
            const isMe = msg.type === 'sent';
            const div = $(`<div class="ow-msg ${isMe ? 'ow-msg-right' : 'ow-msg-left'}">${msg.content}</div>`);
            // 右键删除消息
            div.on('contextmenu', (e) => {
                e.preventDefault();
                if(confirm("删除这条消息？(仅本地)")) {
                    deleteMessage(name, index);
                }
            });
            view.append(div);
        });
        body.append(view);
        body[0].scrollTop = body[0].scrollHeight;
    }

    function renderEmojiPanel() {
        const panel = $('#ow-emoji-panel');
        panel.empty();
        EMOJI_DB.forEach(item => {
            const img = $(`<img src="${item.url}" class="ow-emoji-item" title="${item.label}">`);
            img.click(() => sendEmoji(item)); 
            panel.append(img);
        });
    }

    function updateMainBadge() {
        let total = 0;
        Object.values(State.contacts).forEach(c => total += (c.unread || 0));
        const badge = $('#ow-main-badge');
        if (total > 0) badge.text(total).show();
        else badge.hide();
    }

    function getRandomColor() {
        const colors = ['#f56a00', '#7265e6', '#ffbf00', '#00a2ae', '#1890ff', '#52c41a'];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    function saveData() { localStorage.setItem(SETTING_KEY, JSON.stringify(State.contacts)); }
    function loadData() {
        const raw = localStorage.getItem(SETTING_KEY);
        if(raw) State.contacts = JSON.parse(raw);
    }

    $(document).ready(() => setTimeout(init, 500));
})();
