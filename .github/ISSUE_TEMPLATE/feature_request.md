---
name: ✨ Feature Request
about: Suggest an idea for ArchUnitTS
title: '[FEATURE] '
labels: ['enhancement', 'needs-discussion']
assignees: ['LukasNiessen']
---

## 🚀 Feature Summary

A clear and concise description of what you want to happen.

## 💡 Motivation

**Is your feature request related to a problem? Please describe.**
A clear and concise description of what the problem is. Ex. I'm always frustrated when [...]

## 📝 Detailed Description

**Describe the solution you'd like**
A clear and concise description of what you want to happen.

## 🎯 Use Case

**Describe your use case**
How would this feature be used? What problem does it solve?

## 💻 Proposed API

**What would the API look like?**

```typescript
// Example of how you envision using this feature
import { projectFiles } from 'archunit-ts';

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
