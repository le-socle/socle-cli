# Skill — Testing

*This skill defines how to write tests on a project using Lytos. It covers unit tests and end-to-end tests. An agent loaded with this skill knows what to test, how to structure tests, and what coverage criteria to meet.*

---

## When to invoke this skill

- After writing a new feature
- After a fix — the test must prove the bug won't come back
- During a refactoring — existing tests must continue to pass
- During a quality audit — check overall coverage

---

## Testing strategy

Follow the **Testing Trophy** model (Kent C. Dodds): the highest return on investment comes from **integration tests**, not unit tests.

```
        ╱╲          E2E — few, critical journeys only
       ╱  ╲
      ╱────╲
     ╱      ╲       Integration — the bulk of your tests
    ╱        ╲
   ╱──────────╲
  ╱            ╲    Unit — fast, focused, isolated logic
 ╱──────────────╲
╱________________╲  Static analysis — linting, type checking, formatting
```

| Layer | Volume | What it catches |
|-------|--------|-----------------|
| Static analysis | Runs on every save/commit | Typos, type errors, style drift |
| Unit tests | Many, fast | Logic errors in pure functions |
| Integration tests | **Most of your tests** | Broken contracts between modules, DB queries, API routes |
| E2E tests | Few, slow | Critical user journeys broken across the full stack |

Write **more integration tests than unit tests**. Reserve E2E for the journeys where a failure means lost revenue or data.

---

## Unit tests

### Principles

- A unit test tests **one single thing**
- It is **independent** — does not depend on execution order or another test
- It is **fast** — no network calls, no database (use mocks)
- It is **deterministic** — the same input always gives the same result

### Test file structure

```
tests/
├── unit/
│   ├── [module]/
│   │   └── [module].test.*    <- depends on the project language
│   └── ...
└── e2e/
    ├── [feature].spec.*       <- end-to-end tests
    └── ...
```

Naming conventions by language:

| Language | Test file | Example |
|----------|-----------|---------|
| JavaScript/TypeScript | `module.test.js` or `module.spec.ts` | `cart.test.js` |
| Python | `test_module.py` | `test_cart.py` |
| PHP | `ModuleTest.php` | `CartTest.php` |
| Go | `module_test.go` | `cart_test.go` |
| Rust | `mod tests` in the file or `tests/` | `#[cfg(test)]` |

### Test naming

The test name describes the **expected behavior**, not the implementation.

```javascript
// ✅ Good
it('returns an empty array when no product matches the filter')
// ❌ Bad
it('test filterProducts')
```

```python
# ✅ Good
def test_returns_none_if_user_does_not_exist():
# ❌ Bad
def test_get_user():
```

```go
// ✅ Good
func TestReturnsErrorIfCartIsEmpty(t *testing.T) {
// ❌ Bad
func TestCheckout(t *testing.T) {
```

### AAA Pattern (Arrange, Act, Assert)

Every test follows this structure, regardless of language:

```python
def test_calculates_gross_price_with_tax():
    # Arrange — prepare the data
    net_price = 100
    tax_rate = 0.20

    # Act — execute the action
    gross_price = calculate_gross(net_price, tax_rate)

    # Assert — verify the result
    assert gross_price == 120
```

```javascript
it('calculates the gross price with tax', () => {
  // Arrange
  const netPrice = 100;
  const taxRate = 0.20;

  // Act
  const grossPrice = calculateGross(netPrice, taxRate);

  // Assert
  expect(grossPrice).toBe(120);
});
```

### What to test

- The **nominal case** — the main path that works
- **Edge cases** — null values, empty lists, empty strings, zero
- **Error cases** — invalid inputs, expected exceptions
- **Boundary cases** — min/max values, overflow, unexpected formats

### What NOT to test

- Internal implementation (private details)
- The framework code itself
- Trivial getters/setters with no logic
- Constants

---

## Integration tests

### Principles

