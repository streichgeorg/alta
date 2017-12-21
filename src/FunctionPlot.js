import React, { Component } from 'react';
import Dimensions from 'react-dimensions';

import { range } from './util';

// TODO: Better pass a standalone js function, that would be much more efficient
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

const Text = ({transform = p => p, position, text, anchor='middle', centerVertical=true, size=20, color='black'}) => {
    const screenPosition = transform(position);

    const y = centerVertical ? screenPosition[1] + size / 2 : screenPosition[1];

    return <text x={screenPosition[0]} y={y} textAnchor={anchor} fill={color} fontSize={size}>{text}</text>
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

    const firstLabel = mapToDomain(domain, [0, 1], domain[0] - domain[0] % labelDistance);
    const numLabels = Math.ceil((domain[1] - domain[0]) / labelDistance) + 1;
    const screenLabelDistance = labelDistance / (domain[1] - domain[0]);

    const labelSpots = range(0, numLabels).map(i => {
        return firstLabel + screenLabelDistance * i;
    });

    const start = mulVec(fromOrientation(!orientation), offset);
    const end = addVec(start, fromOrientation(orientation));

    const getTextPosition = (p) => {
        const q = mulVec(fromOrientation(!orientation), 20);
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

        <Line transform={transform} start={start} end={end} width={1.5}/>
    </g>
}

const Grid = ({ transform, domain, distance }) => {
    const DirectionalGrid = ({ transform, orientation, domain, distance }) => {
        const numLines = Math.ceil((domain[1] - domain[0]) / distance) + 1;
        const screenDistance = distance / (domain[1] - domain[0]);

        return <g>
            {range(0, numLines).map(i => {
                const start = mulVec(fromOrientation(!orientation), i * screenDistance);
                const end = addVec(start, fromOrientation(orientation));

                return <Line key={i} transform={transform} start={start} end={end} width={0.5}/>
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
            delta: [0, 0]
        };
    }

    render() {
        const containerWidth = this.props.containerWidth;

        const { numSamples = 500, propsDomain = [-10, 10] } = this.props;

        const xDomain = propsDomain;

        const segmentLength = (xDomain[1] - xDomain[0]) / numSamples;

        const dataPoints = range(0, numSamples + 1).map(i => {
            try {
                const x = xDomain[0] + segmentLength * i;
                const y = this.props.func(x);

                return [x, y];
            } catch (e) {
                return null;
            }
        }).filter(el => el != null);

        const [ min, max ] = dataPoints.reduce(([ min, max ], [ _, y ]) => {
            return [Math.min(min, y), Math.max(max, y)];
        }, [0, 0]);

        const yDomain = [Math.max(xDomain[0], min) - 1.0, Math.min(xDomain[1], max) + 1.0];
        const domain = {x: xDomain, y: yDomain};

        const plotWidth = containerWidth - 200;

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
        const originPos = [originFromDomain(xDomain), originFromDomain(yDomain)];

        const clipMargin = 5;

        return <div>
            <svg width={containerWidth} height={containerHeight}>
                <defs>
                    <clipPath id='clip'>
                        <rect 
                            x={(containerWidth - plotWidth) / 2 - clipMargin}
                            y={(containerHeight - plotHeight) / 2 - clipMargin}
                            width={plotWidth + 2 * clipMargin}
                            height={plotHeight + 2 * clipMargin}/>
                    </clipPath>
                </defs>
                <g>
                    <Axis domain={xDomain} 
                        transform={transform}
                        originPos={originPos}
                        orientation={Orientation.HORIZONTAL}
                        labelDistance={2}/>

                    <Axis domain={yDomain}
                        transform={transform}
                        originPos={originPos}
                        orientation={Orientation.VERTICAL}
                        labelDistance={2}/>

                    <Grid transform={transform}
                        domain={domain}
                        distance={1}/>

                    <Path transform={transform}
                        domain={domain}
                        points={dataPoints}
                        width={2.5}
                        color={'#CC2936'}
                        />
                </g>
            </svg>
        </div>
    }
}

export default Dimensions()(FunctionPlot);