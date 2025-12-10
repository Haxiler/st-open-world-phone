// ==================================================================================
// 模块: Core (核心逻辑 - v1.5 Adaptive Identity)
// ==================================================================================
(function() {
    
    // --- 辅助函数：获取系统时间 ---
    function getSystemTimeStr() {
        const now = new Date();
        const M = now.getMonth() + 1;
        const D = now.getDate();
        const h = String(now.getHours()).padStart(2, '0');
        const m = String(now.getMinutes()).padStart(2, '0');
        return `${M}月${D}日 ${h}:${m}`;
    }

    // 状态管理初始化
    window.ST_PHONE.state.lastUserSendTime = 0;
    window.ST_PHONE.state.pendingMsgText = null;
    window.ST_PHONE.state.pendingMsgTarget = null;
    window.ST_PHONE.state.virtualTime = getSystemTimeStr(); 

    // --- 正则定义 ---
    const REGEX_XML_MSG = /<msg>(.+?)\|(.+?)\|(.+?)\|(.+?)<\/msg>/gi;
    const REGEX_STORY_TIME = /(?:<|&lt;)time(?:>|&gt;)(.*?)(?:<|&lt;)\/time(?:>|&gt;)/i;

    function scanChatHistory() {
        if (typeof SillyTavern === 'undefined') return;
        
        // 1. 获取酒馆上下文
        const context = SillyTavern.getContext();
        const chat = context.chat; 
        if (!chat) return;

        // 2. 【关键】动态获取当前用户名字 (User Persona Name)
        // context.name1 就是你在酒馆里设置的当前“用户名”
        const currentUserPersona = context.name1 ? context.name1.trim() : null;

        const newContactsMap = new Map();
        let latestNarrativeTime = null; 

        // --- 主扫描循环 ---
        chat.forEach(msg => {
            if (!msg.mes) return;
            const cleanMsg = msg.mes.replace(/```/g, ''); 

            // A. 抓取剧情时间
            const timeMatch = cleanMsg.match(REGEX_STORY_TIME);
            if (timeMatch && timeMatch[1]) {
                latestNarrativeTime = timeMatch[1].trim();
            }

            // B. 抓取短信
            const matches = [...cleanMsg.matchAll(REGEX_XML_MSG)];
            matches.forEach(match => {
                let sender = match[1].trim();
                let receiver = match[2].trim();
                const content = match[3].trim();
                const msgTimeStr = match[4].trim();

                if (msgTimeStr && !latestNarrativeTime) {
                    latestNarrativeTime = msgTimeStr;
                }

                let contactName = '';
                let isMyMessage = false;

                // --- 身份判定逻辑 (升级版) ---
                // 定义所有可能代表“我”的标识符
                const myNames = ['{{user}}', '你', 'user', 'me', 'myself'];
                
                // 如果能获取到动态名字，也加进去 (比如 '短昼')
                if (currentUserPersona) {
                    myNames.push(currentUserPersona.toLowerCase());
                    // 也存一个原始大小写的版本以防万一
                    myNames.push(currentUserPersona);
                }

                // 核心判断：发送者是否在“我的名字列表”里？
                const isSenderUser = myNames.some(n => sender.toLowerCase() === n.toLowerCase()) || 
                                     (currentUserPersona && sender.includes(currentUserPersona));

                if (isSenderUser) {
                    // 我发的 -> 联系人是接收者
                    contactName = receiver; 
                    isMyMessage = true;
                } else {
                    // 别人发的 -> 联系人是发送者
                    contactName = sender;
                    isMyMessage = false;
                }
                
                // 安全过滤：防止“我发给我自己”导致通讯录出现自己
                if (myNames.some(n => contactName.toLowerCase() === n.toLowerCase())) return;

                // --- 列表构建 ---
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
                    sender: isMyMessage ? 'user' : 'char',
                    text: content,
                    isPending: false 
                });
                
                contact.lastMsg = content;
                contact.time = msgTimeStr || latestNarrativeTime || getSystemTimeStr();
            });
        });

        // --- 全局更新 ---
        if (latestNarrativeTime) {
            window.ST_PHONE.state.virtualTime = latestNarrativeTime;
        } 
        
        if (window.ST_PHONE.ui.updateStatusBarTime) {
            window.ST_PHONE.ui.updateStatusBarTime(window.ST_PHONE.state.virtualTime);
        }

        // --- 保活逻辑 (Pending Msg) ---
        const pendingText = window.ST_PHONE.state.pendingMsgText;
        const pendingTarget = window.ST_PHONE.state.pendingMsgTarget;
        const now = Date.now();

        if (pendingText) {
            if (!newContactsMap.has(pendingTarget)) {
                 newContactsMap.set(pendingTarget, {
                        id: pendingTarget,
                        name: pendingTarget,
                        lastMsg: '',
                        time: window.ST_PHONE.state.virtualTime,
                        messages: []
                 });
            }
            const contact = newContactsMap.get(pendingTarget);
            const recentRealMsgs = contact.messages.slice(-5);
            
            const isSynced = recentRealMsgs.some(m => m.text === pendingText && m.sender === 'user');

            if (isSynced) {
                window.ST_PHONE.state.pendingMsgText = null;
                window.ST_PHONE.state.pendingMsgTarget = null;
            } else {
                if (now - window.ST_PHONE.state.lastUserSendTime < 60000) {
                    contact.messages.push({
                        sender: 'user',
                        text: pendingText,
                        isPending: true 
                    });
                    contact.lastMsg = pendingText; 
                } else {
                    window.ST_PHONE.state.pendingMsgText = null;
                }
            }
        }

        window.ST_PHONE.state.contacts = Array.from(newContactsMap.values());
        
        if (window.ST_PHONE.ui.renderContacts) {
            const searchInput = document.getElementById('phone-search-bar');
            if (!searchInput || !searchInput.value) {
                window.ST_PHONE.ui.renderContacts();
            }
            if (window.ST_PHONE.state.activeContactId) {
                const currentContact = window.ST_PHONE.state.contacts.find(c => c.id === window.ST_PHONE.state.activeContactId);
                if (currentContact) window.ST_PHONE.ui.renderChat(currentContact);
            }
        }
    }

    // --- 发送逻辑 ---
    function sendDraftToInput() {
        const input = document.getElementById('msg-input');
        const text = input.value.trim();
        const activeId = window.ST_PHONE.state.activeContactId;
        
        if (!text || !activeId) return;

        let contact = window.ST_PHONE.state.contacts.find(c => c.id === activeId);
        const targetName = contact ? contact.name : activeId;
        const timeToSend = window.ST_PHONE.state.virtualTime;

        const xmlString = `<msg>{{user}}|${targetName}|${text}|${timeToSend}</msg>`;
        const mainTextArea = document.querySelector('#send_textarea');
        
        if (mainTextArea) {
            const originalText = mainTextArea.value;
            const separator = originalText.length > 0 ? '\n' : '';
            mainTextArea.value = originalText + separator + xmlString;
            mainTextArea.dispatchEvent(new Event('input', { bubbles: true }));
            
            window.ST_PHONE.state.lastUserSendTime = Date.now();
            window.ST_PHONE.state.pendingMsgText = text;
            window.ST_PHONE.state.pendingMsgTarget = targetName;

            if (contact) {
                contact.messages.push({
                    sender: 'user',
                    text: text,
                    isPending: true
                });
                window.ST_PHONE.ui.renderChat(contact);
            }

            input.value = '';
            mainTextArea.focus();
        } else {
            alert('❌ 找不到酒馆主输入框 (#send_textarea)');
        }
    }

    // --- 事件绑定 ---
    document.addEventListener('st-phone-opened', () => { scanChatHistory(); });
    const sendBtn = document.getElementById('btn-send');
    if(sendBtn) sendBtn.onclick = sendDraftToInput;
    const msgInput = document.getElementById('msg-input');
    if(msgInput) {
        msgInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') sendDraftToInput();
        });
    }
    function initAutomation() {
        setInterval(() => {
            if (window.ST_PHONE.state.isPhoneOpen) {
                scanChatHistory();
            }
        }, 2000);
        if (typeof jQuery !== 'undefined') {
            jQuery(document).on('generation_ended', () => {
                setTimeout(scanChatHistory, 1000); 
            });
        }
    }
    setTimeout(() => {
        initAutomation();
        scanChatHistory();
        console.log('✅ ST-iOS-Phone: 逻辑核心已挂载 (v1.5 Adaptive Identity)');
    }, 1000);

})();
