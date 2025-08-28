# NoMoreLeaks HarperDB EdgeWorker

An Akamai EdgeWorker that checks if user credentials exist in a known compromised credentials database via HarperDB.

## Overview

This EdgeWorker acts as a security layer by checking incoming credential hashes against a database of known compromised credentials. It's designed to prevent users from using credentials that have been exposed in data breaches.

## Features

- 🔍 **Hash Lookup**: Checks if a credential hash exists in HarperDB
- 🛡️ **Security First**: Returns null for any errors to avoid breaking the authentication flow
- 📊 **Comprehensive Logging**: Detailed logging for monitoring and debugging
- ⚡ **High Performance**: Runs at the edge for minimal latency
- 🔧 **Configurable**: Supports PMUSER variables and header-based configuration

## How It Works

1. The EdgeWorker receives a request with a credential hash in the `X-Hash-Value` header
2. It makes a subrequest to a HarperDB endpoint to check if the hash exists
3. Returns either:
   - `{"id": "86cdca52-a34e-4899-8c12-fd370b9b5c56"}` if the hash is found (compromised)
   - `{"id": null}` if the hash is not found (safe) or if any error occurs

## Configuration

### Required Headers/Variables

| Parameter | Source | Description |
|-----------|--------|-------------|
| `X-Hash-Value` | Request Header | The credential hash to check |
| `Authorization` | Header or PMUSER_AUTH_HEADER | Basic auth for HarperDB |
| `knownKeyUrl` | PMUSER_KNOWN_KEY_URL | HarperDB endpoint URL (defaults to `/knownKey`) |

### EdgeWorker Configuration

- **EdgeWorker ID**: 90754
- **Tier**: 200
- **Group ID**: 48668
- **Subworker**: Enabled for EdgeWorker clients

## Installation & Deployment

### Prerequisites

- Node.js and npm
- Akamai CLI with EdgeWorkers package
- Valid Akamai credentials in `.edgerc` file

### Build and Deploy

```bash
# Install dependencies
npm install

# Build the EdgeWorker
npm run build

# Deploy to staging (combines upload and activation)
npm run activate-edgeworker
```

### Available Scripts

- `npm run build` - Compile TypeScript and create deployment bundle
- `npm run upload-edgeworker` - Upload bundle to Akamai
- `npm run activate-edgeworker` - Upload and activate on staging
- `npm run generate-token` - Generate auth token for testing
- `npm run list-groups` - List available EdgeWorker groups
- `npm run create-ew-id` - Create new EdgeWorker ID

## API Reference

### Request Format

```http
GET /your-endpoint
X-Hash-Value: <credential-hash>
Authorization: Basic <base64-encoded-credentials>
```

### Response Format

#### Success (Hash Found - Compromised)
```json
{
  "id": "86cdca52-a34e-4899-8c12-fd370b9b5c56"
}
```

#### Success (Hash Not Found - Safe) or Error
```json
{
  "id": null
}
```

## Error Handling

The EdgeWorker is designed to fail safely:

- Missing required headers → Returns `{"id": null}`
- HarperDB endpoint errors → Returns `{"id": null}`
- Network timeouts → Returns `{"id": null}`
- Any unexpected errors → Returns `{"id": null}`

This ensures that authentication flows are never broken due to security check failures.

## Logging

All events are logged for monitoring:

- **Info**: Successful hash lookups (found/not found)
- **Error**: Missing configuration, HTTP errors, network failures

Use Akamai DataStream to collect and analyze logs.

## Security Considerations

- The HarperDB endpoint must be deployed behind Akamai
- Use HTTPS for all communications
- Store authentication credentials securely using PMUSER variables
- Monitor logs for unusual patterns or errors

## Development

### File Structure

```
├── main.ts          # Main EdgeWorker code
├── package.json     # Dependencies and build scripts
├── tsconfig.json    # TypeScript configuration
├── built/          # Compiled JavaScript
└── dist/           # Deployment bundles
```

### TypeScript Configuration

- Target: ES2022
- Module: ES2022
- Output directory: `built/`
- Source maps: Disabled for production

## License

ISC License

## Author

jgrinwis@akamai.com

## Version

0.0.29