// /components/social/graphing/LineChart.tsx
import React, { useEffect, useMemo } from 'react';
import { View, Text } from 'react-native';
import Svg, { Path, Circle, Line, Text as SvgText } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';

export interface FriendLine {
  friendName: string;
  color?: string;
  scores: number[];
}

interface ThemedLineChartProps {
  labels: string[];
  lines: FriendLine[];
  width: number;
  height: number;
  currentTheme: any;
  fontFamily?: string;
}

const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedLine = Animated.createAnimatedComponent(Line);
const AnimatedText = Animated.createAnimatedComponent(SvgText);

export default function LineChart({
  labels,
  lines,
  width,
  height,
  currentTheme,
  fontFamily = 'Parkisans',
}: ThemedLineChartProps) {
  if (!lines || lines.length === 0) {
    return (
      <View style={{ width, height, justifyContent: 'center', alignItems: 'center', backgroundColor: currentTheme.background }}>
        <Text style={{ fontFamily, color: currentTheme.text }}>No Data</Text>
      </View>
    );
  }

  const valid = useMemo(() => {
    if (!labels || labels.length === 0) return false;
    return lines.every((ln) => ln.scores.length === labels.length);
  }, [labels, lines]);

  if (!valid) {
    return (
      <View style={{ width, height, padding: 8, backgroundColor: currentTheme.background }}>
        <Text style={{ color: 'red', fontFamily }}>Error: lines vs. labels mismatch!</Text>
      </View>
    );
  }

  const allScores = lines.flatMap((ln) => ln.scores);
  const minScore = Math.min(...allScores);
  const maxScore = Math.max(...allScores);
  const range = maxScore - minScore || 1;

  const xPadding = 40;
  const yPadding = 20;
  const chartW = width - xPadding * 2;
  const chartH = height - yPadding * 2;

  const axisOpacity = useSharedValue(0);
  const progress = useSharedValue(0);

  useEffect(() => {
    axisOpacity.value = withTiming(1, { duration: 700 });
    progress.value = withDelay(300, withTiming(1, { duration: 1000, easing: Easing.out(Easing.ease) }));
  }, [lines, labels]);

  const animatedAxisProps = useAnimatedProps(() => ({
    opacity: axisOpacity.value,
  }));

  return (
    <View style={{ width, height, backgroundColor: currentTheme.background }}>
      <Svg width={width} height={height}>
        {/* X-axis */}
        <AnimatedLine
          animatedProps={animatedAxisProps}
          x1={xPadding}
          y1={height - yPadding}
          x2={width - xPadding}
          y2={height - yPadding}
          stroke={currentTheme.text}
          strokeWidth={1.5}
        />

        {/* Y-axis */}
        <AnimatedLine
          animatedProps={animatedAxisProps}
          x1={xPadding}
          y1={yPadding}
          x2={xPadding}
          y2={height - yPadding}
          stroke={currentTheme.text}
          strokeWidth={1.5}
        />

        {/* Y-axis label ("Score") */}
        <AnimatedText
          animatedProps={animatedAxisProps}
          x={xPadding - 25}
          y={yPadding + chartH / 2}
          fontSize={12}
          fontFamily={fontFamily}
          fill={currentTheme.text}
          textAnchor="middle"
          rotation="-90"
        >
          Score
        </AnimatedText>

        {/* X-axis labels */}
        {labels.map((lbl, i) => {
          const x = xPadding + (i * chartW) / (labels.length - 1 || 1);
          return (
            <AnimatedText
              animatedProps={animatedAxisProps}
              key={`label-${i}`}
              x={x}
              y={height - yPadding + 15}
              fontSize={10}
              fontFamily={fontFamily}
              fill={currentTheme.text}
              textAnchor="middle"
            >
              {lbl}
            </AnimatedText>
          );
        })}

        {lines.map((ln, idx) => {
          const points = ln.scores.map((val, i) => ({
            x: xPadding + (i * chartW) / (labels.length - 1),
            y: yPadding + chartH - ((val - minScore) / range) * chartH,
          }));

          const pathStr = points.reduce((str, pt, i) => str + `${i ? ' L' : 'M'} ${pt.x} ${pt.y}`, '');
          const pathLength = points.reduce((len, pt, i) => (i ? len + Math.hypot(pt.x - points[i - 1].x, pt.y - points[i - 1].y) : len), 0);

          const animatedPathProps = useAnimatedProps(() => ({
            strokeDasharray: pathLength,
            strokeDashoffset: pathLength * (1 - progress.value),
          }));

          return (
            <React.Fragment key={`line-${idx}`}>
              <AnimatedPath
                animatedProps={animatedPathProps}
                d={pathStr}
                stroke={ln.color || currentTheme.primary}
                strokeWidth={2}
                fill="none"
              />
              {points.map((pt, pIdx) => (
                <Circle
                  key={`pt-${idx}-${pIdx}`}
                  cx={pt.x}
                  cy={pt.y}
                  r={3}
                  fill={ln.color || currentTheme.primary}
                />
              ))}
            </React.Fragment>
          );
        })}
      </Svg>
    </View>
  );
}
