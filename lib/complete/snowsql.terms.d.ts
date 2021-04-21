import { Completion } from '@codemirror/autocomplete';
export declare const durationTerms: {
    label: string;
}[];
export declare const matchOpTerms: {
    label: string;
}[];
export declare const binOpTerms: {
    label: string;
}[];
export declare const binOpModifierTerms: {
    label: string;
    info: string;
    type: string;
}[];
export declare const atModifierTerms: {
    label: string;
    info: string;
    type: string;
}[];
export declare const functionIdentifierTerms: {
    label: string;
    detail: string;
    info: string;
    type: string;
}[];
export declare const aggregateOpTerms: ({
    label: string;
    detail: string;
    info: string;
    type: string;
} | {
    label: string;
    detail?: undefined;
    info?: undefined;
    type?: undefined;
})[];
export declare const dropSQLTerms: ({
    label: string;
    info: string;
    type: string;
    detail?: undefined;
} | {
    label: string;
    detail: string;
    info: string;
    type: string;
})[];
export declare const SQLqueries: {
    label: string;
    detail: string;
    info: string;
    type: string;
}[];
export declare const basicSqlTerms: {
    label: string;
    detail: string;
    info: string;
    type: string;
}[];
export declare const snippets: readonly Completion[];
