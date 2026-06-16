const authRoutes = require("../features/auth/routes");
const userRoutes = require("../features/users/routes");
const branchRoutes = require("../features/branches/routes");
const subjectRoutes = require("../features/subjects/routes");
const topicRoutes = require("../features/topics/routes");
const questionRoutes = require("../features/questions/routes");
const tagRoutes = require("../features/tags/routes");
const testRoutes = require("../features/tests/routes");
const attemptRoutes = require("../features/attempts/routes");
const questionStatusRoutes = require("../features/question-status/routes");
const bookmarkRoutes = require("../features/bookmarks/routes");
const mistakeBookRoutes = require("../features/mistake-book/routes");
const feedbackRoutes = require("../features/question-feedback/routes");
const reportRoutes = require("../features/question-reports/routes");
const analyticsRoutes = require("../features/analytics/routes");
const adminRoutes = require("../features/admin/routes");

function registerRoutes(app) {
  app.use("/api/v1/auth", authRoutes);
  app.use("/api/v1/users", userRoutes);
  app.use("/api/v1/branches", branchRoutes);
  app.use("/api/v1/subjects", subjectRoutes);
  app.use("/api/v1/topics", topicRoutes);
  app.use("/api/v1/questions", questionRoutes);
  app.use("/api/v1/tags", tagRoutes);
  app.use("/api/v1/tests", testRoutes);
  app.use("/api/v1/attempts", attemptRoutes);
  app.use("/api/v1/question-status", questionStatusRoutes);
  app.use("/api/v1/bookmarks", bookmarkRoutes);
  app.use("/api/v1/mistake-book", mistakeBookRoutes);
  app.use("/api/v1/question-feedback", feedbackRoutes);
  app.use("/api/v1/question-reports", reportRoutes);
  app.use("/api/v1/analytics", analyticsRoutes);
  app.use("/api/v1/admin", adminRoutes);
}

module.exports = { registerRoutes };
