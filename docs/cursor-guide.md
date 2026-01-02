# Working with Cursor

This guide explains how to use Cursor AI editor effectively with this project, including the configured rules, tools, and workflows.

## Overview

This project includes Cursor-specific configuration in the `.cursor/rules/` directory that guides the AI assistant in understanding the project structure, following best practices, and automating common workflows.

## Cursor Rules

The project uses three main rule files that are always applied:

### 1. General Rules (`general.mdc`)

Contains project-wide conventions and patterns:

- **Documentation References**: Points to authoritative documentation files
- **Code Conventions**: File naming, code style, and formatting rules
- **Architecture Patterns**: Clean Architecture, DDD, CQRS patterns
- **Testing Requirements**: 100% test coverage requirement
- **Automatic Discovery**: Convention-based module, model, route, and GraphQL discovery

**Key Conventions:**

- File naming: `kebab-case` for all files
- Code style: `PascalCase` for classes, `camelCase` for variables
- Comments: Only when explaining "why", not "what"
- Validation ordering: Local validations first, then repository-dependent validations

### 2. Branch and PR Workflow (`branch-and-pr-workflow.mdc`)

Automates Git workflow and code validation:

**Mandatory Workflow:**

1. **Branch Creation**: Always create feature branches from `develop`
2. **Code Validation**: Run `npm run validate` after code changes
3. **Test Coverage**: Write tests for all new/modified code
4. **Commit Process**: Request permission before committing
5. **PR Creation**: Request permission before creating pull requests

**Key Rules:**

- Never commit directly to `main` or `develop`
- Always run validation before committing
- Tests are mandatory for all code changes
- Automatic push after commit (no permission needed)
- PR creation requires explicit user approval

### 3. Senior Architect Rules (`senior-architect.mdc`)

Provides architectural guidance and best practices:

- **Architectural Principles**: Scalability, maintainability, testability
- **Design Patterns**: Repository pattern, CQRS, domain events
- **Performance Considerations**: Database optimization, caching strategies
- **Security Best Practices**: Input validation, authentication, authorization
- **Code Quality**: Refactoring guidelines, technical debt management

## Cursor Tools and Features

### AI Assistant

The Cursor AI assistant is configured to:

1. **Follow Project Patterns**: Understands Clean Architecture, DDD, and CQRS patterns
2. **Enforce Conventions**: Applies file naming, code style, and formatting rules
3. **Automate Workflows**: Handles branch creation, validation, and PR workflows
4. **Write Tests**: Automatically writes tests for new code with 100% coverage requirement
5. **Reference Documentation**: Uses architecture and development guides for guidance

### Code Generation

When asking Cursor to generate code:

- It will follow the established patterns (command handlers, query handlers, repositories, etc.)
- It will use the correct file naming conventions
- It will create tests automatically
- It will follow validation ordering patterns
- It will respect layer boundaries (Domain, Application, Infrastructure, Adapters)

### Workflow Automation

Cursor can automate:

- **Branch Management**: Automatically creates feature branches from `develop`
- **Code Validation**: Runs `npm run validate` after code changes
- **Test Writing**: Generates tests following project patterns
- **Commit Messages**: Creates descriptive commit messages
- **PR Descriptions**: Generates PR descriptions with proper formatting

## Common Workflows

### Adding a New Feature

1. **Ask Cursor**: "Add a new feature to update user preferences"
2. **Cursor Actions**:
   - Checks current branch (creates feature branch if needed)
   - Creates command handler following patterns
   - Creates tests automatically
   - Runs validation
   - Requests commit permission

### Fixing a Bug

1. **Ask Cursor**: "Fix the pagination bug in user list endpoint"
2. **Cursor Actions**:
   - Creates feature branch
   - Updates code and tests
   - Runs validation
   - Requests commit permission

### Creating a New Module

1. **Ask Cursor**: "Create a new module for notifications"
2. **Cursor Actions**:
   - Creates module structure following conventions
   - Sets up domain, application, infrastructure, and adapters layers
   - Creates module configuration
   - Generates initial tests
   - Runs validation

## Best Practices

### When Working with Cursor

1. **Be Specific**: Provide clear, specific instructions
2. **Reference Patterns**: Mention existing patterns when asking for similar features
3. **Review Generated Code**: Always review AI-generated code before committing
4. **Use Documentation**: Reference architecture and development guides in requests
5. **Trust the Workflow**: Let Cursor handle branch creation and validation

### Code Review Checklist

Before accepting Cursor's changes:

- [ ] Code follows established patterns
- [ ] File names use correct conventions
- [ ] Tests are included and passing
- [ ] Validation passes (`npm run validate`)
- [ ] No hardcoded values or secrets
- [ ] Error handling is appropriate
- [ ] Documentation is updated if needed

## Troubleshooting

### Cursor Not Following Rules

If Cursor doesn't seem to follow the rules:

1. Check that rule files are in `.cursor/rules/` directory
2. Verify rule files have `alwaysApply: true` in frontmatter
3. Restart Cursor to reload rules
4. Explicitly reference the rule in your request

### Validation Failures

If validation fails:

1. Review the error messages
2. Fix linting errors first
3. Fix formatting issues
4. Fix failing tests
5. Re-run validation

### Test Coverage Issues

If test coverage is below 100%:

1. Check which files are missing coverage
2. Ask Cursor to add tests for uncovered code
3. Ensure all code paths are tested
4. Run `npm run test:coverage` to verify

## Configuration Files

### Rule Files Location

```
.cursor/
└── rules/
    ├── general.mdc              # General project rules
    ├── branch-and-pr-workflow.mdc  # Git workflow rules
    └── senior-architect.mdc     # Architectural guidance
```

### Rule File Format

Rule files use Markdown with frontmatter:

```markdown
---
alwaysApply: true
---

# Rule Title

Rule content...
```

## Advanced Usage

### Custom Instructions

You can provide custom instructions to Cursor by:

1. Adding comments in code files
2. Referencing specific documentation sections
3. Using explicit patterns in requests

### Integration with Other Tools

Cursor works well with:

- **Git**: Automatic branch and commit management
- **ESLint**: Code quality enforcement
- **Prettier**: Code formatting
- **Vitest**: Test execution and coverage
- **TypeScript**: Type checking

## Getting Help

If you encounter issues:

1. Check the documentation in `docs/` folder
2. Review the rule files in `.cursor/rules/`
3. Check existing code for patterns
4. Ask Cursor to explain the pattern or rule

## Summary

Cursor is configured to help you:

- ✅ Follow project conventions automatically
- ✅ Generate code following established patterns
- ✅ Write tests with proper coverage
- ✅ Manage Git workflow (branches, commits, PRs)
- ✅ Validate code quality
- ✅ Reference architecture and development guides

By following the configured rules and workflows, Cursor becomes a powerful development assistant that maintains code quality and consistency across the project.
