// ==================================================================================
// 脚本名称: ST-iOS-Phone Loader (自动寻路修复版)
// 作用: 按顺序加载模块，自动识别当前安装目录，无需手动改名
// ==================================================================================

(async function () {
    // --- 核心修复：自动获取当前脚本所在的路径 ---
    // 既然 index.js 正在运行，document.currentScript 就是它自己
    // 我们直接拿它的 src，去掉结尾的 "index.js"，就是正确的文件夹路径
    const currentScript = document.currentScript;
    const fullUrl = currentScript.src;
    // 确保以 / 结尾
    const EXTENSION_PATH = fullUrl.substring(0, fullUrl.lastIndexOf('/') + 1);
    
    console.log(`📱 ST-iOS-Phone: 检测到安装路径为 -> ${EXTENSION_PATH}`);

    // 模块列表 (顺序很重要：先配置，再界面，最后逻辑)
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
            // 使用自动获取的路径拼接文件名
            script.src = EXTENSION_PATH + filename + '?v=' + Date.now();
            script.onload = resolve;
            script.onerror = () => {
                console.error(`❌ ST-iOS-Phone: 无法加载 ${filename}，请检查文件是否存在于 ${EXTENSION_PATH}`);
                reject(new Error(`Failed to load ${filename}`));
            };
            document.head.appendChild(script);
        });
    }

    try {
        console.log('📱 ST-iOS-Phone: 开始加载模块...');
        for (const file of modules) {
            await loadScript(file);
        }
        console.log('📱 ST-iOS-Phone: 启动成功 (自动路径版)');
    } catch (err) {
        console.error('📱 ST-iOS-Phone: 启动被终止', err);
    }
})();
