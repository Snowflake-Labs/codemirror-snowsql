import { linter } from '@codemirror/lint';
import { HybridLint } from './hybrid';
export function newLintStrategy() {
    return new HybridLint();
}
export function snowSQLLinter(callbackFunc, thisArg) {
    return linter(callbackFunc.call(thisArg));
}
//# sourceMappingURL=index.js.map