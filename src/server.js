const { createApp } = require("./app");

const app = createApp();
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`GATE Practice Platform API running on port ${PORT}`);
});
