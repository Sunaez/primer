// BarChart.tsx
import React from 'react';
import { View, Text } from 'react-native';
import Svg, { Rect, Line, Text as SvgText } from 'react-native-svg';

interface FriendScore {
  friendName: string;
  score: number;
  color: string; // ensure each data point includes a color if needed
}

interface ThemedBarChartProps {
  data: FriendScore[];
  labels: string[]; // Must match data.length
  width: number;
  height: number;
  currentTheme: any;
  fontFamily?: string;
}

function NoDataView({
  width,
  height,
  theme,
  fontFamily,
}: {
  width: number;
  height: number;
  theme: any;
  fontFamily: string;
}) {
  return (
    <View
      style={{
        width,
        height,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: theme.background,
      }}
    >
      <Text style={{ fontFamily, color: theme.text }}>No Data</Text>
    </View>
  );
}

export default function BarChart({
  data,
  labels,
  width,
  height,
  currentTheme,
  fontFamily = 'Parkisans',
}: ThemedBarChartProps) {
  if (!data || data.length === 0) {
    return <NoDataView width={width} height={height} theme={currentTheme} fontFamily={fontFamily} />;
  }
  if (data.length !== labels.length) {
    return (
      <View style={{ width, height, padding: 8, backgroundColor: currentTheme.background }}>
        <Text style={{ fontFamily, color: 'red' }}>Error: data vs. labels mismatch!</Text>
      </View>
    );
  }

  // Round scores to 0 decimal places.
  const roundedData = data.map(d => ({ ...d, score: Math.round(d.score) }));

  // Compute max score from the rounded data.
  const scores = roundedData.map((d) => d.score);
  const maxScore = Math.max(...scores);

  // Layout configuration.
  const xPadding = 40;
  const yPadding = 20;
  const chartW = width - xPadding * 2;
  const chartH = height - yPadding * 2;
  const barCount = roundedData.length;
  const barSpacing = 10;
  const barWidth = (chartW - barSpacing * (barCount + 1)) / barCount;

  return (
    <View style={{ width, height, backgroundColor: currentTheme.background }}>
      <Svg width={width} height={height}>
        {/* Y-axis */}
        <Line
          x1={xPadding}
          y1={yPadding}
          x2={xPadding}
          y2={height - yPadding}
          stroke={currentTheme.text}
          strokeWidth={1.5}
        />
        {/* X-axis */}
        <Line
          x1={xPadding}
          y1={height - yPadding}
          x2={width - xPadding}
          y2={height - yPadding}
          stroke={currentTheme.text}
          strokeWidth={1.5}
        />
        {/* Y-axis labels */}
        <SvgText
          x={xPadding - 10}
          y={yPadding + 5}
          fontSize={10}
          fontFamily={fontFamily}
          fill={currentTheme.text}
          textAnchor="end"
        >
          {maxScore}
        </SvgText>
        <SvgText
          x={xPadding - 10}
          y={height - yPadding}
          fontSize={10}
          fontFamily={fontFamily}
          fill={currentTheme.text}
          textAnchor="end"
        >
          0
        </SvgText>
        {/* Render bars */}
        {roundedData.map((item, i) => {
          const finalHeight = maxScore > 0 ? (item.score / maxScore) * chartH : 0;
          const x = xPadding + barSpacing + i * (barWidth + barSpacing);
          const y = height - yPadding - finalHeight;
          return (
            <Rect
              key={`bar-${i}`}
              x={x}
              y={y}
              width={barWidth}
              height={finalHeight}
              fill={currentTheme.primary}
              rx={6}
              ry={6}
            />
          );
        })}
        {/* X-axis labels */}
        {labels.map((lbl, i) => {
          const x = xPadding + barSpacing + i * (barWidth + barSpacing) + barWidth / 2;
          return (
            <SvgText
              key={`lbl-${i}`}
              x={x}
              y={height - yPadding + 14}
              fontSize={10}
              fontFamily={fontFamily}
              fill={currentTheme.text}
              textAnchor="middle"
            >
              {lbl}
            </SvgText>
          );
        })}
      </Svg>
    </View>
  );
}
