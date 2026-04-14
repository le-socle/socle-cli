# Skill — API Design

*This skill defines how to design and review REST APIs on a project using Lytos. An agent loaded with this skill knows the conventions, patterns, and checks required to produce a consistent, production-ready API.*

---

## When to invoke this skill

- When designing a new API or a new set of endpoints
- When reviewing an existing API for consistency or quality
- When adding endpoints to an existing API — ensure they follow established conventions
- When a team disagrees on URL structure, status codes, or error format

---

## Procedure

### 1. REST conventions

Resources are **plural nouns**, never verbs. The HTTP method carries the action.

| Method | Purpose | Idempotent | Example |
|--------|---------|------------|---------|
| GET | Read a resource or collection | Yes | `GET /users/42` |
| POST | Create a new resource | No | `POST /users` |
| PUT | Full replacement of a resource | Yes | `PUT /users/42` |
| PATCH | Partial update of a resource | No | `PATCH /users/42` |
| DELETE | Remove a resource | Yes | `DELETE /users/42` |

**Nested resources** — use them when the child has no meaning without the parent:

```
GET  /users/{id}/orders            # orders belong to a user
GET  /users/{id}/orders/{orderId}
```

**Flat routes** — prefer them when the child is independently addressable or queried across parents:

```
GET  /orders?user_id=42            # orders can be searched globally
GET  /orders/{orderId}
```

Rule of thumb: nest at most **one level deep**. If you reach `/a/{id}/b/{id}/c`, flatten.

### 2. URL design

- **kebab-case** for multi-word segments: `/order-items`, not `/orderItems`
- **Plural nouns** for collections: `/users`, `/products`
- No verbs in URLs — use HTTP methods instead
- Query parameters for filtering, sorting, pagination

```
# ✅ Good
GET /users?role=admin&sort=-created_at&page=2&per_page=20

# ❌ Bad
GET /getAdminUsers
```

### 3. HTTP status codes

| Code | Name | When to use |
|------|------|-------------|
| 200 | OK | Successful GET, PUT, PATCH, or DELETE that returns a body |
| 201 | Created | Successful POST — include `Location` header |
| 204 | No Content | Successful operation that returns no body |
| 400 | Bad Request | Malformed JSON, missing required field, invalid type |
| 401 | Unauthorized | No credentials or expired token |
| 403 | Forbidden | Valid credentials, but the user lacks permission |
| 404 | Not Found | Resource does not exist |
| 409 | Conflict | Duplicate creation, version conflict |
| 422 | Unprocessable Entity | Valid JSON but fails business rules |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Unexpected server failure — never intentional |

Concrete examples:

```
POST /users {"email":"not-an-email"}        -> 422 (valid JSON, but invalid email)
POST /users {malformed                      -> 400 (cannot parse body)
GET  /users/999                             -> 404 (user does not exist)
DELETE /users/42 (as non-admin)             -> 403 (authenticated, not allowed)
POST /users {"email":"alice@example.com"}   -> 409 (email already taken)
POST /users {"email":"bob@example.com"}     -> 201 Created + Location header
GET  /users/42                              -> 200 OK
DELETE /users/42                            -> 204 No Content
```

### 4. Error response format

Every error response uses the **same structure**. No exceptions.

```json
{
  "error": "validation_error",
  "message": "One or more fields failed validation.",
  "details": [
    { "field": "email", "message": "Invalid email format" },
    { "field": "name", "message": "Must be at least 2 characters" }
  ]
}
```

- `error` — machine-readable code (snake_case), clients switch on this value
- `message` — human-readable explanation
- `details` — optional array for field-level errors
- **Never** expose stack traces, SQL errors, or internal paths in production
- Log the full error server-side; return only what the client needs

### 5. Pagination

Never return an unbounded collection.

| Strategy | URL | Pros | Cons |
|----------|-----|------|------|
| Offset-based | `?page=2&per_page=20` | Simple, jumpable | Inconsistent if data changes |
| Cursor-based | `?cursor=abc123&limit=20` | Stable, performant | Cannot jump to a page |
| Keyset-based | `?after_id=42&limit=20` | Simple cursor variant | Needs a sortable unique column |

Always return pagination metadata:

```json
{
  "data": [ ... ],
  "pagination": { "page": 2, "per_page": 20, "total": 134, "total_pages": 7 }
}
```

Cursor-based variant:

```json
{
  "data": [ ... ],
  "pagination": { "next_cursor": "eyJpZCI6NDJ9", "has_more": true }
}
```

