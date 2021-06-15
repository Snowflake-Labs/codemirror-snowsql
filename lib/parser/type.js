import { NumberLiteral, StringLiteral, } from 'lezer-snowsql';
import { ValueType } from '../types/function';
export function getType(node) {
    if (!node) {
        return ValueType.none;
    }
    switch (node.type.id) {
        /*
        case Expr:
          return getType(node.firstChild);
    */
        case StringLiteral:
            return ValueType.string;
        case NumberLiteral:
            return ValueType.scalar;
        /*
            case SubqueryExpr:
              return ValueType.matrix;
            case ParenExpr:
              return getType(walkThrough(node, Expr));
            case UnaryExpr:
              return getType(walkThrough(node, Expr));
        
         */
        default:
            return ValueType.none;
    }
}
//# sourceMappingURL=type.js.map