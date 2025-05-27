# Contributing to ArchUnitTS 🤝

Thank you for your interest in contributing to ArchUnitTS! We welcome contributions from developers of all experience levels.

## 🌟 Ways to Contribute

- 🐛 **Bug Reports**: Found an issue? Let us know!
- ✨ **Feature Requests**: Have an idea? We'd love to hear it!
- 📝 **Documentation**: Help improve our docs
- 🧪 **Tests**: Add test cases or improve existing ones
- 💻 **Code**: Fix bugs or implement new features
- 🎨 **Examples**: Create usage examples and tutorials

## 🚀 Getting Started

### Prerequisites

- Node.js 14+
- npm 6+
- TypeScript knowledge
- Git

### Local Development Setup

1. **Fork and Clone**

    ```bash
    git clone https://github.com/YOUR_USERNAME/ArchUnitTS.git
    cd ArchUnitTS
    ```

2. **Install Dependencies**

    ```bash
    npm install
    ```

3. **Run Tests**

    ```bash
    npm test
    ```

4. **Build Project**

    ```bash
    npm run build
    ```

5. **Start Development**
    ```bash
    npm run dev
    ```

## 🧪 Testing

We maintain high test coverage and all contributions should include tests:

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific test files
npm test -- --testNamePattern="your-test-name"
```

## 📝 Code Style

We use strict linting and formatting rules:

```bash
# Check code style
npm run lint

# Auto-fix linting issues
npm run lint:fix

# Format code
npm run format

# Check formatting
npm run format:check
```

## 🔄 Pull Request Process

1. **Create Feature Branch**

    ```bash
    git checkout -b feature/your-feature-name
    # or
    git checkout -b fix/your-bug-fix
    ```

2. **Make Changes**

    - Write clean, tested code
    - Follow existing code patterns
    - Add/update tests as needed
    - Update documentation if necessary

3. **Commit Changes**

    ```bash
    git add .
    git commit -m "feat: add new architecture rule validation"
    ```

    We follow [Conventional Commits](https://conventionalcommits.org/):

    - `feat:` new features
    - `fix:` bug fixes
    - `docs:` documentation changes
    - `test:` test changes
    - `refactor:` code refactoring
    - `perf:` performance improvements
    - `style:` formatting changes

4. **Push and Create PR**

    ```bash
    git push origin feature/your-feature-name
    ```

    Then create a Pull Request on GitHub with:

    - Clear title and description
    - Reference any related issues
    - Include screenshots if UI changes
    - Ensure all CI checks pass

## 🐛 Bug Reports

When reporting bugs, please include:

- **Environment**: OS, Node.js version, npm version
- **ArchUnitTS Version**: Which version are you using?
- **Expected Behavior**: What should happen?
- **Actual Behavior**: What actually happens?
- **Steps to Reproduce**: Minimal example to reproduce the issue
- **Error Messages**: Full error output if applicable

**Template:**

```markdown
## Bug Report

**Environment:**

- OS: Windows 11 / macOS 13 / Ubuntu 22.04
- Node.js: v18.19.0
- npm: v10.2.3
- ArchUnitTS: v2.1.6

**Expected Behavior:**
[Description]

**Actual Behavior:**
[Description]

**Steps to Reproduce:**

1.
2.
3.

**Error Output:**
```

[Paste error messages here]

```

```

## ✨ Feature Requests

For feature requests, please:

- Check existing issues first
- Provide clear use case and rationale
- Include example code if possible
- Consider implementation complexity

## 🏗️ Architecture Guidelines

### Project Structure

```
src/
├── common/          # Shared utilities and types
├── files/           # File-based architecture rules
├── metrics/         # Code metrics and analysis
├── slices/          # Slice-based architecture rules
└── testing/         # Test framework integrations
```

### Code Guidelines

- **TypeScript**: Use strict TypeScript with proper typing
- **Functional Style**: Prefer pure functions and immutable data
- **Error Handling**: Provide clear, actionable error messages
- **Performance**: Consider large codebase performance
- **Testing**: Comprehensive test coverage required
- **Documentation**: JSDoc comments for public APIs

### Adding New Features

1. **Design First**: Discuss major changes in issues
2. **Fluent API**: Follow existing fluent API patterns
3. **Test Framework Support**: Ensure compatibility with all supported frameworks
4. **Error Messages**: Provide colorful, helpful error messages
5. **Documentation**: Update README and add examples

## 📚 Documentation

Help improve our documentation:

- **README**: Keep examples current and clear
- **API Docs**: JSDoc comments for all public methods
- **Examples**: Real-world usage examples
- **Architecture**: Explain design decisions

## 🎯 Code Review Guidelines

### For Reviewers

- ✅ Code follows style guidelines
- ✅ Tests are comprehensive and pass
- ✅ Documentation is updated
- ✅ No breaking changes (unless intentional)
- ✅ Performance impact considered
- ✅ Error messages are helpful

### For Contributors

- Be open to feedback
- Respond to review comments promptly
- Make requested changes or explain why not
- Keep PRs focused and reasonably sized

## 🏆 Recognition

Contributors will be:

- Listed in our contributors section
- Credited in release notes for significant contributions
- Invited to join the core team for exceptional contributions

## 💬 Getting Help

- **GitHub Issues**: For bugs and feature requests
- **Discussions**: For questions and community chat
- **Email**: lks.niessen@gmail.com for security issues

## 📜 Code of Conduct

Please be respectful and inclusive. We welcome developers from all backgrounds and experience levels.

---

**Happy Coding! 🚀**

Thank you for helping make ArchUnitTS better for everyone!
