# QuickNotes REST API Design

This document describes the proposed production QuickNotes API, not the JSONPlaceholder practice endpoint used by the browser client. Base URL: `https://api.quicknotes.example/v1`. All protected endpoints require a bearer access token. JSON request and response bodies use `Content-Type: application/json`.

## Authentication and conventions

- Authentication: `Authorization: Bearer <access-token>`.
- IDs are UUIDs; timestamps are ISO 8601 UTC.
- Lists are paginated using `limit` (default 20, maximum 100) and `cursor`.
- A user can access only their own notes unless a note is explicitly shared.
- Error responses use a consistent JSON shape.

## Endpoint catalogue

| Method | Path | Description | Success status |
|---|---|---|---:|
| POST | `/auth/register` | Create a user account | 201 Created |
| POST | `/auth/login` | Authenticate and issue tokens | 200 OK |
| POST | `/auth/refresh` | Refresh an access token | 200 OK |
| GET | `/notes` | List the authenticated user's notes; supports `limit`, `cursor`, `q`, `tag` | 200 OK |
| POST | `/notes` | Create a note | 201 Created |
| GET | `/notes/{noteId}` | Retrieve one note | 200 OK |
| PATCH | `/notes/{noteId}` | Update selected note fields | 200 OK |
| DELETE | `/notes/{noteId}` | Delete a note | 204 No Content |
| GET | `/tags` | List the user's tags | 200 OK |
| POST | `/notes/{noteId}/tags/{tagId}` | Attach an existing tag to a note | 204 No Content |

## Create a note

`POST /v1/notes`

Request:
```json
{
  "title": "Prepare project plan",
  "body": "Draft milestones and review with the team.",
  "tagIds": ["8f5b3c2d-17a4-4c41-9a52-9bfaed8c1201"]
}
```

Response (`201 Created`):
```json
{
  "id": "d29c7d4f-2e9d-4a17-bb43-9f5dd03b2e8a",
  "userId": "2c47b4d2-5a12-4b54-9e2f-1c2a3a4b5c6d",
  "title": "Prepare project plan",
  "body": "Draft milestones and review with the team.",
  "tags": [
    {"id": "8f5b3c2d-17a4-4c41-9a52-9bfaed8c1201", "name": "work"}
  ],
  "createdAt": "2026-10-23T10:15:00Z",
  "updatedAt": "2026-10-23T10:15:00Z"
}
```

## List notes

`GET /v1/notes?limit=2&cursor=eyJpZCI6IjEyMyJ9`

Response (`200 OK`):
```json
{
  "data": [
    {
      "id": "d29c7d4f-2e9d-4a17-bb43-9f5dd03b2e8a",
      "userId": "2c47b4d2-5a12-4b54-9e2f-1c2a3a4b5c6d",
      "title": "Prepare project plan",
      "body": "Draft milestones and review with the team.",
      "createdAt": "2026-10-23T10:15:00Z",
      "updatedAt": "2026-10-23T10:15:00Z"
    },
    {
      "id": "a6e6f4c9-bf03-4c83-a3a1-7d4df55a6b10",
      "userId": "2c47b4d2-5a12-4b54-9e2f-1c2a3a4b5c6d",
      "title": "Buy notebook",
      "body": "Compare prices.",
      "createdAt": "2026-10-22T14:00:00Z",
      "updatedAt": "2026-10-22T14:00:00Z"
    }
  ],
  "page": {"limit": 2, "nextCursor": "eyJpZCI6IjEyMiJ9", "hasMore": true}
}
```

## Error status codes

| Status | Meaning | Typical cause |
|---:|---|---|
| 400 | Bad Request | Invalid JSON, title missing, title longer than 100 characters |
| 401 | Unauthorized | Missing, expired or invalid access token |
| 403 | Forbidden | Authenticated user lacks permission to access a resource |
| 404 | Not Found | Note or tag does not exist or is not visible to the user |
| 409 | Conflict | Duplicate email or conflicting update |
| 422 | Unprocessable Entity | Valid JSON but invalid field values |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Unexpected server-side failure |
| 503 | Service Unavailable | Temporary overload or maintenance |

Example error body (`400 Bad Request`):
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "The title is required.",
    "details": [{"field": "title", "issue": "required"}],
    "requestId": "req_01J9QK3R6F8M"
  }
}
```

## Behaviour and security

- Validate all input on the server; client-side validation is for usability, not security.
- Enforce ownership checks for every note and tag operation.
- Use parameterized SQL queries and store password hashes using a modern password-hashing algorithm.
- Apply per-user and per-IP rate limits, request-size limits, structured logs, and request IDs.
- `DELETE` is idempotent from the client's perspective. Return `204` when deletion succeeds.