### 6. Filtering and sorting

Filtering and sorting use query parameters — never request bodies on GET.

```
GET /orders?status=active&customer_id=42           # filter (AND logic)
GET /users?sort=created_at                          # ascending
GET /users?sort=-created_at                         # descending
GET /orders?sort=-priority,created_at               # multiple sorts
GET /invoices?created_after=2026-01-01&created_before=2026-12-31  # date range
```

- Document every supported filter and sort field
- Return `400` if an unsupported field is provided

### 7. Versioning

Use **URL versioning** for simplicity: `/api/v1/users`, `/api/v2/users`.

Alternative — header versioning: `Accept: application/vnd.myapp+json;version=2`.

- Bump the version on **breaking changes only** (removing/renaming a field, changing a type)
- Adding an optional field is **not** a breaking change
- Support the previous version for a **defined deprecation period** (e.g., 6 months)
- Communicate the timeline in response headers:

```
Sunset: Sat, 01 Nov 2026 00:00:00 GMT
Deprecation: true
```

### 8. Authentication

```
GET /users/me
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

- **Bearer tokens (JWT)** in the `Authorization` header for user authentication
- **API keys** in a custom header for service-to-service communication:

```
X-API-Key: sk_live_abc123
```

- **OAuth2** for third-party access on behalf of a user
- **Never** send credentials in URL query parameters — they leak into logs, browser history, and referrer headers
- Return `401` for missing/expired tokens, `403` for insufficient permissions

### 9. Rate limiting

Include rate limit headers in every response:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 73
X-RateLimit-Reset: 1714500000
```

When exceeded, return `429` with a `Retry-After` header:

```json
{ "error": "rate_limit_exceeded", "message": "Too many requests. Try again in 30 seconds." }
```

Apply different limits per tier or endpoint:

| Tier | Limit |
|------|-------|
| Anonymous | 60 requests/hour |
| Authenticated | 1000 requests/hour |
| Service-to-service | 10000 requests/hour |

- Rate limits apply per API key or authenticated user, not per IP alone

### 10. API documentation

- Use **OpenAPI (Swagger)** as the standard specification format
- Every endpoint: method, URL, parameters, request body, response codes, example payloads
- Keep docs in sync with code — generate from annotations or schema

Generate from annotations where possible:

```python
# Python (FastAPI) — schema generated automatically
@app.get("/users/{user_id}", response_model=UserResponse, status_code=200)
async def get_user(user_id: int):
    """Retrieve a user by ID. Returns 404 if the user does not exist."""
    ...
```

```go
// Go (swaggo) — generate OpenAPI from comments
// @Summary  Get a user by ID
// @Param    id path int true "User ID"
// @Success  200 {object} UserResponse
// @Failure  404 {object} ErrorResponse
// @Router   /users/{id} [get]
func GetUser(w http.ResponseWriter, r *http.Request) {
    ...
}
```

```yaml
# Or maintain an OpenAPI spec directly
paths:
  /users:
    get:
      summary: List all users
      parameters:
        - name: role
          in: query
          schema: { type: string }
      responses:
        '200':
          description: A paginated list of users
```

- Provide a sandbox or interactive explorer (Swagger UI, Redoc) for developers to test calls
- Documentation that drifts from the implementation is worse than no documentation

---

## Checklist before considering the API complete

- [ ] All resources use plural nouns, no verbs in URLs
- [ ] URLs are kebab-case
- [ ] HTTP methods match CRUD semantics (GET reads, POST creates, etc.)
- [ ] Every endpoint returns the correct HTTP status code
- [ ] Error responses follow the standard format (`error`, `message`, optional `details`)
- [ ] No stack traces or internal details leak in error responses
- [ ] Collections are paginated — no unbounded lists
- [ ] Filtering and sorting use query parameters with documented fields
- [ ] API is versioned (`/api/v1/...`)
- [ ] Authentication uses Bearer tokens in headers, never in URLs
- [ ] Rate limiting headers are present on all responses
- [ ] `429` responses include a `Retry-After` header
- [ ] Every endpoint is documented in OpenAPI with request/response examples
- [ ] Idempotent operations (GET, PUT, DELETE) are safe to retry

---

## When to update the memory

- API convention decision (e.g., pagination strategy, error format) -> `cortex/architecture.md`
- API pattern that works well (e.g., standard filter query parser) -> `cortex/patterns.md`

---

*This skill is immediately operational. An agent that loads it can design, review, or extend a REST API without further interpretation.*
