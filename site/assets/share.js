function copyText(value) {
  if (!value) return Promise.reject(new Error("No URL provided"));

  if (navigator.clipboard && navigator.clipboard.writeText) {
    return navigator.clipboard.writeText(value);
  }

  return new Promise((resolve, reject) => {
    const textarea = document.createElement("textarea");
    textarea.value = value;
    textarea.setAttribute("readonly", "true");
    textarea.style.position = "absolute";
    textarea.style.left = "-9999px";
    document.body.appendChild(textarea);
    textarea.select();

    try {
      const successful = document.execCommand("copy");
      document.body.removeChild(textarea);
      if (successful) {
        resolve();
      } else {
        reject(new Error("Copy command was blocked"));
      }
    } catch (error) {
      document.body.removeChild(textarea);
      reject(error);
    }
  });
}

function updateStatus(source, message) {
  if (!source) return;
  source.textContent = message;
}

function handleCopy(event) {
  const button = event.currentTarget;
  const url = button?.dataset?.shareUrl;
  const status = button.closest("[data-share]")?.querySelector("[data-share-status]");

  if (!url) {
    updateStatus(status, "Missing link to copy.");
    return;
  }

  button.disabled = true;
  updateStatus(status, "Copying…");

  copyText(url)
    .then(() => {
      updateStatus(status, "Link copied.");
    })
    .catch(() => {
      updateStatus(status, "Unable to copy. Please copy manually.");
    })
    .finally(() => {
      button.disabled = false;
      button.focus();
    });
}

function initShareButtons() {
  const copyButtons = document.querySelectorAll("[data-share-copy]");
  if (!copyButtons.length) return;

  copyButtons.forEach((button) => {
    button.addEventListener("click", handleCopy);
  });
}

document.addEventListener("DOMContentLoaded", initShareButtons);
