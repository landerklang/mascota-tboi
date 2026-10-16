import { app, BrowserWindow, ipcMain, screen } from "electron";
import * as path from "path";

let win: BrowserWindow | null = null;
let dragInterval: ReturnType<typeof setInterval> | null = null;
let dragOffset = { x: 0, y: 0 };

function createWindow() {
  win = new BrowserWindow({
    width: 200,
    height: 200,
    transparent: true,
    frame: false, // sin bordes
    alwaysOnTop: true, // siempre encima
    resizable: false,
    skipTaskbar: true, // no aparece en la barra de tareas
    hasShadow: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  win.loadFile(path.join(__dirname, "renderer/index.html"));

  // win.webContents.openDevTools({ mode: "detach" });

  // Escucha cuando el renderer pide empezar el arrastre
  ipcMain.on("drag-start", () => {
    if (!win) return;

    const cursor = screen.getCursorScreenPoint();
    const bounds = win.getBounds();

    // Calculamos cuánto está el cursor desplazado respecto a la esquina de la ventana
    dragOffset = { x: cursor.x - bounds.x, y: cursor.y - bounds.y };

    // Bucle que actualiza la posición de la ventana mientras se arrastra
    dragInterval = setInterval(() => {
      if (!win) return;
      const p = screen.getCursorScreenPoint();
      win.setPosition(p.x - dragOffset.x, p.y - dragOffset.y);
    }, 10); // cada 10ms = bastante fluido
  });

  // Escucha cuando el renderer dice que soltaste el ratón
  ipcMain.on("drag-end", () => {
    if (dragInterval) {
      clearInterval(dragInterval);
      dragInterval = null;
    }
  });
}

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
