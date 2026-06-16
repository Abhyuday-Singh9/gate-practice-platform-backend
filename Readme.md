# GATE Practice Platform Backend

This repository now contains the initial Express backend scaffold for the GATE Practice Platform.

## What Is Set Up

- Node.js + Express server
- Feature-based folder structure
- Route-only API scaffolding
- Shared `501 Not Implemented` handlers for every endpoint
- README route map based on `db.sql` and the platform requirements

## Folder Structure

```text
src/
  app.js
  server.js
  config/
    routes.js
  middlewares/
    errorHandler.js
    notFound.js
  shared/
    http/
      notImplemented.js
  features/
    auth/
    users/
    branches/
    subjects/
    topics/
    questions/
    tags/
    tests/
    attempts/
    question-status/
    bookmarks/
    mistake-book/
    question-feedback/
    question-reports/
    analytics/
    admin/
```

## Run

```bash
npm install
npm start
```

The server listens on `PORT` or defaults to `3000`.

## Base URL

All application routes are mounted under:

`/api/v1`

Health check:

- `GET /health`

## API Routes

All routes currently return `501 Not Implemented`. They exist as route contracts only.

### Auth

- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/logout`
- `POST /api/v1/auth/refresh-token`
- `POST /api/v1/auth/forgot-password`
- `POST /api/v1/auth/reset-password`
- `POST /api/v1/auth/verify-email`
- `GET /api/v1/auth/me`

### Users

- `GET /api/v1/users`
- `POST /api/v1/users`
- `GET /api/v1/users/me`
- `PATCH /api/v1/users/me`
- `GET /api/v1/users/me/stats`
- `GET /api/v1/users/:userId`
- `PATCH /api/v1/users/:userId`
- `DELETE /api/v1/users/:userId`
- `GET /api/v1/users/:userId/stats`

### Branches

- `GET /api/v1/branches`
- `POST /api/v1/branches`
- `GET /api/v1/branches/:branchId`
- `PATCH /api/v1/branches/:branchId`
- `DELETE /api/v1/branches/:branchId`
- `GET /api/v1/branches/:branchId/subjects`

### Subjects

- `GET /api/v1/subjects`
- `POST /api/v1/subjects`
- `GET /api/v1/subjects/:subjectId`
- `PATCH /api/v1/subjects/:subjectId`
- `DELETE /api/v1/subjects/:subjectId`
- `GET /api/v1/subjects/:subjectId/topics`
- `GET /api/v1/subjects/:subjectId/questions`

### Topics

- `GET /api/v1/topics`
- `POST /api/v1/topics`
- `GET /api/v1/topics/:topicId`
- `PATCH /api/v1/topics/:topicId`
- `DELETE /api/v1/topics/:topicId`
- `GET /api/v1/topics/:topicId/questions`

### Questions

- `GET /api/v1/questions`
- `POST /api/v1/questions`
- `GET /api/v1/questions/:questionId`
- `PATCH /api/v1/questions/:questionId`
- `DELETE /api/v1/questions/:questionId`
- `GET /api/v1/questions/:questionId/options`
- `POST /api/v1/questions/:questionId/options`
- `PATCH /api/v1/questions/:questionId/options/:optionId`
- `DELETE /api/v1/questions/:questionId/options/:optionId`
- `GET /api/v1/questions/:questionId/tags`
- `POST /api/v1/questions/:questionId/tags`
- `DELETE /api/v1/questions/:questionId/tags/:tagId`
- `GET /api/v1/questions/:questionId/feedback`
- `POST /api/v1/questions/:questionId/feedback`
- `GET /api/v1/questions/:questionId/reports`
- `POST /api/v1/questions/:questionId/reports`

### Tags

- `GET /api/v1/tags`
- `POST /api/v1/tags`
- `GET /api/v1/tags/:tagId`
- `PATCH /api/v1/tags/:tagId`
- `DELETE /api/v1/tags/:tagId`

### Tests

- `GET /api/v1/tests`
- `POST /api/v1/tests`
- `GET /api/v1/tests/:testId`
- `PATCH /api/v1/tests/:testId`
- `DELETE /api/v1/tests/:testId`
- `POST /api/v1/tests/:testId/attempts`
- `GET /api/v1/tests/:testId/questions`
- `POST /api/v1/tests/:testId/questions`
- `PATCH /api/v1/tests/:testId/questions/:questionId`
- `DELETE /api/v1/tests/:testId/questions/:questionId`
- `GET /api/v1/tests/:testId/attempts`

### Attempts

- `GET /api/v1/attempts`
- `GET /api/v1/attempts/:attemptId`
- `PATCH /api/v1/attempts/:attemptId`
- `POST /api/v1/attempts/:attemptId/submit`
- `GET /api/v1/attempts/:attemptId/answers`
- `POST /api/v1/attempts/:attemptId/answers`
- `PATCH /api/v1/attempts/:attemptId/answers/:answerId`
- `DELETE /api/v1/attempts/:attemptId/answers/:answerId`

### Question Status

- `GET /api/v1/question-status`
- `GET /api/v1/question-status/:userId`
- `GET /api/v1/question-status/:userId/:questionId`
- `PATCH /api/v1/question-status/:userId/:questionId`

### Bookmarks

- `GET /api/v1/bookmarks`
- `POST /api/v1/bookmarks`
- `DELETE /api/v1/bookmarks/:questionId`
- `GET /api/v1/bookmarks/:userId`

### Mistake Book

- `GET /api/v1/mistake-book`
- `POST /api/v1/mistake-book`
- `DELETE /api/v1/mistake-book/:questionId`
- `GET /api/v1/mistake-book/:userId`

### Question Feedback

- `GET /api/v1/question-feedback`
- `POST /api/v1/question-feedback`
- `GET /api/v1/question-feedback/:feedbackId`
- `PATCH /api/v1/question-feedback/:feedbackId`
- `DELETE /api/v1/question-feedback/:feedbackId`

### Question Reports

- `GET /api/v1/question-reports`
- `POST /api/v1/question-reports`
- `GET /api/v1/question-reports/:reportId`
- `PATCH /api/v1/question-reports/:reportId`
- `DELETE /api/v1/question-reports/:reportId`

### Analytics

- `GET /api/v1/analytics/dashboard`
- `GET /api/v1/analytics/questions/:questionId`
- `GET /api/v1/analytics/subjects/:subjectId`
- `GET /api/v1/analytics/topics/:topicId`
- `GET /api/v1/analytics/strength`
- `GET /api/v1/analytics/trends`

### Admin

- `GET /api/v1/admin/dashboard`
- `GET /api/v1/admin/users`
- `GET /api/v1/admin/questions`
- `GET /api/v1/admin/tests`
- `GET /api/v1/admin/feedback`
- `GET /api/v1/admin/reports`
- `PATCH /api/v1/admin/feedback/:feedbackId`
- `PATCH /api/v1/admin/reports/:reportId`

## Notes

- This is intentionally route-only for now.
- Business logic, validation, auth, and database access should be added in the next step.
