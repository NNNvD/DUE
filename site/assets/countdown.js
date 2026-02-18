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
      badge.textContent = "Queued for publication";
      badge.setAttribute("aria-label", `Past deadline; queued for publication (deadline ${label})`);
      continue;
    }

    const days = Math.ceil(diff / MS_PER_DAY);
    const suffix = days === 1 ? "day" : "days";
    badge.textContent = `${days} ${suffix} until publication`;
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
      display.textContent = "Publication date pending.";
      continue;
    }

    const update = () => {
      const now = new Date();
      const diff = deadline.getTime() - now.getTime();

      if (diff <= 0) {
        const isHeroCounter = display.classList.contains("hero__stat-number");
        display.textContent = isHeroCounter ? "0" : "Past deadline — queued for publication.";
        return;
      }

      const days = Math.max(0, Math.ceil(diff / MS_PER_DAY));
      const suffix = days === 1 ? "day" : "days";
      display.textContent = `${days} ${suffix} until publication`;
    };

    update();
    setInterval(update, MS_PER_DAY / 12);
  }
}

initializeCountdowns();
