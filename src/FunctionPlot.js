import React, { Component } from 'react';
import Dimensions from 'react-dimensions';

import { assert, range } from './util';

//
// TODO: Better pass a standalone js function, that would be much more efficient
//

const Orientation = {
    HORIZONTAL: true,
    VERTICAL: false,
};

const addVec = ([ x1, y1 ], [ x2, y2]) => [x1 + x2, y1 + y2];
const mulVec = ([ x, y ], a) => [x * a, y * a];
const fromOrientation = (orientation) => (orientation === Orientation.HORIZONTAL) ? [1, 0] : [0, 1];
const mapToDomain = (from, to, value) => {
    const normalized = (value - from[0]) / (from[1] - from[0]);
    return to[0] + normalized * (to[1] - to[0]);
}
const inDomain = (domain, value) => value >= domain[0] && value <= domain[1];

const Rect = ({transform, a, b, stroke='black'}) => {
    const c = transform(a);
    const d = transform(b);

    const style = {
        stroke,
        fill: 'none',
        strokeWidth: 1
    };

    return <rect x={c[0]} y={c[1]} width={d[0] - c[0]} height={d[1] - c[1]} style={style}/>
}

const Text = ({transform = p => p, position, text, anchor='middle', centerVertical=true, size=15, color='black'}) => {
    const screenPosition = transform(position);

    const y = centerVertical ? screenPosition[1] + size / 4 : screenPosition[1] + size / 2;

    const style = {
        fontSize: size
    };

    return <text x={screenPosition[0]} y={y} textAnchor={anchor} style={style} fontSize={size}>{text}</text>
}

const Line = ({transform = p => p, start, end, width, color='black'}) => {
    const style = {
        strokeWidth: width, 
        stroke: color
    };

    const screenStart = transform(start);
    const screenEnd = transform(end);

    return <line x1={screenStart[0]} y1={screenStart[1]} x2={screenEnd[0]} y2={screenEnd[1]} style={style}/>
};

const Axis = ({transform, originPos, orientation, size, origin, domain, labelDistance }) => {
    const offset = orientation ? originPos[1] : originPos[0];
    const domainSize = domain[1] - domain[0];

    const firstLabel = labelDistance - ((domain[0] % labelDistance) + labelDistance) % labelDistance + domain[0];
    const screenFirstLabel = (firstLabel - domain[0]) / domainSize;

    const numLabels = Math.ceil((domain[1] - domain[0]) / labelDistance);
    const screenLabelDistance = labelDistance / domainSize;

    const labelSpots = range(0, numLabels).map(i => {
        return screenFirstLabel + screenLabelDistance * i;
    }).filter(spot => inDomain([0, 1], spot));

    const start = mulVec(fromOrientation(!orientation), offset);
    const end = addVec(start, fromOrientation(orientation));

    const getTextPosition = (p) => {
        const q = mulVec(fromOrientation(!orientation), 8);
        const r = transform(addVec(start, mulVec(fromOrientation(orientation), p)));
        return addVec(q, r);
    }

    return <g>
        {labelSpots.map((p, i) => 
            <Text key={i}
                position={getTextPosition(p)} 
                text={`${+mapToDomain([0, 1], domain, p).toFixed(2)}`} 
                anchor={orientation ? 'middle' : 'start'}
                centerVertical={!orientation}/>
            )}

        <Line transform={transform} start={start} end={end} width={2}/>
    </g>
}

const Grid = ({ transform, domain, distance, width }) => {
    const DirectionalGrid = ({ transform, orientation, domain, distance }) => {
        const domainSize = domain[1] - domain[0];

        const firstLine = distance - ((domain[0] % distance) + distance) % distance + domain[0];
        const screenFirstLine = (firstLine - domain[0]) / domainSize;

        const numLines = Math.ceil((domain[1] - domain[0]) / distance) + 1;
        const screenDistance = distance / domainSize;

        return <g>
            {range(0, numLines).map(i => screenFirstLine + i * screenDistance).filter(p => p <= 1).map((p, i) => {
                const start = mulVec(fromOrientation(!orientation), p);
                const end = addVec(start, fromOrientation(orientation));

                return <Line key={i} transform={transform} start={start} end={end} width={width}/>
            })}
        </g>

    }

    return <g>
        <DirectionalGrid transform={transform}
            orientation={Orientation.HORIZONTAL}
            domain={domain.y}
            distance={distance}/>

        <DirectionalGrid transform={transform}
            orientation={Orientation.VERTICAL}
            domain={domain.x}
            distance={distance}/>
    </g> 
}

