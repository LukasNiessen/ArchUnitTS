---
name: 🐛 Bug Report
about: Create a report to help us improve ArchUnitTS
title: '[BUG] '
labels: ['bug', 'needs-triage']
assignees: ['LukasNiessen']
---

## 🐛 Bug Description

A clear and concise description of what the bug is.

## 🔄 Steps to Reproduce

Steps to reproduce the behavior:

1. Go to '...'
2. Click on '....'
3. Scroll down to '....'
4. See error

## ✅ Expected Behavior

A clear and concise description of what you expected to happen.

## ❌ Actual Behavior

A clear and concise description of what actually happened.

## 🖼️ Screenshots

If applicable, add screenshots to help explain your problem.

## 🌍 Environment

**Please complete the following information:**

- OS: [e.g. Windows 11, macOS 13, Ubuntu 22.04]
- Node.js Version: [e.g. 18.19.0]
- NPM Version: [e.g. 10.2.3]
- ArchUnitTS Version: [e.g. 2.1.6]
- Testing Framework: [e.g. Jest, Vitest, Mocha]

## 📄 Code Sample

**Minimal reproduction case:**

```typescript
// Please provide a minimal code example that reproduces the issue
import { projectFiles } from 'archunit-ts';

const rule = projectFiles('tsconfig.json').should().beFreeOfCycles();

// What happens when you run this?
```

## 📋 Additional Context

Add any other context about the problem here.

## 🔍 Error Output

**If applicable, paste the full error output:**

```
[Paste error messages here]
```

## ✋ Checklist

- [ ] I have searched existing issues to make sure this isn't a duplicate
- [ ] I have provided a minimal reproduction case
- [ ] I have included my environment information
- [ ] I have checked the latest version of ArchUnitTS
