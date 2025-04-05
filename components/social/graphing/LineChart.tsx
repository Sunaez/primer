// LineChart.tsx
import React, { useMemo } from 'react';
import { View, Text } from 'react-native';
import Svg, { Path, Circle, Line, Text as SvgText } from 'react-native-svg';

export interface SeriesMap {
  friendName: string;
  // For each date, a list of scores (numbers) for that date.
  scoreMap: { [date: string]: number[] };
  color: string;
}

interface ThemedLineChartProps {
  seriesMap: SeriesMap[];
  width: number;
  height: number;
  currentTheme: any;
  fontFamily?: string;
}

export default function LineChart({
  seriesMap,
  width,
  height,
  currentTheme,
  fontFamily = 'Parkisans',
}: ThemedLineChartProps) {
  if (!seriesMap || seriesMap.length === 0) {
    return (
      <View style={{ width, height, justifyContent: 'center', alignItems: 'center', backgroundColor: currentTheme.background }}>
        <Text style={{ fontFamily, color: currentTheme.text }}>No Data</Text>
      </View>
    );
  }

  // 1. Compute the union of all dates across all series.
  const unionDates = useMemo(() => {
    const dateSet = new Set<string>();
    seriesMap.forEach((series) => {
      Object.keys(series.scoreMap).forEach((date) => dateSet.add(date));
    });
    const datesArray = Array.from(dateSet);
    // Sort dates chronologically (oldest to newest)
    datesArray.sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
    return datesArray;
  }, [seriesMap]);

  // 2. For each series, compute the main score for each date (highest value, rounded) for the line.
  const seriesData = useMemo(() => {
    return seriesMap.map((series) => {
      const scores = unionDates.map((date) => {
        const arr = series.scoreMap[date] || [];
        if (!Array.isArray(arr) || arr.length === 0) return 0;
        return Math.round(Math.max(...arr));
      });
      return { friendName: series.friendName, scores, color: series.color };
    });
  }, [seriesMap, unionDates]);

  // 3. Determine the overall maximum score (for scaling the y-axis).
  const overallMax = useMemo(() => {
    const all = seriesData.flatMap((s) => s.scores);
    return Math.max(...all, 0);
  }, [seriesData]);

  // 4. Layout configuration.
  const xPadding = 40;
  const yPadding = 20;
  const chartW = width - 2 * xPadding;
  const chartH = height - 2 * yPadding;

  // 5. Compute x-coordinates for each date.
  const xCoords = useMemo(() => {
    if (unionDates.length === 1) return [xPadding + chartW / 2];
    return unionDates.map((_, i) => xPadding + (i * chartW) / (unionDates.length - 1));
  }, [unionDates, xPadding, chartW]);

  // 6. Compute y-coordinates for the main line points (one per date) for each series.
  const seriesPoints = useMemo(() => {
    return seriesData.map((series) =>
      series.scores.map((score) => yPadding + chartH * (1 - (overallMax > 0 ? score / overallMax : 0)))
    );
  }, [seriesData, yPadding, chartH, overallMax]);

  // 7. Build an SVG path string for each series.
  const paths = useMemo(() => {
    return seriesPoints.map((points) =>
      points.map((y, i) => (i === 0 ? `M ${xCoords[i]} ${y}` : `L ${xCoords[i]} ${y}`)).join(' ')
    );
  }, [seriesPoints, xCoords]);

  return (
    <View style={{ width, height, backgroundColor: currentTheme.background }}>
      <Svg width={width} height={height}>
        {/* Draw axes */}
        <Line x1={xPadding} y1={yPadding} x2={xPadding} y2={height - yPadding} stroke={currentTheme.text} strokeWidth={1.5} />
        <Line x1={xPadding} y1={height - yPadding} x2={width - xPadding} y2={height - yPadding} stroke={currentTheme.text} strokeWidth={1.5} />
        {/* Y-axis labels */}
        <SvgText x={xPadding - 10} y={yPadding + 5} fontSize={10} fontFamily={fontFamily} fill={currentTheme.text} textAnchor="end">
          {overallMax}
        </SvgText>
        <SvgText x={xPadding - 10} y={height - yPadding} fontSize={10} fontFamily={fontFamily} fill={currentTheme.text} textAnchor="end">
          0
        </SvgText>
        {/* X-axis labels */}
        {unionDates.map((date, i) => (
          <SvgText
            key={`x-label-${i}`}
            x={xCoords[i]}
            y={height - yPadding + 15}
            fontSize={10}
            fontFamily={fontFamily}
            fill={currentTheme.text}
            textAnchor="middle"
          >
            {date}
          </SvgText>
        ))}
        {/* Draw each series: line and main points (filled circles) */}
        {paths.map((d, idx) => (
          <React.Fragment key={`line-${idx}`}>
            <Path d={d} stroke={seriesData[idx].color} strokeWidth={2} fill="none" />
            {seriesPoints[idx].map((y, i) => (
              <Circle key={`pt-${idx}-${i}`} cx={xCoords[i]} cy={y} r={3} fill={seriesData[idx].color} />
            ))}
          </React.Fragment>
        ))}
        {/* Overlay outlier points as hollow circles */}
        {seriesMap.map((series, sIdx) =>
          unionDates.map((date, dIdx) => {
            const rawArr = series.scoreMap[date];
            if (!Array.isArray(rawArr) || rawArr.length === 0) return null;
            const roundedScores = rawArr.map((score) => Math.round(score));
            const mainVal = Math.round(Math.max(...roundedScores));
            let mainCount = 0;
            return roundedScores.map((rScore, j) => {
              const y = yPadding + chartH * (1 - (overallMax > 0 ? rScore / overallMax : 0));
              if (rScore === mainVal) {
                mainCount++;
                if (mainCount === 1) return null; // Skip the first occurrence (already filled)
              }
              return (
                <Circle
                  key={`out-${sIdx}-${dIdx}-${j}`}
                  cx={xCoords[dIdx]}
                  cy={y}
                  r={3}
                  fill="none"
                  stroke={series.color}
                  strokeWidth={1}
                />
              );
            });
          })
        )}
      </Svg>
    </View>
  );
}
