// Zil preload 脚本 - 暴露安全的 API 给渲染进程
const { contextBridge } = require('electron');

contextBridge.exposeInMainWorld('zil', {
  isElectron: true,
  platform: process.platform,
  versions: {
    electron: process.versions.electron,
    chrome: process.versions.chrome,
    node: process.versions.node,
  },
});
