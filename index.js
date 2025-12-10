// ==================================================================================
// 脚本名称: ST-iOS-Phone-Core (Phase 2 Patch - Fixed Listener)
// ==================================================================================

(function () {
    // 1. 防止重复加载
    if (document.getElementById('st-ios-phone-root')) return;

    console.log('📱 ST-iOS-Phone: 系统初始化...');

    // ==================================================================================
    // HTML 结构
    // ==================================================================================
    const html = `
    <div id="st-ios-phone-root">
        <div id="st-phone-icon">
            <svg viewBox="0 0 24 24"><path d="M17 1.01L7 1c-1.1 0-2 .9-2 2v18c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2V3c0-1.1-.9-1.99-2-1.99zM17 19H7V5h10v14z"/></svg>
        </div>

        <div id="st-phone-window">
            <div class="phone-notch-area" id="phone-drag-handle">
                <div class="phone-notch"></div>
            </div>
            
            <div class="app-container">
                <div class="pages-wrapper">
                    
                    <div class="page active" id="page-contacts">
                        <div class="nav-bar">
                            <span class="nav-title">信息</span>
                            <button class="nav-btn icon" id="btn-reload-data" title="强制刷新">↻</button>
                        </div>
                        <div class="contact-list" id="contact-list-container">
                            </div>
                    </div>

                    <div class="page hidden-right" id="page-chat">
                        <div class="nav-bar">
                            <button class="nav-btn" id="btn-back">❮ 信息</button>
                            <span class="nav-title" id="chat-title">用户</span>
                        </div>
                        <div class="chat-scroll-area" id="chat-messages-container">
                            </div>
                        <div class="input-area">
                            <div class="plus-btn">+</div>
                            <input type="text" class="chat-input" placeholder="iMessage" id="msg-input">
                            <div class="send-btn" id="btn-send">
                                <svg viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    </div>
    `;

    const div = document.createElement('div');
    div.innerHTML = html;
    document.body.appendChild(div);

    // ==================================================================================
    // 核心逻辑
    // ==================================================================================

    let phoneState = { contacts: [] };
    const REGEX_SMS = /\(短信\s*-\s*([^)]+)\)\s*:\s*(.+)/i;

    // --- 扫描逻辑 ---
    async function scanChatHistory() {
        if (typeof SillyTavern === 'undefined') {
            console.warn('📱 未找到 SillyTavern 对象，跳过扫描');
            return;
        }
        
        const context = SillyTavern.getContext();
        const chat = context.chat; 
        if (!chat) return;

        // 重新构建数据
        const newContactsMap = new Map();

        chat.forEach(msg => {
            if (!msg.mes) return;
            // 移除可能存在的markdown代码块标记，防止解析错误
            const cleanMsg = msg.mes.replace(/```/g, ''); 
            
            const match = cleanMsg.match(REGEX_SMS);
            if (match) {
                const contactName = match[1].trim();
                const content = match[2].trim();
                const isUser = msg.is_user; 

                if (!newContactsMap.has(contactName)) {
                    newContactsMap.set(contactName, {
                        id: contactName,
                        name: contactName,
                        lastMsg: '',
                        time: '',
                        messages: []
                    });
                }
                const contact = newContactsMap.get(contactName);

                contact.messages.push({
                    sender: isUser ? 'user' : 'char',
                    text: content
                });
                contact.lastMsg = content;
                contact.time = '刚刚'; 
            }
        });

        phoneState.contacts = Array.from(newContactsMap.values());
        renderContacts();
        
        if (activeContactId) {
            const currentContact = phoneState.contacts.find(c => c.id === activeContactId);
            if (currentContact) renderChat(currentContact);
        }
    }

    // --- 事件监听 (已修复: 使用 jQuery 兜底) ---
    function initEventListeners() {
        console.log('📱 正在注册事件监听器...');

        // 定义回调函数
        const onGenerationEnded = () => {
            console.log('📱 [Event] 生成结束，延时扫描...');
            setTimeout(scanChatHistory, 800); // 增加延时到800ms，确保数据库写入
        };

        const onChatChanged = () => {
            console.log('📱 [Event] 聊天切换，重置数据');
            phoneState.contacts = [];
            renderContacts();
            setTimeout(scanChatHistory, 1500); 
        };

        // 策略：优先使用 jQuery (ST 的底层依赖)，因为它在所有环境都可用
        if (typeof jQuery !== 'undefined') {
            // 监听文档上的自定义事件
            jQuery(document).on('generation_ended', onGenerationEnded);
            jQuery(document).on('chat_id_changed', onChatChanged);
            jQuery(document).on('message_sent', () => setTimeout(scanChatHistory, 500));
            // 某些版本的 ST 事件名可能带前缀，多注册一个保险
            jQuery(document).on('tavern_events.GENERATION_ENDED', onGenerationEnded);
            
            console.log('✅ 已通过 jQuery 注册事件监听');
        } else if (typeof eventOn !== 'undefined') {
            // 备选方案
            eventOn('generation_ended', onGenerationEnded);
            eventOn('chat_id_changed', onChatChanged);
            eventOn('message_sent', () => setTimeout(scanChatHistory, 500));
            console.log('✅ 已通过 eventOn 注册事件监听');
        } else {
            console.error('❌ 无法找到 jQuery 或 eventOn，自动同步将失效！');
        }
    }

    // ==================================================================================
    // UI 渲染
    // ==================================================================================
    
    let activeContactId = null;

    function makeDraggable(element, handle) {
        let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
        handle.onmousedown = dragMouseDown;
        function dragMouseDown(e) { e.preventDefault(); pos3 = e.clientX; pos4 = e.clientY; document.onmouseup = closeDragElement; document.onmousemove = elementDrag; }
        function elementDrag(e) { e.preventDefault(); pos1 = pos3 - e.clientX; pos2 = pos4 - e.clientY; pos3 = e.clientX; pos4 = e.clientY; element.style.top = (element.offsetTop - pos2) + "px"; element.style.left = (element.offsetLeft - pos1) + "px"; }
        function closeDragElement() { document.onmouseup = null; document.onmousemove = null; }
    }
    
    makeDraggable(document.getElementById("st-phone-window"), document.getElementById("phone-drag-handle"));
    makeDraggable(document.getElementById("st-phone-icon"), document.getElementById("st-phone-icon"));

    const icon = document.getElementById('st-phone-icon');
    const windowEl = document.getElementById('st-phone-window');
    let isPhoneOpen = false;

    icon.addEventListener('click', () => {
        isPhoneOpen = !isPhoneOpen;
        windowEl.style.display = isPhoneOpen ? 'block' : 'none';
        if (isPhoneOpen) scanChatHistory(); 
    });

    function renderContacts() {
        const container = document.getElementById('contact-list-container');
        container.innerHTML = '';
        if (phoneState.contacts.length === 0) {
            container.innerHTML = '<div style="padding:20px;text-align:center;color:#999;font-size:14px;">暂无短信<br>请使用格式:<br>(短信-名字): 内容</div>';
            return;
        }
        phoneState.contacts.forEach(contact => {
            const el = document.createElement('div');
            el.className = 'contact-item';
            el.innerHTML = `<div class="info"><div class="name-row"><span class="name">${contact.name}</span><span class="time">${contact.time}</span></div><div class="preview">${contact.lastMsg}</div></div>`;
            el.onclick = () => openChat(contact);
            container.appendChild(el);
        });
    }

    function renderChat(contact) {
        const container = document.getElementById('chat-messages-container');
        container.innerHTML = '';
        container.appendChild(document.createElement('div')).style.height = '10px';
        contact.messages.forEach(msg => {
            const el = document.createElement('div');
            el.className = `message-bubble ${msg.sender === 'user' ? 'sent' : 'received'}`;
            el.innerText = msg.text;
            container.appendChild(el);
        });
        setTimeout(() => container.scrollTop = container.scrollHeight, 0);
    }

    function openChat(contact) {
        activeContactId = contact.id;
        document.getElementById('chat-title').innerText = contact.name;
        renderChat(contact);
        document.getElementById('page-contacts').classList.add('hidden-left');
        document.getElementById('page-contacts').classList.remove('active');
        document.getElementById('page-chat').classList.remove('hidden-right');
        document.getElementById('page-chat').classList.add('active');
    }

    function closeChat() {
        activeContactId = null;
        document.getElementById('page-contacts').classList.remove('hidden-left');
        document.getElementById('page-contacts').classList.add('active');
        document.getElementById('page-chat').classList.add('hidden-right');
        document.getElementById('page-chat').classList.remove('active');
    }

    document.getElementById('btn-back').onclick = closeChat;
    document.getElementById('btn-reload-data').onclick = () => { scanChatHistory(); const btn = document.getElementById('btn-reload-data'); btn.style.transform = 'rotate(360deg)'; setTimeout(()=> btn.style.transform = 'none', 500); };
    
    document.getElementById('btn-send').onclick = () => {
        const input = document.getElementById('msg-input');
        if(!input.value.trim()) return;
        alert('Phase 3 才会实装真实发送功能哦！');
        input.value = '';
    };

    // ==================================================================================
    // 启动
    // ==================================================================================
    setTimeout(() => {
        initEventListeners();
        scanChatHistory(); 
        console.log('✅ ST-iOS-Phone: Phase 2 Patch Loaded (Using jQuery Events)');
    }, 2000);

})();
