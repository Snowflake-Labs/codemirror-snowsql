import { basicSetup } from '@codemirror/basic-setup';
import { EditorState } from '@codemirror/state';
import { EditorView } from '@codemirror/view';
import {  snowSQLExtension  } from '../lang-snowsql';
import { customTheme, snowSQLHighlightMaterialTheme } from './theme';

const snowsqlExtension = new snowSQLExtension();
let editor: EditorView;

function setCompletion() {
  const completionSelect = document.getElementById('completion') as HTMLSelectElement;
  const completionValue = completionSelect.options[completionSelect.selectedIndex].value;
  switch (completionValue) {

    default:
      snowsqlExtension.setComplete();
  }
}

function createEditor() {
  let doc = '';
  if (editor) {
    // When the linter is changed, it required to reload completely the editor.
    // So the first thing to do, is to completely delete the previous editor and to recreate it from scratch
    // We should preserve the current text entered as well.
    doc = editor.state.sliceDoc(0, editor.state.doc.length);
    editor.destroy();
  }
  editor = new EditorView({
    state: EditorState.create({
      extensions: [basicSetup, snowsqlExtension.asExtension(), snowSQLHighlightMaterialTheme, customTheme],
      doc: doc,
    }),
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    parent: document.querySelector('#editor')!,
  });
}

// function applyConfiguration(): void {
//   setCompletion();
//   createEditor();
// }

createEditor();

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion,@typescript-eslint/ban-ts-ignore
// @ts-ignore
// document.getElementById('apply').addEventListener('click', function () {
//   applyConfiguration();
// });
