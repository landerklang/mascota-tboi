(() => {
  const api = (window as any).petAPI;

  const pet = document.getElementById("pet")!;
  const hub = document.getElementById("hub")!;
  const selectionBox = document.getElementById("selection-box")!;
  // ... (tus variables anteriores)
  const btnClose = document.getElementById("btn-close")!; // <-- Añade esto

  let isDragging = false;
  let isResizing = false;
  let hasMoved = false;
  let clickStartedOnImage = false; // <-- NUEVA VARIABLE CLAVE

  let startX = 0;
  let startY = 0;

  let startBounds = { x: 0, y: 0, width: 0, height: 0 };
  let currentDir = "";

  // --- 1. Clic y Arrastre ---
  pet.addEventListener("mousedown", (e) => {
    if (e.button !== 0) return;
    e.preventDefault();

    isDragging = true;
    hasMoved = false;

    // Comprobamos si el clic fue directamente en la imagen o en el div del fondo
    clickStartedOnImage = (e.target as HTMLElement).tagName === "IMG";

    startX = e.screenX;
    startY = e.screenY;

    // Si el menú está abierto, no hacemos arrastre (para que no se mueva al pulsar botones)
    if (!hub.classList.contains("hidden")) return;

    api.startDrag();
  });

  // --- Lógica del botón de cerrar ---
  btnClose.addEventListener("click", (e) => {
    e.stopPropagation(); // Evita que el clic se propague al fondo
    api.closeApp(); // Llama a Electron para cerrar
  });

  window.addEventListener("mousemove", (e) => {
    if (isDragging) {
      if (
        Math.abs(e.screenX - startX) > 5 ||
        Math.abs(e.screenY - startY) > 5
      ) {
        hasMoved = true;
      }
    }

    if (isResizing) {
      const deltaX = e.screenX - startX;
      const deltaY = e.screenY - startY;

      let newX = startBounds.x;
      let newY = startBounds.y;
      let newWidth = startBounds.width;
      let newHeight = startBounds.height;

      if (currentDir.includes("l")) {
        newX = startBounds.x + deltaX;
        newWidth = startBounds.width - deltaX;
      }
      if (currentDir.includes("r")) {
        newWidth = startBounds.width + deltaX;
      }
      if (currentDir.includes("t")) {
        newY = startBounds.y + deltaY;
        newHeight = startBounds.height - deltaY;
      }
      if (currentDir.includes("b")) {
        newHeight = startBounds.height + deltaY;
      }

      if (newWidth > 50 && newHeight > 50) {
        api.resizeWindow({
          x: newX,
          y: newY,
          width: newWidth,
          height: newHeight,
        });
      }
    }
  });

  // --- 2. Soltar el ratón ---
  window.addEventListener("mouseup", () => {
    if (isDragging && !isResizing) {
      api.endDrag();

      // SOLO abrimos/cerramos el menú si el clic empezó en la imagen y no se movió
      if (!hasMoved && clickStartedOnImage) {
        const isHidden = selectionBox.classList.toggle("hidden");
        hub.classList.toggle("hidden", isHidden);
      }
    }

    if (isResizing) {
      isResizing = false;
    }
    isDragging = false;
    clickStartedOnImage = false;
  });

  // --- 3. Redimensionado ---
  const handles = document.querySelectorAll(".handle");

  handles.forEach((handle) => {
    handle.addEventListener("mousedown", (e) => {
      e.preventDefault();
      e.stopPropagation();

      const mouseEvent = e as MouseEvent;
      isResizing = true;
      currentDir = (handle as HTMLElement).dataset.dir || "";

      startBounds = {
        x: window.screenX,
        y: window.screenY,
        width: window.innerWidth,
        height: window.innerHeight,
      };
      startX = mouseEvent.screenX;
      startY = mouseEvent.screenY;
    });
  });

  // --- 4. Ocultar si haces clic en cualquier lugar que NO sea la mascota o sus botones ---

  // A. Clics DENTRO de la ventana (en el fondo transparente)
  window.addEventListener("mousedown", (e) => {
    const target = e.target as HTMLElement;

    // Si el clic es en un puntito de redimensionar, en la imagen, o en la Hub -> No cerrar
    if (
      target.classList.contains("handle") ||
      target.tagName === "IMG" ||
      target.closest("#hub")
    ) {
      return;
    }

    // Si el clic fue en cualquier otro lado de la ventana -> Cerrar
    selectionBox.classList.add("hidden");
    hub.classList.add("hidden");
  });

  // B. Clics FUERA de la ventana (en el escritorio o en otras apps)
  window.addEventListener("blur", () => {
    selectionBox.classList.add("hidden");
    hub.classList.add("hidden");
  });
})();
