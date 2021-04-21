import { Diagnostic } from '@codemirror/lint';
import { SyntaxNode, Tree } from 'lezer-tree';
import {
  CreateExpr,
  DescribeExpr,
  DropExpr,
  And,
  //BinModifiers,
  Bool,
  // Eql,
  EqlSingle,
  Expr,
  //Gte,
  //Gtr,
  Mul,
  Identifier,
  //Lss,
  // Lte,
  //Neq,
  Or,
  ParenExpr,
  SubqueryExpr,
  //Unless,
  SelectExpr,
  Comma,
  Smc,
  From,

} from 'lezer-snowsql';
import { containsAtLeastOneChild, retrieveAllRecursiveNodes, walkThrough } from './path-finder';
import { getType } from './type';
import { //buildLabelMatchers 
} from './matcher';
import { EditorState } from '@codemirror/state';
import { Matcher } from '../types/matcher';
import { syntaxTree } from '@codemirror/language';
import { cursorTo } from 'readline';
import { bindActionCreators } from 'redux';
import { getFunction, ValueType } from '../types/function';

export class Parser {
  private readonly tree: Tree;
  private readonly state: EditorState;
  private readonly diagnostics: Diagnostic[];

  constructor(state: EditorState) {
    this.tree = syntaxTree(state);
    this.state = state;
    this.diagnostics = [];
  }

  getDiagnostics(): Diagnostic[] {
    return this.diagnostics.sort((a, b) => {
      return a.from - b.from;
    });
  }

  analyze() {
    // when you are at the root of the tree, the first node is not `Expr` but a node with no name.
    // So to be able to iterate other the node relative to the snowSQL node, we have to get the first child at the beginning
    this.checkAST(this.tree.topNode.firstChild);
    this.diagnoseAllErrorNodes();
  }

  private diagnoseAllErrorNodes() {
    const cursor = this.tree.cursor();
    console.log(cursor.node.firstChild?.name)
    while (cursor.next()) {
      // usually there is an error node at the end of the expression when user is typing
      // so it's not really a useful information to say the expression is wrong.
      // Hopefully if there is an error node at the end of the tree, checkAST should yell more precisely
      if (cursor.type.id === 0 && cursor.to !== this.tree.topNode.to) {
        const node = cursor.node.parent;
        this.diagnostics.push({
          severity: 'error',
          message: 'unexpected expression',
          from: node ? node.from : cursor.from,
          to: node ? node.to : cursor.to,
        });

      }

    }



  }


  // checkAST is inspired of the same named method from prometheus/prometheus:
  // https://github.com/prometheus/prometheus/blob/3470ee1fbf9d424784eb2613bab5ab0f14b4d222/snowSQL/parser/parse.go#L433
  checkAST(node: SyntaxNode | null): ValueType {
    console.log(node?.type.name, node?.type.id)

    // const forCe = this.tree.cursor();
    console.log("walkThrough" + walkThrough(node!))
    if (!node) {
      return ValueType.none;
    }
    switch (node.type.id) {
      case Expr:
        return this.checkAST(node.firstChild);

      case SelectExpr:
        this.checkSelect(node)
        break;

      case CreateExpr:
        this.checkCreate(node)
        break;

      case DescribeExpr:
        this.checkDesc(node)
        break;

      case DropExpr:
        this.checkDrop(node)
        break;

      case ParenExpr:
        this.checkAST(walkThrough(node, Expr));
        break;

      case SubqueryExpr:
        const subQueryExprType = this.checkAST(walkThrough(node, Expr));
        if (subQueryExprType !== ValueType.vector) {
          this.addDiagnostic(node, `subquery is only allowed on instant vector, got ${subQueryExprType} in ${node.name} instead`);
        }
        break;


    }

    return getType(node);
  }



  private checkSelect(node: SyntaxNode): void {
    const len = this.tree.length
    const nodeC = this.tree.cursor(len);
    const forC = this.tree.cursor();

    if (node.lastChild?.type.id !== Smc) {
      this.addDiagnostic(node, `Missed a semi-colon! ${node.firstChild?.name} ${node.name}`);

    }
    console.log(node.firstChild?.nextSibling?.nextSibling + "First Node")

    const commaChild = node.getChildren(Comma)
    const fromChild = node.getChild(From)
    const lastComma = commaChild[commaChild.length - 1];
    const nodeF = walkThrough(node)

    if (fromChild) {

      if (fromChild?.prevSibling?.type.id != Identifier) {

        if (fromChild?.prevSibling?.type.id != Mul) {
          this.addDiagnostic(node, `There seems to be an extra comma, try removing it?`);
          return;
        }

      }
    }


    if (node.lastChild?.type.id !== Smc) {
      this.addDiagnostic(node, `Missed a semi-colon!`);

    }
    return;
  }

  private checkCreate(node: SyntaxNode) {
    console.log(walkThrough(node))

    return;
  }


  private checkDrop(node: SyntaxNode) {
    console.log("Drop")
    console.log(walkThrough(node))
    return;
  }


  private checkDesc(node: SyntaxNode): void {
    console.log("Desc!")
    console.log(walkThrough(node))

    return;
  }
  /*
    private checkBinaryExpr(node: SyntaxNode): void {
      // Following the definition of the BinaryExpr, the left and the right
      // expression are respectively the first and last child
      // https://github.com/promlabs/lezer-snowsql/blob/master/src/snowSQL.grammar#L52
      const lExpr = node.firstChild;
      const rExpr = node.lastChild;
      if (!lExpr || !rExpr) {
        this.addDiagnostic(node, 'left or right expression is missing in binary expression');
        return;
      }
      const lt = this.checkAST(lExpr);
      const rt = this.checkAST(rExpr);
      const boolModifierUsed = walkThrough(node, BinModifiers, Bool);
      const isComparisonOperator = containsAtLeastOneChild(node, Eql, Neq, Lte, Lss, Gte, Gtr);
      const isSetOperator = containsAtLeastOneChild(node, And, Or);
  
      // BOOL modifier check
      if (boolModifierUsed) {
        if (!isComparisonOperator) {
          this.addDiagnostic(node, 'bool modifier can only be used on comparison operators');
        }
      } else {
        if (isComparisonOperator && lt === ValueType.scalar && rt === ValueType.scalar) {
          this.addDiagnostic(node, 'comparisons between scalars must use BOOL modifier');
        }
      }
  
  
  
      if (lt !== ValueType.scalar && lt !== ValueType.vector) {
        this.addDiagnostic(lExpr, 'binary expression must contain only scalar and instant vector types');
      }
      if (rt !== ValueType.scalar && rt !== ValueType.vector) {
        this.addDiagnostic(rExpr, 'binary expression must contain only scalar and instant vector types');
      }
  
  
      if ((lt === ValueType.scalar || rt === ValueType.scalar) && isSetOperator) {
        this.addDiagnostic(node, 'set operator not allowed in binary scalar expression');
      }
    }
  
  */

  private expectType(node: SyntaxNode, want: ValueType, context: string): void {
    const t = this.checkAST(node);
    if (t !== want) {
      this.addDiagnostic(node, `expected type ${want} in ${context}, got ${t}`);
    }
  }

  private addDiagnostic(node: SyntaxNode, msg: string): void {
    this.diagnostics.push({
      severity: 'error',
      message: msg,
      from: node.from,
      to: node.to,
    });
  }
}
