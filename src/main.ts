import { app, BrowserWindow, ipcMain, screen } from "electron";
import * as path from "path";

let win: BrowserWindow | null = null;
let dragInterval: ReturnType<typeof setInterval> | null = null;
let dragOffset = { x: 0, y: 0 };

function createWindow() {
  win = new BrowserWindow({
    width: 100,
    height: 100,
    transparent: true,
    frame: false, // sin bordes
    alwaysOnTop: true, // siempre encima
    resizable: true,
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

  // Escucha cuando el renderer pide cambiar el tamaño de la ventana
  ipcMain.on(
    "resize-window",
    (
      _event,
      bounds: { x: number; y: number; width: number; height: number },
    ) => {
      if (!win) return;
      // setBounds actualiza posición y tamaño a la vez
      win.setBounds({
        x: Math.round(bounds.x),
        y: Math.round(bounds.y),
        width: Math.round(bounds.width),
        height: Math.round(bounds.height),
      });
    },
  );

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
