(() => {
  const api = (window as any).petAPI;

  const pet = document.getElementById("pet");
  if (!pet) {
    console.error("No se encontró el elemento #pet");
    return;
  }

  pet.addEventListener("dragstart", (e) => e.preventDefault());

  pet.addEventListener("mousedown", (e) => {
    if (e.button !== 0) return;
    e.preventDefault();
    api.startDrag(); // ← antes decía petAPI.startDrag()
  });

  window.addEventListener("mouseup", () => {
    api.endDrag(); // ← antes decía petAPI.endDrag()
  });
})();
