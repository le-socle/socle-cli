---
name: code-structure
description: Apply file structure, naming, and code organization rules to produce clean, consistent, maintainable code. Use when writing new code, refactoring, creating a new module or component, or as a complement to code review.
---

# Skill — Code Structure

*This skill defines the rules for file structure, naming, and code organization on a project using Lytos. An agent loaded with this skill produces clean, consistent, and maintainable code.*

---

## When to invoke this skill

- When writing any new code
- During a refactoring
- As a complement to the code-review skill to verify structure
- When creating a new module or component

---

## Foundational principles

The rules in this skill are practical applications of established software design principles:

- **Single Responsibility (SRP)** — each file, class, or function has one reason to change. This is why we enforce the 300-line rule and one-function-one-job.
- **Dependency Inversion (DIP)** — depend on abstractions, not implementations. High-level modules should not import low-level details directly. This enables testing and swapping implementations.
- **High cohesion, low coupling** — related code stays together (cohesion), unrelated modules interact through narrow interfaces (coupling). A module that needs to import half the codebase is a design smell.
- **YAGNI** — You Aren't Gonna Need It. Do not build abstractions for hypothetical future requirements. Three similar lines of code is better than a premature abstraction.

You do not need to memorize these names. The rules below make them concrete.

---

## Fundamental rule — 300 lines max per file

A file must never exceed 300 lines of code (excluding comments and blank lines).

**Why**: a file that's too long is a sign of multiple responsibilities. It is harder to read, test, and maintain.

**When a file exceeds 300 lines**:
1. Identify the distinct responsibilities in the file
2. Extract each responsibility into its own file
3. Keep the original file as an entry point if needed
4. Update imports and dependencies

---

## Separation of concerns

### Principle

Each file, each function, each class has **one single reason to change**.

### In practice

| Bad | Good |
|-----|------|
| One file handling the route, validation, business logic, and response | Route -> Controller -> Service -> Repository |
| One function that computes, formats, and sends | `compute()` + `format()` + `send()` |
| A React component that fetches, processes, and displays | Hook `useProducts()` + Component `ProductList` |

### Typical module structure

```
module/
├── index.js          <- entry point, public exports
├── service.js        <- business logic
├── repository.js     <- data access
├── validator.js      <- input validation
├── types.js          <- types/interfaces (TS)
└── __tests__/
    ├── service.test.js
    └── validator.test.js
```

### Dependency injection

Functions and classes should receive their dependencies, not create them internally. This is the single most impactful practice for testability.

```python
# ✅ Good — dependency is injected
class OrderService:
    def __init__(self, repository, email_service):
        self.repository = repository
        self.email_service = email_service

# ❌ Bad — dependency is hardcoded
class OrderService:
    def __init__(self):
        self.repository = PostgresRepository()
        self.email_service = SendGridService()
```

```javascript
// ✅ Good — dependency is injected
function createOrderService({ repository, emailService }) {
  return { /* ... */ };
}

// ❌ Bad — dependency is imported directly
import { pgRepository } from '../db/postgres';
function createOrderService() {
  // locked to postgres, untestable without real DB
}
```

---

## Naming

### Files

Follow the language and ecosystem conventions of the project:

| Language | Convention | Example |
|----------|-----------|---------|
| Python | snake_case | `product_service.py` |
| JavaScript/TypeScript | kebab-case | `product-service.js` |
| PHP (classes) | PascalCase | `ProductService.php` |
| Go | snake_case | `product_service.go` |
| Rust | snake_case | `product_service.rs` |
| CSS/SCSS | kebab-case | `product-card.scss` |

### Variables

Follow the language conventions. Universal principles:

| Principle | Example |
|-----------|---------|
| Constants in UPPER_SNAKE_CASE | `MAX_RETRY_COUNT`, `API_BASE_URL` |
| Booleans: prefix with is/has/can/should | `is_active`, `hasPermission` |
| Lists/arrays: plural | `products`, `users` |
| Single element: singular | `product`, `user` |
| No obscure abbreviations | `user` not `usr`, `response` not `resp` |

### Functions

