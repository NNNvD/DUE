function registerErrorHandlers(label = "script") {
  const prefix = `[${label}]`;

  process.on("uncaughtException", error => {
    console.error(`${prefix} Uncaught Exception:`, error);
    process.exit(1);
  });

  process.on("unhandledRejection", reason => {
    console.error(`${prefix} Unhandled Rejection:`, reason);
    process.exit(1);
  });
}

module.exports = { registerErrorHandlers };
