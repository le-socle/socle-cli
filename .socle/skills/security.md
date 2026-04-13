# Skill — Security

*This skill defines how to handle security on a project using Le Socle. An agent loaded with this skill knows how to identify vulnerabilities, apply secure coding patterns, and enforce security best practices across any language.*

---

## When to invoke this skill

- When writing code that handles user input, authentication, or authorization
- During a code review — check for OWASP Top 10 vulnerabilities
- When adding dependencies — audit for known vulnerabilities
- When configuring servers, APIs, or deployment pipelines
- After a security incident — fix the flaw and harden the surrounding code

---

## Procedure

### 1. OWASP Top 10 — common vulnerabilities

For each vulnerability, know the bad pattern and the fix.

#### Injection (SQL, command)

```python
# BAD — SQL injection
query = f"SELECT * FROM users WHERE name = '{user_input}'"
cursor.execute(query)

# GOOD — parameterized query
cursor.execute("SELECT * FROM users WHERE name = %s", (user_input,))
```

```javascript
// BAD — command injection
const output = execSync(`ls ${userInput}`);

// GOOD — avoid shell, pass args as array
const output = execFileSync('ls', [userInput]);
```

#### Broken authentication

```python
# BAD — MD5 for passwords
import hashlib
hashed = hashlib.md5(password.encode()).hexdigest()

# GOOD — bcrypt with salt
import bcrypt
hashed = bcrypt.hashpw(password.encode(), bcrypt.gensalt())
```

```javascript
// BAD — plain comparison, timing attack
if (token === storedToken) { /* ... */ }

// GOOD — constant-time comparison
const crypto = require('crypto');
if (crypto.timingSafeEqual(Buffer.from(token), Buffer.from(storedToken))) { /* ... */ }
```

#### Sensitive data exposure

```go
// BAD — logging sensitive data
log.Printf("User login: email=%s password=%s", email, password)

// GOOD — never log secrets
log.Printf("User login: email=%s", email)
```

```php
// BAD — exposing stack traces to the user
ini_set('display_errors', 1);

// GOOD — log errors, show generic message
ini_set('display_errors', 0);
ini_set('log_errors', 1);
```

#### XSS (Cross-Site Scripting)

```javascript
// BAD — inserting raw user input into DOM
element.innerHTML = userInput;

// GOOD — use textContent or sanitize
element.textContent = userInput;
```

```python
# BAD — rendering raw HTML in a template (Jinja2)
return render_template("page.html", name=user_input)
# with template: <p>{{ name | safe }}</p>

# GOOD — auto-escaping (default in Jinja2)
# with template: <p>{{ name }}</p>
```

#### Broken access control

```python
# BAD — no ownership check
@app.route("/api/invoices/<invoice_id>")
def get_invoice(invoice_id):
    return db.get_invoice(invoice_id)

# GOOD — verify the resource belongs to the user
@app.route("/api/invoices/<invoice_id>")
def get_invoice(invoice_id):
    invoice = db.get_invoice(invoice_id)
    if invoice.owner_id != current_user.id:
        abort(403)
    return invoice
```

#### Security misconfiguration

```javascript
// BAD — CORS allows everything
app.use(cors({ origin: '*' }));

// GOOD — restrict to known origins
app.use(cors({ origin: ['https://myapp.com'] }));
```

#### CSRF (Cross-Site Request Forgery)

```python
# GOOD — Django CSRF protection (enabled by default)
# In the template:
# <form method="post">{% csrf_token %} ... </form>

# GOOD — for APIs, use SameSite cookies + verify Origin header
```

```javascript
// GOOD — Express with csurf middleware
const csrf = require('csurf');
app.use(csrf({ cookie: { sameSite: 'strict', httpOnly: true } }));
```

### 2. Input validation

Validate at every system boundary — never trust incoming data.

```python
# GOOD — schema validation with Pydantic
from pydantic import BaseModel, EmailStr, constr

class CreateUser(BaseModel):
    email: EmailStr
    name: constr(min_length=1, max_length=100)
    age: int = Field(ge=0, le=150)
```

```javascript
// GOOD — schema validation with Zod
const CreateUser = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(100),
  age: z.number().int().min(0).max(150),
});
const parsed = CreateUser.parse(req.body);
```

Rules:
- **Whitelist over blacklist** — define what is allowed, reject everything else
- **Validate server-side** — client-side validation is UX, not security
- **Validate type, length, format, and range** for every input
- **Sanitize file uploads** — check MIME type, limit size, never serve from the upload directory

### 3. Authentication patterns

#### Password hashing

| Algorithm | Status |
|-----------|--------|
| MD5, SHA1, SHA256 | **Never use** for passwords — too fast, no salt |
| bcrypt | Good — built-in salt, configurable cost |
| argon2id | Best — memory-hard, resistant to GPU attacks |

```go
// GOOD — argon2id in Go
import "golang.org/x/crypto/argon2"

hash := argon2.IDKey([]byte(password), salt, 1, 64*1024, 4, 32)
```

#### JWT best practices

