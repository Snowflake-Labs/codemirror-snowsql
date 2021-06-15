
import { And, BinaryExpr, BinModifiers, GroupingLabel, GroupingLabelList, GroupingLabels, GroupLeft, GroupRight, On, OnOrIgnoring, Or, Unless, } from 'lezer-snowsql';
import { VectorMatchCardinality } from '../types/vector';
import { containsAtLeastOneChild, retrieveAllRecursiveNodes } from './path-finder';
export function buildVectorMatching(state, binaryNode) {
    if (!binaryNode || binaryNode.type.id !== BinaryExpr) {
        return null;
    }
    const result = {
        card: VectorMatchCardinality.CardOneToOne,
        matchingLabels: [],
        on: false,
        include: [],
    };
    const binModifiers = binaryNode.getChild(BinModifiers);
    if (binModifiers) {
        const onOrIgnoring = binModifiers.getChild(OnOrIgnoring);
        if (onOrIgnoring) {
            result.on = onOrIgnoring.getChild(On) !== null;
            const labels = retrieveAllRecursiveNodes(onOrIgnoring.getChild(GroupingLabels), GroupingLabelList, GroupingLabel);
            if (labels.length > 0) {
                for (const label of labels) {
                    result.matchingLabels.push(state.sliceDoc(label.from, label.to));
                }
            }
        }
        const groupLeft = binModifiers.getChild(GroupLeft);
        const groupRight = binModifiers.getChild(GroupRight);
        if (groupLeft || groupRight) {
            result.card = groupLeft ? VectorMatchCardinality.CardManyToOne : VectorMatchCardinality.CardOneToMany;
            const includeLabels = retrieveAllRecursiveNodes(binModifiers.getChild(GroupingLabels), GroupingLabelList, GroupingLabel);
            if (includeLabels.length > 0) {
                for (const label of includeLabels) {
                    result.include.push(state.sliceDoc(label.from, label.to));
                }
            }
        }
    }
    const isSetOperator = containsAtLeastOneChild(binaryNode, And, Or, Unless);
    if (isSetOperator && result.card === VectorMatchCardinality.CardOneToOne) {
        result.card = VectorMatchCardinality.CardManyToMany;
    }
    return result;
}
//# sourceMappingURL=vector.js.map