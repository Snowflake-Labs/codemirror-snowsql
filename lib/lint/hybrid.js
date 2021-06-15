import { Parser } from '../parser/parser';
// HybridLint will provide a snowSQL linter with static analysis
export class HybridLint {
    snowSQL() {
        return (view) => {
            const parser = new Parser(view.state);
            parser.analyze();
            return parser.getDiagnostics();
        };
    }
}
//# sourceMappingURL=hybrid.js.map