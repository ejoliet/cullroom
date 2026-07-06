```markdown
# cullroom Development Patterns

> Auto-generated skill from repository analysis

## Overview
This skill teaches you the core development patterns and conventions used in the `cullroom` JavaScript codebase. The repository is a plain JavaScript project (no framework detected) that manages both frontend and backend logic, with a focus on cryptographic operations and collaborative features. You'll learn how to structure code, follow naming conventions, update multiple files for feature changes, and write tests in the style used by this project.

## Coding Conventions

### File Naming
- Use **camelCase** for file names.
  - Example: `keygen.js`, `host.html`, `client.html`

### Import Style
- Use **relative imports** for JavaScript modules.
  - Example:
    ```javascript
    import { generateKey } from './keygen.js';
    ```

### Export Style
- Use **named exports** in JavaScript modules.
  - Example:
    ```javascript
    // In keygen.js
    export function generateKey() { ... }
    ```

### Commit Messages
- Freeform style, no strict prefixes.
- Average commit message length: ~77 characters.

## Workflows

### Multi-File Feature Update
**Trigger:** When adding a new feature or fixing a bug that affects both frontend (host/client), backend logic (`keygen.js`), and documentation.  
**Command:** `/multi-file-feature-update`

1. **Edit `host.html`**  
   Update the UI or logic for host users as needed for the feature or fix.
2. **Edit `client.html`**  
   Update the UI or logic for client users accordingly.
3. **Edit `keygen.js`**  
   Modify backend or cryptographic logic to support the new feature or fix.
4. **Edit `README.md`**  
   Clarify usage, document changes, or add instructions relevant to the update.

**Example:**
Suppose you are adding a new cryptographic option:
- Update both `host.html` and `client.html` to add UI controls for the new option.
- Update `keygen.js` to implement the new cryptographic logic.
- Update `README.md` to document how to use the new option.

## Testing Patterns

- **Testing Framework:** Unknown (no framework detected).
- **Test File Pattern:** Files named with `*.test.*` (e.g., `keygen.test.js`).
- **Test Style:** Place test files alongside the code they test, using the `.test.` infix.

**Example:**
```javascript
// keygen.test.js
import { generateKey } from './keygen.js';

test('generateKey returns a valid key', () => {
  const key = generateKey();
  expect(typeof key).toBe('string');
});
```

## Commands

| Command                    | Purpose                                                        |
|----------------------------|----------------------------------------------------------------|
| /multi-file-feature-update | Guide for updating host/client HTML, backend JS, and docs together |
```
