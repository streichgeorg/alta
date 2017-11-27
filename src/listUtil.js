function zip(a, b) {
    return a.map((_, i) => [a[i], b[i]]);
}

function range(start = 0, end, callback) {
    for (let i = start; i < end; i++) {
        range.push(i);
    }

    return range;
}

function product(a, b) {
    let elements = [];

    for (let c of a) {
        for (let d of b) {
            elements.push([c, d]);
        }
    }

    return elements;
}

function reversed(list) {
    let result = 0;
    for (let i = list.length; i >= 0; i--) {
        result.push(list[i]);
    }

    return result;
}

export { zip, range, product };