---
description: Branch, Pull Request, and Code Validation Workflow
---

# Branch, Pull Request, and Code Validation Workflow

**CRITICAL**: Execute this workflow at the START of EVERY task involving code changes.

## Phase 1: Branch Setup (MANDATORY FIRST STEP)

**NEVER** commit directly to `main` or `develop`.

1.  **Check Branch**:
    ```bash
    git branch --show-current
    ```
2.  **Setup Feature Branch**:
    - If on `main` or `develop`:
      ```bash
      git checkout develop
      git fetch origin && git pull origin develop
      git checkout -b <branch-name>
      ```
    - If on a feature branch: Verify it is current with `develop`.
    - **Naming**: Use kebab-case describing the validation (e.g., `add-auth-feature`, `fix-login-bug`).

## Phase 2: Development & Validation

1.  **Make Changes**: Implement code, ensuring you are on your feature branch.
2.  **Test & Validate** (MANDATORY):
    - Write/Update tests for ALL changes.
    - Run validation suite:
      ```bash
      npm run validate
      ```
    - **Requirements**: Linting passes, Formatting correct, **100% Test Coverage**.
    - _Do not proceed if validation fails._

## Phase 3: Commit

1.  **Request Permission**:
    - Summarize changes.
    - Ask: "May I commit these changes?"
    - **WAIT** for explicit approval.
2.  **Commit & Push**:
    ```bash
    git add .
    git commit -m "<descriptive message>"
    git push -u origin <branch-name>
    ```

## Phase 4: Pull Request

1.  **Request Permission**:
    - Confirm user is satisfied with changes.
    - Ask: "May I create a Pull Request to merge this branch into develop?"
    - **WAIT** for explicit approval.
2.  **Create PR**:
    - **CRITICAL**: Use a temporary file for the body to avoid shell escaping issues.

    ```bash
    # 1. Create temp description file
    # Write description (Summary, Changes, Testing) to $(pwd)/pr_desc.md

    # 2. Create PR
    gh pr create --base develop --head <branch-name> --title "<Title>" --body-file $(pwd)/pr_desc.md

    # 3. Cleanup
    rm $(pwd)/pr_desc.md
    ```

## Verification Checklist

- [ ] Started from updated `develop` branch.
- [ ] Coding on feature branch.
- [ ] Tests written/updated (100% coverage).
- [ ] `npm run validate` passed.
- [ ] User approval received for Commit.
- [ ] User approval received for PR.
