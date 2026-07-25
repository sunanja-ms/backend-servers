# Development Rules & Guidelines

**Version:** 1.0.0
**Date:** 2026-07-22

---

## 📋 Table of Contents

1. [Coding Standards](#coding-standards)
2. [Git Workflow](#git-workflow)
3. [Commit Convention](#commit-convention)
4. [Branch Strategy](#branch-strategy)
5. [Code Review Rules](#code-review-rules)
6. [Testing Rules](#testing-rules)
7. [Security Rules](#security-rules)
8. [Documentation Rules](#documentation-rules)
9. [Performance Rules](#performance-rules)
10. [Deployment Rules](#deployment-rules)

---

## 💻 Coding Standards

### TypeScript Rules

#### ✅ DO:

```typescript
// Use explicit types
interface User {
  id: number;
  email: string;
  name: string;
}

// Use async/await
async function getUser(id: number): Promise<User | null> {
  return await userModel.findById(id);
}

// Use proper error handling
try {
  const user = await getUser(id);
  if (!user) {
    throw new Error('User not found');
  }
  return user;
} catch (error) {
  logger.error({ error }, 'Failed to get user');
  throw error;
}

// Use meaningful variable names
const userEmail = 'user@example.com';  // ✅ Good
const ue = 'user@example.com';         // ❌ Bad

// Use proper imports
import type { User } from './types.js';  // ✅ Type import
import { userService } from './services.js'; // ✅ Value import
```

#### ❌ DON'T:

```typescript
// ❌ Don't use any
function getData(data: any): any { ... }

// ❌ Don't use var
var user = getUser(); // ❌
const user = getUser(); // ✅

// ❌ Don't ignore errors
try {
  // code
} catch (e) {
  // Silent fail ❌
}

// ❌ Don't use magic numbers
const result = data * 3.14; // ❌
const PI = 3.14; // ✅
const result = data * PI;

// ❌ Don't use console.log in production
console.log('Debug info'); // ❌
logger.debug('Debug info'); // ✅
```

---

## 🔀 Git Workflow

### Branch Strategy

```
main
└── develop
    ├── feature/feature-name
    ├── bugfix/bug-description
    ├── hotfix/critical-fix
    └── release/v1.0.0
```

### Branch Naming Convention

| Type    | Format                     | Example                 |
| ------- | -------------------------- | ----------------------- |
| Feature | `feature/description`      | `feature/user-auth`     |
| Bugfix  | `bugfix/issue-description` | `bugfix/login-error`    |
| Hotfix  | `hotfix/description`       | `hotfix/security-patch` |
| Release | `release/v{version}`       | `release/v1.0.0`        |

---

## 📝 Commit Convention

### Commit Message Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

| Type       | Description   | Example                                  |
| ---------- | ------------- | ---------------------------------------- |
| `feat`     | New feature   | `feat(auth): add user registration`      |
| `fix`      | Bug fix       | `fix(api): fix login validation`         |
| `docs`     | Documentation | `docs(readme): update API docs`          |
| `style`    | Code style    | `style: format code with prettier`       |
| `refactor` | Code refactor | `refactor(service): simplify auth logic` |
| `test`     | Testing       | `test: add unit tests for user service`  |
| `chore`    | Maintenance   | `chore: update dependencies`             |
| `perf`     | Performance   | `perf(db): add indexes to users table`   |
| `security` | Security      | `security: update JWT implementation`    |

### Examples

```bash
# Feature
git commit -m "feat(auth): add JWT token validation"
git commit -m "feat(user): add update profile endpoint"

# Fix
git commit -m "fix(api): fix rate limiting issue"
git commit -m "fix(db): fix connection pool timeout"

# Docs
git commit -m "docs: add API documentation"
git commit -m "docs(swagger): update schema definitions"

# Refactor
git commit -m "refactor(service): extract user validation logic"

# Test
git commit -m "test: add integration tests for auth routes"

# Chore
git commit -m "chore: update Fastify to v5.7.0"
```

---

## 🧪 Testing Rules

### Unit Tests

```typescript
// ✅ DO: Test each service method
describe("UserService", () => {
  it("should create a user", async () => {
    const user = await userService.create(userData);
    expect(user).toHaveProperty("id");
    expect(user.email).toBe(userData.email);
  });

  it("should throw error if email exists", async () => {
    await userService.create(userData);
    await expect(userService.create(userData)).rejects.toThrow(
      "User already exists",
    );
  });
});

// ❌ DON'T: Test multiple concerns
describe("UserService", () => {
  it("should handle everything", async () => {
    // ❌ Testing multiple things in one test
  });
});
```

### Integration Tests

```typescript
// ✅ DO: Test API
import { describe, it, expect } from "vitest";
import { fastify } from "fastify";
import { build } from "../src/server";

describe("Auth Controller", () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await build();
  });

  afterAll(async () => {
    await app.close();
  });

  it("should register a user", async () => {
    const response = await app
      .post("/api/v1/auth/register")
      .send({
        email: "test@example.com",
        password: "password123",
        name: "Test User",
      });

    expect(response.statusCode).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveProperty("id");
  });

  it("should login a user", async () => {
    // First register
    await app
      .post("/api/v1/auth/register")
      .send({
        email: "test2@example.com",
        password: "password123",
        name: "Test User 2",
      });

    // Then login
    const response = await app
      .post("/api/v1/auth/login")
      .send({
        email: "test2@example.com",
        password: "password123",
      });

    expect(response.statusCode).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveProperty("token");
  });
});
```

### E2E Tests

```typescript
// ✅ DO: Test full user flows
import { describe, it, expect } from "vitest";
import { build } from "../src/server";

describe("User Flow E2E", () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await build();
  });

  afterAll(async () => {
    await app.close();
  });

  it("should complete user registration and product creation flow", async () => {
    // 1. Register user
    const registerResponse = await app
      .post("/api/v1/auth/register")
      .send({
        email: "e2e@example.com",
        password: "password123",
        name: "E2E Test User",
      });

    expect(registerResponse.statusCode).toBe(201);
    expect(registerResponse.body.success).toBe(true);
    const userId = registerResponse.body.data.id;

    // 2. Login
    const loginResponse = await app
      .post("/api/v1/auth/login")
      .send({
        email: "e2e@example.com",
        password: "password123",
      });

    expect(loginResponse.statusCode).toBe(200);
    expect(loginResponse.body.success).toBe(true);
    const token = loginResponse.body.data.token;

    // 3. Create product
    const productResponse = await app
      .post("/api/v1/products")
      .set("Authorization", `Bearer ${token}`)
      .send({
        name: "E2E Test Product",
        description: "Product created during E2E test",
        price: 100000,
        stock: 5,
      });

    expect(productResponse.statusCode).toBe(201);
    expect(productResponse.body.success).toBe(true);
    expect(productResponse.body.data).toHaveProperty("id");
    expect(productResponse.body.data.userId).toBe(userId);
  });
});
```

---

## 🤝 Code Review Rules

### What to Check in Code Review

1. **Functionality**
   - Does it work as expected?
   - Are edge cases handled?

2. **Code Quality**
   - Is it readable and maintainable?
   - Are there duplicate code?

3. **Performance**
   - Are there potential bottlenecks?
   - Is database optimized?

4. **Security**
   - Are there security vulnerabilities?
   - Is input properly validated?

5. **Testing**
   - Are there adequate tests?
   - Do tests cover edge cases?

6. **Documentation**
   - Is API documented?
   - Are complex logic explained?

### Review Checklist

```markdown
- [ ] Code follows style guide
- [ ] No console.log/console.error in production
- [ ] Proper error handling
- [ ] Input validation implemented
- [ ] Authentication/Authorization checked
- [ ] Database queries optimized
- [ ] Tests written and passing
- [ ] API documented
- [ ] No security vulnerabilities
- [ ] Performance impact assessed
```

---

## 🚫 What NOT to Do

### Code Mistakes

```typescript
// ❌ Don't Use 'any'
function getUser(id: any): any { ... }

// ✅ Do Use Proper Types
function getUser(id: number): Promise<User | null> { ... }

// ❌ Don't Ignore Errors
try {
  // code
} catch (e) {
  // Silent fail
}

// ✅ Do Handle Errors
try {
  // code
} catch (error) {
  logger.error(error);
  throw new Error('Operation failed');
}

// ❌ Don't Hardcode Values
const MAX_RETRIES = 3; // ❌

// ✅ Do Use Constants
const MAX_RETRIES = 3; // ✅ Define once

// ❌ Don't Mutate Inputs
function updateUser(user: User) {
  user.name = 'New Name'; // ❌ Mutating input
  return user;
}

// ✅ Do Create New Object
function updateUser(user: User) {
  return { ...user, name: 'New Name' };
}
```

---

## 🔧 Development Tools

### Required Extensions (VS Code)

1. **TypeScript** - Type checking
2. **ESLint** - Code linting
3. **Prettier** - Code formatting
4. **Drizzle** - Database queries
5. **Fastify** - Snippets

### ESLint Configuration

```javascript
module.exports = {
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:@typescript-eslint/strict",
  ],
  rules: {
    "@typescript-eslint/no-explicit-any": "error",
    "@typescript-eslint/explicit-function-return-type": "error",
    "@typescript-eslint/no-unused-vars": "error",
    "no-console": "warn",
  },
};
```

### Prettier Configuration

```json
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 100,
  "bracketSpacing": true,
  "arrowParens": "always"
}
```

---

## 📊 Performance Rules

### Benchmarking Standards

```typescript
// ✅ DO: Benchmark critical paths
const start = performance.now();
const result = await operation();
const duration = performance.now() - start;

if (duration > 100) {
  logger.warn({ duration }, "Slow operation detected");
}

// ❌ DON'T: Skip performance monitoring
```

### Memory Management

```typescript
// ✅ DO: Use streams for large data
const stream = fs.createReadStream(largeFile);
stream.pipe(response);

// ❌ DON'T: Load all data in memory
const data = fs.readFileSync(largeFile); // ❌

// ✅ DO: Clean up resources
try {
  const client = await pool.connect();
  // Use client
} finally {
  client.release();
}
```

---

## 📦 Dependency Rules

### Adding Dependencies

```bash
# ✅ DO: Use exact versions for production
npm install --save-exact package-name

# ✅ DO: Review package before adding
# Check:
# - Weekly downloads
# - GitHub stars
# - Last update
# - Security vulnerabilities

# ❌ DON'T: Add unnecessary dependencies
```

### Version Management

```json
{
  "dependencies": {
    "fastify": "^5.7.2", // ✅ Use caret for patches
    "drizzle-orm": "0.45.1" // ✅ Exact for critical
  }
}
```

---

## 🔄 CI/CD Rules

### Pre-commit Hooks

```json
{
  "husky": {
    "hooks": {
      "pre-commit": "npm run lint && npm run test",
      "pre-push": "npm run build"
    }
  }
}
```

### CI Pipeline Requirements

```yaml
# .github/workflows/ci.yml
name: CI
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run lint
      - run: npm run test
      - run: npm run build
```

---

## 📋 Checklist Before Commit

### Pre-commit Checklist

- [ ] All tests pass
- [ ] Code is formatted
- [ ] No lint errors
- [ ] Types are correct
- [ ] Documentation updated
- [ ] No console.log statements
- [ ] Environment variables used
- [ ] Error handling implemented
- [ ] Security checks passed

---

## 🎯 Final Notes

### Remember

1. **Quality over Quantity**
2. **Write Code for Humans**
3. **Test Everything**
4. **Document as You Go**
5. **Review Before Commit**
6. **Keep It Simple**
7. **Stay Updated**
8. **Share Knowledge**

### Useful Commands

```bash
# Lint code
npm run lint

# Format code
npm run format

# Run tests
npm run test

# Build project
npm run build

# Generate migrations
npm run db:generate

# Push schema
npm run db:push
```

---

**Last Updated:** 2026-07-22
**Version:** 1.0.0