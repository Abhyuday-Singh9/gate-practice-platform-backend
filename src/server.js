require("dotenv").config();

const { createApp } = require("./app");

const PORT = process.env.PORT || 3000;

async function start() {
  const app = createApp();

  app.listen(PORT, () => {
    console.log(`GATE Practice Platform API running on port ${PORT}`);
  });
}

start().catch((error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});
