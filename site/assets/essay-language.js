const LANGUAGE_LABELS = {
  en: "English",
  nl: "Nederlands",
};

function languageLabel(code) {
  const normalized = String(code || "en").trim().toLowerCase();
  return LANGUAGE_LABELS[normalized] || normalized;
}

function addLanguageDetail() {
  const propertyList = document.querySelector(".essay-sidebar .essay-property-list");
  if (!propertyList || propertyList.querySelector("[data-language-detail]")) return;

  const code = document.documentElement.lang || "en";
  const row = document.createElement("div");
  row.dataset.languageDetail = "";

  const term = document.createElement("dt");
  term.textContent = "Language";

  const description = document.createElement("dd");
  description.textContent = languageLabel(code);

  row.append(term, description);

  const authorRow = Array.from(propertyList.children).find((child) => child.querySelector("dt")?.textContent === "Author");
  if (authorRow) {
    authorRow.insertAdjacentElement("afterend", row);
  } else {
    propertyList.prepend(row);
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", addLanguageDetail, { once: true });
} else {
  addLanguageDetail();
}
