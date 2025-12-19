// ==================================================================================
// 模块: Scribe (书记员 - v3.95 Lite - Custom Modified)
// ==================================================================================
(function () {
    // 【修改点1】将最大条数限制改为 20 (针对每个角色)
    const MAX_MESSAGES = 20;
    const state = { debounceTimer: null };

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

        if (!targetBookName && context.characterId) {
            charId = context.characterId;
            const char = SillyTavern.characters[charId];
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
            const char = SillyTavern.characters[charId];
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

            if (!existingEntry) {
                const newEntry = createEntry(contact.name, comment, content);
                if (isDict) bookObj.entries[newEntry.uid] = newEntry;
                else bookObj.entries.push(newEntry);
                modified = true;
            } else {
                // 检查内容更新
                if (existingEntry.content !== content) {
                    existingEntry.content = content;
                    existingEntry.enabled = true;
                    modified = true;
                }
                
                // 【额外逻辑】强制更新现有条目的属性，以符合新的设定
                // 1. 深度修正为 3
                if (existingEntry.depth !== 3) {
                    existingEntry.depth = 3;
                    modified = true;
                }
                // 2. 强制开启防止递归
                if (existingEntry.preventRecursion !== true) {
                    existingEntry.preventRecursion = true;
                    modified = true;
                }
                // 3. 修正触发词 (仅保留名字)
                // 注意：这会覆盖用户手动修改的触发词，但符合你的“删除其他”要求
                const targetKeysStr = JSON.stringify([contact.name]);
                const currentKeysStr = JSON.stringify(existingEntry.keys || []);
                // 简单对比数组内容（假设顺序一致或单元素）
                if (currentKeysStr !== targetKeysStr && (!existingEntry.keys || existingEntry.keys.length !== 1 || existingEntry.keys[0] !== contact.name)) {
                    existingEntry.key = [contact.name];
                    existingEntry.keys = [contact.name];
                    modified = true;
                }
            }
        });

        if (modified) {
            if (isEmbedded) {
                if (SillyTavern.saveCharacterDebounced) SillyTavern.saveCharacterDebounced(charId);
                else SillyTavern.saveCharacter(charId);
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
            // 【修改点2】触发词仅保留 contactName
            key: [contactName], 
            keys: [contactName],
            comment: comment,
            content: content,
            enabled: true,
            constant: false,
            selectiveLogic: 0,
            depth:3, 
            preventRecursion: true,
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
