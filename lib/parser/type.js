import { Expr, NumberLiteral, ParenExpr, StringLiteral, SubqueryExpr, UnaryExpr, } from 'lezer-snowsql';
import { walkThrough } from './path-finder';
import { ValueType } from '../types/function';
// Based on https://github.com/prometheus/prometheus/blob/d668a7efe3107dbdcc67bf4e9f12430ed8e2b396/snowSQL/parser/ast.go#L191
export function getType(node) {
    if (!node) {
        return ValueType.none;
    }
    switch (node.type.id) {
        case Expr:
            return getType(node.firstChild);
        case StringLiteral:
            return ValueType.string;
        case NumberLiteral:
            return ValueType.scalar;
        case SubqueryExpr:
            return ValueType.matrix;
        case ParenExpr:
            return getType(walkThrough(node, Expr));
        case UnaryExpr:
            return getType(walkThrough(node, Expr));
        default:
            return ValueType.none;
    }
}
//# sourceMappingURL=type.js.map