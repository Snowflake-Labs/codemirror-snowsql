// The MIT License (MIT)
//
// Copyright (c) 2020 The Prometheus Authors
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.
import { Add, And, Div, Duration, Eql, Expr, GroupingLabel, GroupingLabels, Gte, Gtr, Identifier, LabelName, Lss, Lte, Mod, Mul, 
//LabelMatchList,
NumberLiteral, Or, Pow, Sub, SubqueryExpr, } from 'lezer-snowsql';
import { containsAtLeastOneChild, containsChild } from '../parser/path-finder';
import { dropSQLTerms, aggregateOpTerms, atModifierTerms, binOpModifierTerms, basicSqlTerms, binOpTerms, durationTerms, functionIdentifierTerms, matchOpTerms, snippets, } from './snowsql.terms';
import { syntaxTree } from '@codemirror/language';
const autocompleteNodes = {
    matchOp: matchOpTerms,
    binOp: binOpTerms,
    duration: durationTerms,
    binOpModifier: binOpModifierTerms,
    basicSql: basicSqlTerms,
    atModifier: atModifierTerms,
    functionIdentifier: functionIdentifierTerms,
    aggregateOp: aggregateOpTerms,
    dropSql: dropSQLTerms,
};
// ContextKind is the different possible value determinate by the autocompletion
export var ContextKind;
(function (ContextKind) {
    // dynamic autocompletion (required a distant server)
    ContextKind[ContextKind["MetricName"] = 0] = "MetricName";
    ContextKind[ContextKind["LabelName"] = 1] = "LabelName";
    ContextKind[ContextKind["LabelValue"] = 2] = "LabelValue";
    // static autocompletion
    ContextKind[ContextKind["Function"] = 3] = "Function";
    ContextKind[ContextKind["Aggregation"] = 4] = "Aggregation";
    ContextKind[ContextKind["BinOpModifier"] = 5] = "BinOpModifier";
    ContextKind[ContextKind["BinOp"] = 6] = "BinOp";
    ContextKind[ContextKind["MatchOp"] = 7] = "MatchOp";
    ContextKind[ContextKind["dropSQLTerms"] = 8] = "dropSQLTerms";
    ContextKind[ContextKind["Duration"] = 9] = "Duration";
    ContextKind[ContextKind["Offset"] = 10] = "Offset";
    ContextKind[ContextKind["Bool"] = 11] = "Bool";
    ContextKind[ContextKind["basicSql"] = 12] = "basicSql";
    ContextKind[ContextKind["AtModifiers"] = 13] = "AtModifiers";
})(ContextKind || (ContextKind = {}));
function arrayToCompletionResult(data, from, to, includeSnippet = false, span = true) {
    const options = data;
    if (includeSnippet) {
        options.push(...snippets);
    }
    return {
        from: from,
        to: to,
        options: options,
        span: span ? /^[a-zA-Z0-9_:]+$/ : undefined,
    };
}
// computeStartCompleteLabelPositionInLabelMatcherOrInGroupingLabel calculates the start position only when the node is a LabelMatchers or a GroupingLabels
function computeStartCompleteLabelPositionInLabelMatcherOrInGroupingLabel(node, pos) {
    // Here we can have two different situations:
    // 1. `metric{}` or `sum by()` with the cursor between the bracket
    // and so we have increment the starting position to avoid to consider the open bracket when filtering the autocompletion list.
    // 2. `metric{foo="bar",} or `sum by(foo,)  with the cursor after the comma.
    // Then the start number should be the current position to avoid to consider the previous labelMatcher/groupingLabel when filtering the autocompletion list.
    let start = node.from + 1;
    if (node.firstChild !== null) {
        // here that means the LabelMatchers / GroupingLabels has a child, which is not possible if we have the expression `metric{}`. So we are likely trying to autocomplete the label list after a comma
        start = pos;
    }
    return start;
}
// computeStartCompletePosition calculates the start position of the autocompletion.
// It is an important step because the start position will be used by CMN to find the string and then to use it to filter the CompletionResult.
// A wrong `start` position will lead to have the completion not working.
// Note: this method is exported only for testing purpose.
export function computeStartCompletePosition(node, pos) {
    let start = node.from;
    /*
      if (node.type.id === LabelMatchers || node.type.id === GroupingLabels) {
        start = computeStartCompleteLabelPositionInLabelMatcherOrInGroupingLabel(node, pos);
      } */
    return start;
}
// analyzeCompletion is going to determinate what should be autocompleted.
// The value of the autocompletion is then calculate by the function buildCompletion.
// Note: this method is exported for testing purpose only. Do not use it directly.
export function analyzeCompletion(state, node) {
    var _a, _b, _c, _d, _e, _f, _g, _h;
    const result = [];
    switch (node.type.id) {
        case 0: // 0 is the id of the error node
            if (((_a = node.parent) === null || _a === void 0 ? void 0 : _a.type.id) === SubqueryExpr && containsAtLeastOneChild(node.parent, Duration)) {
                // we are likely in the given situation:
                //    `rate(foo[5d:5])`
                // so we should autocomplete a duration
                result.push({ kind: ContextKind.Duration });
                break;
            }
            // when we are in the situation 'metric_name !', we have the following tree
            // Expr(VectorSelector(MetricIdentifier(Identifier),⚠))
            // We should try to know if the char '!' is part of a binOp.
            // Note: as it is quite experimental, maybe it requires more condition and to check the current tree (parent, other child at the same level ..etc.).
            const operator = state.sliceDoc(node.from, node.to);
            if (binOpTerms.filter((term) => term.label.includes(operator)).length > 0) {
                result.push({ kind: ContextKind.BinOp });
            }
            break;
        case Identifier:
            // sometimes an Identifier has an error has parent. This should be treated in priority
            if (((_b = node.parent) === null || _b === void 0 ? void 0 : _b.type.id) === 0) {
            }
            // As the leaf Identifier is coming for a lot of different case, we have to take a bit time to analyze the tree
            // in order to know what we have to autocomplete exactly.
            // Here is some cases:
            // 1. metric_name / ignor --> we should autocomplete the BinOpModifier + metric/function/aggregation
            // 2. http_requests_total{method="GET"} off --> offset or binOp should be autocompleted here
            // 3. rate(foo[5m]) un --> offset or binOp should be autocompleted
            // 4. sum(http_requests_total{method="GET"} off) --> offset or binOp should be autocompleted
            // 5. sum(http_requests_total{method="GET"} / o) --> BinOpModifier + metric/function/aggregation
            // All examples above gives a different tree each time but ends up to be treated in this case.
            // But they all have the following common tree pattern:
            // Parent( Expr(...),
            //         ... ,
            //         Expr(VectorSelector(MetricIdentifier(Identifier)))
            //       )
            //
            // So the first things to do is to get the `Parent` and to determinate if we are in this configuration.
            // Otherwise we would just have to autocomplete the metric / function / aggregation.
            const parent = (_e = (_d = (_c = node.parent) === null || _c === void 0 ? void 0 : _c.parent) === null || _d === void 0 ? void 0 : _d.parent) === null || _e === void 0 ? void 0 : _e.parent;
            if (!parent) {
                // this case is normally impossible since by definition, the identifier has 3 parents,
                // and in Lexer, there is always a default parent in top of everything.
                result.push({ kind: ContextKind.MetricName, metricName: state.sliceDoc(node.from, node.to) }, { kind: ContextKind.Function }, { kind: ContextKind.Aggregation });
                break;
            }
            // now we have to know if we have two Expr in the direct children of the `parent`
            const containExprTwice = containsChild(parent, Expr, Expr);
            if (containExprTwice) {
            }
            else {
                result.push({ kind: ContextKind.MetricName, metricName: state.sliceDoc(node.from, node.to) }, { kind: ContextKind.Function }, { kind: ContextKind.Aggregation });
            }
            break;
        case GroupingLabels:
            // In this case we are in the given situation:
            //      sum by ()
            // So we have to autocomplete any labelName
            result.push({ kind: ContextKind.LabelName });
            break;
        case LabelName:
            if (((_f = node.parent) === null || _f === void 0 ? void 0 : _f.type.id) === GroupingLabel) {
                // In this case we are in the given situation:
                //      sum by (myL)
                // So we have to continue to autocomplete any kind of labelName
                result.push({ kind: ContextKind.LabelName });
            }
        case NumberLiteral:
            if (((_g = node.parent) === null || _g === void 0 ? void 0 : _g.type.id) === 0 && ((_h = node.parent.parent) === null || _h === void 0 ? void 0 : _h.type.id) === SubqueryExpr) {
                // Here we are likely in this situation:
                //     `go[5d:4]`
                // and we have the given tree:
                // Expr( SubqueryExpr(
                // 		Expr(VectorSelector(MetricIdentifier(Identifier))),
                // 		Duration, Duration, ⚠(NumberLiteral)
                // ))
                // So we should continue to autocomplete a duration
                result.push({ kind: ContextKind.Duration });
            }
            break;
        case Pow:
        case Mul:
        case Div:
        case Mod:
        case Add:
        case Sub:
        case Eql:
        case Gte:
        case Gtr:
        case Lte:
        case Lss:
        case And:
        case Or:
    }
    return result;
}
// HybridComplete provides a full completion result with or without a remote prometheus.
export class HybridComplete {
    constructor(SnowClient, maxMetricsMetadata = 10000) {
        this.SnowClient = SnowClient;
        this.maxMetricsMetadata = maxMetricsMetadata;
    }
    getSnowClient() {
        return this.SnowClient;
    }
    snowSQL(context) {
        const { state, pos } = context;
        const tree = syntaxTree(state).resolve(pos, -1);
        const contexts = analyzeCompletion(state, tree);
        let asyncResult = Promise.resolve([]);
        let completeSnippet = false;
        let span = true;
        for (const context of contexts) {
            switch (context.kind) {
                case ContextKind.Aggregation:
                    asyncResult = asyncResult.then((result) => {
                        return result.concat(autocompleteNodes.aggregateOp);
                    });
                    break;
                case ContextKind.Function:
                    asyncResult = asyncResult.then((result) => {
                        return result.concat(autocompleteNodes.functionIdentifier);
                    });
                    break;
                case ContextKind.basicSql:
                    console.log("basicSQL is being triggered");
                    asyncResult = asyncResult.then((result) => {
                        return result.concat(autocompleteNodes.basicSql);
                    });
                    break;
                case ContextKind.BinOpModifier:
                    asyncResult = asyncResult.then((result) => {
                        return result.concat(autocompleteNodes.binOpModifier);
                    });
                    break;
                case ContextKind.BinOp:
                    asyncResult = asyncResult.then((result) => {
                        return result.concat(autocompleteNodes.binOp);
                    });
                    break;
                case ContextKind.MatchOp:
                    asyncResult = asyncResult.then((result) => {
                        return result.concat(autocompleteNodes.matchOp);
                    });
                    break;
                case ContextKind.dropSQLTerms:
                    asyncResult = asyncResult.then((result) => {
                        return result.concat(autocompleteNodes.dropSQLTerms);
                    });
                    break;
                case ContextKind.Duration:
                    span = false;
                    asyncResult = asyncResult.then((result) => {
                        return result.concat(autocompleteNodes.duration);
                    });
                    break;
                case ContextKind.Offset:
                    asyncResult = asyncResult.then((result) => {
                        return result.concat([{ label: 'offset' }]);
                    });
                    break;
                case ContextKind.Bool:
                    asyncResult = asyncResult.then((result) => {
                        return result.concat([{ label: 'bool' }]);
                    });
                    break;
                case ContextKind.AtModifiers:
                    asyncResult = asyncResult.then((result) => {
                        return result.concat(autocompleteNodes.atModifier);
                    });
                    break;
                case ContextKind.MetricName:
                    asyncResult = asyncResult.then((result) => {
                        completeSnippet = true;
                        return this.autocompleteMetricName(result, context);
                    });
                    break;
                case ContextKind.LabelName:
                    asyncResult = asyncResult.then((result) => {
                        return this.autocompleteLabelName(result, context);
                    });
                    break;
                case ContextKind.LabelValue:
                    asyncResult = asyncResult.then((result) => {
                        return this.autocompleteLabelValue(result, context);
                    });
            }
        }
        return asyncResult.then((result) => {
            return arrayToCompletionResult(result, computeStartCompletePosition(tree, pos), pos, completeSnippet, span);
        });
    }
    autocompleteMetricName(result, context) {
        if (!this.SnowClient) {
            return result;
        }
        const metricCompletion = new Map();
        return this.SnowClient
            .metricNames(context.metricName)
            .then((metricNames) => {
            var _a;
            for (const metricName of metricNames) {
                metricCompletion.set(metricName, { label: metricName, type: 'constant' });
            }
            // avoid to get all metric metadata if the prometheus server is too big
            if (metricNames.length <= this.maxMetricsMetadata) {
                // in order to enrich the completion list of the metric,
                // we are trying to find the associated metadata
                return (_a = this.SnowClient) === null || _a === void 0 ? void 0 : _a.metricMetadata();
            }
        })
            .then((metricMetadata) => {
            if (metricMetadata) {
                for (const [metricName, node] of metricCompletion) {
                    // For histograms and summaries, the metadata is only exposed for the base metric name,
                    // not separately for the _count, _sum, and _bucket time series.
                    const metadata = metricMetadata[metricName.replace(/(_count|_sum|_bucket)$/, '')];
                    if (metadata) {
                        if (metadata.length > 1) {
                            // it means the metricName has different possible helper and type
                            for (const m of metadata) {
                                if (node.detail === '') {
                                    node.detail = m.type;
                                }
                                else if (node.detail !== m.type) {
                                    node.detail = 'unknown';
                                    node.info = 'multiple different definitions for this metric';
                                }
                                if (node.info === '') {
                                    node.info = m.help;
                                }
                                else if (node.info !== m.help) {
                                    node.info = 'multiple different definitions for this metric';
                                }
                            }
                        }
                        else if (metadata.length === 1) {
                            let { type, help } = metadata[0];
                            if (type === 'histogram' || type === 'summary') {
                                if (metricName.endsWith('_count')) {
                                    type = 'counter';
                                    help = `The total number of observations for: ${help}`;
                                }
                                if (metricName.endsWith('_sum')) {
                                    type = 'counter';
                                    help = `The total sum of observations for: ${help}`;
                                }
                                if (metricName.endsWith('_bucket')) {
                                    type = 'counter';
                                    help = `The total count of observations for a bucket in the histogram: ${help}`;
                                }
                            }
                            node.detail = type;
                            node.info = help;
                        }
                    }
                }
            }
            return result.concat(Array.from(metricCompletion.values()));
        });
    }
    autocompleteLabelName(result, context) {
        if (!this.SnowClient) {
            return result;
        }
        return this.SnowClient.labelNames(context.metricName).then((labelNames) => {
            return result.concat(labelNames.map((value) => ({ label: value, type: 'constant' })));
        });
    }
    autocompleteLabelValue(result, context) {
        if (!this.SnowClient || !context.labelName) {
            return result;
        }
        return this.SnowClient.labelValues(context.labelName, context.metricName, context.matchers).then((labelValues) => {
            return result.concat(labelValues.map((value) => ({ label: value, type: 'text' })));
        });
    }
}
//# sourceMappingURL=hybrid.js.map