import {
  app,
  BrowserWindow,
  ipcMain,
  screen,
  Tray,
  Menu,
  nativeImage,
} from "electron";
import * as path from "path";
import * as fs from "fs";

let tray: Tray | null = null;
let trayAnimation: ReturnType<typeof setInterval> | null = null;
let trayFrames: Electron.NativeImage[] = [];
let currentFrame = 0;
let win: BrowserWindow | null = null;
let dragInterval: ReturnType<typeof setInterval> | null = null;
let dragOffset = { x: 0, y: 0 };

// Variables para controlar el estado de la animación
let isTrayAnimating = false;

function createWindow() {
  win = new BrowserWindow({
    width: 100,
    height: 100,
    transparent: true,
    frame: false,
    alwaysOnTop: true,
    resizable: true,
    skipTaskbar: true,
    hasShadow: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  win.loadFile(path.join(__dirname, "renderer/index.html"));

  // --- Lógica para ocultar en la bandeja al intentar cerrar ---
  win.on("close", (event) => {
    if (!(app as any).isQuitting) {
      event.preventDefault();
      win?.hide();
    }
  });

  // --- ¡LA MAGIA DE LA OPTIMIZACIÓN! ---
  // Cuando la ventana se oculta, el icono empieza a bailar
  win.on("hide", () => {
    startTrayAnimation();
  });

  // Cuando la ventana se muestra, el icono se queda quieto
  win.on("show", () => {
    stopTrayAnimation();
  });

  // Escucha cuando el renderer pide minimizar
  ipcMain.on("minimize-to-tray", () => {
    win?.hide();
  });

  // ... (tus otros ipcMain.on de resize-window, drag-start, drag-end se mantienen igual)
  ipcMain.on(
    "resize-window",
    (
      _event,
      bounds: { x: number; y: number; width: number; height: number },
    ) => {
      if (!win) return;
      win.setBounds({
        x: Math.round(bounds.x),
        y: Math.round(bounds.y),
        width: Math.round(bounds.width),
        height: Math.round(bounds.height),
      });
    },
  );

  ipcMain.on("drag-start", () => {
    if (!win) return;
    const cursor = screen.getCursorScreenPoint();
    const bounds = win.getBounds();
    dragOffset = { x: cursor.x - bounds.x, y: cursor.y - bounds.y };

    dragInterval = setInterval(() => {
      if (!win) return;
      const p = screen.getCursorScreenPoint();
      win.setPosition(p.x - dragOffset.x, p.y - dragOffset.y);
    }, 10);
  });

  ipcMain.on("drag-end", () => {
    if (dragInterval) {
      clearInterval(dragInterval);
      dragInterval = null;
    }
  });
}

function createTray() {
  const framesDir = path.join(__dirname, "renderer/imagenes/azazel/dance");
  trayFrames = [];

  if (fs.existsSync(framesDir)) {
    const files = fs
      .readdirSync(framesDir)
      .filter((f) => f.endsWith(".png") || f.endsWith(".gif"))
      .sort();

    for (const file of files) {
      const imgPath = path.join(framesDir, file);
      const img = nativeImage.createFromPath(imgPath);
      trayFrames.push(img.resize({ width: 16, height: 16 }));
    }
  }

  if (trayFrames.length === 0) {
    console.warn("⚠️ No se encontraron imágenes en la carpeta de la bandeja.");
    return;
  }

  // Creamos el Tray con la primera imagen (estática)
  tray = new Tray(trayFrames[0]!);
  tray.setToolTip("Azazel está bailando");

  const contextMenu = Menu.buildFromTemplate([
    { label: "Mostrar Mascota", click: () => win?.show() },
    { type: "separator" },
    {
      label: "Salir",
      click: () => {
        (app as any).isQuitting = true;
        app.quit();
      },
    },
  ]);
  tray.setContextMenu(contextMenu);

  // Clic en el icono para mostrar/ocultar
  tray.on("click", () => {
    if (win?.isVisible()) {
      win.hide(); // Esto disparará automáticamente win.on("hide")
    } else {
      win?.show(); // Esto disparará automáticamente win.on("show")
    }
  });
}

// --- Funciones de control de la animación ---
function startTrayAnimation() {
  // Si ya está animando o no hay imágenes, no hacemos nada
  if (isTrayAnimating || !tray || trayFrames.length <= 1) return;

  isTrayAnimating = true;
  trayAnimation = setInterval(() => {
    if (!tray) return;
    currentFrame = (currentFrame + 1) % trayFrames.length;
    tray.setImage(trayFrames[currentFrame]!);
  }, 70);
}

function stopTrayAnimation() {
  if (!isTrayAnimating || !tray) return;

  isTrayAnimating = false;
  if (trayAnimation) {
    clearInterval(trayAnimation);
    trayAnimation = null;
  }

  // Al detenerse, volvemos a poner la imagen estática (el primer frame)
  tray.setImage(trayFrames[0]!);
  currentFrame = 0; // Reiniciamos el contador
}

// Asegúrate de detener la animación cuando la app se cierre
app.on("before-quit", () => {
  (app as any).isQuitting = true;
  stopTrayAnimation();
});

ipcMain.on("close-app", () => {
  if (win) {
    (app as any).isQuitting = true;
    win.close();
  }
});

app.whenReady().then(() => {
  createWindow();
  createTray();

  // Como la ventana acaba de iniciar, nos aseguramos de que el icono esté quieto
  // (Nota: La ventana al iniciar se muestra, así que el evento 'show' podría no dispararse solo).
  // Lo dejamos quieto por defecto.
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
