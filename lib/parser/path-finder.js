// walkBackward will iterate other the tree from the leaf to the root until it founds the given `exit` node.
// It returns null if the exit is not found.
export function walkBackward(node, exit) {
    const cursor = node.cursor;
    let cursorIsMoving = true;
    while (cursorIsMoving && cursor.type.id !== exit) {
        cursorIsMoving = cursor.parent();
    }
    return cursor.type.id === exit ? cursor.node : null;
}
// walkThrough is going to follow the path passed in parameter.
// If it succeeds to reach the last id/name of the path, then it will return the corresponding Subtree.
// Otherwise if it's not possible to reach the last id/name of the path, it will return `null`
// Note: the way followed during the iteration of the tree to find the given path, is only from the root to the leaf.
export function walkThrough(node, ...path) {
    const cursor = node.cursor;
    let i = 0;
    let cursorIsMoving = true;
    path.unshift(cursor.type.id);
    while (i < path.length && cursorIsMoving) {
        if (cursor.type.id === path[i] || cursor.type.name === path[i]) {
            i++;
            if (i < path.length) {
                cursorIsMoving = cursor.next();
            }
        }
        else {
            cursorIsMoving = cursor.nextSibling();
        }
    }
    if (i >= path.length) {
        return cursor.node;
    }
    return null;
}
export function containsAtLeastOneChild(node, ...child) {
    const cursor = node.cursor;
    if (!cursor.next()) {
        // let's try to move directly to the children level and
        // return false immediately if the current node doesn't have any child
        return false;
    }
    let result = false;
    do {
        result = child.some((n) => cursor.type.id === n || cursor.type.name === n);
    } while (!result && cursor.nextSibling());
    return result;
}
export function containsChild(node, ...child) {
    const cursor = node.cursor;
    if (!cursor.next()) {
        // let's try to move directly to the children level and
        // return false immediately if the current node doesn't have any child
        return false;
    }
    let i = 0;
    do {
        if (cursor.type.id === child[i] || cursor.type.name === child[i]) {
            i++;
        }
    } while (i < child.length && cursor.nextSibling());
    return i >= child.length;
}
export function retrieveAllRecursiveNodes(parentNode, recursiveNode, leaf) {
    const nodes = [];
    function recursiveRetrieveNode(node, nodes) {
        const subNode = node === null || node === void 0 ? void 0 : node.getChild(recursiveNode);
        const le = node === null || node === void 0 ? void 0 : node.lastChild;
        if (subNode && subNode.type.id === recursiveNode) {
            recursiveRetrieveNode(subNode, nodes);
        }
        if (le && le.type.id === leaf) {
            nodes.push(le);
        }
    }
    recursiveRetrieveNode(parentNode, nodes);
    return nodes;
}
//# sourceMappingURL=path-finder.js.map