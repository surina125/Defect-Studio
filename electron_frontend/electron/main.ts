import { app, BrowserWindow, Menu, MenuItemConstructorOptions } from 'electron';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

process.env.APP_ROOT = path.join(__dirname, '..');

export const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL'];
export const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist-electron');
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist');

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path.join(process.env.APP_ROOT, 'public') : RENDERER_DIST;

let win: BrowserWindow | null;

// Electron 창을 생성하는 함수
function createWindow() {
  win = new BrowserWindow({
    icon: path.join(process.env.VITE_PUBLIC, 'electron-vite.svg'),
    autoHideMenuBar: true, // 메뉴 바 숨기기
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'),
      nodeIntegration: false, // Node.js 통합 비활성화
      contextIsolation: true  // 메인 프로세스와 렌더러 프로세스 격리
    }
  });

  // 메뉴 바를 숨긴 상태에서 단축키만 설정
  const menuTemplate: MenuItemConstructorOptions[] = [
    {
      label: 'Edit',
      submenu: [
        {
          role: 'zoomIn',
          accelerator: 'CmdOrCtrl+=' // 줌 인
        },
        {
          role: 'zoomOut',
          accelerator: 'CmdOrCtrl+-' // 줌 아웃
        }
      ]
    },
    {
      label: 'View',
      submenu: [
        {
          role: 'reload',
          accelerator: 'CmdOrCtrl+R' // 새로고침
        },
        {
          role: 'forceReload',
          accelerator: 'CmdOrCtrl+Shift+R' // 강력 새로고침
        },
        {
          role: 'toggleDevTools',
          accelerator: 'CmdOrCtrl+Shift+I' // 개발자 도구 열기/닫기
        }
      ]
    }
  ];

  // 메뉴 설정 및 숨기기
  const menu = Menu.buildFromTemplate(menuTemplate);
  Menu.setApplicationMenu(menu);

  // Test active push message to Renderer-process.
  win.webContents.on('did-finish-load', () => {
    win?.webContents.send('main-process-message', new Date().toLocaleString());
  });

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL);
  } else {
    win.loadFile(path.join(RENDERER_DIST, 'index.html'));
  }
}

// 모든 창이 닫혔을 때 애플리케이션 종료
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
    win = null;
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

app.whenReady().then(createWindow);
