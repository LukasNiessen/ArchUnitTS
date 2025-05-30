---
name: Feature Request
about: Suggest an idea for ArchUnitTS
title: '[FEATURE] '
labels: ['enhancement']
assignees: []
---

# Feature Request

Describe the feature you'd like to see added.

## Problem

What problem does this solve? Is your feature request related to a problem?

## Proposed Solution

How would this feature work? What would the API look like?

```typescript
// Example usage
```

## Use Case

How would you use this feature in your project?

```typescript
// Example of how you envision using this feature
import { projectFiles } from 'archunit';

const rule = projectFiles('tsconfig.json').inFolder('src').should().yourNewFeature(); // Example API

await expect(rule).toPass();
```

## 🔄 Alternatives Considered

**Describe alternatives you've considered**
A clear and concise description of any alternative solutions or features you've considered.

## 📊 Impact Assessment

**What areas would this affect?**

- [ ] Core architecture testing
- [ ] File dependencies
- [ ] Metrics calculation
- [ ] Slice testing
- [ ] Error messages
- [ ] Test framework integration
- [ ] Performance
- [ ] Documentation

## 🎨 Implementation Ideas

**Do you have ideas on how this could be implemented?**
Any thoughts on the implementation approach, if you have them.

## 📋 Additional Context

Add any other context or screenshots about the feature request here.

## ✋ Checklist

- [ ] I have searched existing issues to make sure this isn't a duplicate
- [ ] I have provided a clear use case
- [ ] I have considered the API design
- [ ] I have thought about backward compatibility