| Rule | Example ✅ | Counter-example ❌ |
|------|-----------|-------------------|
| Verb + noun | `calculateGross()` | `gross()` |
| Describe the action | `sendConfirmationEmail()` | `email()` |
| No abbreviation | `getUserById()` | `getUsrById()` |
| Boolean return -> question | `isActive()`, `canOrder()` | `active()`, `order()` |

### Classes

| Rule | Example |
|------|---------|
| PascalCase | `ProductService` |
| Name = responsibility | `InvoiceGenerator`, not `InvoiceManager` |
| A clear suffix | `Controller`, `Service`, `Repository`, `Validator` |

---

## Import organization

Imports are organized by category, separated by a blank line. The order is the same regardless of language:

1. **Standard library** (built-in)
2. **External dependencies** (third-party packages)
3. **Internal modules** (absolute paths within the project)
4. **Relative modules** (same folder/module)

```python
# 1. Standard
import os
from pathlib import Path

# 2. External
from fastapi import FastAPI
from pydantic import BaseModel

# 3. Internal
from app.services.product import ProductService

# 4. Relative
from .helpers import format_price
```

```javascript
// 1. Standard
import path from 'path';

// 2. External
import express from 'express';
import { z } from 'zod';

// 3. Internal
import { ProductService } from '@/services/product';

// 4. Relative
import { formatPrice } from './helpers';
```

---

## Circular dependencies

If module A imports module B and module B imports module A, the design is broken. Circular dependencies cause:
- Unpredictable initialization order
- Difficult-to-trace bugs
- Impossible-to-test modules in isolation

**How to fix:**
1. Extract the shared logic into a third module that both A and B import
2. Use dependency injection — pass the dependency instead of importing it
3. Rethink the boundary — maybe A and B should be one module, or the shared part should be its own

If your language's import system raises a circular import error, do not work around it — fix the design.

---

## Module public API

Every module should have a clear boundary — what it exports (public) and what it keeps internal.

- Use an `index` file (or `__init__.py`, `mod.rs`) as the single entry point
- Only export what other modules need — everything else is internal
- If a module exports more than 10 symbols, it may be doing too much
- Renaming or removing a public export is a breaking change — be deliberate about what you expose

---

## Function structure

### Length

- A function is ideally **under 30 lines**
- If it exceeds 50 lines, consider splitting it

### Nesting

- Maximum **3 levels** of nesting
- Use **early return** to reduce nesting

```python
# ✅ Good — early return
def process_order(order):
    if not order.is_valid():
        raise ValueError("Invalid order")

    if not order.client.can_order():
        raise PermissionError("Unauthorized client")

    return execute_order(order)

# ❌ Bad — deep nesting
def process_order(order):
    if order.is_valid():
        if order.client.can_order():
            return execute_order(order)
        else:
            raise PermissionError("Unauthorized client")
    else:
        raise ValueError("Invalid order")
```

The principle is identical across all languages: exit early from error cases to keep the main path at the lowest indentation level.

### Parameters

- Maximum **4 parameters** per function
- Beyond that, group into an object, dict, struct, or DTO

```python
# ✅ Good — configuration object
def create_user(config: UserConfig):

# ❌ Bad — too many parameters
def create_user(name, email, role, department, start_date, manager):
```

---

## Hardcoded values — forbidden

No magic values in the code. Everything must be named.

```python
# ✅ Good
FRANCE_TAX_RATE = 0.20
gross_price = net_price * (1 + FRANCE_TAX_RATE)

# ❌ Bad
gross_price = net_price * 1.20
```

```javascript
// ✅ Good
const MAX_RETRIES = 3;
// ❌ Bad
if (attempts > 3) {
```

For CSS, same principle — use variables, not hardcoded values:

```css
/* ✅ Good */
color: var(--color-primary);
/* ❌ Bad */
color: #3B82F6;
```

---

## Checklist before considering the code properly structured

- [ ] No file exceeds 300 lines
- [ ] Each file has a single responsibility
- [ ] Functions are under 30 lines (50 max)
- [ ] Nesting does not exceed 3 levels
- [ ] Names are explicit and follow conventions
- [ ] Imports are organized by category
- [ ] No hardcoded values — everything is named in constants or variables
- [ ] Functions have 4 parameters max

---

*This skill is immediately operational. An agent that loads it produces structured, readable, and maintainable code without further interpretation.*
