import { CreateStmt, DescribeStmt, DropStmt, 
// Eql,
// EqlSingle,
Star, 
//Unless,
SelectStmt, Comma, Smc, From, } from 'lezer-snowsql';
import { walkThrough } from './path-finder';
import { getType } from './type';
import { syntaxTree } from '@codemirror/language';
import { ValueType } from '../types/function';
export class Parser {
    constructor(state) {
        this.tree = syntaxTree(state);
        this.state = state;
        this.diagnostics = [];
    }
    getDiagnostics() {
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
    diagnoseAllErrorNodes() {
        var _a;
        const cursor = this.tree.cursor();
        console.log((_a = cursor.node.firstChild) === null || _a === void 0 ? void 0 : _a.name);
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
    checkAST(node) {
        console.log(node === null || node === void 0 ? void 0 : node.type.name, node === null || node === void 0 ? void 0 : node.type.id);
        // const forCe = this.tree.cursor();
        console.log("walkThrough" + walkThrough(node));
        if (!node) {
            return ValueType.none;
        }
        switch (node.type.id) {
            //    case Expr:
            //     return this.checkAST(node.firstChild);
            case SelectStmt:
                this.checkSelect(node);
                break;
            case CreateStmt:
                this.checkCreate(node);
                break;
            case DescribeStmt:
                this.checkDesc(node);
                break;
            case DropStmt:
                this.checkDrop(node);
                break;
            /*
                  case ParenExpr:
                    this.checkAST(walkThrough(node, Expr));
                    break;
            
                  case SubqueryExpr:
                    const subQueryExprType = this.checkAST(walkThrough(node, Expr));
                    if (subQueryExprType !== ValueType.vector) {
                      this.addDiagnostic(node, `subquery is only allowed on instant vector, got ${subQueryExprType} in ${node.name} instead`);
                    }
                    break;
            */
        }
        return getType(node);
    }
    checkSelect(node) {
        var _a, _b, _c, _d, _e, _f, _g;
        const len = this.tree.length;
        const nodeC = this.tree.cursor(len);
        const forC = this.tree.cursor();
        if (((_a = node.lastChild) === null || _a === void 0 ? void 0 : _a.type.id) !== Smc) {
            this.addDiagnostic(node, `Missed a semi-colon! ${(_b = node.firstChild) === null || _b === void 0 ? void 0 : _b.name} ${node.name}`);
        }
        console.log(((_d = (_c = node.firstChild) === null || _c === void 0 ? void 0 : _c.nextSibling) === null || _d === void 0 ? void 0 : _d.nextSibling) + "First Node");
        const commaChild = node.getChildren(Comma);
        const fromChild = node.getChild(From);
        const lastComma = commaChild[commaChild.length - 1];
        const nodeF = walkThrough(node);
        if (fromChild) {
            if (((_e = fromChild === null || fromChild === void 0 ? void 0 : fromChild.prevSibling) === null || _e === void 0 ? void 0 : _e.type.id) == Comma) {
                if (((_f = fromChild === null || fromChild === void 0 ? void 0 : fromChild.prevSibling) === null || _f === void 0 ? void 0 : _f.type.id) != Star) {
                    this.addDiagnostic(node, `There seems to be an extra comma, try removing it?`);
                    return;
                }
            }
        }
        if (((_g = node.lastChild) === null || _g === void 0 ? void 0 : _g.type.id) !== Smc) {
            this.addDiagnostic(node, `Missed a semi-colon!`);
        }
        return;
    }
    checkCreate(node) {
        console.log(walkThrough(node));
        return;
    }
    checkDrop(node) {
        console.log("Drop");
        console.log(walkThrough(node));
        return;
    }
    checkDesc(node) {
        console.log("Desc!");
        console.log(walkThrough(node));
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
    expectType(node, want, context) {
        const t = this.checkAST(node);
        if (t !== want) {
            this.addDiagnostic(node, `expected type ${want} in ${context}, got ${t}`);
        }
    }
    addDiagnostic(node, msg) {
        this.diagnostics.push({
            severity: 'error',
            message: msg,
            from: node.from,
            to: node.to,
        });
    }
}
//# sourceMappingURL=parser.js.map