// Auto-detect and setup all available testing frameworks
import { extendJestMatchers } from '../jest';
import { extendJasmineMatchers } from '../jasmine';
import { extendVitestMatchers } from '../vitest';

// Auto-detect and setup all available testing frameworks
// Each adapter function already includes conditional checks for framework availability
extendJestMatchers(); // Only sets up if Jest is available
extendJasmineMatchers(); // Only sets up if Jasmine is available
extendVitestMatchers(); // Only sets up if Vitest is available

// TODO: not working yet, needs work
//extendMochaMatchers(); // Only sets up if Mocha is available
//extendQUnitMatchers(); // Only sets up if QUnit is available
//extendAvaMatchers(); // Only sets up if Ava is available
