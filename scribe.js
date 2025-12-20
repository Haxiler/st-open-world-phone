// ==================================================================================
// 模块: Scribe (书记员 - v4.1 Position Fix)
// ==================================================================================
(function () {
    const MAX_MESSAGES = 20; 
    const state = { debounceTimer: null };

    // 获取全局 Characters 对象 (兼容 1.14.0+)
    function getCharacters() {
        return window.characters || (window.SillyTavern && window.SillyTavern.characters) || {};
    }

    function buildContent(contact) {
        if (!contact.messages || contact.messages.length === 0) return '';
        const msgs = contact.messages.slice(-MAX_MESSAGES);
        let out = `【手机短信记录｜${contact.name}】\n\n`;
        out += `以下是 {{user}} 与 ${contact.name} 之间的近期手机短信记录，仅在短信交流时用于回忆上下文。\n\n`;
        msgs.forEach(m => {
            const who = m.sender === 'user' ? '我' : contact.name;
            out += `(${m.timeStr}) ${who}：${m.text}\n`;
        });
        return out.trim();
    }

    async function apiFetch(url, body) {
        return new Promise((resolve, reject) => {
            $.ajax({
                type: 'POST',
                url: url,
                data: JSON.stringify(body),
                contentType: 'application/json',
                headers: { 'X-CSRF-Token': window.csrf_token },
                success: function(data) { resolve(data); },
                error: function(jqXHR) { reject(new Error(`API Error: ${jqXHR.status}`)); }
            });
        });
    }

    async function fetchWorldBookList() {
        try {
            if (typeof window.world_names !== 'undefined' && Array.isArray(window.world_names)) return window.world_names;
            const select = document.querySelector('#world_editor_select');
            if (select && select.options.length > 0) {
                return Array.from(select.options)
                    .map(o => (o.innerText || o.text || "").trim())
                    .filter(v => v && v !== "Select World Info" && v !== "None");
            }
        } catch(e) {}
        return [];
    }

    async function performSync(contacts) {
        if (!contacts || !contacts.length) return;

        let targetBookName = window.ST_PHONE.config.targetWorldBook;
        let isEmbedded = false;
        let charId = null;
        const context = SillyTavern.getContext();
        const chars = getCharacters(); // 使用兼容写法

        if (!targetBookName && context.characterId) {
            charId = context.characterId;
            const char = chars[charId];
            if (char && char.data && char.data.character_book) {
                const bookRef = char.data.character_book;
                if (typeof bookRef === 'object') {
                    isEmbedded = true; 
                    targetBookName = "Embedded_Book"; 
                } else if (typeof bookRef === 'string' && bookRef.trim() !== '') {
                    targetBookName = bookRef;
                }
            }
        }

        if (!targetBookName) return;

        let bookObj = null;
        if (isEmbedded) {
            const char = chars[charId];
            if (!char.data.character_book) char.data.character_book = { entries: [] };
            bookObj = char.data.character_book;
        } else {
            try {
                const res = await apiFetch('/api/worldinfo/get', { name: targetBookName });
                if (!res) return;
                bookObj = res;
            } catch(e) { return; }
        }

        if (!bookObj.entries) bookObj.entries = [];
        const entriesCollection = bookObj.entries;
        const isDict = !Array.isArray(entriesCollection);
        const entryList = isDict ? Object.values(entriesCollection) : entriesCollection;
        
        let modified = false;

        contacts.forEach(contact => {
            const comment = `ST_PHONE_SMS::${contact.name}`;
            const content = buildContent(contact);
            if (!content) return;

            let existingEntry = entryList.find(e => e.comment === comment);

            // 扩展配置
            const extensionConfig = {
                depth: 3,
                position: 4, // 冗余备份
                prevent_recursion: true,
                exclude_recursion: true 
            };

            if (!existingEntry) {
                const newEntry = createEntry(contact.name, comment, content);
                if (isDict) bookObj.entries[newEntry.uid] = newEntry;
                else bookObj.entries.push(newEntry);
                modified = true;
            } else {
                if (existingEntry.content !== content) {
                    existingEntry.content = content;
                    existingEntry.enabled = true;
                    modified = true;
                }
                
                // 【核心修复】：强制纠正属性
                // 1. 位置代码：4 代表 "At Depth" (在指定深度)
                if (existingEntry.position !== 4) { existingEntry.position = 4; modified = true; }
                
                // 2. 深度：3
                if (existingEntry.depth !== 3) { existingEntry.depth = 3; modified = true; }
                
                // 3. 防递归
                if (existingEntry.preventRecursion !== true) { existingEntry.preventRecursion = true; modified = true; }

                // 4. Extensions 同步
                if (!existingEntry.extensions) {
                    existingEntry.extensions = extensionConfig;
                    modified = true;
                } else {
                    if (existingEntry.extensions.position !== 4) { existingEntry.extensions.position = 4; modified = true; }
                    if (existingEntry.extensions.depth !== 3) { existingEntry.extensions.depth = 3; modified = true; }
                }

                // 5. 触发词
                const targetKeysStr = JSON.stringify([contact.name]);
                const currentKeysStr = JSON.stringify(existingEntry.keys || []);
                if (currentKeysStr !== targetKeysStr) {
                    existingEntry.key = [contact.name];
                    existingEntry.keys = [contact.name];
                    modified = true;
                }
            }
        });

        if (modified) {
            console.log('📱 ST-Phone: 检测到变动，正在同步世界书...');
            if (isEmbedded) {
                if (SillyTavern.saveCharacterDebounced) SillyTavern.saveCharacterDebounced(charId);
                else if (SillyTavern.saveCharacter) SillyTavern.saveCharacter(charId);
            } else {
                await apiFetch('/api/worldinfo/edit', { name: targetBookName, data: bookObj });
                try {
                    const editorSelect = document.getElementById('world_editor_select');
                    if (editorSelect && editorSelect.value === targetBookName) {
                        const loadFunc = window.loadWorldInfo || (SillyTavern && SillyTavern.loadWorldInfo);
                        if (typeof loadFunc === 'function') loadFunc(targetBookName);
                    }
                } catch(err) {}
            }
        }
    }

    function createEntry(contactName, comment, content) {
        return {
            uid: generateUUID(), 
            key: [contactName], 
            keys: [contactName],
            comment: comment,
            content: content,
            enabled: true,
            constant: false,
            selectiveLogic: 0,
            
            // 【关键】：必须显式指定 position = 4，否则 depth 无效！
            position: 4, 
            depth: 3, 
            preventRecursion: true,

            extensions: {
                position: 4,
                depth: 3,
                prevent_recursion: true,
                exclude_recursion: true 
            },

            order: 100, 
            priority: 100
        };
    }

    function generateUUID() {
        if (crypto && crypto.randomUUID) return crypto.randomUUID();
        return Date.now().toString(); 
    }

    window.ST_PHONE.scribe = {
        sync: function(contacts) {
            if (state.debounceTimer) clearTimeout(state.debounceTimer);
            state.debounceTimer = setTimeout(() => { performSync(contacts); }, 2000);
        },
        getWorldBookList: fetchWorldBookList,
        forceSync: () => performSync(window.ST_PHONE.state.contacts)
    };
})();
