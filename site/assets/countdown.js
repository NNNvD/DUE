export function initializeCountdowns(root = document) {
  const countdownBlocks = root.querySelectorAll("[data-deadline]");
  const deadlineBadges = root.querySelectorAll("[data-deadline-badge]");

  const MS_PER_DAY = 24 * 60 * 60 * 1000;

  for (const badge of deadlineBadges) {
    const target = badge.getAttribute("data-deadline-badge");
    if (!target) continue;

    const deadline = new Date(target);
    const label = badge.getAttribute("data-deadline-label") || target;
    if (Number.isNaN(deadline.getTime())) {
      badge.textContent = label;
      badge.setAttribute("aria-label", `Publishes on ${label}`);
      continue;
    }

    const now = new Date();
    const diff = deadline.getTime() - now.getTime();
    if (diff <= 0) {
      badge.textContent = "Publishing now";
      badge.setAttribute("aria-label", `Publishing now (deadline ${label})`);
      continue;
    }

    const days = Math.ceil(diff / MS_PER_DAY);
    const suffix = days === 1 ? "day" : "days";
    badge.textContent = `${days} ${suffix} left`;
    badge.setAttribute("aria-label", `Publishes in ${days} ${suffix} on ${label}`);
  }

  for (const block of countdownBlocks) {
    const target = block.getAttribute("data-deadline");
    const display = block.querySelector("[data-countdown]");
    if (!target || !display) continue;

    if (!display.hasAttribute("aria-live")) {
      display.setAttribute("aria-live", "polite");
    }

    if (!display.hasAttribute("role")) {
      display.setAttribute("role", "status");
    }

    const deadline = new Date(target);
    if (Number.isNaN(deadline.getTime())) {
      display.textContent = `Publishes at ${target}`;
      continue;
    }

    const update = () => {
      const now = new Date();
      const diff = deadline.getTime() - now.getTime();

      if (diff <= 0) {
        display.textContent = "Publishes at the deadline (any moment now).";
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
    setInterval(update, 1000);
  }
}

initializeCountdowns();
