import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("petAPI", {
  startDrag: () => ipcRenderer.send("drag-start"),
  endDrag: () => ipcRenderer.send("drag-end"),
});
