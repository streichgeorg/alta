import { zip, product } from '../util';

const ExpressionTypes = {
    IDENTIFIER: 0,
    NUMBER: 1,
    SUM: 2,
    SUB: 3,
    PRODUCT: 4,
    FRACTION: 5,
    POWER: 6,
    FUNCTION: 7,
};

function identifierExpression(name) {
    return {
        name,

        type: ExpressionTypes.IDENTIFIER
    };
}

function numberExpression(number) {
    return {
        number,

        type: ExpressionTypes.NUMBER
    };
}

function sumExpression(summands) {
    return {
        summands,

        type: ExpressionTypes.SUM
    };
}

function subExpression(left, right) {
    return sumExpression([
        left,
        productExpression([numberExpression(-1), right])
    ]);
}

function productExpression(factors) {
    return {
        factors,

        type: ExpressionTypes.PRODUCT
    };
}

function fractionExpression(numerator, denominator) {
    return {
        numerator,
        denominator,

        type: ExpressionTypes.FRACTION
    }
}

function powerExpression(base, exponent) {
    return {
        base,
        exponent,

        type: ExpressionTypes.POWER
    };
}

function functionExpression(name, args) {
    return {
        name,
        args,

        type: ExpressionTypes.FUNCTION
    };
}

export { ExpressionTypes, identifierExpression, numberExpression, sumExpression, subExpression,
         productExpression, fractionExpression, functionExpression };

function isIdentifier(expr) {
    return expr.type === ExpressionTypes.IDENTIFIER;
}

function isNumber(expr) {
    return expr.type === ExpressionTypes.NUMBER;
}

function isSum(expr) {
    return expr.type === ExpressionTypes.SUM;
}

function isProduct(expr) {
    return expr.type === ExpressionTypes.PRODUCT;
}

function isFraction(expr) {
    return expr.type === ExpressionTypes.FRACTION;
}

function isPower(expr) {
    return expr.type === ExpressionTypes.POWER;
}

function isFunction(expr) {
    return expr.type === ExpressionTypes.FUNCTION;
}

export { isIdentifier, isNumber, isSum, isProduct, isFraction, isFunction };

function compareExpressions(a, b) {
    if (a.type !== b.type) {
        return a.type < b.type;
    }

    const compareExpressionList = (c, d) => {
        if (c.length !== d.length) {
            return c.length < d.length;
        }

        for (let pair of zip(c, d)) {
            if (!identical(...pair)) {
                return compareExpressions(...pair);
            }
        }

        return true;
    }

    switch(a.type) {
        case ExpressionTypes.IDENTIFIER:
            return a.name < b.name;
        case ExpressionTypes.NUMBER:
            return a.number < b.number;
        case ExpressionTypes.SUM:
            return compareExpressionList(a.summands, b.summands);
        case ExpressionTypes.PRODUCT:
            return compareExpressionList(a.factors, b.factors);
        case ExpressionTypes.FRACTION:
            if (!identical(a.numerator, b.numerator)) {
                return compareExpressions(a.numerator, b.numerator);
            }
            if (!identical(a.denominator, b.denominator)) {
                return compareExpressions(a.denominator, b.denominator);
            }

            return true;
        case ExpressionTypes.POWER:
            if (!identical(a.base, b.base)) {
                return compareExpressions(a.base, b.base);
            }
            if (!identical(a.exponent, b.exponent)) {
                return compareExpressions(a.exponent, b.exponent);
            }

            return true;
        case ExpressionTypes.FUNCTION:
            if (a.name !== b.name) {
                return a.name < b.name;
            }

            if (a.args.length !== b.length) {
                return a.args.length < b.args.length;
            }

            for (let pair of zip(a.args, b.args)) {
                if (!identical(...pair)) {
                    return compareExpressions(...pair);
                }
            }

            return true;
        default:
            throw 'Cannot compare expressions';
    }
}

function sortedExpressionList(list) {
    const sorted = list.slice().sort(compareExpressions);
    return sorted;
}

