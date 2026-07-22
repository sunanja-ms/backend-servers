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

### Fastify Specific Rules

#### Plugin Rules

```typescript
// ✅ DO: Register plugins properly
export default async function plugin(fastify: FastifyInstance) {
  await fastify.register(cors, { origin: "*" });
  await fastify.register(helmet);
}

// ❌ DON'T: Use plugins without proper registration
fastify.use(cors()); // ❌
```

#### Route Rules

```typescript
// ✅ DO: Define routes with schemas
fastify.post("/users", {
  schema: {
    body: userSchema,
    response: {
      201: userResponseSchema,
    },
  },
  handler: createUser,
});

// ❌ DON'T: Skip schema validation
fastify.post("/users", handler); // ❌
```

#### Error Handling Rules

```typescript
// ✅ DO: Use consistent error handling
try {
  // code
} catch (error) {
  if (error instanceof ZodError) {
    return reply.status(400).send({
      success: false,
      error: "Validation Error",
      details: error.errors,
    });
  }
  throw error;
}

// ❌ DON'T: Throw raw errors
try {
  // code
} catch (error) {
  throw error; // ❌
}
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
// ✅ DO: Test API endpoints
describe("POST /api/v1/auth/register", () => {
  it("should return 201 on successful registration", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/api/v1/auth/register",
      payload: registerData,
    });

    expect(response.statusCode).toBe(201);
    expect(response.json()).toHaveProperty("success", true);
  });
});

// ❌ DON'T: Skip error cases
// ❌ DON'T: Hard-code test data
```

### Test Coverage Rules

| Component   | Minimum Coverage |
| ----------- | ---------------- |
| Models      | 90%              |
| Services    | 90%              |
| Controllers | 80%              |
| Utils       | 80%              |
| Middleware  | 70%              |
| Total       | 80%              |

---

## 🚀 Performance Rules

### Database Optimization

```typescript
// ✅ DO: Use indexes
const users = await db.select().from(users).where(eq(users.email, email)); // email has index

// ✅ DO: Select only needed fields
const users = await db
  .select({
    id: users.id,
    name: users.name,
  })
  .from(users);

// ❌ DON'T: Select all without indexes
const users = await db.select().from(users); // ❌ Without WHERE

// ❌ DON'T: Select all fields if not needed
const users = await db.select().from(users); // ❌ If only need id,name
```

### API Optimization

```typescript
// ✅ DO: Use pagination
const users = await db
  .select()
  .from(users)
  .limit(10)
  .offset(page * 10);

// ✅ DO: Use compression
await fastify.register(compress, {
  global: true,
  threshold: 1024,
});

// ✅ DO: Use cache headers
reply.header("Cache-Control", "public, max-age=300");

// ❌ DON'T: Return large datasets without pagination
const allUsers = await db.select().from(users); // ❌

// ❌ DON'T: Disable compression
```

---

## 🔒 Security Rules

### Authentication Rules

```typescript
// ✅ DO: Always protect routes
fastify.get("/users", {
  preHandler: [authMiddleware], // ✅
  handler: getUsers,
});

fastify.get("/users", {
  // ❌ No auth middleware
  handler: getUsers, // ❌
});

// ✅ DO: Role-based access
fastify.delete("/users/:id", {
  preHandler: [authMiddleware, requireRole(["admin"])],
  handler: deleteUser,
});

// ❌ DON'T: Expose user data
const user = await userService.getUser(id);
return user; // ❌ Might include password

// ✅ DO: Remove sensitive data
const { password, ...userData } = user;
return userData; // ✅
```

### Input Validation Rules

```typescript
// ✅ DO: Validate all inputs
const schema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

const data = schema.parse(request.body);

// ✅ DO: Validate IDs
const id = z.coerce.number().int().positive().parse(params.id);

// ❌ DON'T: Trust user input
const { email, password } = request.body; // ❌

// ❌ DON'T: Use unsanitized input in queries
const id = params.id; // ❌
```

### Environment Rules

```typescript
// ✅ DO: Use environment variables
const JWT_SECRET = process.env.JWT_SECRET; // ✅

// ❌ DON'T: Hard-code secrets
const JWT_SECRET = "hardcoded-secret"; // ❌

// ✅ DO: Validate environment
const env = z
  .object({
    JWT_SECRET: z.string().min(32),
  })
  .parse(process.env);

// ❌ DON'T: Skip validation
```

---

## 📚 Documentation Rules

### Code Documentation

```typescript
/**
 * User Service
 *
 * Handles all user-related business logic
 *
 * @example
 * const userService = new UserService();
 * const user = await userService.createUser(data);
 */
export class UserService {
  /**
   * Create a new user
   *
   * @param data - User registration data
   * @returns Created user (without password)
   * @throws {Error} If user already exists
   */
  async createUser(data: RegisterInput): Promise<Omit<User, "password">> {
    // Implementation
  }
}
```

### API Documentation

```typescript
// ✅ DO: Document endpoints
fastify.post("/users", {
  schema: {
    description: "Create a new user",
    tags: ["Users"],
    body: {
      type: "object",
      required: ["email", "password", "name"],
      properties: {
        email: { type: "string", format: "email" },
        password: { type: "string", minLength: 6 },
        name: { type: "string", minLength: 2 },
      },
    },
    response: {
      201: {
        description: "User created successfully",
        type: "object",
        properties: {
          success: { type: "boolean" },
          data: { type: "object" },
        },
      },
    },
  },
  handler: createUser,
});

// ❌ DON'T: Skip documentation
fastify.post("/users", handler); // ❌
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
