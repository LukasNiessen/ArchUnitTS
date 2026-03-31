# Contributing

Thanks for contributing!

## Setup

- Fork & clone: `git clone https://github.com/LukasNiessen/ArchUnitTS.git`
- Install: `npm install`
- Test: `npm test`
- Build: `npm run build`

## Guidelines

- Code Style: Run `npm run lint` and `npm run format` before committing
- Commits: Use [Conventional Commits](https://www.conventionalcommits.org/) (see below)
- PRs: Use feature branches, clear descriptions, ensure CI passes
- Tests: Maintain high coverage

## Commit Convention

We use [Conventional Commits](https://www.conventionalcommits.org/) to automate versioning and changelog generation via [semantic-release](https://github.com/semantic-release/semantic-release). Your commit messages determine the next version number:

| Commit prefix | Version bump | Example |
|---|---|---|
| `fix:` | Patch (2.1.63 -> 2.1.64) | `fix: handle empty tsconfig in graph extraction` |
| `feat:` | Minor (2.1.63 -> 2.2.0) | `feat: add support for JS file analysis` |
| `feat!:` or `BREAKING CHANGE:` in footer | Major (2.1.63 -> 3.0.0) | `feat!: remove deprecated matchFilename API` |

Other prefixes like `chore:`, `docs:`, `refactor:`, `test:`, `ci:` do **not** trigger a release.

## Releases

Releases are fully automated. When a PR is merged to `main`:

1. CI runs lint + tests
2. If CI passes, [semantic-release](https://github.com/semantic-release/semantic-release) analyzes commit messages since the last release
3. If there are `fix:` or `feat:` commits, it automatically:
   - Bumps the version in `package.json`
   - Updates `CHANGELOG.md`
   - Publishes to npm
   - Creates a GitHub release with release notes

No manual version bumping or publishing is needed.

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

Be respectful and inclusive.
Happy coding!
