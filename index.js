// ==================================================================================
// 脚本名称: ST-iOS-Phone Loader (最终路径修复版)
// 作用: 自动识别安装路径，修复 currentScript 为 null 的问题
// ==================================================================================

// 1. 在任何异步操作开始前，立即获取当前脚本路径
const scriptTag = document.currentScript || (function() {
    // 备用方案：如果 currentScript 失效，暴力搜索包含 st-ios-phone 的脚本标签
    const scripts = document.getElementsByTagName('script');
    for (let i = 0; i < scripts.length; i++) {
        if (scripts[i].src && (scripts[i].src.includes('st-ios-phone') || scripts[i].src.includes('iOS')) && scripts[i].src.endsWith('index.js')) {
            return scripts[i];
        }
    }
    return null;
})();

(async function () {
    if (!scriptTag) {
        console.error('❌ ST-iOS-Phone: 无法定位安装路径，请检查文件夹名称是否包含 "st-ios-phone"');
        return;
    }

    // 2. 提取路径 (去掉结尾的 index.js)
    const fullUrl = scriptTag.src;
    const EXTENSION_PATH = fullUrl.substring(0, fullUrl.lastIndexOf('/') + 1);
    
    console.log(`📱 ST-iOS-Phone: 路径锁定 -> ${EXTENSION_PATH}`);

    // 3. 模块列表
    const modules = [
        "config.js",
        "view.js",
        "core.js"
    ];

    // 初始化全局命名空间
    window.ST_PHONE = window.ST_PHONE || {
        state: {
            contacts: [],
            activeContactId: null,
            isPhoneOpen: false,
            isDragging: false 
        },
        ui: {},     
        config: {}  
    };

    function loadScript(filename) {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = EXTENSION_PATH + filename + '?v=' + Date.now();
            script.onload = resolve;
            script.onerror = () => {
                console.error(`❌ ST-iOS-Phone: 加载失败 -> ${filename}`);
                reject(new Error(`Failed to load ${filename}`));
            };
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