const Path = ({ transform, domain, points, width, color='black', clipPath=null}) => {
    const screenPoints = points.map(([x, y]) =>
        [
            mapToDomain(domain.x, [0, 1], x),
            mapToDomain(domain.y, [0, 1], y),
        ]
    ).map(transform);

    const path = screenPoints.slice(1).reduce((acc, point) => {
        return acc + `L ${point[0]} ${point[1]}`
    }, `M ${screenPoints[0][0]} ${screenPoints[0][1]}`)

    return <path d={path} fill='none' stroke={color} strokeWidth={width} {...clipPath ? {clipPath} : {}}/>
}

class FunctionPlot extends Component {
    constructor(props) {
        super(props);

        this.state = {
            dragging: false,
            delta: [0, 0],
            lastMousePos: null
        };

        this.onMouseDown = this.onMouseDown.bind(this);
        this.onMouseUp = this.onMouseUp.bind(this);
        this.onMouseLeave = this.onMouseLeave.bind(this);
        this.onMouseMove = this.onMouseMove.bind(this);
    }

    onMouseDown(e) {
        this.setState({
            ...this.state,
            dragging: true,
            lastMousePos: [e.pageX, e.pageY]
        });
    }

    onMouseUp(e) {
        this.setState({
            ...this.state,
            dragging: false,
            lastMousePos: null
        });
    }

    onMouseLeave(e) {
        this.setState({
            ...this.state,
            dragging: false,
            lastMousePos: null
        });
    }

    onMouseMove(e) {
        const DRAG_SPEED = 0.05;
        if (this.state.dragging) {
            let mousePos = [e.pageX, e.pageY];
            let delta = mulVec(addVec(this.state.lastMousePos, mulVec(mousePos, -1)), DRAG_SPEED);
            this.setState({
                ...this.state,
                lastMousePos: mousePos,
                delta: addVec(this.state.delta, delta)
            });
        }
    }

