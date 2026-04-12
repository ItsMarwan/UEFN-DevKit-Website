# Security Policy

## Reporting a Vulnerability

To report a vulnerability, please contact `itsmarwanuefn@gmail.com` with details explaining the issue.

You should get a response in less than 24 hours and a fix should be pushed in less than 48 hours.

Once a fix has been pushed, you will be contacted to let you know and depending on severity, you may be rewarded :)

## Security Best Practices

### Known Security Considerations

- **Client-Side Exposure**: Variables prefixed with `NEXT_PUBLIC_` are exposed to the browser - never put secrets in these
- **Server-Side Only**: Keep sensitive operations server-side only (API routes)
- **Input Validation**: All user inputs are validated, but additional validation layers are recommended
- **CORS**: API routes have appropriate CORS configuration for security

### Production Deployment Recommendations

- Use a reputable hosting provider (Vercel, Netlify, etc.)
- Enable security headers (CSP, HSTS, etc.)
- Monitor for unusual activity
- Keep backups of your database and configuration
- Use environment-specific configurations

## Responsible Disclosure

We kindly ask that you:
- Give us reasonable time to fix issues before public disclosure
- Avoid accessing or modifying user data
- Don't perform DoS attacks or degrade service performance
- Don't spam our systems or users

## Security Updates

Security updates will be released as soon as possible. Critical vulnerabilities will be addressed within 48 hours of verification.
