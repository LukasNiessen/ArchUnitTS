# Contributing

Thanks for contributing!

## Setup

- Fork & clone: `git clone https://github.com/LukasNiessen/ArchUnitTS.git`
- Install: `npm install`
- Test: `npm test`
- Build: `npm run build`

## Guidelines

- Code Style: Run `npm run lint` and `npm run format` before commiting
- Commits: Use Conventional Commits (e.g., `feat:`, `fix:`)
- PRs: Use feature branches, clear descriptions, ensure CI passes
- Tests: Maintain high coverage

## Documentation

Documentation is automatically generated from TypeScript code using TypeDoc and deployed to GitHub Pages.

### Local Development

- Generate docs: `npm run docs`
- Watch mode: `npm run docs:watch`
- Serve locally: `npm run docs:serve`

### Writing Good Documentation

- Add JSDoc comments to all public APIs
- Use `@example` tags for code examples
- Use `@param` and `@returns` for functions
- Use `@since` for version information
- Group related functionality with `@group` tags

### Documentation Deployment

- Documentation is automatically deployed to [GitHub Pages](https://lukasniessen.github.io/ArchUnitTS/) on push to `main`
- Documentation validation runs on all PRs
- Configuration is in `typedoc.json`

## Issues

Bugs: Include environment, expected/actual behavior, steps, errors
Features: Check existing issues, provide use case

## Code of Conduct

Be respectful and inclusive. 😇
Happy coding! 🐲