    render() {
        const containerWidth = this.props.containerWidth;

        const { numSamples = 500, propsDomain = [-10, 10] } = this.props;

        const xDomain = [propsDomain[0] + this.state.delta[0], propsDomain[1] + this.state.delta[0]];
        // TODO: Find a good starting offset in the constructor
        const yDomain = [propsDomain[0] - this.state.delta[1], propsDomain[1] - this.state.delta[1]];

        const domain = {x: xDomain, y: yDomain};

        const segmentLength = (xDomain[1] - xDomain[0]) / numSamples;

        let paths = range(0, numSamples + 1).reduce(([paths, path], i) => {
            try {
                const x = xDomain[0] + segmentLength * i;
                const y = this.props.func(x);

                // Evaluate should not return Nan
                assert(!isNaN(y));

                if (i === numSamples) {
                    return [[...paths, [...path, [x, y]]], []];
                }

                return [paths, [...path, [x, y]]]
            } catch (e) {
                // TODO: Only do this with EvalErrors
                if (path.length > 0) {
                    return [[...paths, path], []];
                } else {
                    return [paths, []];
                }
            }
        }, [[], []])[0];

        const flatten = arrays => arrays.reduce((acc, arr) => [...acc, ...arr], []);


        const splitAtAsymptote = (path) => {
            const sign = (num) => {
                if (num < 0) {
                    return -1
                } else if (num > 0) {
                    return 1;
                } else {
                    return 0;
                }
            }

            // TODO: Find almost exact position of asymptote
            return path.reduce(([paths, path, oldPoint, oldSign], point, i, arr) => {
                if (oldPoint === null) {
                    return [paths, [...path, point], point, null];
                } else if (oldSign === null) {
                    const deltaY = point[1] - oldPoint[1];
                    return [paths, [...path, point], point, sign(deltaY)];
                }

                const deltaY = point[1] - oldPoint[1];
                const deltaX = point[0] - oldPoint[0];

                const newSign = sign(deltaY);

                if (oldSign !== newSign && Math.abs(deltaY / deltaX) > 500) {
                    return [[...paths, [...path, oldPoint]], [point], point, newSign]
                }

                if (i === arr.length - 1) {
                    return [[...paths, [...path, point]]];
                }

                return [paths, [...path, point], point, newSign]
            }, [[], [], null, null])[0];
        };

        const removeOutOfDomain = (path) => {
            // Assuming b is outside the y-domain
            const intersect = (domain, a, b) => {
                let delta;
                if (b[1] < domain.y[0]) {
                    delta = domain.y[0] - b[1];
                } else if (b[1] > domain.y[1]) {
                    delta = domain.y[1] - b[1];
                }

                let slope = (b[0] - a[0]) /  (b[1] - a[1]);
                let y = b[1] + delta;
                let x = b[0] + delta * slope;

                return [x, y];
            };

            return path.reduce(([paths, path, prevPoint, prevContained], point, i, arr) => {
                const contains = inDomain(domain.y, point[1]);

                if (prevPoint === null) {
                    if (contains) {
                        return [paths, [point], point, contains];
                    } else {
                        return [paths, [], point, contains];
                    }
                }

                if (prevContained && !contains) {
                    return [[...paths, [...path, intersect(domain, prevPoint, point)]], [], point, contains];
                } else if (!prevContained && !contains) {
                    return [paths, [], point, contains];
                } else {
                    let points;
                    if (!prevContained && contains) {
                        points = [intersect(domain, point, prevPoint), point];
                    } else {
                        points = [point];
                    }

                    if (i === arr.length - 1) {
                        return [[...paths, [...path, ...points]], [], point, contains];
                    }

                    return [paths, [...path, ...points], point, contains];
                }
            }, [[], [], null, null])[0];
        }

        paths = paths.reduce((acc, path) => [...acc, ...removeOutOfDomain(path)], [])
                     .reduce((acc, path) => [...acc, ...splitAtAsymptote(path)], []);

        const plotWidth = containerWidth * 0.8;

        const aspectRatio = (xDomain[1] - xDomain[0]) / (yDomain[1] - yDomain[0]);
        const containerHeight = containerWidth / aspectRatio;
        const plotHeight = containerHeight * 0.8;

        const transform = ([x, y]) => {
            return [
                (containerWidth - plotWidth) / 2 + plotWidth * x,
                (containerHeight - plotHeight) / 2 + plotHeight * (1 - y)
            ];
        }

        const originFromDomain = (domain) => -domain[0] / (domain[1] - domain[0]);
        const originPos = [
            Math.min(Math.max(0, originFromDomain(xDomain)), 1),
            Math.min(Math.max(0, originFromDomain(yDomain)), 1)
        ];

        const style = {
            userSelect: 'none'
        };

        return <div style={style}
                    onMouseDown={this.onMouseDown}
                    onMouseUp={this.onMouseUp}
                    onMouseLeave={this.onMouseLeave}
                    onMouseMove={this.onMouseMove}>

            <svg width={containerWidth} height={containerHeight}>
                <g>
                    <Axis domain={xDomain}
                        transform={transform}
                        originPos={originPos}
                        orientation={Orientation.HORIZONTAL}
                        labelDistance={4}/>

                    <Axis domain={yDomain}
                        transform={transform}
                        originPos={originPos}
                        orientation={Orientation.VERTICAL}
                        labelDistance={4}/>

                    <Grid transform={transform}
                        domain={domain}
                        distance={1}
                        width={0.3}/>

                    <Grid transform={transform}
                        domain={domain}
                        distance={4}
                        width={1}/>

                    <Rect transform={transform}
                        a={[0, 1]}
                        b={[1, 0]}/>

                    {paths.map((path, i) => 
                        <Path key={i}
                            transform={transform}
                            domain={domain}
                            points={path}
                            width={2}
                            color={'#CC2936'}/>
                    )}
                </g>
            </svg>
        </div>
    }
}

export default Dimensions()(FunctionPlot);