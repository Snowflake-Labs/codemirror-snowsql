import { Extension } from '@codemirror/state';
import { CompleteConfiguration, CompleteStrategy } from './complete';
import { LintStrategy } from './lint';
import { LezerLanguage } from '@codemirror/language';
export declare const snowSQLLanguage: LezerLanguage;
/**
 * This class holds the state of the completion extension for CodeMirror and allow hot-swapping the complete strategy.
 */
export declare class snowSQLExtension {
    private complete;
    private lint;
    private enableCompletion;
    private enableLinter;
    constructor();
    setComplete(conf?: CompleteConfiguration): snowSQLExtension;
    getComplete(): CompleteStrategy;
    activateCompletion(activate: boolean): snowSQLExtension;
    setLinter(linter: LintStrategy): snowSQLExtension;
    getLinter(): LintStrategy;
    activateLinter(activate: boolean): snowSQLExtension;
    asExtension(): Extension;
}