- An integration test verifies that **multiple modules work together correctly**
- It uses **real dependencies** — a test database, actual service layers, real routers — not mocks
- It is slower than a unit test but faster than E2E — no browser, no UI
- It catches the bugs that slip between unit-tested functions: wrong queries, bad serialization, misconfigured middleware

### How it differs from unit and E2E

| Aspect | Unit | Integration | E2E |
|--------|------|-------------|-----|
| Dependencies | Mocked | Real (test DB, real services) | Full stack |
| Speed | Milliseconds | Seconds | Seconds to minutes |
| Scope | One function/class | Module interactions, API routes | Complete user journey |
| UI involved | No | No | Yes |

### Example — Python (FastAPI + httpx + test DB)

```python
import pytest
from httpx import AsyncClient
from app.main import app
from app.database import get_test_db, reset_test_db

@pytest.fixture(autouse=True)
async def clean_db():
    await reset_test_db()
    yield
    await reset_test_db()

@pytest.mark.asyncio
async def test_create_and_retrieve_user():
    async with AsyncClient(app=app, base_url="http://test") as client:
        # Create
        response = await client.post("/api/users", json={
            "name": "Alice",
            "email": "alice@example.com"
        })
        assert response.status_code == 201
        user_id = response.json()["id"]

        # Retrieve
        response = await client.get(f"/api/users/{user_id}")
        assert response.status_code == 200
        assert response.json()["email"] == "alice@example.com"
```

### Example — JavaScript (Express + supertest + test DB)

```javascript
const request = require('supertest');
const app = require('../src/app');
const { resetTestDb } = require('./helpers/db');

beforeEach(async () => {
  await resetTestDb();
});

describe('POST /api/orders', () => {
  it('creates an order and returns it with a computed total', async () => {
    const res = await request(app)
      .post('/api/orders')
      .send({ items: [{ productId: 1, quantity: 2 }] })
      .expect(201);

    expect(res.body.total).toBe(49.98);
    expect(res.body.items).toHaveLength(1);
  });
});
```

### When to write integration tests

- API route handlers — verify the full request/response cycle
- Service-to-service interactions — ensure contracts are respected
- Database queries — confirm real SQL behaves as expected with constraints and indexes
- Middleware chains — authentication, rate-limiting, logging in the correct order

### Test database setup

- Use a **dedicated test database** — never the development or production database
- Reset state **before each test** using transaction rollback or table truncation
- Seed only the data the test needs — avoid shared fixtures that create hidden coupling

---

## E2E tests (end-to-end)

### Principles

- An E2E test simulates a **complete user journey**
- It tests the application **end-to-end** — interface, API, database
- It is slower and more fragile than a unit test — only test critical journeys
- It verifies **visible behavior**, not implementation

### Tools by context

| Context | Common tools |
|---------|-------------|
| Web application | Playwright, Cypress, Selenium |
| REST/GraphQL API | Supertest, httpx, Postman/Newman |
| Mobile application | Detox, Appium, XCTest |
| CLI | Shell tests, subprocess |

### Example — Web application (Playwright)

```typescript
test.describe('User login', () => {
  test('a user can log in with valid credentials', async ({ page }) => {
    await page.goto('/login');
    await page.fill('[data-testid="email"]', 'user@example.com');
    await page.fill('[data-testid="password"]', 'motdepasse123');
    await page.click('[data-testid="submit-login"]');

    await expect(page).toHaveURL('/dashboard');
    await expect(page.locator('[data-testid="user-name"]')).toHaveText('Jean Dupont');
  });
});
```

### Example — API (Python httpx)

```python
def test_create_reservation_returns_201():
    response = client.post("/api/reservations", json={
        "date": "2026-04-15",
        "heure": "14:00",
        "nom": "Jean Dupont"
    })
    assert response.status_code == 201
    assert response.json()["nom"] == "Jean Dupont"
```

### E2E conventions

