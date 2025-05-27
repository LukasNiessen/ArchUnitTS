# Security Policy

## 🔒 Reporting Security Vulnerabilities

The ArchUnitTS team takes security vulnerabilities seriously. We appreciate your efforts to responsibly disclose your findings.

### 📧 How to Report

**Please do NOT report security vulnerabilities through public GitHub issues.**

Instead, please report security vulnerabilities by emailing: **security@archunitts.dev**

Include the following information in your report:

- Type of issue (e.g., buffer overflow, SQL injection, cross-site scripting, etc.)
- Full paths of source file(s) related to the manifestation of the issue
- The location of the affected source code (tag/branch/commit or direct URL)
- Any special configuration required to reproduce the issue
- Step-by-step instructions to reproduce the issue
- Proof-of-concept or exploit code (if possible)
- Impact of the issue, including how an attacker might exploit it

### 🛡️ Security Response Process

1. **Acknowledgment**: We will acknowledge receipt of your vulnerability report within 48 hours.

2. **Assessment**: Our security team will assess the vulnerability and determine its impact and severity.

3. **Fix Development**: We will work on developing a fix for the vulnerability.

4. **Release**: We will release a security update and publish a security advisory.

5. **Recognition**: We will credit you in our security advisory (unless you prefer to remain anonymous).

### ⏱️ Response Timeline

- **Initial Response**: Within 48 hours
- **Status Updates**: Every 7 days until resolution
- **Security Fix**: Target within 30 days for high severity issues

## 🔐 Supported Versions

We provide security updates for the following versions:

| Version | Supported          |
| ------- | ------------------ |
| 2.x.x   | ✅ Yes             |
| 1.x.x   | ⚠️ Limited support |
| < 1.0   | ❌ No              |

### 📋 Security Best Practices

When using ArchUnitTS in your projects:

1. **Keep Updated**: Always use the latest version of ArchUnitTS
2. **Secure Configuration**: Review your archunit configuration for any sensitive information
3. **CI/CD Security**: Ensure your architecture tests don't expose sensitive data in logs
4. **Dependencies**: Regularly audit and update dependencies

### 🚨 Known Security Considerations

- **File System Access**: ArchUnitTS reads your source code files. Ensure it's only used in trusted environments.
- **Configuration Files**: Configuration files may contain path information. Review for sensitive data.
- **Error Messages**: Error outputs may include file paths and code snippets. Consider this in CI/CD logs.

### 🔍 Security Features

ArchUnitTS includes several security-conscious features:

- **Read-Only Operations**: ArchUnitTS only reads files, never modifies your source code
- **Sandboxed Analysis**: Analysis runs in isolation without network access
- **Minimal Permissions**: Requires only file system read access to specified directories
- **No Data Collection**: No telemetry or data collection

## 📞 Contact Information

- **Security Email**: security@archunitts.dev
- **General Issues**: [GitHub Issues](https://github.com/LukasNiessen/ArchUnitTS/issues)
- **Maintainer**: [@LukasNiessen](https://github.com/LukasNiessen)

## 🏆 Hall of Fame

We would like to thank the following security researchers for responsibly disclosing vulnerabilities:

<!-- Future security researchers will be listed here -->

_Be the first to help us improve ArchUnitTS security!_

---

**Thank you for helping keep ArchUnitTS and the community safe! 🙏**
