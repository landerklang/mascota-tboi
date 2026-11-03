import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("petAPI", {
  startDrag: () => ipcRenderer.send("drag-start"),
  endDrag: () => ipcRenderer.send("drag-end"),
  resizeWindow: (bounds: {
    x: number;
    y: number;
    width: number;
    height: number;
  }) => ipcRenderer.send("resize-window", bounds),
  closeApp: () => ipcRenderer.send("close-app"), // <-- NUEVO
});
