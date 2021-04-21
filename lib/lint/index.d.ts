import { EditorView } from '@codemirror/view';
import { Diagnostic } from '@codemirror/lint';
declare type lintFunc = (view: EditorView) => readonly Diagnostic[] | Promise<readonly Diagnostic[]>;
export interface LintStrategy {
    snowSQL(this: LintStrategy): lintFunc;
}
export declare function newLintStrategy(): LintStrategy;
export declare function snowSQLLinter(callbackFunc: (this: LintStrategy) => lintFunc, thisArg: LintStrategy): import("@codemirror/state").Extension;
export {};
