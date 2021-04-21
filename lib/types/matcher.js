import { EqlSingle, Neq } from 'lezer-snowsql';
export class Matcher {
    constructor(type, name, value) {
        this.type = type;
        this.name = name;
        this.value = value;
    }
    matchesEmpty() {
        switch (this.type) {
            case EqlSingle:
                return this.value === '';
            case Neq:
                return this.value !== '';
            default:
                return false;
        }
    }
}
//# sourceMappingURL=matcher.js.map