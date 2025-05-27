# Changelog

All notable changes to ArchUnitTS will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.1.6] - 2024-12-07

### ✨ Added

- **🎨 Colorful Error Messages**: Revolutionary new error formatting with colors and clickable file paths
- **📍 IDE Integration**: File paths now include `:1:1` suffix for clickable navigation in VS Code, IntelliJ, and other IDEs
- **📊 Enhanced Violation Details**: Detailed, human-readable error messages instead of JSON dumps
- **🎯 Improved Developer Experience**: Clear violation counts and numbered lists for better readability

### 🔧 Improved

- **Error Formatting**: Complete rewrite of `ViolationFactory` and `ResultFactory` for better UX
- **Test Framework Integration**: Enhanced Jest, Vitest, Mocha integration with colorful output
- **Violation Messages**: Structured error messages with proper context and actionable information
- **Coverage**: Improved test coverage for error handling components

### 🐛 Fixed

- Generic "expected to pass" messages replaced with meaningful architecture rule descriptions
- JSON.stringify() error dumps replaced with formatted, readable violation details
- Better error message consistency across all violation types

### 💥 Breaking Changes

- Error message format has changed (now more readable and developer-friendly)
- Old JSON-based error format is no longer used

## [2.1.5] - 2024-11-15

### ✨ Added

- Support for Node.js 20
- Enhanced TypeScript 5.3 compatibility
- Improved circular dependency detection

### 🔧 Improved

- Performance optimizations for large codebases
- Better memory usage in metric calculations
- Enhanced ESM support

## [2.1.0] - 2024-10-01

### ✨ Added

- **UML Architecture Testing**: Test your code against PlantUML architecture diagrams
- **Advanced Metrics**: LCOM4, Distance from Main Sequence, and more
- **Slice Testing**: Advanced dependency rules for architectural slices
- **Auto-Detection**: Automatic test framework detection and setup

### 🔧 Improved

- Faster dependency graph analysis
- Better TypeScript integration
- Enhanced error messages

## [2.0.0] - 2024-08-15

### 💥 Breaking Changes

- Minimum Node.js version is now 14
- New fluent API design
- Restructured package exports

### ✨ Added

- Complete API redesign with fluent interface
- Support for multiple testing frameworks (Jest, Vitest, Mocha, etc.)
- Advanced code metrics (LCOM, coupling, cohesion)
- Comprehensive cycle detection
- File pattern matching capabilities

### 🗑️ Removed

- Legacy API (1.x) is no longer supported
- Deprecated configuration options

## [1.9.0] - 2024-06-10

### ✨ Added

- Basic architecture rule testing
- Dependency validation
- Simple cycle detection
- Jest integration

### 🔧 Improved

- Initial stable release
- Basic documentation
- Core functionality

---

## Legend

- ✨ **Added** for new features
- 🔧 **Improved** for changes in existing functionality
- 🐛 **Fixed** for bug fixes
- 🗑️ **Removed** for removed features
- 💥 **Breaking Changes** for incompatible changes
- 🔒 **Security** for security improvements
