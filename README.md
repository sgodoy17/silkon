# silkon

Silkon is a TypeScript monorepo for building serverless Node.js applications.

## Packages

- `@silkon/common`: shared runtime guards, shared types, and base exceptions.

## Development

Requirements:

- Node.js 20 or newer
- npm

Common workspace commands:

```bash
npm install
npm run build
npm run test
npm run lint
npm run changeset
npm run changeset:version
cd packages/{package-name} && npm run build
```

## Repository layout

- `packages/common`: shared code published as `@silkon/common`
- `packages/core`: shared code published as `@silkon/core`
- `tsconfig*.json`: TypeScript project references for the workspace
- `jest.config.js`: test runner configuration
- `eslint.config.mjs`: lint configuration

## Contributing

This project is still in its infancy.
Contributions are welcome!
Please open an issue or pull request if you have any questions or suggestions.
Thank you!

## License

MIT
