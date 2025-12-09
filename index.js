(function () {
    const STORAGE_PREFIX = "ow_phone_v3_";
    
    // 异步加载的表情包容器
    let EMOJI_DB = []; 
    // 用于去重，记录最后一次处理的消息文本或ID
    let lastProcessedContent = "";

    const State = {
        contacts: {}, 
        currentChat: null,
        isOpen: false,
        isDragging: false,
        userName: "User",
        currentChatFileId: null,
    };

    function init() {
        console.log("[OW Phone] Init v4.0 - Immersion Mode (Data Stream)");
        
        // 1. 加载表情包
        $.getJSON('/extensions/open_world_phone/emojis.json', function(data) {
            console.log("[OW Phone] 表情包加载成功");
            EMOJI_DB = data;
            if ($('#ow-emoji-panel').is(':visible')) renderEmojiPanel();
        }).fail(function() {
            console.error("[OW Phone] 表情包加载失败，请检查路径");
        });

        // 2. 初始化环境
        updateContextInfo();
        
        // 3. 注入 UI (保持不变)
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
        if ($('#ow-phone-container').length === 0) {
            $('body').append(layout);
            bindEvents();
        }

        // 4. 【核心修改】监听系统事件，而非 DOM 变化
        // 这样即使正则隐藏了文本，我们也能从 eventSource 或 context 中读到原始数据
        if (window.eventSource) {
            // 当 AI 生成完毕时触发
            window.eventSource.on('generation_ended', function() {
                console.log("[OW Phone] 捕捉到生成结束事件，正在扫描后台数据...");
                checkLatestMessage();
            });
            
            // 当切换聊天/群组时触发
            window.eventSource.on('chat_id_changed', function() {
                updateContextInfo();
            });
        } else {
            console.error("[OW Phone] 致命错误：未检测到 window.eventSource，插件可能无法正常工作。");
        }
        
        renderContactList();
    }

    // === 新的核心读取逻辑 ===
    function checkLatestMessage() {
        if (!window.SillyTavern || !window.SillyTavern.getContext) return;
        
        const context = window.SillyTavern.getContext();
        // 获取聊天记录数组
        const chat = context.chat;
        
        if (chat && chat.length > 0) {
            // 获取最新的一条消息
            const lastMsg = chat[chat.length - 1];
            
            // 获取原始文本 (Raw Text)，这里不会受 Regex Script (Markdown Only) 的影响
            const rawContent = lastMsg.mes; 
            
            // 简单去重，防止重复触发
            if (rawContent && rawContent !== lastProcessedContent) {
                lastProcessedContent = rawContent;
                
                // 只有包含协议头才解析
                if (rawContent.includes('<msg>')) {
                    parseCommand(rawContent);
                }
            }
        }
    }

    // === 其他逻辑保持不变 ===

    function updateContextInfo() {
        if (!window.SillyTavern || !window.SillyTavern.getContext) return;
        const context = window.SillyTavern.getContext();
        if (context.name) State.userName = context.name;
        else if (context.user_name) State.userName = context.user_name;

        const newFileId = context.chatId || context.characterId;
        if (newFileId && newFileId !== State.currentChatFileId) {
            State.currentChatFileId = newFileId;
            State.contacts = {}; 
            loadData(); 
            renderContactList();
        }
    }

    function parseCommand(text) {
        if (!text) return;
        const decodedText = text.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
        // 使用全局匹配
        const msgRegex = /<msg>(.+?)\|(.+?)\|(.+?)\|(.+?)<\/msg>/g;
        let match;
        
        while ((match = msgRegex.exec(decodedText)) !== null) {
            let sender = match[1].trim();
            let receiver = match[2].trim();
            let content = match[3].trim();
            let timeStr = match[4].trim();

            console.log(`[OW Phone] 解析指令: ${sender} -> ${receiver}`);

            if (sender.toLowerCase() === 'system' && content.startsWith('ADD:')) {
                const newContactName = content.replace('ADD:', '').trim();
                if (!State.contacts[newContactName]) {
                    State.contacts[newContactName] = { messages: [], unread: 0, color: getRandomColor() };
                }
                saveData(); // 即使已存在也保存一下，防止异常
                toastr.success(`📱 自动添加好友: ${newContactName}`);
                if(State.isOpen && !State.currentChat) renderContactList();
                continue;
            }

            const isSenderUser = checkIsUser(sender);
            const isReceiverUser = checkIsUser(receiver);
            content = parseEmojiContent(content);

            if (!isSenderUser && isReceiverUser) {
                if (!State.contacts[sender]) {
                    State.contacts[sender] = { messages: [], unread: 0, color: getRandomColor() };
                    saveData();
                }
                addMessageLocal(sender, content, 'recv', timeStr);
            }
            else if (isSenderUser && !isReceiverUser) {
                if (!State.contacts[receiver]) {
                    State.contacts[receiver] = { messages: [], unread: 0, color: getRandomColor() };
                    saveData();
                }
                addMessageLocal(receiver, content, 'sent', timeStr);
            }
        }
    }

    function checkIsUser(name) {
        return (name === State.userName || name === '我' || name.toLowerCase() === 'user' || name === 'User' || name === '{{user}}');
    }

    function parseEmojiContent(text) {
        const bqbMatch = text.match(/\[(?:bqb-|表情:)\s*(.+?)\]/);
        if (bqbMatch) {
            const label = bqbMatch[1].trim();
            const found = EMOJI_DB.find(e => e.label === label);
            if (found) return `<img src="${found.url}" class="ow-msg-img">`;
            return `[表情: ${label}]`;
        }
        return text;
    }

    function handleUserSend() {
        const input = document.getElementById('ow-input');
        const text = input.value.trim();
        const target = State.currentChat; 
        if (!text || !target) return;

        const now = new Date();
        const timeStr = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;

        addMessageLocal(target, text, 'sent', timeStr);
        input.value = '';
        const command = `\n<msg>{{user}}|${target}|${text}|${timeStr}</msg>`;
        appendToMainInput(command);
    }

    function sendEmoji(item) {
        const target = State.currentChat;
        if (!target) return;
        const now = new Date();
        const timeStr = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
        const imgHtml = `<img src="${item.url}" class="ow-msg-img">`;
        addMessageLocal(target, imgHtml, 'sent', timeStr);
        $('#ow-emoji-panel').hide();
        const command = `\n<msg>{{user}}|${target}|[bqb-${item.label}]|${timeStr}</msg>`;
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
    }

    function addMessageLocal(name, content, type, timeStr) {
        if (!State.contacts[name]) {
            State.contacts[name] = { messages: [], unread: 0, color: getRandomColor() };
        }
        
        const msgs = State.contacts[name].messages;
        const lastMsg = msgs[msgs.length - 1];

        // 3秒去重保护 (防止事件重复触发导致消息双倍)
        if (lastMsg && lastMsg.content === content && lastMsg.type === type) {
            if (Date.now() - (lastMsg.realTime || 0) < 3000) return;
        }

        msgs.push({ 
            type: type, 
            content: content, 
            displayTime: timeStr || "刚刚",
            realTime: Date.now() 
        });

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

    function deleteMessage(contactName, index) {
        if (!State.contacts[contactName]) return;
        State.contacts[contactName].messages.splice(index, 1);
        saveData();
        renderChat(contactName);
        toastr.success("消息已删除");
    }

    function saveData() { 
        if (State.currentChatFileId) {
            localStorage.setItem(STORAGE_PREFIX + State.currentChatFileId, JSON.stringify(State.contacts));
        }
    }
    
    function loadData() {
        State.contacts = {}; 
        if (State.currentChatFileId) {
            const raw = localStorage.getItem(STORAGE_PREFIX + State.currentChatFileId);
            if(raw) {
                try {
                    State.contacts = JSON.parse(raw);
                    console.log(`[OW Phone] 已加载存档数据: ${State.currentChatFileId}`);
                } catch(e) {
                    console.error("数据解析失败", e);
                }
            }
        }
        updateMainBadge();
    }

    function bindEvents() {
        $('#ow-phone-toggle').click(() => togglePhone(true));
        $('#ow-close-btn').click(() => togglePhone(false));
        $('#ow-back-btn').click(() => { renderContactList(); });
        $('#ow-add-btn').click(() => {
            const name = prompt("添加好友：");
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
        let view = body.find(`.ow-chat-view[data-chat-id="${name}"]`);
        const msgs = State.contacts[name]?.messages || [];
        
        if (view.length === 0) {
            body.empty();
            view = $(`<div class="ow-chat-view" data-chat-id="${name}"></div>`);
            body.append(view);
            msgs.forEach((msg, index) => {
                appendMsgToView(view, msg, name, index);
            });
            body[0].scrollTop = body[0].scrollHeight;
        } else {
            const currentCount = view.children().length;
            const targetCount = msgs.length;

            if (targetCount > currentCount) {
                for (let i = currentCount; i < targetCount; i++) {
                    appendMsgToView(view, msgs[i], name, i);
                }
                body.animate({ scrollTop: body[0].scrollHeight }, 300);
            } else if (targetCount < currentCount) {
                body.empty();
                renderChat(name); 
                return;
            }
        }
    }

    function appendMsgToView(viewContainer, msg, contactName, index) {
        const isMe = msg.type === 'sent';
        const div = $(`
            <div class="ow-msg-wrapper" style="display:flex; flex-direction:column; align-items:${isMe?'flex-end':'flex-start'};">
                <div class="ow-msg ${isMe ? 'ow-msg-right' : 'ow-msg-left'}">${msg.content}</div>
                <div style="font-size:10px; color:#888; margin-top:2px;">${msg.displayTime || ''}</div>
            </div>
        `);
        div.find('.ow-msg').on('contextmenu', (e) => {
            e.preventDefault();
            if(confirm("删除这条消息？")) deleteMessage(contactName, index);
        });
        viewContainer.append(div);
    }

    function renderEmojiPanel() {
        const panel = $('#ow-emoji-panel');
        panel.empty();
        if (EMOJI_DB.length === 0) {
            panel.html('<div style="color:#aaa; text-align:center; padding:20px;">加载中...</div>');
            return;
        }
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

    $(document).ready(() => setTimeout(init, 500));
})();
