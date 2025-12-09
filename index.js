(function () {
    const SETTING_KEY = "open_world_phone_data";
    
    // === 表情包字典 ===
    // 柏柏的格式通常是 [bqb-关键词]，所以我们这就适配这个
    const EMOJI_DB = [
        { label: "打招呼", url: "https://sharkpan.xyz/f/LgwT7/AC229A80203166B292155ADA057DE423_0.gif" },
        { label: "开心", url: "https://sharkpan.xyz/f/aVwtY/0CBEE9105C7A98E0E6162A79CCD09EFA_0.gif" },
        { label: "顶嘴", url: "https://sharkpan.xyz/f/vVBtL/mmexport1737057690899.png" },
        { label: "免礼", url: "https://sharkpan.xyz/f/pO6uQ/mmexport1737057701883.png" },
        { label: "走吧", url: "https://sharkpan.xyz/f/1vAc2/mmexport1737057678306.png" },
        { label: "满意", url: "https://sharkpan.xyz/f/e8KUw/mmexport1737057664689.png" },
        { label: "揍你", url: "https://sharkpan.xyz/f/oJ1i4/mmexport1737057862640.gif" },
        { label: "坏蛋", url: "https://sharkpan.xyz/f/8r2Sj/mmexport1737057726579.png" },
        { label: "关心", url: "https://sharkpan.xyz/f/Gvmil/mmexport1737057801285.gif" },
        { label: "撞飞", url: "https://sharkpan.xyz/f/zMZu5/mmexport1737057848709.gif" },
        { label: "爱心", url: "https://sharkpan.xyz/f/53nhj/345FFC998474F46C1A40B1567335DA03_0.gif" },
        { label: "飞奔", url: "https://sharkpan.xyz/f/kDOi6/0A231BF0BFAB3C2B243F9749B64F7444_0.gif" },
        { label: "乖巧", url: "https://files.catbox.moe/4dnzcq.png" },
        { label: "害羞", url: "https://files.catbox.moe/ssgpgy.jpg" },
        { label: "哭哭", url: "https://files.catbox.moe/rw1cfk.png" },
        { label: "委屈", url: "https://sharkpan.xyz/f/gVySw/D90D0B53802301FCDB1F0718DEB08C79_0.gif" },
        { label: "生气", url: "https://files.catbox.moe/si6f0k.png" },
        { label: "不爽", url: "https://files.catbox.moe/amelbv.png" },
        { label: "无语", url: "https://files.catbox.moe/wgkwjh.png" },
        { label: "疑惑", url: "https://files.catbox.moe/gofdox.jpg" },
        { label: "震惊", url: "https://files.catbox.moe/q7683x.png" },
        { label: "尴尬", url: "https://files.catbox.moe/8eaawd.png" },
        { label: "偷看", url: "https://files.catbox.moe/72wkme.png" },
        { label: "发疯", url: "https://files.catbox.moe/8cqr43.jpg" },
        { label: "已老实", url: "https://files.catbox.moe/6eyzlg.png" },
        { label: "晚安", url: "https://files.catbox.moe/duzx7n.png" },
        { label: "躺平", url: "https://files.catbox.moe/cq6ipd.png" },
        { label: "吃瓜", url: "https://files.catbox.moe/428w1c.png" },
        { label: "比中指", url: "https://files.catbox.moe/umpgjb.jpg" },
        { label: "投降", url: "https://files.catbox.moe/f4ogyw.png" }
    ];

    const State = {
        contacts: {}, 
        currentChat: null,
        isOpen: false,
        isDragging: false,
        showEmoji: false,
        lastProcessedMsgId: -1,
        userName: "User"
    };

    function init() {
        console.log("[OW Phone] Init v3.0 - Baibai Protocol (<msg>)");
        loadData();
        
        // UI 结构保持不变
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
        
        // 监听原始数据
        const chatObserver = new MutationObserver(() => {
            setTimeout(processRawChatData, 100);
        });
        const chatLog = document.getElementById('chat');
        if (chatLog) chatObserver.observe(chatLog, { childList: true, subtree: true });
        
        renderContactList();
    }

    // === 核心逻辑：读取 Raw Context ===
    function processRawChatData() {
        if (!window.SillyTavern || !window.SillyTavern.getContext) return;
        
        const context = window.SillyTavern.getContext();
        
        // 动态获取用户名
        if (context.name) State.userName = context.name;
        else if (context.user_name) State.userName = context.user_name;
        
        if (!context.chat || context.chat.length === 0) return;

        const lastMsgObj = context.chat[context.chat.length - 1];
        const currentMsgId = context.chat.length; 
        
        // 简单防抖
        if (State.lastProcessedMsgId === currentMsgId) return;
        State.lastProcessedMsgId = currentMsgId;

        parseCommands(lastMsgObj.mes);
    }

    // === 协议解析：适配 <msg> 格式 ===
    function parseCommands(text) {
        // 1. 自动加好友 [ADD_CONTACT: 名字] (这个指令太好用了，我们保留它辅助)
        // 或者我们兼容一下柏柏的加好友逻辑？柏柏是自动识别 sender 的。
        // 为了方便，我们保留 [ADD_CONTACT] 作为显式加好友手段。
        const addRegex = /\[ADD_CONTACT:\s*(.+?)\]/g;
        let addMatch;
        while ((addMatch = addRegex.exec(text)) !== null) {
            const name = addMatch[1].trim();
            if (!State.contacts[name]) {
                State.contacts[name] = { messages: [], unread: 0, color: getRandomColor() };
                saveData();
                toastr.success(`📱 自动添加好友: ${name}`);
            }
        }

        // 2. 柏柏消息解析
        // 格式: <msg>发送人|接收人|内容|时间</msg>
        // 注意：正则需要匹配换行符，使用 [\s\S] 或者 . 配合 s 修饰符(但JS不支持s修饰符直到ES2018)
        // 最稳妥写法: /<msg>(.+?)\|(.+?)\|(.+?)\|(.+?)<\/msg>/g
        const msgRegex = /<msg>(.+?)\|(.+?)\|(.+?)\|(.+?)<\/msg>/g;
        let match;
        
        while ((match = msgRegex.exec(text)) !== null) {
            let sender = match[1].trim();
            let receiver = match[2].trim();
            let content = match[3].trim();
            let timeStr = match[4].trim(); // 柏柏格式带时间

            // 归一化 "我"
            const isSenderUser = checkIsUser(sender);
            const isReceiverUser = checkIsUser(receiver);

            // 处理表情包 [bqb-关键词]
            content = parseEmojiContent(content);

            // 1. 别人发给我
            if (!isSenderUser && isReceiverUser) {
                // 如果是新面孔，自动加好友 (柏柏逻辑)
                if (!State.contacts[sender]) {
                    State.contacts[sender] = { messages: [], unread: 0, color: getRandomColor() };
                    saveData();
                }
                addMessageLocal(sender, content, 'recv', timeStr);
            }
            
            // 2. 我发给别人
            else if (isSenderUser && !isReceiverUser) {
                addMessageLocal(receiver, content, 'sent', timeStr);
            }
        }
    }

    function checkIsUser(name) {
        return (name === State.userName || name === '我' || name.toLowerCase() === 'user' || name === 'User' || name === '{{user}}');
    }

    function parseEmojiContent(text) {
        // 柏柏格式：[bqb-关键词]
        const bqbRegex = /\[bqb-(.+?)\]/;
        const match = text.match(bqbRegex);
        if (match) {
            const label = match[1].trim();
            const found = EMOJI_DB.find(e => e.label === label);
            if (found) return `<img src="${found.url}" class="ow-msg-img">`;
            // 如果没找到，显示个破碎图标或者原文
            return `[表情: ${label}]`;
        }
        return text;
    }

    // === 发送逻辑：构造 <msg> 标签 ===
    function handleUserSend() {
        const input = document.getElementById('ow-input');
        const text = input.value.trim();
        const target = State.currentChat; 

        if (!text || !target) return;

        // 1. 获取当前时间 HH:mm
        const now = new Date();
        const timeStr = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;

        // 2. 本地上屏
        addMessageLocal(target, text, 'sent', timeStr);
        input.value = '';

        // 3. 构造柏柏格式指令
        // <msg>User|Target|Content|Time</msg>
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

        // 构造表情指令
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
        toastr.info(`短信指令已填入`);
    }

    // === UI渲染与数据 (复用) ===
    // 注意：addMessageLocal 增加了一个 time 参数
    function addMessageLocal(name, content, type, timeStr) {
        if (!State.contacts[name]) {
            State.contacts[name] = { messages: [], unread: 0, color: getRandomColor() };
        }
        
        const msgs = State.contacts[name].messages;
        const lastMsg = msgs[msgs.length - 1];

        // 防重
        if (lastMsg && lastMsg.content === content && lastMsg.type === type) {
            // 内容相同且时间非常接近（防止刷新重复添加）
            if (Date.now() - lastMsg.realTime < 3000) return;
        }

        msgs.push({ 
            type: type, 
            content: content, 
            displayTime: timeStr || "刚刚",
            realTime: Date.now() // 用于排序和去重
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

    // ... (bindEvents, togglePhone, renderContactList, renderEmojiPanel, updateMainBadge, getRandomColor, saveData, loadData 保持不变) ...
    // 这里重新提供 renderChat 以适配 displayTime
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
            const div = $(`
                <div class="ow-msg-wrapper" style="display:flex; flex-direction:column; align-items:${isMe?'flex-end':'flex-start'};">
                    <div class="ow-msg ${isMe ? 'ow-msg-right' : 'ow-msg-left'}">${msg.content}</div>
                    <div style="font-size:10px; color:#888; margin-top:2px;">${msg.displayTime || ''}</div>
                </div>
            `);
            div.find('.ow-msg').on('contextmenu', (e) => {
                e.preventDefault();
                if(confirm("删除这条消息？")) deleteMessage(name, index);
            });
            view.append(div);
        });
        body.append(view);
        body[0].scrollTop = body[0].scrollHeight;
    }

    // 复用之前的 bindEvents 等...
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
