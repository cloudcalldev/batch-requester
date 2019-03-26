module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/dist/'
  ],
  modulePathIgnorePatterns : [
    '/dist/'
  ]
};