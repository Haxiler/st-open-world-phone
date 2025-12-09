(function () {
    const STORAGE_PREFIX = "ow_phone_v3_";
    
    // --- 调试日志工具 (保留，便于验证功能) ---
    function debugLog(step, message, data = null) {
        const time = new Date().toLocaleTimeString();
        console.log(`%c[${time}] [OW调试-步骤${step}] ${message}`, "color: #ff00ff; font-weight: bold;", data || "");
    }
    
    // --- 1. 表情包数据 (直接硬编码到 JS 文件中) ---
    const EMOJI_DB = [
        // --- 基础互动 ---
        { label: "打招呼", url: "https://sharkpan.xyz/f/LgwT7/AC229A80203166B292155ADA057DE423_0.gif" },
        { label: "开心", url: "https://sharkpan.xyz/f/aVwtY/0CBEE9105C7A98E0E6162A79CCD09EFA_0.gif" },
        { label: "爱心", url: "https://sharkpan.xyz/f/53nhj/345FFC998474F46C1A40B1567335DA03_0.gif" },
        { label: "给你爱", url: "https://files.catbox.moe/sqa7c9.jpg" },
        { label: "好的", url: "https://files.catbox.moe/71kn5e.png" },
        { label: "晚安", url: "https://files.catbox.moe/duzx7n.png" },

        // --- 卖萌/撒娇 ---
        { label: "乖巧", url: "https://files.catbox.moe/4dnzcq.png" },
        { label: "害羞", url: "https://files.catbox.moe/ssgpgy.jpg" },
        { label: "飞奔", url: "https://sharkpan.xyz/f/kDOi6/0A231BF0BFAB3C2B243F9749B64F7444_0.gif" },
        { label: "蹭蹭", url: "https://files.catbox.moe/9p0x2t.png" },
        { label: "期待", url: "https://files.catbox.moe/i0ov5h.png" },
        { label: "送花", url: "https://files.catbox.moe/s1t2kd.jpg" },
        { label: "可怜", url: "https://sharkpan.xyz/f/XgmcW/817B66DAB2414E1FC8D717570A602193_0.gif" },
        { label: "流口水", url: "https://sharkpan.xyz/f/j36f6/3010464DF8BD77B4A99AB23730F2EE57_0.gif" },

        // --- 负面情绪/拒绝 ---
        { label: "哭哭", url: "https://files.catbox.moe/rw1cfk.png" },
        { label: "大哭", url: "https://files.catbox.moe/dbyrdf.png" },
        { label: "委屈", url: "https://sharkpan.xyz/f/gVySw/D90D0B53802301FCDB1F0718DEB08C79_0.gif" },
        { label: "生气", url: "https://files.catbox.moe/si6f0k.png" },
        { label: "不爽", url: "https://files.catbox.moe/amelbv.png" },
        { label: "嫌弃", url: "https://files.catbox.moe/t2e0nt.png" },
        { label: "无语", url: "https://files.catbox.moe/wgkwjh.png" },
        { label: "拒绝", url: "https://files.catbox.moe/bos6mn.jpg" },
        { label: "心碎", url: "https://files.catbox.moe/ueqlfe.jpg" },
        { label: "压力", url: "https://files.catbox.moe/ufz3ek.jpg" },

        // --- 攻击性/怼人 ---
        { label: "顶嘴", url: "https://sharkpan.xyz/f/vVBtL/mmexport1737057690899.png" },
        { label: "揍你", url: "https://sharkpan.xyz/f/oJ1i4/mmexport1737057862640.gif" },
        { label: "撞飞", url: "https://sharkpan.xyz/f/zMZu5/mmexport1737057848709.gif" },
        { label: "锁喉", url: "https://files.catbox.moe/mi8tk3.jpg" },
        { label: "滚", url: "https://sharkpan.xyz/f/1vAc2/mmexport1737057678306.png" },
        { label: "比中指", url: "https://files.catbox.moe/umpgjb.jpg" },
        { label: "吃屎", url: "https://files.catbox.moe/r26gox.png" },
        { label: "你是坏蛋", url: "https://sharkpan.xyz/f/8r2Sj/mmexport1737057726579.png" },
        { label: "我恨你", url: "https://files.catbox.moe/r6g32h.png" },

        // --- 搞笑/发疯/阴阳怪气 ---
        { label: "疑惑", url: "https://files.catbox.moe/gofdox.jpg" },
        { label: "震惊", url: "https://files.catbox.moe/q7683x.png" },
        { label: "尴尬", url: "https://files.catbox.moe/8eaawd.png" },
        { label: "偷看", url: "https://files.catbox.moe/72wkme.png" },
        { label: "发疯", url: "https://files.catbox.moe/8cqr43.jpg" },
        { label: "已老实", url: "https://files.catbox.moe/6eyzlg.png" },
        { label: "喝茶", url: "https://files.catbox.moe/1xvrb8.jpg" }, // 大人请用茶
        { label: "免礼", url: "https://sharkpan.xyz/f/pO6uQ/mmexport1737057701883.png" },
        { label: "满意", url: "https://sharkpan.xyz/f/e8KUw/mmexport1737057664689.png" },
        { label: "好困", url: "https://files.catbox.moe/7pncr1.jpg" },
        { label: "躺平", url: "https://files.catbox.moe/cq6ipd.png" },
        { label: "升天", url: "https://files.catbox.moe/o8td90.png" },
        { label: "大脑短路", url: "https://files.catbox.moe/d41e2q.png" },
        { label: "吃瓜", url: "https://files.catbox.moe/428w1c.png" }, // 围观
        { label: "吐魂", url: "https://files.catbox.moe/7yejey.png" },

        // --- 特殊类 ---
        { label: "我是狗", url: "https://files.catbox.moe/1bki7o.jpg" },
        { label: "汪", url: "https://files.catbox.moe/iwmiww.jpg" },
        { label: "投降", url: "https://files.catbox.moe/f4ogyw.png" }
    ];

    // 用于去重，记录最后一次处理的消息文本
    let lastProcessedContent = "";

    const State = {
        contacts: {}, 
        currentChat: null,
        isOpen: false,
        isDragging: false,
        userName: "User",
        currentChatFileId: null,
    };

    // --- 辅助函数 (防止 ReferenceError) ---
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
                } catch(e) {
                    console.error("数据解析失败", e);
                }
            }
        }
        updateMainBadge();
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

    // --- 核心消息读取逻辑 (优化版) ---
    function checkLatestMessage() {
        if (!window.SillyTavern || !window.SillyTavern.getContext) return;
        const context = window.SillyTavern.getContext();
        const chat = context.chat;
        
        if (chat && chat.length > 0) {
            const lastMsg = chat[chat.length - 1];
            // 确保获取的是原始消息体 (.mes)，它不会被“格式显示”的正则修改
            const rawContent = lastMsg.mes; 
            
            // 调试输出原始数据，用于排查
            debugLog(3, "检查最新消息内容", rawContent);
            
            if (rawContent === lastProcessedContent) return;
            lastProcessedContent = rawContent;

            if (rawContent.includes('<msg>')) {
                debugLog(4, "发现手机指令，开始解析");
                parseCommand(rawContent);
            }
        }
    }
    
    function reprocessAllMessages() {
        debugLog(7, "重新扫描所有消息 (触发检查)");
        // 在实际应用中，我们只需要触发最新的消息检查，因为它包含了所有最新的指令
        checkLatestMessage(); 
    }


    // --- 主初始化流程 (整合了所有修复) ---
    function init() {
        debugLog(0, "插件正在初始化...");
        
        // 1. 初始化绑定
        updateContextInfo();
        
        // 2. 注入 UI
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
            renderEmojiPanel();
            bindEvents();
        }

        // 3. 【核心修复】使用多事件监听策略，实现沉浸式（无视正则隐藏）接收
        if (window.eventOn && window.tavern_events) {
            debugLog(1, "已挂载 SillyTavern 事件监听器。");
            
            // 消息渲染完成 (NPC消息进入 DOM 的最佳时机)
            eventOn(tavern_events.CHARACTER_MESSAGE_RENDERED, () => {
                debugLog(2, "收到 'CHARACTER_MESSAGE_RENDERED' 事件");
                setTimeout(checkLatestMessage, 50); 
            });
            
            // 消息生成完成 (AI生成完毕)
            eventOn(tavern_events.GENERATION_ENDED, () => {
                debugLog(2, "收到 'GENERATION_ENDED' 事件");
                setTimeout(checkLatestMessage, 50); 
            });
            
            // 消息更新 (用户编辑/删除/重发)
            eventOn(tavern_events.MESSAGE_UPDATED, () => {
                debugLog(2, "收到 'MESSAGE_UPDATED' 事件");
                // 更新时需要重新扫描，因为我们不确定是哪条消息被更新了
                reprocessAllMessages();
            });
            
            // 聊天切换/存档改变
            eventOn(tavern_events.CHAT_CHANGED, () => {
                debugLog(2, "收到 'CHAT_CHANGED' 事件");
                reprocessAllMessages();
            });
        } else {
             console.warn("【警告】未检测到 eventOn/tavern_events API。手机自动接收消息功能可能无法工作。");
        }
        
        renderContactList();
    }


    // === 核心解析器 (保持不变) ===
    function parseCommand(text) {
        if (!text) return;
        
        // 解码 HTML 实体 (防止 &lt; 导致正则失败)
        const decodedText = text.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');

        // 正则匹配: <msg>发送|接收|内容|时间</msg>
        const msgRegex = /<msg>(.+?)\|(.+?)\|(.+?)\|(.+?)<\/msg>/g;
        let match;
        
        while ((match = msgRegex.exec(decodedText)) !== null) {
            let sender = match[1].trim();
            let receiver = match[2].trim();
            let content = match[3].trim();
            let timeStr = match[4].trim();

            debugLog(5, `解析成功: ${sender} -> ${receiver}`);

            // === A. 处理加好友 (System 指令) ===
            if (sender.toLowerCase() === 'system' && content.startsWith('ADD:')) {
                const newContactName = content.replace('ADD:', '').trim();
                if (!State.contacts[newContactName]) {
                    State.contacts[newContactName] = { messages: [], unread: 0, color: getRandomColor() };
                    saveData();
                    toastr.success(`📱 自动添加好友: ${newContactName}`);
                    if(State.isOpen && !State.currentChat) renderContactList();
                }
                continue;
            }

            // === B. 处理普通消息 ===
            const isSenderUser = checkIsUser(sender);
            const isReceiverUser = checkIsUser(receiver);

            content = parseEmojiContent(content);

            // 别人发给我 (存为 recv)
            if (!isSenderUser && isReceiverUser) {
                if (!State.contacts[sender]) {
                    State.contacts[sender] = { messages: [], unread: 0, color: getRandomColor() };
                    saveData();
                }
                addMessageLocal(sender, content, 'recv', timeStr);
            }
            // 我发给别人 (存为 sent)
            else if (isSenderUser && !isReceiverUser) {
                if (!State.contacts[receiver]) {
                    State.contacts[receiver] = { messages: [], unread: 0, color: getRandomColor() };
                    saveData();
                }
                addMessageLocal(receiver, content, 'sent', timeStr);
            }
        }
    }


    // === 发送与数据存储逻辑 (保持不变) ===
    function handleUserSend() {
        const input = document.getElementById('ow-input');
        const text = input.value.trim();
        const target = State.currentChat; 
        if (!text || !target) return;

        const now = new Date();
        const timeStr = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;

        addMessageLocal(target, text, 'sent', timeStr);
        input.value = '';

        // 构造指令，并发送到主输入框
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

        // 3秒防抖
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
        debugLog(6, "消息已写入 UI", {name, type});
    }

    function deleteMessage(contactName, index) {
        if (!State.contacts[contactName]) return;
        State.contacts[contactName].messages.splice(index, 1);
        saveData();
        renderChat(contactName);
        toastr.success("消息已删除");
    }

    // === UI 渲染函数 (包含增量渲染优化) ===
    
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

    // 增量渲染函数（性能优化）
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
        
        // 查找是否已经存在当前聊天的视图
        let view = body.find(`.ow-chat-view[data-chat-id="${name}"]`);
        
        const msgs = State.contacts[name]?.messages || [];
        
        // 如果视图不存在，或者当前视图属于另一个人，则完全重绘
        if (view.length === 0) {
            body.empty();
            view = $(`<div class="ow-chat-view" data-chat-id="${name}"></div>`);
            body.append(view);
            
            // 首次渲染：添加所有消息
            msgs.forEach((msg, index) => {
                appendMsgToView(view, msg, name, index);
            });
            // 滚动到底部
            body[0].scrollTop = body[0].scrollHeight;
        } else {
            // 增量渲染：只添加新消息
            const currentCount = view.children().length;
            const targetCount = msgs.length;

            if (targetCount > currentCount) {
                // 有新消息 -> 追加
                for (let i = currentCount; i < targetCount; i++) {
                    appendMsgToView(view, msgs[i], name, i);
                }
                // 平滑滚动到底部
                body.animate({ scrollTop: body[0].scrollHeight }, 300);
            } else if (targetCount < currentCount) {
                // 消息减少了（删除了消息）-> 强制重绘
                body.empty();
                renderChat(name); 
                return;
            }
        }
    }

    // 辅助函数：生成单条消息 DOM
    function appendMsgToView(viewContainer, msg, contactName, index) {
        const isMe = msg.type === 'sent';
        const div = $(`
            <div class="ow-msg-wrapper" style="display:flex; flex-direction:column; align-items:${isMe?'flex-end':'flex-start'};">
                <div class="ow-msg ${isMe ? 'ow-msg-right' : 'ow-msg-left'}">${msg.content}</div>
                <div style="font-size:10px; color:#888; margin-top:2px;">${msg.displayTime || ''}</div>
            </div>
        `);
        
        // 绑定右键删除事件
        div.find('.ow-msg').on('contextmenu', (e) => {
            e.preventDefault();
            if(confirm("删除这条消息？")) deleteMessage(contactName, index);
        });
        
        viewContainer.append(div);
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

    $(document).ready(() => setTimeout(init, 500));
})();
