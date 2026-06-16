const express = require("express");
const { registerRoutes } = require("./config/routes");
const { notFoundHandler } = require("./middlewares/notFound");
const { errorHandler } = require("./middlewares/errorHandler");

function createApp() {
  const app = express();

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  registerRoutes(app);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

module.exports = { createApp };
