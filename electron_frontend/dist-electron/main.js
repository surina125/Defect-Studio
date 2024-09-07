import { app as n, BrowserWindow as l, Menu as t } from "electron";
import { fileURLToPath as m } from "node:url";
import o from "node:path";
const i = o.dirname(m(import.meta.url));
process.env.APP_ROOT = o.join(i, "..");
const r = process.env.VITE_DEV_SERVER_URL, _ = o.join(process.env.APP_ROOT, "dist-electron"), s = o.join(process.env.APP_ROOT, "dist");
process.env.VITE_PUBLIC = r ? o.join(process.env.APP_ROOT, "public") : s;
let e;
function a() {
  e = new l({
    icon: o.join(process.env.VITE_PUBLIC, "electron-vite.svg"),
    autoHideMenuBar: !0,
    // 메뉴 바 숨기기
    webPreferences: {
      preload: o.join(i, "preload.mjs"),
      nodeIntegration: !1,
      // Node.js 통합 비활성화
      contextIsolation: !0
      // 메인 프로세스와 렌더러 프로세스 격리
    }
  });
  const c = [
    {
      label: "Edit",
      submenu: [
        {
          role: "zoomIn",
          accelerator: "CmdOrCtrl+="
          // 줌 인
        },
        {
          role: "zoomOut",
          accelerator: "CmdOrCtrl+-"
          // 줌 아웃
        }
      ]
    },
    {
      label: "View",
      submenu: [
        {
          role: "reload",
          accelerator: "CmdOrCtrl+R"
          // 새로고침
        },
        {
          role: "forceReload",
          accelerator: "CmdOrCtrl+Shift+R"
          // 강력 새로고침
        },
        {
          role: "toggleDevTools",
          accelerator: "CmdOrCtrl+Shift+I"
          // 개발자 도구 열기/닫기
        }
      ]
    }
  ], d = t.buildFromTemplate(c);
  t.setApplicationMenu(d), e.webContents.on("did-finish-load", () => {
    e == null || e.webContents.send("main-process-message", (/* @__PURE__ */ new Date()).toLocaleString());
  }), r ? e.loadURL(r) : e.loadFile(o.join(s, "index.html"));
}
n.on("window-all-closed", () => {
  process.platform !== "darwin" && (n.quit(), e = null);
});
n.on("activate", () => {
  l.getAllWindows().length === 0 && a();
});
n.whenReady().then(a);
export {
  _ as MAIN_DIST,
  s as RENDERER_DIST,
  r as VITE_DEV_SERVER_URL
};
