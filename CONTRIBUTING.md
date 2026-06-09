# Contributing to Baileys WhatsApp API

Thank you for your interest in contributing to the Baileys WhatsApp API! We welcome contributions from the community and appreciate your help in making this project better.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [How to Contribute](#how-to-contribute)
- [Development Setup](#development-setup)
- [Coding Standards](#coding-standards)
- [Testing](#testing)
- [Documentation](#documentation)
- [Pull Request Process](#pull-request-process)
- [Community](#community)

## Code of Conduct

This project and everyone participating in it is governed by our Code of Conduct. By participating, you are expected to uphold this code. Please report unacceptable behavior to the project maintainers.

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL 12+
- Git
- Basic knowledge of TypeScript/JavaScript
- Familiarity with REST APIs

### Areas Where We Need Help

- 🐛 **Bug fixes** - Help us identify and fix issues
- ✨ **New features** - Implement new WhatsApp API functionality
- 📝 **Documentation** - Improve guides, examples, and API docs
- 🧪 **Testing** - Add unit tests and integration tests
- 🎨 **UI/UX** - Enhance the dashboard interface
- 🌐 **Internationalization** - Add support for multiple languages
- 🔧 **DevOps** - Improve CI/CD, Docker, deployment scripts

## How to Contribute

### Reporting Bugs

1. **Search existing issues** to avoid duplicates
2. **Use the bug report template** when creating new issues
3. **Provide detailed information**:
   - Clear description of the problem
   - Steps to reproduce
   - Expected vs actual behavior
   - Environment details
   - Relevant logs or screenshots

### Suggesting Features

1. **Check existing feature requests** to avoid duplicates
2. **Use the feature request template**
3. **Describe the feature** clearly:
   - What problem does it solve?
   - How should it work?
   - Any implementation ideas?

### Contributing Code

1. **Fork the repository**
2. **Create a feature branch** from `main`
3. **Make your changes**
4. **Add tests** for new functionality
5. **Update documentation** as needed
6. **Submit a pull request**

## Development Setup

### 1. Fork and Clone

```bash
# Fork the repository on GitHub, then clone your fork
git clone https://github.com/yourusername/baileys-api.git
cd baileys-api

# Add the original repository as upstream
git remote add upstream https://github.com/originalowner/baileys-api.git
```

### 2. Install Dependencies

```bash
# Install dependencies
yarn install

# Set up environment
cp .env.example .env
# Edit .env with your local configuration
```

### 3. Set Up Database

```bash
# Generate Prisma client
yarn db:generate

# Run migrations
yarn migrate

# (Optional) Seed database with test data
yarn db:seed
```

### 4. Start Development Server

```bash
# Start in development mode
yarn dev

# The API will be available at http://localhost:3001
```

## Coding Standards

### TypeScript/JavaScript

- Use **TypeScript** for all new code
- Follow **ESLint** configuration
- Use **Prettier** for code formatting
- Write **clear, descriptive variable names**
- Add **JSDoc comments** for functions and classes

### Code Style

```typescript
// Good: Clear function with proper typing
async function createWhatsAppSession(
  sessionId: string, 
  userId: string, 
  options?: SessionOptions
): Promise<WhatsAppSession> {
  // Implementation
}

// Good: Proper error handling
try {
  const result = await whatsAppService.sendMessage(sessionId, to, content);
  return { success: true, data: result };
} catch (error) {
  logger.error('Failed to send message:', error);
  throw new ApiError('Message sending failed', 500);
}
```

### API Design

- Follow **RESTful conventions**
- Use **consistent response formats**
- Include **proper HTTP status codes**
- Add **comprehensive error messages**
- Document all endpoints with **Swagger/OpenAPI**

### Database

- Use **Prisma** for database operations
- Write **migrations** for schema changes
- Follow **naming conventions** (camelCase for fields)
- Add **proper indexes** for performance

## Testing

### Running Tests

```bash
# Run all tests
yarn test

# Run tests in watch mode
yarn test:watch

# Run tests with coverage
yarn test:coverage
```

### Writing Tests

- Write **unit tests** for services and utilities
- Write **integration tests** for API endpoints
- Use **descriptive test names**
- Mock external dependencies
- Aim for **high test coverage**

Example test:

```typescript
describe('WhatsAppService', () => {
  describe('sendMessage', () => {
    it('should send a text message successfully', async () => {
      // Arrange
      const sessionId = 'test-session';
      const to = '1234567890@s.whatsapp.net';
      const content = { text: 'Hello World' };

      // Act
      const result = await whatsAppService.sendMessage(sessionId, to, content);

      // Assert
      expect(result).toBeDefined();
      expect(result.key).toBeDefined();
    });
  });
});
```

## Documentation

### API Documentation

- Update **Swagger/OpenAPI** specs for new endpoints
- Include **request/response examples**
- Document **error responses**
- Add **authentication requirements**

### Code Documentation

- Add **JSDoc comments** for public functions
- Update **README.md** for new features
- Create **guides** for complex features
- Keep **CHANGELOG.md** updated

### Examples

- Provide **working examples** for new features
- Update **usage examples** in README
- Create **tutorial content** when appropriate

## Pull Request Process

### Before Submitting

1. **Sync with upstream**:
```bash
git fetch upstream
git checkout main
git merge upstream/main
```

2. **Create feature branch**:
```bash
git checkout -b feature/your-feature-name
```

3. **Make changes and commit**:
```bash
git add .
git commit -m "feat: add new WhatsApp feature"
```

4. **Push to your fork**:
```bash
git push origin feature/your-feature-name
```

### Pull Request Guidelines

- **Use descriptive titles** (e.g., "feat: add group management endpoints")
- **Fill out the PR template** completely
- **Link related issues** using keywords (fixes #123)
- **Keep PRs focused** - one feature/fix per PR
- **Update documentation** as needed
- **Add tests** for new functionality

### PR Review Process

1. **Automated checks** must pass (CI, tests, linting)
2. **Code review** by maintainers
3. **Address feedback** promptly
4. **Squash commits** if requested
5. **Merge** after approval

## Community

### Communication

- **GitHub Issues** - Bug reports and feature requests
- **GitHub Discussions** - General questions and ideas
- **Pull Requests** - Code contributions and reviews

### Getting Help

- Check the **documentation** first
- Search **existing issues** and discussions
- Ask questions in **GitHub Discussions**
- Be **respectful** and **patient**

### Recognition

Contributors will be:
- **Listed** in the project's contributors section
- **Mentioned** in release notes for significant contributions
- **Thanked** publicly for their help

## License

By contributing to this project, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to the Baileys WhatsApp API! Your help makes this project better for everyone. 🎉
