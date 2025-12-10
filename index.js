// ==================================================================================
// 脚本名称: ST-iOS-Phone Loader (v1.8 Path Aware)
// ==================================================================================
var scriptTag = document.currentScript || (function() {
    var scripts = document.getElementsByTagName('script');
    for (var i = 0; i < scripts.length; i++) {
        var src = scripts[i].src;
        if (src && (src.includes('st-ios-phone') || src.includes('iOS')) && src.endsWith('index.js')) {
            return scripts[i];
        }
    }
    return null;
})();

(async function () {
    if (!scriptTag) return;

    const fullUrl = scriptTag.src;
    const EXTENSION_PATH = fullUrl.substring(0, fullUrl.lastIndexOf('/') + 1);
    
    // 4. 定义要加载的子模块
    const modules = ["config.js", "view.js", "core.js"];

    // 初始化全局变量
    window.ST_PHONE = window.ST_PHONE || {
        state: {
            contacts: [],
            activeContactId: null,
            isPhoneOpen: false,
            isDragging: false 
        },
        ui: {},     
        config: {},
        path: EXTENSION_PATH // <--- 【关键】这里保存了路径，方便播放声音
    };

    function loadScript(filename) {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = EXTENSION_PATH + filename + '?v=' + Date.now();
            script.onload = () => resolve();
            script.onerror = () => reject(new Error(`Failed to load ${filename}`));
            document.head.appendChild(script);
        });
    }

    try {
        console.log('📱 ST-iOS-Phone: 开始加载子模块...');
        for (const file of modules) {
            await loadScript(file);
        }
        console.log('📱 ST-iOS-Phone: 系统启动成功！');
    } catch (err) {
        console.error('📱 ST-iOS-Phone: 启动中断', err);
    }
})();
