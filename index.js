(function () {
    // === 配置常量 ===
    const SETTING_KEY = "open_world_phone_data";
    // 扩展 API 上下文 (SillyTavern 官方对象)
    const Context = {
        eventSource: undefined,
        generation: undefined,
        user: undefined
    };

    // === 状态管理 ===
    const State = {
        contacts: {}, 
        // 结构: { "姓名": { messages: [], unread: 0, avatar: "" } }
        currentChat: null,
        isOpen: false,
        isDragging: false
    };

    // === 1. 初始化 ===
    function init() {
        console.log("[OW Phone] Initializing...");
        
        // 尝试获取酒馆上下文
        if (window.SillyTavern) {
            // 如果是新版酒馆，通常暴露在 window 对象上
            // 或者等待后续 Hook
        }

        // 加载历史数据
        loadData();

        // 注入 HTML 结构
        const layout = `
        <div id="ow-phone-toggle" title="打开手机">
            💬
            <span id="ow-main-badge" class="ow-badge" style="display:none">0</span>
        </div>

        <div id="ow-phone-container" class="ow-hidden">
            <div id="ow-phone-header">
                <div id="ow-back-btn" style="display:none">❮</div>
                <div id="ow-header-title">通讯录</div>
                <div id="ow-close-btn">✖</div>
            </div>
            
            <div id="ow-phone-body"></div>
            
            <div id="ow-input-area" style="display:none">
                <input id="ow-input" placeholder="发送讯息..." autocomplete="off">
                <div id="ow-send-btn">➤</div>
            </div>
        </div>
        `;
        $('body').append(layout);

        // 绑定交互事件
        bindEvents();
        
        // 启动消息监听
        startMessageListener();

        console.log("[OW Phone] Ready.");
    }

    // === 2. 绑定事件 (含原生拖拽) ===
    function bindEvents() {
        const toggleBtn = document.getElementById('ow-phone-toggle');
        const container = document.getElementById('ow-phone-container');
        const header = document.getElementById('ow-phone-header');
        const closeBtn = document.getElementById('ow-close-btn');
        const backBtn = document.getElementById('ow-back-btn');
        const sendBtn = document.getElementById('ow-send-btn');
        const input = document.getElementById('ow-input');

        // 开关
        toggleBtn.onclick = () => togglePhone(true);
        closeBtn.onclick = () => togglePhone(false);
        
        // 返回
        backBtn.onclick = renderContactList;

        // 发送
        sendBtn.onclick = handleUserSend;
        input.onkeypress = (e) => { if (e.key === 'Enter') handleUserSend(); };

        // --- 原生拖拽逻辑 (解决依赖问题) ---
        let offset = { x: 0, y: 0 };
        
        header.onmousedown = function(e) {
            State.isDragging = true;
            offset.x = e.clientX - container.offsetLeft;
            offset.y = e.clientY - container.offsetTop;
            header.style.cursor = 'grabbing';
        };

        document.onmouseup = function() {
            State.isDragging = false;
            header.style.cursor = 'grab';
        };

        document.onmousemove = function(e) {
            if (!State.isDragging) return;
            e.preventDefault();
            let left = e.clientX - offset.x;
            let top = e.clientY - offset.y;
            
            // 简单边界检查
            // container.style.left = left + 'px';
            // container.style.top = top + 'px';
            // 移除 bottom/right 定位，改用 left/top 以支持拖拽
            container.style.bottom = 'auto';
            container.style.right = 'auto';
            container.style.left = left + 'px';
            container.style.top = top + 'px';
        };
    }

    // === 3. 消息监听 (Hook) ===
    function startMessageListener() {
        // 方法 A: 使用 MutationObserver 监听 DOM (最稳妥，不依赖特定 API 版本)
        const observer = new MutationObserver((mutations) => {
            let shouldCheck = false;
            mutations.forEach(mutation => {
                if (mutation.addedNodes.length) shouldCheck = true;
            });
            if (shouldCheck) checkLatestMessage();
        });

        // 监听酒馆聊天框
        // 注意：酒馆的聊天框 ID 通常是 #chat
        const chatLog = document.getElementById('chat');
        if (chatLog) {
            observer.observe(chatLog, { childList: true, subtree: true });
        } else {
            console.warn("[OW Phone] Chat container (#chat) not found. Waiting...");
            // 简单的重试机制
            setTimeout(startMessageListener, 2000);
        }
    }

    function checkLatestMessage() {
        // 获取最后一条 AI 消息
        // 酒馆的消息 class 通常是 .mes_text
        const lastMsgEl = $('.mes_text').last(); 
        if (lastMsgEl.length === 0) return;
        
        const text = lastMsgEl.text();
        
        // --- 核心协议解析 ---
        // 1. [ADD_CONTACT: 名字]
        const addRegex = /\[ADD_CONTACT:\s*(.+?)\]/g;
        let match;
        while ((match = addRegex.exec(text)) !== null) {
            const name = match[1].trim();
            addContact(name);
        }

        // 2. [SMS: 发信人 | 内容]
        const smsRegex = /\[SMS:\s*(.+?)\s*\|\s*(.+?)\]/g;
        let smsMatch;
        let hasNewSms = false;
        while ((smsMatch = smsRegex.exec(text)) !== null) {
            const sender = smsMatch[1].trim();
            const content = smsMatch[2].trim();
            
            // 过滤掉自己发的消息 (如果你用了显式发送)
            if (sender === '我' || sender === 'User' || sender === 'user') continue;

            receiveMessage(sender, content);
            hasNewSms = true;
        }

        if (hasNewSms) {
            updateUI();
        }
    }

    // === 4. 业务逻辑 ===

    function addContact(name) {
        if (!State.contacts[name]) {
            State.contacts[name] = { 
                messages: [], 
                unread: 0,
                // 生成一个随机颜色或首字母作为头像
                avatarColor: '#' + Math.floor(Math.random()*16777215).toString(16)
            };
            toastr.success(`📱 手机: 已添加联系人 ${name}`);
            saveData();
            updateUI();
        }
    }

    function receiveMessage(sender, content) {
        // 如果联系人不存在，先自动添加
        if (!State.contacts[sender]) addContact(sender);

        const contact = State.contacts[sender];
        contact.messages.push({
            type: 'recv',
            content: content,
            time: Date.now()
        });

        // 增加未读 (除非正在看这个人的聊天)
        if (State.currentChat !== sender) {
            contact.unread = (contact.unread || 0) + 1;
        }
        
        saveData();
    }

    // 重点：隐式发送逻辑
    async function handleUserSend() {
        const input = document.getElementById('ow-input');
        const text = input.value.trim();
        const target = State.currentChat;

        if (!text || !target) return;

        // 1. UI 立即上屏 (伪造本地体验)
        if (!State.contacts[target]) addContact(target);
        State.contacts[target].messages.push({
            type: 'sent',
            content: text,
            time: Date.now()
        });
        
        input.value = '';
        renderChat(target);
        saveData();

        // 2. 构造隐式指令
        // 我们不直接发到聊天框，而是通过API触发生成，并带上 system note
        // 格式: [系统指令: User给<角色>发了短信]
        
        const systemInstruction = `\n[系统通知: {{user}} 给 ${target} 发送了短信: "${text}"。请 ${target} 查收并视情况回复 (格式: [SMS: ${target} | 回复内容])]\n`;

        // 调用酒馆发送接口
        // 这里我们使用一种“欺骗”手段：
        // 把指令填入输入框 -> 触发发送 -> (可选)随后在DOM中隐藏这条消息
        // 为了最稳妥的兼容性，我们先用最简单的方法：直接发送
        
        const textarea = document.getElementById('send_textarea');
        const sendButton = document.getElementById('send_but');
        
        if (textarea && sendButton) {
            // 备份当前输入框内容(万一用户正在打字)
            const originalVal = textarea.value;
            
            // 填入指令
            textarea.value = systemInstruction;
            
            // 触发点击
            sendButton.click();
            
            // 注意：这种方式会在聊天记录里留下一条系统指令。
            // 这是目前非侵入式扩展最稳定的做法。
            // 想要“无痕”，需要拦截 /api/generate，比较复杂，且容易坏。
            // 我们可以接受主界面有一条灰色的 [系统通知...]，这反而有助于你回顾剧情。
        }
    }

    // === 5. 渲染逻辑 (UI Painting) ===

    function togglePhone(show) {
        State.isOpen = show;
        const container = document.getElementById('ow-phone-container');
        const toggle = document.getElementById('ow-phone-toggle');
        
        if (show) {
            container.classList.remove('ow-hidden');
            toggle.style.display = 'none';
            if (State.currentChat) renderChat(State.currentChat);
            else renderContactList();
        } else {
            container.classList.add('ow-hidden');
            toggle.style.display = 'flex';
        }
    }

    function updateUI() {
        if (!State.isOpen) {
            updateTotalBadge();
            return;
        }
        
        if (State.currentChat) {
            renderChat(State.currentChat);
        } else {
            renderContactList();
        }
        updateTotalBadge();
    }

    function renderContactList() {
        State.currentChat = null;
        $('#ow-header-title').text("通讯录");
        $('#ow-back-btn').hide();
        $('#ow-input-area').hide();
        
        const body = $('#ow-phone-body');
        body.empty();

        const names = Object.keys(State.contacts);
        if (names.length === 0) {
            body.html(`<div style="text-align:center; padding:30px; color:rgba(255,255,255,0.4); font-size:14px;">暂无联系人<br>在聊天中等待 NPC 联系你</div>`);
            return;
        }

        names.forEach(name => {
            const contact = State.contacts[name];
            const lastMsg = contact.messages[contact.messages.length - 1];
            const preview = lastMsg ? lastMsg.content : "新朋友";
            
            // 构建 HTML
            const item = $(`
                <div class="ow-contact-item">
                    <div class="ow-avatar" style="background:${contact.avatarColor || '#ccc'}">
                        ${name[0]}
                        ${contact.unread > 0 ? `<div class="ow-badge">${contact.unread}</div>` : ''}
                    </div>
                    <div class="ow-info">
                        <div class="ow-name">${name}</div>
                        <div class="ow-preview">${preview}</div>
                    </div>
                </div>
            `);
            
            item.click(() => renderChat(name));
            body.append(item);
        });
    }

    function renderChat(name) {
        State.currentChat = name;
        // 清除未读
        if (State.contacts[name]) State.contacts[name].unread = 0;
        updateTotalBadge();
        saveData();

        $('#ow-header-title').text(name);
        $('#ow-back-btn').show();
        $('#ow-input-area').css('display', 'flex'); // flex布局
        
        const body = $('#ow-phone-body');
        body.empty();

        const msgs = State.contacts[name]?.messages || [];
        const view = $('<div class="ow-chat-view"></div>');

        msgs.forEach(msg => {
            const isMe = msg.type === 'sent';
            const el = $(`<div class="ow-msg ${isMe ? 'ow-msg-right' : 'ow-msg-left'}">${msg.content}</div>`);
            view.append(el);
        });

        body.append(view);
        // 滚动到底部
        body[0].scrollTop = body[0].scrollHeight;
    }

    function updateTotalBadge() {
        let total = 0;
        Object.values(State.contacts).forEach(c => total += (c.unread || 0));
        const badge = $('#ow-main-badge');
        if (total > 0) {
            badge.text(total).show();
        } else {
            badge.hide();
        }
    }

    // === 6. 数据持久化 ===
    function saveData() {
        localStorage.setItem(SETTING_KEY, JSON.stringify(State.contacts));
    }

    function loadData() {
        const raw = localStorage.getItem(SETTING_KEY);
        if (raw) {
            try {
                State.contacts = JSON.parse(raw);
            } catch (e) {
                console.error("加载手机数据失败", e);
            }
        }
        updateTotalBadge();
    }

    // 启动
    $(document).ready(() => {
        // 延时一点点，确保酒馆主界面加载完毕
        setTimeout(init, 1000);
    });

})();