- Target elements by `data-testid` or stable identifiers — never by fragile CSS selectors
- Each test must be able to run independently
- Group tests by feature
- Wait for elements explicitly

### What to test in E2E

- Critical journeys: sign-up, login, purchase, form submission
- Journeys that involve multiple steps
- Third-party integrations visible to the user

### What NOT to test in E2E

- Unit-level edge cases — that's the job of unit tests
- Every variation of a form — test the nominal case and one error case
- Visual styling — unless critical for UX

---

## Mocking strategy

### When to mock

- **External services** — payment gateways, email providers, SMS APIs
- **Third-party APIs** — you don't control their availability or rate limits
- **Time and dates** — freeze time to make tests deterministic
- **Randomness** — seed or stub random generators

### When NOT to mock

- **Your own code** — if you mock your own service layer, you're testing nothing
- **The database in integration tests** — use a real test database instead
- **Core business logic** — the whole point is to verify it works

### The danger of over-mocking

If every dependency is mocked, your tests verify that your mocks behave as expected — not your code. Tests pass, but production breaks. A good rule: **if the mock is more complex than the real implementation, remove the mock.**

### Examples

```python
# Python — mocking an external payment API
from unittest.mock import patch

@patch("app.payments.stripe_client.charge")
def test_checkout_calls_payment_provider(mock_charge):
    mock_charge.return_value = {"status": "succeeded", "id": "ch_123"}
    result = checkout(cart_id=1)
    assert result.paid is True
    mock_charge.assert_called_once()
```

```javascript
// JavaScript — mocking a date
jest.useFakeTimers().setSystemTime(new Date('2026-01-15'));

it('labels an invoice as overdue after 30 days', () => {
  const invoice = createInvoice({ due: '2025-12-01' });
  expect(invoice.isOverdue()).toBe(true);
});

jest.useRealTimers();
```

---

## Coverage criteria

| Type | Minimum coverage | Target |
|------|-----------------|--------|
| Unit tests | 80% of public functions | 100% of critical functions (auth, payment, data) |
| E2E tests | 100% of critical journeys | All main application journeys |

### How to measure

| Language | Coverage command |
|----------|----------------|
| JavaScript | `jest --coverage` or `vitest --coverage` |
| Python | `pytest --cov` |
| PHP | `phpunit --coverage-html` |
| Go | `go test -cover` |
| Rust | `cargo tarpaulin` |

---

## Test isolation

- Each test must be **independent** — it must pass whether run alone or in any order
- Clean up database state **before or after each test** using transaction rollback or table truncation
- Never rely on **shared mutable state** — no global variables modified across tests
- Tests must be **parallel-safe** — two tests running concurrently must not interfere with each other
- If a test needs specific data, it creates that data itself — do not depend on another test's side effects

---

## Flaky tests

A flaky test — one that sometimes passes and sometimes fails with no code change — is **worse than no test**. It erodes trust in the entire test suite.

- **Quarantine immediately** — move the flaky test out of the main suite so it stops blocking CI
- **Fix or delete within one sprint** — a quarantined test that lingers is a dead test
- **Never `@skip` / `.skip()` / `pytest.mark.skip` without a linked issue** — every skip must reference a ticket
- Common causes: timing dependencies, shared state, external service calls, non-deterministic ordering
- If a test is flaky because the feature is flaky, **fix the feature**

---

## Checklist before considering tests complete

- [ ] All tests pass
- [ ] E2E tests pass
- [ ] Coverage does not regress compared to the previous sprint
- [ ] New tests follow the AAA pattern
- [ ] Tests are descriptively named
- [ ] No commented-out or skipped test without justification in the issue

---

## When to update the memory

- A recurring test pattern emerges -> document it in `cortex/patterns.md`
- A project-specific test pitfall is discovered -> note it in `cortex/bugs.md`
- A decision about test strategy is made -> `cortex/architecture.md`

---

*This skill is immediately operational. An agent that loads it can write unit and E2E tests without further interpretation.*
