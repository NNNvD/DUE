const countdownBlocks = document.querySelectorAll("[data-deadline]");

for (const block of countdownBlocks) {
  const target = block.getAttribute("data-deadline");
  const display = block.querySelector("[data-countdown]");
  if (!target || !display) continue;

  const deadline = new Date(target);
  if (Number.isNaN(deadline.getTime())) {
    display.textContent = `Publishes at ${target}`;
    continue;
  }

  let timer;

  const update = () => {
    const now = new Date();
    const diff = deadline.getTime() - now.getTime();

    if (diff <= 0) {
      display.textContent = "Publishes at the deadline (any moment now).";
      if (timer) {
        clearInterval(timer);
      }
      return;
    }

    const totalSeconds = Math.floor(diff / 1000);
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    const parts = [];
    if (days) parts.push(`${days}d`);
    parts.push(`${hours.toString().padStart(2, "0")}h`);
    parts.push(`${minutes.toString().padStart(2, "0")}m`);
    parts.push(`${seconds.toString().padStart(2, "0")}s`);

    display.textContent = `Publishes in ${parts.join(" ")}`;
  };

  update();
  timer = setInterval(update, 1000);
}