function identical(a, b) {
    if (a.type !== b.type) {
        return false;
    }

    const expressionListsAreEqual = (c, d) => {
        if (c.length !== d.length) {
            return false;
        }

        return !zip(sortedExpressionList(c), sortedExpressionList(d))
                    .find(([ e, f ]) => !identical(e, f));
    };

    switch (a.type) {
        case ExpressionTypes.IDENTIFIER:
            return a.name === b.name;
        case ExpressionTypes.NUMBER:
            // TODO: Use a better way to compare floating point numbers
            return a.number === b.number;
        case ExpressionTypes.SUM:
            return expressionListsAreEqual(a.summands, b.summands);
        case ExpressionTypes.PRODUCT:
            return expressionListsAreEqual(a.factors, b.factors);
        case ExpressionTypes.FRACTION:
            return identical(a.numerator, b.numerator) && 
                   identical(a.denominator, b.denominator);
        case ExpressionTypes.POWER:
            return identical(a.base, b.base) && 
                   identical(a.exponent, b.exponent);
        case ExpressionTypes.FUNCTION:
            return a.name === b.name && expressionListsAreEqual(a.args, b.args);
        default:
            throw 'Can\'t compare expressions';
    }
}

export { compareExpressions, identical };

function flattenTree(isParent, key, expr) {
    const func = (node) => {
        return isParent(node) ? 
            key(node).reduce((acc, value) => acc.concat(func(value)), []) : 
            [node];
    }

    return func(expr);
}

const getFactors = expr => isProduct(expr) ? expr.factors : [expr];
const getBase = (a) => isPower(a) ? a.base : a;
const getExponent = (a) => isPower(a) ? a.exponent : numberExpression(1);

function identicalBase(a, b) {
    return identical(getBase(a), getBase(a));
}

function exponentDiff(a, b) {
    const result = subExpression(getExponent(a), getExponent(b));
    return result;
}

function combineElements(withCoeffs, combine) {
    const func = (list) => {
        if (list.length === 0) {
            return [];
        }

        let [ head, ...tail ] = list;
        let n = tail.filter(({ coeff, expr }) => identical(expr, head.expr))
                    .reduce((sum, { coeff }) => simplify(sumExpression([sum, coeff])), head.coeff);

        let rest = tail.filter(({ expr }) => !identical(head.expr, expr));

        let newElement = combine(n, head.expr);

        return [newElement, ...func(rest)];
    }

    return func(withCoeffs);
}

function simplifySum(expr) {
    // Flatten tree
    let summands = flattenTree(isSum, s => s.summands, expr);

    // Simplify summands
    summands = summands.map(simplify);

    let numerical = summands.filter(isNumber);
    let nonNumerical = summands.filter(summand => !isNumber(summand));

    let number = numberExpression(numerical.reduce((acc, { number }) => acc + number, 0));

    if (nonNumerical.length === 0) {
        return number;
    }

    // Combine summands
    const withCoeffs = nonNumerical.map(summand => {
        const factors = getFactors(summand);
        const i = factors.findIndex(isNumber);

        if (i === -1) {
            const expr = factors.length > 1 ? productExpression(factors) : factors[0];
            return {coeff: numberExpression(1), expr};
        } else {
            const coeff = numberExpression(factors[i].number);
            factors.splice(i, 1);

            const expr = factors.length > 1 ? productExpression(factors) : factors[0];
            return {coeff, expr};
        }
    });

    summands =  combineElements(withCoeffs, (n, head) => {
        return simplify(productExpression([n, head]));
    });

    summands.push(number);

    summands = summands.filter(summand => !identical(summand, numberExpression(0)));

    if (summands.length === 0) {
        return numberExpression(0);
    } else if (summands.length === 1) {
        return summands[0];
    } 

    return sumExpression(summands);
}

function simplifyProduct(expr) {
    if (expr.factors.length === 0) {
        return numberExpression(1);
    }

    if (expr.factors.length === 1) {
        return expr.factors[0];
    }

    // Flatten tree
    let factors = flattenTree(isProduct, s => s.factors, expr);

    // Simplify factors
    factors = factors.map(simplify);

    // Pull fractions together
    if (factors.find(isFraction)) {
        let fractions = factors.filter(isFraction);
        let nonFractions = factors.filter(factor => !isFraction(factor));

        let numerator = productExpression([...fractions.map(fraction => fraction.numerator), ...nonFractions]);
        let denominator = productExpression(fractions.map(fraction => fraction.denominator));

        return simplify(fractionExpression(numerator, denominator));
    }

    // Expand sums
    let sums = factors.filter(isSum);
    let nonSums = factors.filter(factor => !isSum(factor));

    if (sums.length > 1) {
        let expanded = sums[0];
        for (let sum of sums.slice(1)) {
            let newSummands = product(expanded.summands, sum.summands).map(([ a, b ]) => {
                return simplify(productExpression([a, b]));
            })

            expanded = sumExpression(newSummands);
        }

        factors = [...nonSums, simplify(expanded)];
    }

    let numerical = factors.filter(isNumber);
    let nonNumerical = factors.filter(factor => !isNumber(factor));
    let number = numberExpression(numerical.reduce((acc, {number}) => acc * number, 1));

    if (nonNumerical.length === 0) {
        return number;
    }

    const withCoeffs = nonNumerical.map(factor => {
        return {coeff: getExponent(factor), expr: getBase(factor)};
    });

    factors = combineElements(withCoeffs, (n, head) => {
        return simplify(powerExpression(head, n));
    });

    factors.push(number);

    if (factors.find(factor => identical(factor, numberExpression(0)))) {
        return numberExpression(0);
    }

    factors = factors.filter(factor => !identical(factor, numberExpression(1)));

    if (factors.length === 0) {
        return numberExpression(1);
    }

    return factors.length > 1 ? productExpression(factors) : factors[0];
}

