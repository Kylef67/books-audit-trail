module.exports = {
    transform: {
        "^.+\\.(js|jsx)?$": "babel-jest"
    },
    testEnvironmentOptions: {
        url:"http://localhost/",
        IS_OFFLINE: true
    },
    setupFiles: [
        "<rootDir>/src/setEnvVars.js"
    ],
    collectCoverage: true,
    collectCoverageFrom: ["src/**.js", "src/*/**.js"],
    testMatch: [ "**/src/(*.)+test.[jt]s?(x)" ],
    testResultsProcessor: "jest-sonar-reporter",
    coverageThreshold: {
        global: {
            branches: 80,
            functions: 90,
            lines: 80,
            statements: 80
        }
    },
    coverageReporters: ["html", "lcov","text"]
}
