

import { EditorView } from '@codemirror/view';
import { Diagnostic, linter } from '@codemirror/lint';
import { HybridLint } from './hybrid';

type lintFunc = (view: EditorView) => readonly Diagnostic[] | Promise<readonly Diagnostic[]>;

// LintStrategy is the interface that defines the simple method that returns a DiagnosticResult.
// Every different lint mode must implement this interface.
export interface LintStrategy {
  snowSQL(this: LintStrategy): lintFunc;
}

export function newLintStrategy(): LintStrategy {
  return new HybridLint();
}

export function snowSQLLinter(callbackFunc: (this: LintStrategy) => lintFunc, thisArg: LintStrategy) {
  return linter(callbackFunc.call(thisArg));
}
