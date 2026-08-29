const esModules = [
  // file-type and all dependencies: https://github.com/sindresorhus/file-type
  'file-type',
  'strtok3',
  'readable-web-to-node-stream',
  'token-types',
  'peek-readable',
  'locate-path',
  'p-locate',
  'p-limit',
  'yocto-queue',
  'unicorn-magic',
  'path-exists',
  'qs-esm',
  'uint8array-extras',
  // newer file-type chain, pulled in by payload since 3.88
  '@borewit/text-codec',
  '@tokenizer/inflate',
  // ESM-only, reachable from payload's dist entry since 3.88
  'uuid',
  'image-dimensions',
  'http-status',
  'croner',
  'date-fns',
  'get-tsconfig',
  'payload',
  '@payloadcms/next',
  '@payloadcms/ui',
  '@payloadcms/graphql',
  '@payloadcms/translations',
  '@payloadcms/db-mongodb',
  '@payloadcms/richtext-lexical',
].join('|')

/** @type {import('jest').Config} */
const customJestConfig = {
  extensionsToTreatAsEsm: ['.ts', '.tsx'],
  transformIgnorePatterns: [
    `/node_modules/(?!.pnpm)(?!(${esModules})/)`,
    `/node_modules/.pnpm/(?!(${esModules.replace(/\//g, '\\+')})@)`,
  ],
  moduleNameMapper: {
    '\\.(css|scss)$': '<rootDir>/test/helpers/mocks/emptyModule.js',
    '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$':
      '<rootDir>/test/helpers/mocks/fileMock.js',
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  testEnvironment: 'node',
  testTimeout: 90000,
  transform: {
    '^.+\\.(t|j)sx?$': ['@swc/jest'],
  },
  verbose: true,
  testMatch: ['<rootDir>/**/*int.spec.ts'],
  moduleNameMapper: {
    '\\.(css|scss)$': '<rootDir>/helpers/mocks/emptyModule.js',
    '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$':
      '<rootDir>/helpers/mocks/fileMock.js',
    // payload 3.88 pulls in file-type@21, whose '.' export offers only `import`
    // under the `node` condition, so jest's default (node, require, default)
    // conditions resolve nothing and it reports the package as missing. The
    // './node' subpath exposes the same entry behind `default`, which resolves
    // under any condition; the transform allowlist above converts it to CJS.
    '^file-type$': 'file-type/node',
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
}

export default customJestConfig
