import {
    QueryWhere,
    AdvancedOperator,
    QueryWhereCombineWith,
    NativeOperator,
    Operator
} from './types';

export function getCombineWithOperator(where: QueryWhere): QueryWhereCombineWith {
    if (!where.combineWith) {
        return QueryWhereCombineWith.and;
    }

    if (
        where.combineWith !== QueryWhereCombineWith.and
        && where.combineWith !== QueryWhereCombineWith.or
    ) {
        throw new Error('combineWith value must be "and" or "or"');
    }

    return where.combineWith;
}

const nativeOperators = [
    Operator.lt,
    Operator.lte,
    Operator.eq,
    Operator.gt,
    Operator.gte,
    Operator.arrayContains
];

const advancedOperators = [
    Operator.notEq,
    Operator.betweenClose,
    Operator.betweenOpen,
    Operator.notBetweenClose,
    Operator.notBetweenOpen,
    Operator.in,
    Operator.notIn,
    Operator.like
];

const allOperators = nativeOperators.concat(advancedOperators);

export function isValidOperator(op: any): op is Operator {
    return allOperators.includes(op);
}

export function isAdvancedOperator(op: any): op is AdvancedOperator {
    return advancedOperators.includes(op);
}

export function isNativeOperator(op: any): op is NativeOperator {
    return nativeOperators.includes(op);
}
