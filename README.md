# YapaMarket - Multi-Domain Astro SSR

Astro SSR application with multi-domain (new.yapamarket.com / nuevo.yapamarket.com) and multi-language support, configured for AWS Amplify Hosting.

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## Features

- ✅ Server-Side Rendering (SSR) active on AWS Amplify
- ✅ Multi-domain detection (English & Spanish)
- ✅ Dynamic language switching based on domain
- ✅ `/status` endpoint showing Node.js version and SSR status
- ✅ Production-ready AWS Amplify configuration

## Pages

- `/` - Home page (language switches based on domain)
- `/status` - Server status showing Node.js version and SSR confirmation

## Domains

| Domain | Language |
|--------|----------|
| `https://new.yapamarket.com/` | English (EN) |
| `https://nuevo.yapamarket.com/` | Spanish (ES) |

## Deployment

AWS Amplify automatically detects and uses `amplify.yml` for deployment.

For more detailed information, see [SETUP.md](SETUP.md)