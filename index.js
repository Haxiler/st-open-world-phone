(function () {
    // === 核心状态 ===
    const SETTING_KEY = "open_world_phone_data";
    const State = {
        contacts: {}, // { "姓名": { messages: [], unread: 0 } }
        currentChat: null, // 当前正在和谁聊天
        isOpen: false,
        totalUnread: 0
    };

    // === 1. 初始化 & UI 渲染 ===
    function init() {
        // 加载保存的数据
        loadData();

        // 注入 HTML
        const layout = `
        <div id="ow-phone-toggle" title="查看手机">
            📱<span id="ow-main-badge" class="ow-badge" style="display:none">0</span>
        </div>
        <div id="ow-phone-container" class="ow-hidden">
            <div id="ow-phone-header">
                <span id="ow-back-btn" style="display:none; cursor:pointer; margin-right:10px">❮</span>
                <span id="ow-header-title">通讯录</span>
                <span id="ow-close-btn" style="cursor:pointer; margin-left:auto">✖</span>
            </div>
            <div id="ow-phone-body"></div>
            <div id="ow-input-area" style="display:none">
                <input id="ow-input" placeholder="输入短信..." autocomplete="off">
                <button id="ow-send-btn">发送</button>
            </div>
        </div>
        <audio id="ow-notify-sound" src="/scripts/extensions/open_world_phone/notify.mp3" preload="auto"></audio>
        `;
        $('body').append(layout);

        // 绑定事件
        $('#ow-phone-toggle').click(() => togglePhone(true));
        $('#ow-close-btn').click(() => togglePhone(false));
        $('#ow-back-btn').click(renderContactList);
        
        // 使手机窗口可拖动 (依赖 JQuery UI)
        $("#ow-phone-container").draggable({ 
            handle: "#ow-phone-header",
            containment: "window"
        });

        // 发送消息事件
        $('#ow-send-btn').click(handleUserSend);
        $('#ow-input').keypress((e) => { if (e.which == 13) handleUserSend(); });

        // 监听酒馆消息 (核心 Hook)
        // 这里的 context.eventSource 是酒馆接收消息的标准接口
        if (window.eventSource) {
            window.eventSource.on(tavern_events.MESSAGE_RECEIVED, (data) => {
                // data 是最新生成的那条消息 ID，我们需要去读取内容
                // 由于 event 触发时 DOM 可能还没渲染完，我们稍微延迟一下或直接读数据
                setTimeout(() => checkLatestMessage(), 500); 
            });
        } else {
            // 降级方案：MutationObserver 监听聊天框变化
            const observer = new MutationObserver(checkLatestMessage);
            const chatLog = document.querySelector('#chat');
            if (chatLog) observer.observe(chatLog, { childList: true, subtree: true });
        }

        renderContactList();
    }

    // === 2. 逻辑：检查并解析消息 ===
    function checkLatestMessage() {
        // 获取最后一条消息的文本
        const lastMsg = $('.mes_text').last().text();
        if (!lastMsg) return;

        // 正则 1: [SMS: 发信人 | 内容]
        // 正则 2: [ADD_CONTACT: 名字]
        const smsRegex = /\[SMS:\s*(.+?)\s*\|\s*(.+?)\]/g;
        const addRegex = /\[ADD_CONTACT:\s*(.+?)\]/g;

        let hasUpdate = false;

        // 处理加好友
        let addMatch;
        while ((addMatch = addRegex.exec(lastMsg)) !== null) {
            const name = addMatch[1].trim();
            if (!State.contacts[name]) {
                State.contacts[name] = { messages: [], unread: 0 };
                toastr.success(`📱 自动添加新联系人: ${name}`);
                hasUpdate = true;
            }
        }

        // 处理短信
        let smsMatch;
        while ((smsMatch = smsRegex.exec(lastMsg)) !== null) {
            const sender = smsMatch[1].trim();
            const content = smsMatch[2].trim();
            
            // 如果是 {{user}} 发的消息（即我刚才发的），忽略，避免重复
            if (sender === '我' || sender.toLowerCase() === 'user') continue;

            addMessage(sender, content, 'recv');
            hasUpdate = true;
        }

        if (hasUpdate) {
            playSound();
            saveData();
            if (State.isOpen) {
                if (State.currentChat) renderChatWindow(State.currentChat);
                else renderContactList();
            }
            updateBadge();
        }
    }

    // === 3. 逻辑：添加消息到数据库 ===
    function addMessage(name, content, type) {
        if (!State.contacts[name]) {
            State.contacts[name] = { messages: [], unread: 0 };
        }
        
        State.contacts[name].messages.push({
            type: type, // 'sent' or 'recv'
            content: content,
            time: new Date().getTime()
        });

        // 只有当这是接收消息，且当前没在看这个人的聊天窗时，增加未读
        if (type === 'recv' && State.currentChat !== name) {
            State.contacts[name].unread = (State.contacts[name].unread || 0) + 1;
        }
    }

    // === 4. 逻辑：用户发送消息 (注入酒馆) ===
    async function handleUserSend() {
        const text = $('#ow-input').val().trim();
        const target = State.currentChat;
        if (!text || !target) return;

        // 1. UI 上先显示
        addMessage(target, text, 'sent');
        $('#ow-input').val('');
        renderChatWindow(target);
        saveData();

        // 2. 构造注入文本
        // 格式: [短信发送给 角色名: "内容"]
        const injection = `\n[SMS: 我 | ${text}]\n(System: User sent a text to ${target}. ${target} should read it and reply using [SMS: ${target} | message] format if needed.)`;

        // 3. 发送给酒馆
        // 我们利用酒馆的 API 直接触发生成
        // 如果是流式传输，最好直接追加到当前输入框并触发点击
        const textarea = document.getElementById('send_textarea');
        if (textarea) {
            // 暂存用户可能正在输入的内容
            const originalInput = textarea.value;
            
            // 填入我们的短信指令
            textarea.value = injection;
            
            // 触发发送
            document.getElementById('send_but').click();
            
            // 稍后（极短时间）如果想恢复用户之前的输入有点难，因为点击发送会清空。
            // 所以这里直接作为一次交互发送出去是合理的。
        }
    }

    // === 5. 渲染：通讯录 ===
    function renderContactList() {
        State.currentChat = null;
        $('#ow-header-title').text("通讯录");
        $('#ow-back-btn').hide();
        $('#ow-input-area').hide();
        const body = $('#ow-phone-body');
        body.empty();

        const names = Object.keys(State.contacts);
        if (names.length === 0) {
            body.append(`<div style="text-align:center; padding:20px; color:#888;">暂无联系人<br>在剧情中触发 [ADD_CONTACT:姓名] 即可添加</div>`);
            return;
        }

        names.forEach(name => {
            const data = State.contacts[name];
            const lastMsgObj = data.messages[data.messages.length - 1];
            const lastMsgText = lastMsgObj ? lastMsgObj.content : "暂无消息";
            
            const badgeHtml = data.unread > 0 ? `<div class="ow-badge" style="position:static; margin-left:10px">${data.unread}</div>` : '';

            const item = $(`
                <div class="ow-contact-item">
                    <div style="flex:1; overflow:hidden;">
                        <div class="ow-contact-name">${name}</div>
                        <div class="ow-contact-preview">${lastMsgText}</div>
                    </div>
                    ${badgeHtml}
                    <div style="color:#666">❯</div>
                </div>
            `);
            
            item.click(() => renderChatWindow(name));
            body.append(item);
        });
    }

    // === 6. 渲染：聊天窗口 ===
    function renderChatWindow(name) {
        State.currentChat = name;
        // 清除未读
        if (State.contacts[name]) State.contacts[name].unread = 0;
        updateBadge();
        saveData();

        $('#ow-header-title').text(name);
        $('#ow-back-btn').show();
        $('#ow-input-area').css('display', 'flex'); // flex布局
        const body = $('#ow-phone-body');
        body.empty();

        const view = $('<div class="ow-chat-view"></div>');
        const msgs = State.contacts[name]?.messages || [];

        msgs.forEach(msg => {
            const el = $(`<div class="ow-msg ${msg.type === 'sent' ? 'ow-msg-right' : 'ow-msg-left'}">${msg.content}</div>`);
            view.append(el);
        });

        body.append(view);
        // 滚动到底部
        body.scrollTop(body[0].scrollHeight);
    }

    // === 工具函数 ===
    function togglePhone(show) {
        State.isOpen = show;
        const container = $('#ow-phone-container');
        const toggle = $('#ow-phone-toggle');
        
        if (show) {
            container.removeClass('ow-hidden');
            toggle.addClass('ow-hidden'); // 隐藏悬浮球
            if (!State.currentChat) renderContactList();
        } else {
            container.addClass('ow-hidden');
            toggle.removeClass('ow-hidden'); // 显示悬浮球
        }
        updateBadge();
    }

    function updateBadge() {
        let total = 0;
        Object.values(State.contacts).forEach(c => total += (c.unread || 0));
        const badge = $('#ow-main-badge');
        if (total > 0) {
            badge.text(total).show();
        } else {
            badge.hide();
        }
    }

    function playSound() {
        const audio = document.getElementById('ow-notify-sound');
        if (audio) {
            audio.volume = 0.5;
            audio.play().catch(e => console.log('声音播放被拦截:', e));
        }
    }

    function saveData() {
        // 使用酒馆自带的 settings 保存机制 (如果有) 或者 localStorage
        // 为了通用性，这里使用 localStorage 并加上扩展名作为前缀
        localStorage.setItem(SETTING_KEY, JSON.stringify(State.contacts));
    }

    function loadData() {
        const raw = localStorage.getItem(SETTING_KEY);
        if (raw) {
            try {
                State.contacts = JSON.parse(raw);
            } catch(e) {
                console.error("加载手机数据失败", e);
            }
        }
        updateBadge();
    }

    // 启动!
    $(document).ready(() => {
        // 延迟一点加载，确保酒馆核心已就绪
        setTimeout(init, 1000);
    });
})();
