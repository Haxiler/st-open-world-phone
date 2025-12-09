(function () {
    const SETTING_KEY = "open_world_phone_data";
    
    // 表情包列表
    const EMOJI_LIST = [
    // --- 柏柏小手机精选 (Sharkpan) ---
    "https://sharkpan.xyz/f/vVBtL/mmexport1737057690899.png", // 你敢顶嘴
    "https://sharkpan.xyz/f/pO6uQ/mmexport1737057701883.png", // 免礼
    "https://sharkpan.xyz/f/1vAc2/mmexport1737057678306.png", // 你走吧
    "https://sharkpan.xyz/f/e8KUw/mmexport1737057664689.png", // 我很满意
    "https://sharkpan.xyz/f/oJ1i4/mmexport1737057862640.gif", // 揍你哦
    "https://sharkpan.xyz/f/8r2Sj/mmexport1737057726579.png", // 坏蛋
    "https://sharkpan.xyz/f/Gvmil/mmexport1737057801285.gif", // 关心你
    "https://sharkpan.xyz/f/zMZu5/mmexport1737057848709.gif", // 撞飞你
    "https://sharkpan.xyz/f/53nhj/345FFC998474F46C1A40B1567335DA03_0.gif", // 剪纸爱心
    "https://sharkpan.xyz/f/kDOi6/0A231BF0BFAB3C2B243F9749B64F7444_0.gif", // 飞奔过来
    "https://sharkpan.xyz/f/j36f6/3010464DF8BD77B4A99AB23730F2EE57_0.gif", // 流口水
    "https://sharkpan.xyz/f/aVwtY/0CBEE9105C7A98E0E6162A79CCD09EFA_0.gif", // 开心跳舞
    "https://sharkpan.xyz/f/rOpu6/9277120A65282CFEAB9E191B34474729_0.gif", // 开心扭动
    "https://sharkpan.xyz/f/DnJHK/F12BF133675BA34684A60CF38E17D328_0.gif", // 擦地板
    "https://sharkpan.xyz/f/LgwT7/AC229A80203166B292155ADA057DE423_0.gif", // 打招呼
    "https://sharkpan.xyz/f/qJJI3/E7B02761D317A00B912F328AA9F02565_0.gif", // 戴项圈
    "https://sharkpan.xyz/f/XgmcW/817B66DAB2414E1FC8D717570A602193_0.gif", // 可怜兮兮
    "https://sharkpan.xyz/f/2aACQ/A491786010A6E595A84B9F4D4EE58B27_0.gif", // 送礼物
    "https://sharkpan.xyz/f/gVySw/D90D0B53802301FCDB1F0718DEB08C79_0.gif", // 委屈哭泣
    "https://sharkpan.xyz/f/JXeig/68FD6090F0D187FC88794909AA4E4C30_0.gif", // 欢呼
    "https://sharkpan.xyz/f/6Mzua/7AF42F3AE5EA01AEDBA5A3C7437339FA_0.gif", // 趴枕头
    "https://sharkpan.xyz/f/713sj/307F8B36E1F2A49573E6562193AA71BF_0.gif", // 嘟嘴
    "https://sharkpan.xyz/f/ADwCZ/04A8CC14F4C317F5E0DA84AD2A8BE1FF_0.gif", // 垂死惊坐
    "https://sharkpan.xyz/f/wqghq/B8578FD25ED069B8AF1B0AC35F20770B_0.gif", // 奔跑
    "https://sharkpan.xyz/f/M4OUa/DA8F0F3F2B2C1F567258724B9EA59623_0.gif", // 尴尬动耳
    "https://sharkpan.xyz/f/30lHe/1507DB48EFC13593A4766C51F33BFC1C_0.gif", // 激动摇摆
    "https://sharkpan.xyz/f/kXOI6/C0FC1927068E1F87D38FA09B7F51F830_0.gif", // 偷看
    "https://sharkpan.xyz/f/jq6H6/413DB04EE36F940E3381C99402CE2E44_0.gif", // 跳跃
    "https://sharkpan.xyz/f/rmpI6/7D87F6F45B1AEDAABC0EF119E977732F_0.gif", // 打滚
    "https://sharkpan.xyz/f/DXJcK/E419CF47415150B8CBADD767F09017C9_0.gif", // 哭泣打滚
    
    // --- 小图书馆系列 (Catbox) ---
    "https://files.catbox.moe/tqm23r.jpg", // 吃啥呢给我掰点
    "https://files.catbox.moe/tmm57s.jpg", // 别动量下腰围
    "https://files.catbox.moe/ufz3ek.jpg", // 感到压力
    "https://files.catbox.moe/mi8tk3.jpg", // 锁你的喉
    "https://files.catbox.moe/8cqr43.jpg", // 发疯我吃吃吃
    "https://files.catbox.moe/1xvrb8.jpg", // 大人请用茶
    "https://files.catbox.moe/ig8pp7.jpg", // 让咪咪咪一会好吗
    "https://files.catbox.moe/3sw5uu.jpg", // 愚蠢的我
    "https://files.catbox.moe/p2ymy9.jpg", // 跟我神经病计较什么
    "https://files.catbox.moe/h4osmk.jpg", // 请问你很牛吗
    "https://files.catbox.moe/gzosdm.jpg", // 局促
    "https://files.catbox.moe/zj6adv.jpg", // 我很好
    "https://files.catbox.moe/qrp6dm.jpg", // 硬撑
    "https://files.catbox.moe/sqa7c9.jpg", // 我的爱都给你
    "https://files.catbox.moe/g98ofy.jpg", // 牛马的命也是命
    "https://files.catbox.moe/kmiyh6.jpg", // 你的良心出了点问题
    "https://files.catbox.moe/7b5v1v.jpg", // 哈哈我疯啦
    "https://files.catbox.moe/7jom1o.jpg", // 这事有蹊跷
    "https://files.catbox.moe/ov1hdu.jpg", // 哦！
    "https://files.catbox.moe/b010fx.jpg", // 早上好不好也随便
    "https://files.catbox.moe/cff4yf.jpg", // excuse me?
    "https://files.catbox.moe/9u8rhz.jpg", // 没你的觉我睡不明白
    "https://files.catbox.moe/zap7bj.jpg", // 机缘巧合罢了
    "https://files.catbox.moe/hyushu.jpg", // 给你台阶
    "https://files.catbox.moe/3pht7n.jpg", // 要死了
    "https://files.catbox.moe/u2ntmn.jpg", // 别刺激我
    "https://files.catbox.moe/6fahlg.jpg", // 我好累
    "https://files.catbox.moe/l2227m.jpg", // 很烦
    "https://files.catbox.moe/bqit1t.jpg", // 我恨这个世界
    "https://files.catbox.moe/72koiw.jpg", // 骂骂咧咧
    "https://files.catbox.moe/gofdox.jpg", // 问号
    "https://files.catbox.moe/4sabpi.jpg", // 阿弥陀佛
    "https://files.catbox.moe/bos6mn.jpg", // 不必了
    "https://files.catbox.moe/2bidi3.jpg", // 死工作永无止境
    "https://files.catbox.moe/vz0zth.jpg", // 狗眼看人低？
    "https://files.catbox.moe/vmzqib.jpg", // 不爽
    "https://files.catbox.moe/umpgjb.jpg", // 比中指
    "https://files.catbox.moe/3nnxf7.jpg", // 按下骂人开关
    "https://files.catbox.moe/5pyonu.jpg", // 哦呦了不起
    "https://files.catbox.moe/mkm06b.jpg", // 今天发什么疯好呢
    "https://files.catbox.moe/6htwq1.jpg", // 嘘
    "https://files.catbox.moe/sdod5d.jpg", // 精神病一触即发
    "https://files.catbox.moe/qjjuai.jpg", // 请你上吊
    "https://files.catbox.moe/ueqlfe.jpg", // 易碎的心
    "https://files.catbox.moe/vlxbvu.jpg", // 我永远也不会原谅你
    "https://files.catbox.moe/7pncr1.jpg", // 好困
    "https://files.catbox.moe/2lhe1h.jpg", // 做人没必要那么正常
    "https://files.catbox.moe/43ba7g.jpg", // 突然想到个馊主意
    "https://files.catbox.moe/1cmut7.jpg", // 抛开内容不谈你讲得有道理
    "https://files.catbox.moe/xkapk3.jpg", // 偷听
    "https://files.catbox.moe/f8bjf0.jpg", // 我该打
    "https://files.catbox.moe/ssgpgy.jpg", // 害羞
    "https://files.catbox.moe/s1t2kd.jpg", // 送花
    "https://files.catbox.moe/irq4ky.jpg", // 姐姐我摔倒啦
    "https://files.catbox.moe/imo7d8.jpg", // 请和我交往
    "https://files.catbox.moe/vidlif.jpg", // 送你幸福
    "https://files.catbox.moe/bulyae.jpg", // 你最棒
    "https://files.catbox.moe/o0dia5.jpg", // 每天都在想你
    "https://files.catbox.moe/rcogx1.jpg", // Oi！
    "https://files.catbox.moe/iwmiww.jpg", // 汪！
    "https://files.catbox.moe/wkdcdf.jpg", // 皇上请翻牌子
    "https://files.catbox.moe/1bki7o.jpg", // 陛下我是你的狗啊
    "https://files.catbox.moe/wt8jqa.jpg", // 奴才告退
    "https://files.catbox.moe/ohry21.jpg", // 舔狗登场
    "https://files.catbox.moe/f9587d.jpg", // 姐姐！
    "https://files.catbox.moe/tctls0.jpg", // 太美了吧
    "https://files.catbox.moe/k5rzrq.jpg", // 狗狗来咯
    "https://files.catbox.moe/h4bqea.jpg", // 狗狗走咯
    "https://files.catbox.moe/mqsa57.jpg", // 不在乎小狗了吗
    "https://files.catbox.moe/9rimsc.jpg", // 请你公开我们的关系
    "https://files.catbox.moe/ic2n92.jpg", // 听不懂想亲嘴
    "https://files.catbox.moe/y7qphr.jpg", // 小狗抱手机哭
    "https://files.catbox.moe/vtrw3o.jpg", // 求求你
    "https://files.catbox.moe/8bvpz6.jpg", // 好的主人
    "https://files.catbox.moe/rbnrf1.jpg", // 小狗委屈
    "https://files.catbox.moe/9hvpjn.jpg", // 主人我以后只跟着你走
    "https://files.catbox.moe/e4qmfr.png", // 不爽
    "https://files.catbox.moe/zl4tko.png", // 等待
    "https://files.catbox.moe/amelbv.png", // 不爽
    "https://files.catbox.moe/tpnhxx.png", // 期待
    "https://files.catbox.moe/wfhbla.png", // 期待
    "https://files.catbox.moe/g68grl.png", // 害羞/开心
    "https://files.catbox.moe/kxu26o.png", // love you
    "https://files.catbox.moe/oxi30g.png", // 呆坐
    "https://files.catbox.moe/j2s53r.png", // 着急
    "https://files.catbox.moe/qt9uta.png", // 急哭了
    "https://files.catbox.moe/5txmzd.png", // 吃我一拳
    "https://files.catbox.moe/spgdwv.png", // 警觉
    "https://files.catbox.moe/8ccguc.png", // 鬼鬼祟祟
    "https://files.catbox.moe/9tc8lj.png", // 双眼放光
    "https://files.catbox.moe/d5bdm3.png", // 委屈哭唧唧
    "https://files.catbox.moe/qsbgfr.png", // 生气打拳
    "https://files.catbox.moe/pzb873.png", // 生气
    "https://files.catbox.moe/funa7u.png", // 吻手礼
    "https://files.catbox.moe/ugt3wq.png", // 重罪
    "https://files.catbox.moe/0xr1fh.png", // 真的吗？
    "https://files.catbox.moe/h77bnu.png", // 可怜兮兮
    "https://files.catbox.moe/6ylibe.png", // 双眼放光
    "https://files.catbox.moe/4dnzcq.png", // 乖巧
    "https://files.catbox.moe/0nbi2p.png", // 开心转圈
    "https://files.catbox.moe/htndae.png", // NO/表示抗拒
    "https://files.catbox.moe/31ke9x.png", // 严肃/板着脸
    "https://files.catbox.moe/ois23f.png", // 跑过来
    "https://files.catbox.moe/wcxabf.png", // 惊讶
    "https://files.catbox.moe/u1msrp.png", // 嫌弃/不满
    "https://files.catbox.moe/afuns1.png", // 来啦来啦
    "https://files.catbox.moe/dhp2gr.png", // 那咋了
    "https://files.catbox.moe/3ruhin.png", // 想咋地
    "https://files.catbox.moe/k0uru3.png", // 哈？
    "https://files.catbox.moe/6uqxds.png", // 心虚
    "https://files.catbox.moe/doag9c.png", // 怎么样打死我
    "https://files.catbox.moe/428w1c.png", // 围观
    "https://files.catbox.moe/tt548x.png", // 好厉害（不走心）
    "https://files.catbox.moe/vpnmxr.png", // 坏笑
    "https://files.catbox.moe/p9v3sq.png", // 装酷
    "https://files.catbox.moe/gmvx6d.png", // 红温
    "https://files.catbox.moe/u77bks.png", // 可怜兮兮
    "https://files.catbox.moe/w7olag.png", // 大惊失色
    "https://files.catbox.moe/ydyx59.png", // 难过
    "https://files.catbox.moe/69kl2l.png", // 爆哭
    "https://files.catbox.moe/nhtazq.png", // 自闭
    "https://files.catbox.moe/cq6ipd.png", // 摆烂
    "https://files.catbox.moe/do83tr.png", // 那又如何
    "https://files.catbox.moe/32ql1h.png", // 思考
    "https://files.catbox.moe/x5u5sm.png", // 爱你
    "https://files.catbox.moe/bsomey.png", // 害羞
    "https://files.catbox.moe/f4ogyw.png", // 投降
    "https://files.catbox.moe/b5egx6.png", // 生气
    "https://files.catbox.moe/duzx7n.png", // 晚安
    "https://files.catbox.moe/p67llx.png", // 爱你
    "https://files.catbox.moe/xsmgb0.png", // 生气
    "https://files.catbox.moe/6u5ch8.png", // 睡会儿/困
    "https://files.catbox.moe/4oeevo.png", // 精神涣散
    "https://files.catbox.moe/gs9ppe.png", // 多喝热水
    "https://files.catbox.moe/7yejey.png", // 吐魂
    "https://files.catbox.moe/fuyq6d.png", // 打哈欠/好困
    "https://files.catbox.moe/kq9i8f.png", // 大脑过载
    "https://files.catbox.moe/6eyzlg.png", // 已老实
    "https://files.catbox.moe/324d33.png", // 我想想
    "https://files.catbox.moe/pfnrya.png", // 按头
    "https://files.catbox.moe/00lj4d.png", // 无语
    "https://files.catbox.moe/dbyrdf.png", // 爆哭
    "https://files.catbox.moe/81c7qy.png", // 期待
    "https://files.catbox.moe/h1kt1u.png", // 捏爆地球
    "https://files.catbox.moe/i0ov5h.png", // 眼睛亮晶晶/期待
    "https://files.catbox.moe/wnr64t.png", // 不要和我说话
    "https://files.catbox.moe/itw2h1.png", // 不对劲
    "https://files.catbox.moe/w206rr.png", // 啧
    "https://files.catbox.moe/rw1cfk.png", // 哭哭
    "https://files.catbox.moe/7fwfte.png", // 讨好
    "https://files.catbox.moe/to45ts.png", // 问号
    "https://files.catbox.moe/9za97q.png", // 盯——
    "https://files.catbox.moe/9b800k.png", // “草”
    "https://files.catbox.moe/q7683x.png", // 震惊
    "https://files.catbox.moe/u94gd8.png", // 委屈哭哭
    "https://files.catbox.moe/ne6dii.png", // 爱心
    "https://files.catbox.moe/72wkme.png", // 偷看你
    "https://files.catbox.moe/hgfgj3.png", // 老实
    "https://files.catbox.moe/nh9r23.png", // 泪流成河
    "https://files.catbox.moe/si6f0k.png", // 炸毛生气
    "https://files.catbox.moe/r6g32h.png", // 我恨
    "https://files.catbox.moe/d41e2q.png", // 大脑短路
    "https://files.catbox.moe/8ejal5.png", // 打电话哭哭
    "https://files.catbox.moe/9lmwuz.png", // 揉脸
    "https://files.catbox.moe/r26gox.png", // 这是屎吗
    "https://files.catbox.moe/3xu8xr.png", // 哀怨/不满
    "https://files.catbox.moe/2fskww.png", // 生气/不满
    "https://files.catbox.moe/skv9p6.png", // 满脸疑惑
    "https://files.catbox.moe/0bmbi0.png", // 哈特软软/好喜欢
    "https://files.catbox.moe/71kn5e.png", // OK
    "https://files.catbox.moe/sgkcwv.png", // 被训
    "https://files.catbox.moe/1n905b.png", // 哀怨/生闷气
    "https://files.catbox.moe/9p0x2t.png", // 蹭蹭/撒娇
    "https://files.catbox.moe/opqz7o.png", // 喜欢
    "https://files.catbox.moe/t2e0nt.png", // 嫌弃
    "https://files.catbox.moe/26xc9h.png", // 被吓一跳
    "https://files.catbox.moe/zt4t1s.png", // 心虚
    "https://files.catbox.moe/l68nws.png", // 淋雨哭泣
    "https://files.catbox.moe/7wbc1d.png", // 睡了
    "https://files.catbox.moe/wgkwjh.png", // 无语
    "https://files.catbox.moe/o8td90.png", // 升天了
    "https://files.catbox.moe/3s5ipf.png", // 非常认可
    "https://files.catbox.moe/z25fao.png", // 竖中指
    "https://files.catbox.moe/8eaawd.png"  // 尴尬
];

    const State = {
        contacts: {}, 
        currentChat: null,
        isOpen: false,
        isDragging: false,
        showEmoji: false
    };

    function init() {
        console.log("[OW Phone] Init v1.3 - Auto Greeting Fix");
        loadData();
        
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
        startMessageListener();
        renderContactList();
    }

    function bindEvents() {
        $('#ow-phone-toggle').click(() => togglePhone(true));
        $('#ow-close-btn').click(() => togglePhone(false));
        $('#ow-back-btn').click(() => { renderContactList(); });

        $('#ow-add-btn').click(() => {
            const name = prompt("【添加好友】请输入对方的名字：");
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

    function appendToMainInput(text) {
        const textarea = document.getElementById('send_textarea');
        if (!textarea) return;
        let currentVal = textarea.value;
        if (currentVal.length > 0 && !currentVal.endsWith('\n')) currentVal += '\n';
        textarea.value = currentVal + text;
        textarea.dispatchEvent(new Event('input', { bubbles: true }));
        textarea.focus();
        toastr.info(`短信指令已填入输入框`);
    }

    function handleUserSend() {
        const input = document.getElementById('ow-input');
        const text = input.value.trim();
        const target = State.currentChat;
        if (!text || !target) return;

        // 1. 本地上屏 (伪造)
        addMessageLocal(target, text, 'sent');
        input.value = '';

        // 2. 填入指令
        const command = `[SMS: ${target} | ${text}]`;
        appendToMainInput(command);
    }

    function sendEmoji(url) {
        const target = State.currentChat;
        if (!target) return;
        const imgHtml = `<img src="${url}" class="ow-msg-img">`;
        addMessageLocal(target, imgHtml, 'sent');
        $('#ow-emoji-panel').hide();
        const command = `[SMS: ${target} | [发送了一个表情包]]`;
        appendToMainInput(command);
    }

    // === 数据逻辑 ===
    function addMessageLocal(name, content, type) {
        if (!State.contacts[name]) {
            State.contacts[name] = { messages: [], unread: 0, color: getRandomColor() };
        }
        
        // 防重检查：如果最后一条消息内容和类型都一样，且时间间隔很短，则不添加
        const messages = State.contacts[name].messages;
        const lastMsg = messages.length > 0 ? messages[messages.length - 1] : null;
        
        // 这里做一个简单的防重，防止 Listener 和 本地添加 撞车
        if (lastMsg && lastMsg.content === content && lastMsg.type === type) {
            // 如果是刚刚发的（5秒内），忽略
            if (Date.now() - lastMsg.time < 5000) return; 
        }

        messages.push({ type: type, content: content, time: Date.now() });

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

    // === 核心修复：允许 AI 代表 User 发送 ===
    function startMessageListener() {
        const observer = new MutationObserver(() => {
            const lastMsgEl = $('.mes_text').last();
            if (lastMsgEl.length === 0) return;
            const text = lastMsgEl.text();
            
            // 1. 自动加好友
            let match;
            const addRegex = /\[ADD_CONTACT:\s*(.+?)\]/g;
            while ((match = addRegex.exec(text)) !== null) {
                const name = match[1].trim();
                // 只有当好友不存在时才提示，避免重复弹窗
                if (!State.contacts[name]) {
                    State.contacts[name] = { messages: [], unread: 0, color: getRandomColor() };
                    saveData();
                    toastr.success(`📱 自动添加好友: ${name}`);
                    if(State.isOpen && !State.currentChat) renderContactList();
                }
            }

            // 2. 消息监听 (User 和 NPC 全都要)
            // 现在的正则会匹配 [SMS: 任何人 | 内容]
            const smsRegex = /\[SMS:\s*(.+?)\s*\|\s*(.+?)\]/g;
            while ((match = smsRegex.exec(text)) !== null) {
                const sender = match[1].trim();
                const content = match[2].trim();
                
                // 判断发送者
                let type = 'recv';
                let target = sender; // 默认对方是 sender

                // 如果发送者是 '我' / 'User' / '{{user}}'
                // 说明这是 AI 代替 User 发的（自动问候），或者是 User 手动发的（回显）
                if (sender === '我' || sender.toLowerCase() === 'user' || sender === 'User') {
                    type = 'sent';
                    // 这种情况下，我们需要知道发给谁...
                    // 尴尬点：[SMS: User | 内容] 没有指定接收者！
                    // 解决方案：通常这种自动问候紧跟在 ADD_CONTACT 之后。
                    // 或者我们默认发给“当前上下文里提到的那个人”。
                    
                    // *修正策略*：为了避免逻辑混乱，我们假设自动问候是发给"刚刚添加的那个人"
                    // 或者，我们在 Prompt 里要求 AI 写成 [SMS: {{user}}->角色名 | 内容]？
                    // 不，那样太复杂。
                    
                    // 最简单的修正：
                    // 如果 AI 输出了 [SMS: User | 内容]，我们就把它归类为 "发给当前聊天窗口的人" 
                    // 或者 "最近一个 ADD_CONTACT 的人"。
                    
                    // 这里做一个简单的回退：如果检测到是 User 发的，且当前没有明确目标，
                    // 我们尝试去 recent contact 里找。
                    
                    // 但为了代码简单，我们先假设 AI 会严格按照 ADD_CONTACT -> SMS 的顺序。
                    // 我们可以去 State.contacts 里找最近更新的一个人。
                    
                    // 更加稳妥的方法：
                    // 让 AI 输出 [SMS: User->角色 | 内容]。如果不改 Prompt，
                    // 我们可以暂时把 User 发的消息归档给 "最近联系人" 或者 "State.currentChat"
                    
                    // 如果实在不知道发给谁，就暂存到 System 或 忽略。
                    // 但在这里，因为是扫码场景，我们假设发给“刚刚加的那个人”。
                    
                    // *Hack*: 遍历刚才正则捕获的 addMatch (如果存在)
                    // 但 regex exec 是独立的。
                    
                    // 让我们换个思路：如果 sender 是 User，我们忽略？
                    // 不，你说要体现。
                    
                    // 既然是扫码场景，对方一定是刚刚加的。
                    // 我们查找最近 1 秒内创建的联系人？
                    // 或者，我们仅仅依靠“当前打开的窗口”？
                    
                    // 算了，为了不让代码过于复杂，我们采用“双向绑定判定”：
                    // 如果上一条指令是 ADD_CONTACT: X，那么这条 SMS: User 就是发给 X 的。
                    
                    // 这里我们简化处理：如果是 User 发的，我们尝试获取当前聊天对象，或者最近添加的对象。
                    // 这是一个妥协。
                    
                    if (State.currentChat) {
                        target = State.currentChat;
                    } else {
                        // 找最近一个联系人
                        const names = Object.keys(State.contacts);
                        if (names.length > 0) target = names[names.length - 1]; // 最后添加的
                        else return; // 没好友，没法发
                    }
                }

                // 执行添加 (带防重)
                // 这里的 target 变成了接收者(如果是我发的) 或 发送者(如果是对方发的)
                // 统称为 "对话对象"
                addMessageLocal(target, content, type);
            }
        });

        const chatLog = document.getElementById('chat');
        if (chatLog) observer.observe(chatLog, { childList: true, subtree: true });
        else setTimeout(startMessageListener, 2000);
    }

    // ... (UI 渲染和工具函数保持 v1.2 不变) ...
    // 为节省篇幅，这里复用 v1.2 的 renderChat, renderContactList 等函数
    // 实际文件请务必保留 style.css 和完整的 render 函数
    
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
            body.append(item);
        });
    }

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
        msgs.forEach(msg => {
            const isMe = msg.type === 'sent';
            const div = $(`<div class="ow-msg ${isMe ? 'ow-msg-right' : 'ow-msg-left'}">${msg.content}</div>`);
            view.append(div);
        });
        body.append(view);
        body[0].scrollTop = body[0].scrollHeight;
    }

    function renderEmojiPanel() {
        const panel = $('#ow-emoji-panel');
        panel.empty();
        EMOJI_LIST.forEach(url => {
            const img = $(`<img src="${url}" class="ow-emoji-item">`);
            img.click(() => sendEmoji(url));
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
