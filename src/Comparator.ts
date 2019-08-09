export class Comparator {
    eq(value: any, other: any): boolean {
        return value === other;
    }

    notEq(value: any, other: any): boolean {
        return value !== other;
    }

    lt(value: any, other: any): boolean {
        this.assertType(value, ['string', 'number']);
        this.assertType(other, ['string', 'number']);

        return value < other;
    }

    lte(value: any, other: any): boolean {
        this.assertType(value, ['string', 'number']);
        this.assertType(other, ['string', 'number']);

        return value <= other;
    }

    gt(value: any, other: any): boolean {
        this.assertType(value, ['string', 'number']);
        this.assertType(other, ['string', 'number']);

        return value > other;
    }

    gte(value: any, other: any): boolean {
        this.assertType(value, ['string', 'number']);
        this.assertType(other, ['string', 'number']);

        return value >= other;
    }

    like(value: any, other: any): boolean {
        this.assertType(value, ['string']);
        this.assertType(other, ['string']);

        return value.includes(other);
    }

    in(value: any, other: any[]): boolean {
        this.assertType(value, ['string', 'number']);
        this.assertArrayOfTypes(other, ['string', 'number']);

        return other.includes(value);
    }

    arrayContains(value: any[], other: any): boolean {
        this.assertArrayOfTypes(value, ['string', 'number']);
        this.assertType(other, ['string', 'number']);

        return value.includes(other);
    }

    betweenOpen(value: any, other: any[]): boolean {
        this.assertType(value, ['number']);
        this.assertArrayOfTypes(other, ['number']);

        return other[0] < value && other[1] > value;
    }

    betweenClose(value: any, other: any[]): boolean {
        this.assertType(value, ['number']);
        this.assertArrayOfTypes(other, ['number']);

        return other[0] <= value && other[1] >= value;
    }

    notBetweenOpen(value: any, other: any[]): boolean {
        this.assertType(value, ['number']);
        this.assertArrayOfTypes(other, ['number']);

        return other[0] >= value || other[1] <= value;
    }

    notBetweenClose(value: any, other: any[]): boolean {
        this.assertType(value, ['number']);
        this.assertArrayOfTypes(other, ['number']);

        return other[0] > value || other[1] < value;
    }

    private assertType(value: any, types: string[]): void | never {
        if (!types.includes(typeof value)) {
            throw new TypeError('value must on of ' + types.join(', '));
        }
    }

    private assertArrayOfTypes(value: any[], types: string[]): void | never {
        if (!Array.isArray(value)) {
            throw new TypeError('value must be an array');
        }

        value.forEach(_ => this.assertType(_, types));
    }
}