function reduceNonNumericalFraction(numerator, denominator) {
    let uniqueNumerator = [];
    let uniqueDenominator = denominator;

    for (let factor of numerator) {
        const base = getBase(factor);
        const i = uniqueDenominator.findIndex(factor => identical(base, getBase(factor)));

        if (i !== -1) {
            const diff = simplify(exponentDiff(factor, uniqueDenominator[i]));

            uniqueDenominator.splice(i, 1);

            if (isNumber(diff) && diff.number < 0) {
                uniqueDenominator.push(simplify(powerExpression(base, numberExpression(-diff.number))));
            } else if (!identical(diff, numberExpression(0))) {
                uniqueNumerator.push(simplify(powerExpression(base, diff)));
            }
        } else {
            uniqueNumerator.push(factor);
        }
    }

    return [uniqueNumerator, uniqueDenominator];
}

function simplifyFraction(expr) {
    let numerator = simplify(expr.numerator);
    let denominator = simplify(expr.denominator);

    let newNumerator = [];
    let newDenominator = [];

    if (isFraction(numerator)) {
        newNumerator.push(numerator.numerator);
        newDenominator.push(numerator.denominator);
    }

    if (isFraction(denominator)) {
        newDenominator.push(denominator.numerator);
        newNumerator.push(denominator.denominator);
    }

    if (newNumerator.length > 0) {
        numerator = simplify(productExpression(newNumerator));
        denominator = simplify(productExpression(newDenominator));
    }

    // Reduce fraction
    const numeratorRest = getFactors(numerator).filter(factor => !isNumber(factor));
    const numeratorNumber = getFactors(numerator).find(isNumber);
    const denominatorRest = getFactors(denominator).filter(factor => !isNumber(factor));
    const denominatorNumber = getFactors(denominator).find(isNumber);

    newNumerator = [];
    newDenominator = [];

    if (numeratorNumber) {
        newNumerator.push(numeratorNumber);
    }

    if (denominatorNumber) {
        newDenominator.push(denominatorNumber);
    }

    if (numeratorRest.length > 0 && denominatorRest.length > 0) {
        const [ reducedNumerator, reducedDenominator ] = reduceNonNumericalFraction(numeratorRest, denominatorRest);

        newNumerator.push(...reducedNumerator);
        newDenominator.push(...reducedDenominator);
    } else {
        newNumerator.push(...numeratorRest);
        newDenominator.push(...denominatorRest);
    }

    numerator = simplify(productExpression(newNumerator));
    denominator = simplify(productExpression(newDenominator));

    if (identical(numerator, numberExpression(0))) {
        return numberExpression(0);
    }

    if (identical(denominator, numberExpression(1))) {
        return numerator;
    }

    if (identical(denominator, numberExpression(0))) {
        throw 'Division by 0 is undefined';
    }

    return fractionExpression(numerator, denominator);
}

function simplifyPower(expr) {
    let base = simplify(expr.base);
    let exponent = simplify(expr.exponent);

    if (identical(exponent, numberExpression(0)) && identical(base, numberExpression(0))) {
        throw '0 ^ 0 is undefined';
    }

    if (identical(exponent, numberExpression(0))) {
        return numberExpression(1);
    }

    if (identical(exponent, numberExpression(1))) {
        return base;
    }

    if (identical(base, numberExpression(0))) {
        return numberExpression(0);
    }

    if (identical(base, numberExpression(1))) {
        return numberExpression(1);
    }

    return powerExpression(base, exponent);
}

function simplify(expr) {
    switch(expr.type) {
        case ExpressionTypes.SUM:
            return simplifySum(expr);
        case ExpressionTypes.PRODUCT:
            return simplifyProduct(expr);
        case ExpressionTypes.FRACTION:
            return simplifyFraction(expr);
        case ExpressionTypes.POWER:
            return simplifyPower(expr);
        default:
            return expr;
    }
}

export { simplify };