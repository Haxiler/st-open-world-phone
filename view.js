// ==================================================================================
// 模块: View (界面与交互)
// ==================================================================================
(function() {
    // 防止重复加载
    if (document.getElementById('st-ios-phone-root')) return;

    // 1. HTML 模板 (原封不动)
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
                        <div class="nav-bar ios-nav">
                            <button class="nav-btn text-btn" id="btn-reload-data">编辑</button>
                            <span class="nav-title">信息</span>
                            <button class="nav-btn icon" id="btn-add-friend" title="新对话">
                                <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#007AFF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                            </button>
                        </div>
                        <div class="ios-search-bar">
                            <div class="search-input">
                                <svg viewBox="0 0 24 24" width="14" height="14" fill="#8e8e93"><path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" stroke="#8e8e93" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
                                <span>搜索</span>
                            </div>
                        </div>
                        <div class="contact-list" id="contact-list-container">
                            </div>
                    </div>

                    <div class="page hidden-right" id="page-chat">
                        <div class="nav-bar ios-nav-detail">
                            <button class="nav-btn back-btn" id="btn-back">
                                <svg viewBox="0 0 24 24" width="24" height="24" stroke="#007AFF" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
                                <span>信息</span>
                            </button>
                            <div class="nav-title-group">
                                <span class="nav-title-small" id="chat-title">用户</span>
                            </div>
                            <button class="nav-btn" style="visibility:hidden; width: 40px"></button>
                        </div>
                        <div class="chat-scroll-area" id="chat-messages-container">
                            </div>
                        <div class="input-area">
                            <div class="plus-btn">
                                <svg viewBox="0 0 24 24" width="16" height="16" fill="#8e8e93"><path d="M12 5v14M5 12h14" stroke="#fff" stroke-width="2" stroke-linecap="round"/></svg>
                            </div>
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

    // 2. 拖拽逻辑 (View 负责交互)
    function makeDraggable(element, handle) {
        let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
        handle.onmousedown = dragMouseDown;

        function dragMouseDown(e) {
            e.preventDefault();
            pos3 = e.clientX;
            pos4 = e.clientY;
            window.ST_PHONE.state.isDragging = false; 
            document.onmouseup = closeDragElement;
            document.onmousemove = elementDrag;
        }

        function elementDrag(e) {
            e.preventDefault();
            pos1 = pos3 - e.clientX;
            pos2 = pos4 - e.clientY;
            pos3 = e.clientX;
            pos4 = e.clientY;
            window.ST_PHONE.state.isDragging = true;
            element.style.top = (element.offsetTop - pos2) + "px";
            element.style.left = (element.offsetLeft - pos1) + "px";
        }

        function closeDragElement() {
            document.onmouseup = null;
            document.onmousemove = null;
        }
    }
    
    makeDraggable(document.getElementById("st-phone-window"), document.getElementById("phone-drag-handle"));
    makeDraggable(document.getElementById("st-phone-icon"), document.getElementById("st-phone-icon"));

    // 3. 导出 UI 操作函数供 core.js 调用
    window.ST_PHONE.ui = {
        toggleWindow: function() {
            const icon = document.getElementById('st-phone-icon');
            const windowEl = document.getElementById('st-phone-window');
            
            if (window.ST_PHONE.state.isDragging) {
                window.ST_PHONE.state.isDragging = false;
                return;
            }

            window.ST_PHONE.state.isPhoneOpen = !window.ST_PHONE.state.isPhoneOpen;
            windowEl.style.display = window.ST_PHONE.state.isPhoneOpen ? 'block' : 'none';
            
            // 如果打开，触发一次数据扫描 (需要 core.js 配合，这里暂时只管 UI)
            // 实际扫描逻辑在 Core 里绑定
            return window.ST_PHONE.state.isPhoneOpen;
        },

        renderContacts: function() {
            const container = document.getElementById('contact-list-container');
            const contacts = window.ST_PHONE.state.contacts;
            
            container.innerHTML = '';
            if (contacts.length === 0) {
                container.innerHTML = `
                    <div style="padding-top: 150px; text-align: center; color: #8e8e93;">
                        <div style="font-size: 24px; margin-bottom: 8px;">无短信</div>
                        <div style="font-size: 14px;">你可以通过右上角添加新对话</div>
                    </div>`;
                return;
            }
            contacts.forEach(contact => {
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
                el.onclick = () => window.ST_PHONE.ui.openChat(contact);
                container.appendChild(el);
            });
        },

        renderChat: function(contact) {
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
        },

        openChat: function(contact) {
            window.ST_PHONE.state.activeContactId = contact.id;
            document.getElementById('chat-title').innerText = contact.name;
            window.ST_PHONE.ui.renderChat(contact);
            document.getElementById('page-contacts').classList.add('hidden-left');
            document.getElementById('page-contacts').classList.remove('active');
            document.getElementById('page-chat').classList.remove('hidden-right');
            document.getElementById('page-chat').classList.add('active');
        },

        closeChat: function() {
            window.ST_PHONE.state.activeContactId = null;
            document.getElementById('page-contacts').classList.remove('hidden-left');
            document.getElementById('page-contacts').classList.add('active');
            document.getElementById('page-chat').classList.add('hidden-right');
            document.getElementById('page-chat').classList.remove('active');
        }
    };

    // 绑定基础 UI 事件
    document.getElementById('st-phone-icon').addEventListener('click', () => {
        const isOpen = window.ST_PHONE.ui.toggleWindow();
        // 触发自定义事件，通知 core.js 刷新数据
        if(isOpen) document.dispatchEvent(new CustomEvent('st-phone-opened'));
    });
    
    document.getElementById('btn-back').onclick = window.ST_PHONE.ui.closeChat;

})();
