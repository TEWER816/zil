// Zil Electron 主进程（CommonJS）
// 职责：1) fork 后端子进程（避免 better-sqlite3 原生模块重编译）
//      2) 等待后端就绪 3) 创建窗口并加载前端
const { app, BrowserWindow, shell } = require('electron');
const { spawn } = require('child_process');
const path = require('path');
const http = require('http');

// 是否开发模式（通过环境变量 ELECTRON_DEV 标识）
const isDev = !!process.env.ELECTRON_DEV;

// 设置应用名（影响任务栏、About 菜单、系统通知等）
app.setName('Zil Desktop');

let mainWindow = null;
let serverProcess = null;

// ============ 启动后端子进程 ============
// 用系统独立 node 运行 server，而非 Electron 内嵌 Node
// 这样 better-sqlite3 原生模块沿用系统 Node ABI，无需为 Electron 重编译
function startServer() {
  const serverPath = path.join(__dirname, '..', 'server', 'src', 'index.js');
  const serverCwd = path.join(__dirname, '..', 'server');

  serverProcess = spawn('node', [serverPath], {
    cwd: serverCwd,
    stdio: 'pipe',
    env: { ...process.env, PORT: '3001' },
    shell: false,
  });

  serverProcess.stdout.on('data', (data) => {
    console.log(`[server] ${data.toString().trim()}`);
  });
  serverProcess.stderr.on('data', (data) => {
    console.error(`[server error] ${data.toString().trim()}`);
  });

  serverProcess.on('exit', (code) => {
    console.log(`后端进程退出，代码：${code}`);
  });
}

// 轮询健康检查，确认后端已就绪
function waitForServer(maxRetries = 30) {
  return new Promise((resolve, reject) => {
    let retries = 0;
    const check = () => {
      const req = http.get('http://localhost:3001/api/health', (res) => {
        if (res.statusCode === 200) {
          resolve();
        } else {
          retry();
        }
        res.resume();
      });
      req.on('error', retry);
      req.setTimeout(1000, () => {
        req.destroy();
        retry();
      });
    };
    const retry = () => {
      retries++;
      if (retries >= maxRetries) {
        reject(new Error('后端启动超时'));
      } else {
        setTimeout(check, 500);
      }
    };
    check();
  });
}

// ============ 创建窗口 ============
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    title: 'Zil Desktop - 舒适自律辅助',
    backgroundColor: '#0D1117',
    show: false,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  // 外部链接用系统浏览器打开
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  if (isDev) {
    // 开发模式：加载 Vite dev server
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    // 生产模式：加载构建产物
    mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// ============ 应用生命周期 ============
app.whenReady().then(async () => {
  // 打包版不启动后端（better-sqlite3 原生模块兼容问题），核心功能用 localStorage
  // 开发版启动后端用于云端同步调试
  if (!app.isPackaged) {
    startServer();
    try {
      await waitForServer();
      console.log('后端已就绪，开始创建窗口');
    } catch (err) {
      console.error(err.message);
      // 即使后端未就绪也尝试创建窗口（前端有 localStorage 回退）
    }
  }

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// 所有窗口关闭时退出（macOS 除外）
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// 退出时杀掉后端子进程
app.on('before-quit', () => {
  if (serverProcess) {
    try {
      serverProcess.kill();
    } catch (e) {
      console.error('结束后端进程失败:', e);
    }
    serverProcess = null;
  }
});
