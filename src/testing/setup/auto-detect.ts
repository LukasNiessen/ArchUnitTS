// Auto-detect and setup all available testing frameworks
import { extendJestMatchers } from '../jest/jest-adapter';
import { extendJasmineMatchers } from '../jasmine/jasmine-adapter';
import { extendVitestMatchers } from '../vitest/vitest-adapter';
import { extendMochaMatchers } from '../mocha/mocha-adapter';
import { extendQUnitMatchers } from '../qunit/qunit-adapter';
import { extendAvaMatchers } from '../ava/ava-adapter';

// Auto-detect and setup all available testing frameworks
// Each adapter function already includes conditional checks for framework availability
extendJestMatchers(); // Only sets up if Jest is available
extendJasmineMatchers(); // Only sets up if Jasmine is available
extendVitestMatchers(); // Only sets up if Vitest is available
extendMochaMatchers(); // Only sets up if Mocha is available
extendQUnitMatchers(); // Only sets up if QUnit is available
extendAvaMatchers(); // Only sets up if Ava is available
