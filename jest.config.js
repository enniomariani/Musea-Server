import { pathsToModuleNameMapper } from 'ts-jest'
import tsConfig from './tests/tsconfig.json' with { type: 'json' };

export default {
    testEnvironment: 'node',
    moduleFileExtensions: ['js', 'ts', 'd.ts'],
    preset: "ts-jest",
    moduleNameMapper: pathsToModuleNameMapper(tsConfig.compilerOptions.paths ,{prefix: '<rootDir>/',  useESM: true }),
    roots: ['<rootDir>'],
    globals: {
        'ts-jest': {
            tsconfig: './tests/tsconfig.json',
            useESM: true,
        },
    },
};