- Set short expiry (`exp`) — 15 minutes for access tokens
- Store in **httpOnly, Secure, SameSite=Strict** cookies — not localStorage
- Use refresh tokens (long-lived, stored server-side, rotated on use)
- Validate `iss`, `aud`, and `exp` claims on every request
- Use asymmetric signing (RS256/ES256) for distributed systems

#### OAuth2 / OIDC

- Use the **Authorization Code flow with PKCE** — never the Implicit flow
- Validate the `state` parameter to prevent CSRF
- Verify ID tokens server-side

#### Multi-factor authentication

- Support TOTP (Google Authenticator, Authy) as a minimum
- Store recovery codes hashed, not in plain text
- Rate-limit MFA attempts to prevent brute force

### 4. Authorization

#### RBAC vs ABAC

| Model | Use when |
|-------|----------|
| **RBAC** (Role-Based) | Simple apps — admin, editor, viewer |
| **ABAC** (Attribute-Based) | Complex rules — "owner can edit if status is draft" |

#### Rules

- **Check permissions on every request** — the server is the authority, not the UI
- **Principle of least privilege** — grant the minimum access needed
- **Deny by default** — if no rule grants access, deny

```python
# GOOD — decorator-based permission check
@app.route("/admin/users")
@require_role("admin")
def list_users():
    return db.get_all_users()
```

```go
// GOOD — middleware checks permission before handler runs
func requireRole(role string) func(http.Handler) http.Handler {
    return func(next http.Handler) http.Handler {
        return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
            if !hasRole(r.Context(), role) {
                http.Error(w, "Forbidden", http.StatusForbidden)
                return
            }
            next.ServeHTTP(w, r)
        })
    }
}
```

### 5. Secrets management

- **Never commit secrets** — no API keys, passwords, or tokens in source code
- Use **environment variables** or a **secret manager** (Vault, AWS Secrets Manager, GCP Secret Manager)
- Add `.env` to `.gitignore` — always
- **Rotate secrets regularly** — especially after team member departures
- Use **short-lived credentials** when possible (e.g., IAM roles over static keys)

```bash
# GOOD — .gitignore includes secret files
echo ".env" >> .gitignore
echo "*.pem" >> .gitignore
echo "credentials.json" >> .gitignore
```

If a secret is accidentally committed, consider it **compromised** — rotate it immediately, then remove it from git history.

### 6. Dependency security

Run audits regularly and before every release:

| Language | Audit command |
|----------|--------------|
| JavaScript | `npm audit` or `yarn audit` |
| Python | `pip-audit` |
| Go | `govulncheck ./...` |
| PHP | `composer audit` |
| Rust | `cargo audit` |

Rules:
- **Commit lock files** (`package-lock.json`, `poetry.lock`, `go.sum`, `composer.lock`)
- **Enable automated updates** — Dependabot or Renovate
- **Review new dependencies** before adding — check maintenance status, download count, known issues
- **Pin major versions** — avoid surprise breaking changes

### 7. HTTP security headers

Apply these headers on every response:

```
Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self'
Strict-Transport-Security: max-age=31536000; includeSubDomains
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=()
```

#### Cookie flags

Every cookie that carries session or auth data must have:
- `Secure` — only sent over HTTPS
- `HttpOnly` — not accessible from JavaScript
- `SameSite=Strict` (or `Lax` if cross-site navigation is needed)

```javascript
// GOOD — Express cookie settings
res.cookie('session', token, {
  httpOnly: true,
  secure: true,
  sameSite: 'strict',
  maxAge: 15 * 60 * 1000,
});
```

#### CORS

- Never use `origin: '*'` on authenticated endpoints
- Explicitly list allowed origins
- Do not reflect the `Origin` header back without validation

---

## Security checklist

- [ ] All user inputs are validated server-side (type, length, format)
- [ ] SQL queries use parameterized statements — no string concatenation
- [ ] Passwords are hashed with bcrypt or argon2 — never MD5/SHA1
- [ ] JWT tokens have short expiry and are stored in httpOnly cookies
- [ ] Permissions are checked on every API endpoint, not just in the UI
- [ ] No secrets in source code or git history
- [ ] `.env` and credential files are in `.gitignore`
- [ ] Dependencies are audited (`npm audit` / `pip-audit` / equivalent)
- [ ] Lock files are committed
- [ ] HTTP security headers are set (CSP, HSTS, X-Content-Type-Options)
- [ ] Cookies use Secure, HttpOnly, and SameSite flags
- [ ] CORS is restricted to known origins
- [ ] CSRF protection is active on state-changing endpoints
- [ ] File uploads are validated (type, size) and stored safely
- [ ] Error messages do not expose stack traces or internal details
- [ ] Rate limiting is applied on authentication endpoints

---

## When to update the memory

- A secure coding pattern is established -> document it in `cortex/patterns.md`
- A vulnerability is found and fixed -> document it in `cortex/bugs.md`
- A security architecture decision is made (auth strategy, secret management) -> `cortex/architecture.md`

---

*This skill is immediately operational. An agent that loads it can audit code for security flaws and apply secure coding patterns without further interpretation.*
