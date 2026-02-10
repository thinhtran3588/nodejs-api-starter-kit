---
alwaysApply: true
---

# Branch, Pull Request, and Code Validation Workflow Rule

## MANDATORY WORKFLOW - MUST BE FOLLOWED FIRST

**CRITICAL**: This workflow is MANDATORY and MUST be executed at the START of EVERY task that involves code changes. This is the FIRST thing you must do before making any code modifications.

**When you receive a task request:**

1. **STOP** - Do not start coding yet
2. **FIRST**: Check your current branch with `git branch --show-current`
3. **THEN**: Follow the branch creation steps below
4. **ONLY AFTER**: You are on a feature branch, proceed with code changes

**This rule applies to ALL code changes, including:**

- Adding new features
- Fixing bugs
- Refactoring code
- Updating dependencies
- Any file modifications in `src/` directory

## Branch Management

**CRITICAL**: All code changes MUST be made on a feature branch, never directly on `main` or `develop` branches.

### Branch Creation - MANDATORY FIRST STEP

**BEFORE making any code changes, you MUST:**

1. **IMMEDIATELY check current branch** - This is the FIRST command you run:

   ```bash
   git branch --show-current
   ```

2. **Based on current branch, follow the appropriate path:**

   **If you are on `main` or `develop` branch:**
   - **STOP** - Do not proceed with code changes
   - Switch to `develop` branch: `git checkout develop`
   - Fetch latest changes: `git fetch origin`
   - Pull latest changes: `git pull origin develop`
   - Create new branch: `git checkout -b <branch-name>`
   - Verify you're on the new branch: `git branch --show-current`

   **If you are already on a feature branch:**
   - Verify it's not `main` or `develop` (should be a feature branch name)
   - If it's a valid feature branch, proceed with your changes
   - If unsure, create a new branch following the steps above

3. **Branch naming convention**: Create branch name based on the user's request
   - Use kebab-case (lowercase with hyphens)
   - Make it descriptive of the feature/fix being implemented
   - Examples:
     - `add-user-authentication`
     - `fix-pagination-bug`
     - `implement-search-feature`
     - `refactor-validation-logic`

   **CRITICAL**: Always ensure your feature branch is based on the latest `develop` branch to prevent merge conflicts and keep branches in sync.

### Forbidden Operations

**NEVER** make code changes directly on:

- `main` branch
- `develop` branch

**If you find yourself on `main` or `develop` when starting a task:**

1. **STOP immediately** - Do not proceed with any code changes
2. **Execute branch setup workflow:**
   - If on `main`: `git checkout develop` first
   - If on `develop`: `git fetch origin && git pull origin develop`
   - Create new branch: `git checkout -b <branch-name>`
3. **Verify you are on the new branch**: `git branch --show-current`
4. **ONLY THEN** proceed with your code changes

**If you accidentally made changes on `main` or `develop`:**

1. **STOP immediately**
2. Stash your changes: `git stash`
3. Follow the branch setup workflow above
4. Apply your changes: `git stash pop`
5. Continue on the feature branch

### Code Validation

**CRITICAL**: After making any code changes (editing, creating, or modifying files), you MUST run `npm run validate` to ensure:

- Code passes linting checks (`npm run lint`)
- Code formatting is correct (`npm run format:check`)
- **MANDATORY: All tests pass with coverage** (`npm run test:coverage`) - This includes:
  - All existing tests must pass
  - New/modified code must have test coverage
  - Test coverage must meet threshold (100% as per vitest.config.ts)
  - **If you modified code, you MUST have updated/added tests before running validation**

#### When to Run Validation

Run `npm run validate` in the following scenarios:

1. After editing any TypeScript source files
2. After creating new files
3. After modifying existing files
4. After completing a feature implementation
5. Before marking tasks as complete
6. Before committing changes

#### Exception Cases for Validation

You may skip validation only if:

- The user explicitly requests to skip validation
- You are only reading files (no code changes made)
- You are only searching or examining the codebase

#### If Validation Fails

If `npm run validate` fails:

1. Fix any linting errors first
2. Fix any formatting issues
3. Fix any failing tests
4. Re-run validation until it passes
5. Do not mark tasks as complete until validation passes
6. Do not commit changes until validation passes

### Committing Changes

**CRITICAL**: You MUST request explicit permission from the user before making any commits to the local branch.

1. **Run validation first**: Ensure `npm run validate` passes before committing
2. **Request permission**: Before committing, you MUST:
   - Inform the user that you are ready to commit changes
   - Show a summary of what will be committed
   - **Explicitly ask**: "May I commit these changes?"
   - **Wait for explicit user approval** before proceeding
3. **Only after receiving permission**: Commit all changes to the feature branch
4. **Use descriptive commit messages** that explain what was changed
5. **Automatically push after commit**: After committing, automatically push the branch to the remote repository without asking for permission:

   ```bash
   git push -u origin <branch-name>
   ```

### Pull Request Creation

**CRITICAL**: You MUST request explicit permission from the user before creating any Pull Request. Do not create a PR automatically without explicit user approval.

**IMPORTANT**: Only create a Pull Request **after the user explicitly accepts all changes and explicitly requests a PR to be created**.

1. **Wait for user acceptance**: Before creating a PR, ensure:
   - User has reviewed all code changes
   - User has explicitly accepted the changes
   - User has confirmed they are satisfied with the implementation

2. **Request permission**: Before creating a PR, you MUST:
   - Inform the user that you are ready to create a Pull Request
   - Show the PR title and description that will be used
   - **Explicitly ask**: "May I create a Pull Request to merge this branch into develop?"
   - **Wait for explicit user approval** before proceeding

