function isEssayHidden(data = {}) {
  const visibility = typeof data.visibility === "string" ? data.visibility.trim().toLowerCase() : "";
  if (["hidden", "private", "internal"].includes(visibility)) {
    return true;
  }

  if (data.listed === false) {
    return true;
  }

  return false;
}

function isEssayPublic(data = {}) {
  return !isEssayHidden(data);
}

module.exports = {
  isEssayHidden,
  isEssayPublic,
};
