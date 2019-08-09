import {getCombineWithOperator, isAdvancedOperator, isNativeOperator} from './utils';
import {Firestore, NativeOperator, Operator, Query, QueryWhere, QueryWhereCombineWith} from './types';
import * as admin from 'firebase-admin';
import {Comparator} from './Comparator';
import Timestamp = admin.firestore.Timestamp;

export class QueryRunner {
    comparator = new Comparator();

    constructor(
        protected client: Firestore.Client
    ) {
    }

    async run(collection: string, query: Query): Promise<Firestore.DocumentSnapshot[]> {
        const baseQuery = this.createBaseQuery(collection, query);

        if (this.shouldUseStream(query)) {
            return this.runWithStream(baseQuery, collection, query);
        }

        return this.runDefaultStrategy(baseQuery, collection, query);
    }

    createBaseQuery(collection: string, options: Query): Firestore.Query {
        let query = this.client.collection(collection) as Firestore.Query;

        if (options.orderBy) {
            query = query.orderBy(
                options.orderBy.field,
                options.orderBy.dir
            );
        }

        if (options.startAfter !== undefined) {
            const list = Array.isArray(options.startAfter)
                ? options.startAfter
                : [options.startAfter];

            query = query.startAfter(
                ...list
            );
        }

        if (options.startAfter !== undefined) {
            const list = Array.isArray(options.startAfter)
                ? options.startAfter
                : [options.startAfter];

            query = query.startAt(
                ...list
            );
        }

        if (options.endAt !== undefined) {
            const list = Array.isArray(options.endAt)
                ? options.endAt
                : [options.endAt];

            query = query.endAt(
                ...list
            );
        }

        if (options.endBefore !== undefined) {
            const list = Array.isArray(options.endBefore)
                ? options.endBefore
                : [options.endBefore];

            query = query.endBefore(
                ...list
            );
        }

        return query;
    }

    shouldUseStream(options: Query): boolean {
        const match = (where: QueryWhere) => (
            getCombineWithOperator(where) === QueryWhereCombineWith.or
            || isAdvancedOperator(where.op)
        );

        if (options.where) {
            if (Array.isArray(options.where)) {
                return options.where.some(match);
            }

            return match(options.where);
        }

        return false;
    }

    runWithStream(query: Firestore.Query, collection: string, options: Query): Promise<Firestore.DocumentSnapshot[]> {
        return new Promise((resolve, reject) => {
            const result: Firestore.DocumentSnapshot[] = [];

            const whereList = this.getWhereList(options);
            const stream = query.stream() as NodeJS.ReadWriteStream;


            let currentIndex = 0;
            let counter = 0;
            let resolved = false;

            const onData = (documentSnapshot: Firestore.DocumentSnapshot) => {
                if (resolved) {
                    return;
                }

                const data = documentSnapshot.data() as Firestore.DocumentData;
                const and = whereList
                    .filter(where => getCombineWithOperator(where) === 'and');
                const or = whereList
                    .filter(where => getCombineWithOperator(where) === 'or');

                const isMatchAllAnds = this.isMatchAll(and, data);
                const isMatchOneOfOr = this.isMatchOneOf(or, data);
                const isFullyMatch = isMatchAllAnds && isMatchOneOfOr;

                if (!isFullyMatch) {
                    return;
                }

                if (options.offset !== undefined) {
                    if (currentIndex < options.offset) {
                        currentIndex++;
                        return;
                    }
                }

                result.push(documentSnapshot);

                counter++;
                currentIndex++;

                if (
                    options.limit !== undefined
                    && options.limit !== 0
                ) {
                    if (counter === options.limit) {
                        stream.end();
                        resolved = true;
                        resolve(result);
                    }
                }
            };

            const onEnd = () => {
                if (!resolved) {
                    resolved = true;
                    resolve(result);
                }
            };

            const onError = (error: Error) => {
                if (!resolved) {
                    reject(error);
                }
            };

            stream.on('data', onData);
            stream.on('error', onError);
            stream.on('end', onEnd);
        });
    }

    async runDefaultStrategy(query: Firestore.Query, collection: string, options: Query): Promise<Firestore.DocumentSnapshot[]> {
        const whereList = this.getWhereList(options)
            .filter(where => (
                getCombineWithOperator(where) === 'and'
                && isNativeOperator(where.op)
            ));

        for (const where of whereList) {
            query = query
                .where(
                    where.field,
                    where.op as NativeOperator,
                    where.value
                );
        }

        if (options.limit != null) {
            query = query.limit(options.limit);
        }

        if (options.offset != null) {
            query = query.offset(options.offset);
        }

        const result = await query.get();

        return result.docs;
    }

    isMatch(where: QueryWhere, data: Firestore.DocumentData) {
        const whereValue = this.toPrimitivesDeep(where.value);
        const value = this.toPrimitivesDeep(data[where.field]);

        switch (where.op) {
            case Operator.eq:
                return this.comparator.eq(value, whereValue);
            case Operator.notEq:
                return this.comparator.notEq(value, whereValue);
            case Operator.lt:
                return this.comparator.lt(value, whereValue);
            case Operator.lte:
                return this.comparator.lte(value, whereValue);
            case Operator.gt:
                return this.comparator.gt(value, whereValue);
            case Operator.gte:
                return this.comparator.gte(value, whereValue);
            case Operator.like:
                return this.comparator.like(value, whereValue);
            case Operator.in:
                return this.comparator.in(value, whereValue);
            case Operator.betweenOpen:
                return this.comparator.betweenOpen(value, whereValue);
            case Operator.notBetweenOpen:
                return this.comparator.notBetweenOpen(value, whereValue);
            case Operator.betweenClose:
                return this.comparator.betweenClose(value, whereValue);
            case Operator.notBetweenClose:
                return this.comparator.notBetweenClose(value, whereValue);
            case Operator.arrayContains:
                return this.comparator.arrayContains(value, whereValue);
        }

        return false;
    }

    isMatchAll(whereList: QueryWhere[], data: Firestore.DocumentData): boolean {
        if (whereList.length) {
            const matcher = (where: QueryWhere) => this.isMatch(where, data);
            return whereList.every(matcher);
        }

        return true;
    }

    isMatchOneOf(whereList: QueryWhere[], data: Firestore.DocumentData) {
        if (whereList.length) {
            const matcher = (where: QueryWhere) => this.isMatch(where, data);
            return whereList.some(matcher);
        }

        return true;
    }

    toPrimitivesDeep(value: any): any {
        if (value instanceof Timestamp) {
            return value.toMillis();
        }

        if (Array.isArray(value)) {
            return value.map(
                (value: any) => this.toPrimitivesDeep(value)
            );
        }

        return value;
    }

    getWhereList(options: Query): QueryWhere[] {
        if (options.where) {
            if (Array.isArray(options.where)) {
                return options.where;
            }

            return [options.where];
        }

        return [];
    }
}
