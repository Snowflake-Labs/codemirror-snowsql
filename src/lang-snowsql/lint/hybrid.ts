

import { LintStrategy } from './index';
import { EditorView } from '@codemirror/view';
import { Diagnostic } from '@codemirror/lint';
import { Parser } from '../parser/parser';

// HybridLint will provide a snowSQL linter with static analysis
export class HybridLint implements LintStrategy {
  public snowSQL(this: HybridLint): (view: EditorView) => readonly Diagnostic[] {
    return (view: EditorView) => {
      const parser = new Parser(view.state);
      parser.analyze();
      return parser.getDiagnostics();
    };
  }
}
