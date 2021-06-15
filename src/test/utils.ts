import { parser } from 'lezer-snowsql';
import { EditorState } from '@codemirror/state';
import { LezerLanguage } from '@codemirror/language';

const lightsnowSQLSyntax = LezerLanguage.define({ parser: parser });

export function createEditorState(expr: string): EditorState {
  return EditorState.create({
    doc: expr,
    extensions: lightsnowSQLSyntax,
  });
}
