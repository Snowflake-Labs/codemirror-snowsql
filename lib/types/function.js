export var ValueType;
(function (ValueType) {
    ValueType["none"] = "none";
    ValueType["vector"] = "vector";
    ValueType["scalar"] = "scalar";
    ValueType["matrix"] = "matrix";
    ValueType["string"] = "string";
})(ValueType || (ValueType = {}));
// snowSQLFunctions is a list of all functions supported by snowSQL, including their types.
const snowSQLFunctions = {};
export function getFunction(id) {
    return snowSQLFunctions[id];
}
//# sourceMappingURL=function.js.map