import { Diagnostic } from '@codemirror/lint';
import { SyntaxNode } from 'lezer-tree';
import { EditorState } from '@codemirror/state';
import { ValueType } from '../types/function';
export declare class Parser {
    private readonly tree;
    private readonly state;
    private readonly diagnostics;
    constructor(state: EditorState);
    getDiagnostics(): Diagnostic[];
    analyze(): void;
    private diagnoseAllErrorNodes;
    checkAST(node: SyntaxNode | null): ValueType;
    private checkSelect;
    private checkCreate;
    private checkDrop;
    private checkDesc;
    private checkBinaryExpr;
    private expectType;
    private addDiagnostic;
}
