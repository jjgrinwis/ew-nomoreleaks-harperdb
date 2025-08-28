# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an Akamai EdgeWorker that checks user credentials against a HarperDB database of known compromised credentials. It acts as a security layer to prevent users from using credentials exposed in data breaches.

- **EdgeWorker ID**: 90754
- **Tier**: 200  
- **Group ID**: 48668
- **Language**: TypeScript (ES2022)

## Development Commands

### Build and Deploy
- `npm run build` - Build TypeScript and create deployment bundle
- `npm run build-ts` - Compile TypeScript only
- `npm run build-bundle-json` - Create bundle.json with metadata
- `npm run build-ew-tgz` - Create deployment tarball

### EdgeWorker Management
- `npm run upload-edgeworker` - Upload bundle to Akamai
- `npm run activate-edgeworker` - Upload and activate on staging (combines build + upload + activation)
- `npm run generate-token` - Generate auth token for testing
- `npm run list-groups` - List available EdgeWorker groups
- `npm run create-ew-id` - Create new EdgeWorker ID

### Quick Deploy
```bash
npm run activate-edgeworker  # Full build, upload, and staging activation
```

## Architecture

### Core Files
- `main.ts` - Single EdgeWorker entry point with `onClientRequest()` handler
- `built/` - Compiled JavaScript output
- `dist/` - Deployment tarballs

### Key Components

#### Request Flow (main.ts:26-74)
1. Extract hash from `X-Hash-Value` header
2. Get HarperDB endpoint URL (PMUSER_KNOWN_KEY_URL or default `/knownKey`)
3. Get authentication (PMUSER_AUTH_HEADER or Authorization header)
4. Validate all required parameters exist
5. Make subrequest to HarperDB
6. Return JSON response

#### Security Pattern
- Always returns `{"id": null}` on errors to fail safely
- Never breaks authentication flows due to lookup failures
- Uses comprehensive error logging for monitoring

#### Configuration Sources
- PMUSER variables (for testing/static config)
- Request headers (for dynamic auth from parent EdgeWorker)

### TypeScript Configuration
- Target: ES2022
- Module: ES2022
- Output: `built/` directory
- No source maps in production
- Uses Akamai EdgeWorkers type definitions

### Deployment Process
1. TypeScript compilation
2. Bundle.json generation with version/metadata
3. Tarball creation with naming: `ew_90754_<version>.tgz`
4. Upload to Akamai EdgeWorkers platform
5. Activation on staging environment

### Error Handling Philosophy
The EdgeWorker implements "fail-safe" patterns:
- Missing headers → return null (don't block auth)
- HarperDB errors → return null (don't block auth)
- Network issues → return null (don't block auth)
- Log all failures for monitoring via DataStream

### Configuration Requirements
- `.edgerc` file with `betajam` section for Akamai CLI
- HarperDB endpoint must be deployed behind Akamai
- Authorization via Basic Auth headers