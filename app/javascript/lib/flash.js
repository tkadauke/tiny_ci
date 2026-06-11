const FLASH_STORAGE_KEY = "tiny_ci.flash";

export function storeFlash(type, message) {
  sessionStorage.setItem(FLASH_STORAGE_KEY, JSON.stringify({ type, message }));
}

export function renderStoredFlash() {
  const rawFlash = sessionStorage.getItem(FLASH_STORAGE_KEY);
  if (!rawFlash) return;

  sessionStorage.removeItem(FLASH_STORAGE_KEY);

  let flash;
  try {
    flash = JSON.parse(rawFlash);
  } catch (_error) {
    return;
  }

  if (!flash?.message || document.getElementById("flash")) return;

  const body = document.getElementById("body");
  if (!body) return;

  const flashElement = document.createElement("div");
  flashElement.id = "flash";
  flashElement.className = flash.type === "error" ? "error" : "notice";
  flashElement.append(document.createTextNode(flash.message));

  const closeLink = document.createElement("a");
  closeLink.href = "#";
  closeLink.textContent = "Close";
  closeLink.addEventListener("click", (event) => {
    event.preventDefault();
    flashElement.style.display = "none";
  });
  flashElement.append(closeLink);

  body.prepend(flashElement);
}
