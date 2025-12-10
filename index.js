// ==================================================================================
// 脚本名称: ST-iOS-Phone-Core (Phase 3 Final - XML Protocol & Draft Mode)
// ==================================================================================

(function () {
    // 1. 防止重复加载
    if (document.getElementById('st-ios-phone-root')) return;

    console.log('📱 ST-iOS-Phone: Phase 3 (交互版) 启动中...');

    // ==================================================================================
    // HTML 结构
    // ==================================================================================
    const html = `
    <div id="st-ios-phone-root">
        <div id="st-phone-icon" title="打开/关闭手机">
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
                            <button class="nav-btn icon" id="btn-reload-data" title="手动刷新">↻</button>
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
    // 核心逻辑：数据管理
    // ==================================================================================

    let phoneState = { contacts: [] };
    let activeContactId = null;
    let isPhoneOpen = false;

    // --- 核心正则：XML 解析 ---
    // 捕获组: $1=发送人, $2=接收人, $3=内容, $4=时间
    const REGEX_XML_MSG = /<msg>(.+?)\|(.+?)\|(.+?)\|(.+?)<\/msg>/gi;

    // --- 辅助：获取当前时间 HH:mm ---
    function getCurrentTimeStr() {
        const now = new Date();
        return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    }

    // --- 核心：扫描聊天记录 ---
    async function scanChatHistory() {
        if (typeof SillyTavern === 'undefined') return;
        
        const context = SillyTavern.getContext();
        const chat = context.chat; 
        if (!chat) return;

        const newContactsMap = new Map();

        // 倒序遍历还是顺序遍历？顺序遍历符合时间轴
        chat.forEach(msg => {
            if (!msg.mes) return;
            
            // 移除可能存在的 Markdown 代码块标记
            const cleanMsg = msg.mes.replace(/```/g, ''); 
            
            // 使用 matchAll 捕获所有标签（防止一条消息里有多条短信）
            const matches = [...cleanMsg.matchAll(REGEX_XML_MSG)];

            matches.forEach(match => {
                const sender = match[1].trim();   // 发送人
                const receiver = match[2].trim(); // 接收人
                const content = match[3].trim();  // 内容
                const timeStr = match[4].trim();  // 时间

                // --- 归属判定逻辑 ---
                let contactName = '';
                let isMyMessage = false;

                // 判断逻辑：如果发送人是 {{user}} (不区分大小写)，那这就是发给“接收人”的消息
                if (sender.toLowerCase().includes('{{user}}') || sender === '你' || sender.toLowerCase() === 'user') {
                    contactName = receiver; // 联系人是对方
                    isMyMessage = true;
                } else {
                    // 否则，这通常是对方发给我的，或者对方发给别人的
                    // 只有当接收人是 {{user}}，或者是群聊时，我们才显示
                    // 为了简化，我们假设所有非User发的都归档到Sender名下
                    contactName = sender;
                    isMyMessage = false;
                }

                // 过滤：如果你希望只显示发给 {{user}} 的，可以在这里加判断
                // 目前逻辑：只要正文里有 <msg>，就提取进手机

                if (!newContactsMap.has(contactName)) {
                    newContactsMap.set(contactName, {
                        id: contactName, // 简单用名字做ID
                        name: contactName,
                        lastMsg: '',
                        time: '',
                        messages: []
                    });
                }
                const contact = newContactsMap.get(contactName);

                contact.messages.push({
                    sender: isMyMessage ? 'user' : 'char',
                    text: content
                });
                
                // 更新最新状态
                contact.lastMsg = content;
                contact.time = timeStr || getCurrentTimeStr();
            });
        });

        // 更新全局数据
        phoneState.contacts = Array.from(newContactsMap.values());
        
        // 刷新 UI
        renderContacts();
        if (activeContactId) {
            const currentContact = phoneState.contacts.find(c => c.id === activeContactId);
            if (currentContact) renderChat(currentContact);
        }
    }

    // --- 核心：发送逻辑 (Draft Mode) ---
    function sendDraftToInput() {
        const input = document.getElementById('msg-input');
        const text = input.value.trim();
        
        if (!text || !activeContactId) return;

        // 1. 获取当前聊天对象的名字
        const contact = phoneState.contacts.find(c => c.id === activeContactId);
        const targetName = contact ? contact.name : activeContactId;

        // 2. 封装 XML 格式
        // 格式: <msg>{{user}}|接收人|内容|时间</msg>
        const xmlString = `<msg>{{user}}|${targetName}|${text}|${getCurrentTimeStr()}</msg>`;

        // 3. 寻找酒馆主输入框
        // 通常 ID 是 send_textarea
        const mainTextArea = document.querySelector('#send_textarea');
        
        if (mainTextArea) {
            // 获取当前光标位置或直接追加到末尾
            const originalText = mainTextArea.value;
            // 如果输入框不为空，先换行
            const separator = originalText.length > 0 ? '\n' : '';
            
            // 赋值
            mainTextArea.value = originalText + separator + xmlString;
            
            // 触发 input 事件，让酒馆知道内容变了（调整高度、激活发送键等）
            mainTextArea.dispatchEvent(new Event('input', { bubbles: true }));
            
            // 给予视觉反馈 (清空手机输入框)
            input.value = '';
            
            // 可以在这里做一个小的提示动画，或者把焦点移回主输入框
            mainTextArea.focus();
            
            // 乐观更新：虽然还没发送，但先假装显示在手机里，体验更好？
            // 既然是草稿模式，还没发送就不应该显示在手机历史里，
            // 只有当用户点了酒馆发送，AI处理完或者正则脚本生效后，轮询扫到了才会显示。
            // 所以这里不做本地 push。
        } else {
            alert('❌ 找不到酒馆主输入框 (#send_textarea)');
        }
    }

    // --- 自动化：轮询与监听 ---
    function initAutomation() {
        // 1. 启动心跳轮询 (每2秒)
        setInterval(() => {
            // 只有当手机窗口打开时才扫描，节省性能
            if (isPhoneOpen) {
                scanChatHistory();
            }
        }, 2000);

        // 2. 备用：尝试注册 jQuery 事件 (如果环境允许)
        if (typeof jQuery !== 'undefined') {
            jQuery(document).on('generation_ended', () => {
                // AI 生成完毕，无论手机开没开，稍微延时后扫一次，保证红点逻辑未来可用
                setTimeout(scanChatHistory, 1000); 
            });
        }
    }

    // ==================================================================================
    // UI 交互
    // ==================================================================================
    
    // 拖拽 (保持不变)
    function makeDraggable(element, handle) {
        let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
        handle.onmousedown = dragMouseDown;
        function dragMouseDown(e) { e.preventDefault(); pos3 = e.clientX; pos4 = e.clientY; document.onmouseup = closeDragElement; document.onmousemove = elementDrag; }
        function elementDrag(e) { e.preventDefault(); pos1 = pos3 - e.clientX; pos2 = pos4 - e.clientY; pos3 = e.clientX; pos4 = e.clientY; element.style.top = (element.offsetTop - pos2) + "px"; element.style.left = (element.offsetLeft - pos1) + "px"; }
        function closeDragElement() { document.onmouseup = null; document.onmousemove = null; }
    }
    makeDraggable(document.getElementById("st-phone-window"), document.getElementById("phone-drag-handle"));
    makeDraggable(document.getElementById("st-phone-icon"), document.getElementById("st-phone-icon"));

    // 显隐切换 + 立即刷新
    const icon = document.getElementById('st-phone-icon');
    const windowEl = document.getElementById('st-phone-window');

    icon.addEventListener('click', () => {
        isPhoneOpen = !isPhoneOpen;
        windowEl.style.display = isPhoneOpen ? 'block' : 'none';
        
        if (isPhoneOpen) {
            // 开屏瞬间立即扫描
            scanChatHistory();
            // 让列表滚回顶部或保持原位
        }
    });

    // 渲染函数
    function renderContacts() {
        const container = document.getElementById('contact-list-container');
        container.innerHTML = '';
        if (phoneState.contacts.length === 0) {
            container.innerHTML = '<div style="padding:20px;text-align:center;color:#999;font-size:13px;">暂无消息<br>等待正则捕获...</div>';
            return;
        }
        // 按时间倒序排列联系人（最新消息的在上面）- 暂不实现复杂排序，按扫描顺序
        phoneState.contacts.forEach(contact => {
            const el = document.createElement('div');
            el.className = 'contact-item';
            el.innerHTML = `
                <div class="info">
                    <div class="name-row">
                        <span class="name">${contact.name}</span>
                        <span class="time">${contact.time}</span>
                    </div>
                    <div class="preview">${contact.lastMsg}</div>
                </div>
            `;
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

    // 绑定按钮事件
    document.getElementById('btn-back').onclick = closeChat;
    
    // 手动刷新 (保留作为备用)
    document.getElementById('btn-reload-data').onclick = () => { 
        scanChatHistory(); 
        const btn = document.getElementById('btn-reload-data'); 
        btn.style.transform = 'rotate(360deg)'; 
        setTimeout(()=> btn.style.transform = 'none', 500); 
    };

    // 发送按钮 -> 触发 Draft 逻辑
    document.getElementById('btn-send').onclick = sendDraftToInput;
    
    // 输入框回车发送
    document.getElementById('msg-input').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendDraftToInput();
    });

    // ==================================================================================
    // 启动
    // ==================================================================================
    setTimeout(() => {
        initAutomation();
        scanChatHistory();
        console.log('✅ ST-iOS-Phone: Phase 3 Ready (XML Protocol)');
    }, 2000);

})();
