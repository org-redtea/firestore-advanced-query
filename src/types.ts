import * as admin from 'firebase-admin';

export namespace Firestore {
    export type Client = admin.firestore.Firestore;
    export type Timestamp = admin.firestore.Timestamp;
    export type Query = admin.firestore.Query;
    export type QuerySnapshot = admin.firestore.QuerySnapshot;
    export type DocumentSnapshot = admin.firestore.DocumentSnapshot;
    export type DocumentData = admin.firestore.DocumentData;
}

export enum Operator {
    lt = '<',
    lte = '<=',
    eq = '==',
    notEq = '!==',
    gt = '>',
    gte = '>=',
    arrayContains = 'array-contains',
    like = 'like',
    in = 'in',
    notIn = '!in',
    betweenOpen = 'between()',
    betweenClose = 'between[]',
    notBetweenOpen = '!between()',
    notBetweenClose = '!between[]',
}

export type NativeOperator =
    Operator.lt
    | Operator.lte
    | Operator.eq
    | Operator.gt
    | Operator.gte
    | Operator.arrayContains;

export type AdvancedOperator =
    Operator.notEq
    | Operator.betweenClose
    | Operator.betweenOpen
    | Operator.notBetweenClose
    | Operator.notBetweenOpen
    | Operator.in
    | Operator.notIn
    | Operator.like;

export type BetweenOperator =
    | Operator.betweenClose
    | Operator.betweenOpen
    | Operator.notBetweenClose
    | Operator.notBetweenOpen;

export interface QueryWhereBase {
    field: string;
    op: NativeOperator | Operator.notEq;
    value: any;
    combineWith?: QueryWhereCombineWith;
}

export type QueryWhereLike = Omit<QueryWhereBase, 'op' | 'value'> & {
    op: Operator.like;
    value: string;
}

export type QueryWhereIn = Omit<QueryWhereBase, 'op' | 'value'> & {
    op: Operator.in | Operator.notIn;
    value: (string | number | Firestore.Timestamp)[];
}

export type QueryWhereBetween = Omit<QueryWhereBase, 'op' | 'value'> & {
    op: BetweenOperator;
    value: [number | Firestore.Timestamp, number | Firestore.Timestamp];
}

export type QueryWhere = QueryWhereBase | QueryWhereLike | QueryWhereIn | QueryWhereBetween;

export interface QueryOrderBy {
    field: string;
    dir?: QueryOrderByDirs;
}

export enum QueryWhereCombineWith {
    and = 'and',
    or = 'or',
}

export enum QueryOrderByDirs {
    desc = 'desc',
    asc = 'asc',
}

export interface Query {
    where?:
        QueryWhere
        | QueryWhere[];
    orderBy?: QueryOrderBy;
    limit?: number;
    offset?: number;
    startAfter?: any | any[];
    startAt?: any | any[];
    endAt?: any | any[];
    endBefore?: any | any[];
}