3. **Only after receiving permission**: Ensure GitHub CLI is authenticated (if not already):

   ```bash
   gh auth status
   ```

4. **Only after receiving permission**: Create Pull Request to merge into `develop`:

   **CRITICAL**: Always use a temporary file for the PR description to avoid shell interpretation issues with special characters (backticks, quotes, etc.):

   **Recommended approach** (using workspace directory with absolute path):

   ```bash
   # Step 1: Create temporary file in workspace using write tool or echo
   # Write PR description to pr_description.md in workspace root

   # Step 2: Create PR using absolute path to the file
   gh pr create --base develop --head <branch-name> --title "<PR Title>" --body-file $(pwd)/pr_description.md

   # Step 3: Clean up temporary file
   rm $(pwd)/pr_description.md
   ```

   **Note**: When creating the PR description file:
   - Use proper markdown formatting with backticks for code elements (e.g., `` `methodName` ``, `` `ClassName` ``, `` `file/path.ts` ``)
   - Include all sections: Summary, Changes, Benefits, Testing, Files Modified
   - The file should contain the complete PR description with all formatting intact

5. **PR Title**: Should be descriptive and match the branch purpose
   - Example: "Add user authentication feature"
   - Example: "Fix pagination validation bug"

6. **PR Description**: Should include:
   - Summary of changes
   - What was implemented/fixed
   - Any relevant context or notes
   - Use proper markdown formatting with backticks for code elements (method names, class names, file paths)
   - **MUST be written to a temporary file first** to avoid shell interpretation issues with special characters

   **Why use a temp file?**: When passing PR description directly via `--body`, shell interprets backticks, quotes, and other special characters, causing formatting issues. Using `--body-file` ensures the description is read exactly as written.

   **Example workflow**:

   ```bash
   # 1. Create temp file with PR description (using write tool or similar)
   # File: pr_description.md
   # Content includes markdown with backticks like: `verifyToken`, `User`, etc.

   # 2. Create PR with file
   gh pr create --base develop --head <branch> --title "..." --body-file $(pwd)/pr_description.md

   # 3. Clean up
   rm $(pwd)/pr_description.md
   ```

### Workflow Summary

**MANDATORY: Execute steps 1-5 FIRST before any code changes. This is not optional.**

**Complete workflow for any code change:**

### PHASE 1: Branch Setup (MUST DO FIRST - BEFORE ANY CODE CHANGES)

1. ✅ **FIRST STEP**: Check current branch: `git branch --show-current`
2. ✅ If on `main` or `develop`: Switch to develop: `git checkout develop`
3. ✅ Fetch latest: `git fetch origin`
4. ✅ Pull latest develop: `git pull origin develop`
5. ✅ Create new branch: `git checkout -b <branch-name>`

### PHASE 2: Development (ONLY AFTER PHASE 1 IS COMPLETE)

1. ✅ Make code changes
2. ✅ **MANDATORY: Write/update tests** for all code changes:
   - For new code: Write new tests immediately
   - For modified code: Update existing tests and add new tests for new code paths
   - Ensure all tests pass: `npm test`
   - Verify coverage: `npm run test:coverage`
3. ✅ Run validation: `npm run validate` (MUST pass before committing - includes tests)
4. ✅ **Request permission to commit**: Ask user "May I commit these changes?" and wait for approval
5. ✅ **Only after permission granted**: Commit changes: `git add . && git commit -m "<descriptive message>"`
6. ✅ **Automatically push after commit**: Push branch to remote without asking: `git push -u origin <branch-name>`

### PHASE 3: Pull Request (ONLY AFTER USER ACCEPTS CHANGES)

1. ✅ **Wait for user to review and accept all changes**
2. ✅ **Request permission to create PR**: Ask user "May I create a Pull Request to merge this branch into develop?" and wait for approval
3. ✅ **Only after permission granted**: Create PR using temporary file for description: Create temp file with PR description, then `gh pr create --base develop --head <branch-name> --title "<title>" --body-file <temp-file>`, then remove temp file

### Exception Cases

You may skip branch creation only if:

- The user explicitly requests to work directly on a branch (but still not on `main` or `develop`)
- You are only reading files (no code changes made)
- You are only searching or examining the codebase

### Branch Name Generation

When creating a branch name from a user request:

- Extract the main action/feature from the request
- Convert to kebab-case
- Keep it concise but descriptive
- Examples:
  - "add authentication" → `add-authentication`
  - "fix the pagination bug" → `fix-pagination-bug`
  - "implement user search feature" → `implement-user-search`
  - "refactor validation utilities" → `refactor-validation-utilities`

### Verification Checklist

Before marking a task as complete, verify:

- [ ] Started from latest `develop` branch (fetched and pulled before creating branch)
- [ ] Working on a feature branch (not `main` or `develop`)
- [ ] **MANDATORY: Tests written/updated for all code changes**
  - [ ] New code has corresponding new tests
  - [ ] Modified code has updated tests reflecting new behavior
  - [ ] New code paths have test coverage
  - [ ] All existing tests still pass
- [ ] Code validation passed: `npm run validate` (linting, formatting, and tests)
- [ ] **Explicit permission requested and received before committing**
- [ ] All changes committed to the branch (only after user permission)
- [ ] Branch automatically pushed to remote after commit
- [ ] **User has reviewed and accepted all changes**
- [ ] **Explicit permission requested and received before creating PR**
- [ ] Pull Request created to merge into `develop` (only after user permission)
- [ ] PR title and description are clear and descriptive
