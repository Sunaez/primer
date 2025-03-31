// /components/social/graphing/BarChart.tsx
import React, { useEffect } from 'react';
import { View, Text } from 'react-native';
import Svg, { Rect as SvgRect, Line as SvgLine, Text as SvgText } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
  Easing,
  withDelay,
} from 'react-native-reanimated';

interface FriendScore {
  friendName: string;
  score: number;
}

interface ThemedBarChartProps {
  data: FriendScore[];
  labels: string[]; // must match data.length
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
    <View style={{ width, height, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.background }}>
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

  // 1) Domain
  const scores = data.map((d) => d.score);
  const minScore = Math.min(...scores);
  const maxScore = Math.max(...scores);
  const range = maxScore - minScore || 1;

  // 2) Layout
  const xPadding = 40;
  const yPadding = 20;
  const chartW = width - xPadding * 2;
  const chartH = height - yPadding * 2;

  const barCount = data.length;
  const barSpacing = 10;
  const barWidth = (chartW - barSpacing * (barCount + 1)) / barCount;

  // 3) Animate axis + bars
  const axisOpacity = useSharedValue(0);
  const progress = useSharedValue(0);

  useEffect(() => {
    axisOpacity.value = withTiming(1, { duration: 700 });
    progress.value = withDelay(300, withTiming(1, { duration: 1000, easing: Easing.out(Easing.ease) }));
  }, [data]);

  return (
    <View style={{ width, height, backgroundColor: currentTheme.background }}>
      <Svg width={width} height={height}>
        {/* X-axis */}
        <AnimatedSvgLine
          x1={xPadding}
          y1={height - yPadding}
          x2={width - xPadding}
          y2={height - yPadding}
          stroke={currentTheme.text}
          strokeWidth={1.5}
          axisOpacity={axisOpacity}
        />
        {/* Y-axis */}
        <AnimatedSvgLine
          x1={xPadding}
          y1={yPadding}
          x2={xPadding}
          y2={height - yPadding}
          stroke={currentTheme.text}
          strokeWidth={1.5}
          axisOpacity={axisOpacity}
        />

        {/* Bars */}
        {data.map((item, i) => {
          const val = item.score;
          const finalHeight = ((val - minScore) / range) * chartH;
          const x = xPadding + barSpacing + i * (barWidth + barSpacing);
          return (
            <AnimatedRect
              key={`bar-${i}`}
              x={x}
              barWidth={barWidth}
              bottomY={height - yPadding}
              finalHeight={finalHeight}
              fill={currentTheme.primary}
              progress={progress}
            />
          );
        })}

        {/* X-axis labels */}
        {labels.map((lbl, i) => {
          const x = xPadding + barSpacing + i * (barWidth + barSpacing) + barWidth / 2;
          return (
            <AnimatedSvgText
              key={`lbl-${i}`}
              axisOpacity={axisOpacity}
              x={x}
              y={height - yPadding + 14}
              fontSize={10}
              fontFamily={fontFamily}
              fill={currentTheme.text}
              textAnchor="middle"
            >
              {lbl}
            </AnimatedSvgText>
          );
        })}
      </Svg>
    </View>
  );
}

// ------------------- ANIMATED PARTS ------------------- //
import { Rect as RNRect, Line as RNLine, Text as RNText } from 'react-native-svg';

// Axis
type AnimatedLineProps = Omit<React.ComponentProps<typeof RNLine>, 'opacity'> & {
  axisOpacity: Animated.SharedValue<number>;
};
const AnimatedLineComp = Animated.createAnimatedComponent(RNLine);

function AnimatedSvgLine(props: AnimatedLineProps) {
  const { axisOpacity, ...rest } = props;
  const animatedProps = useAnimatedProps(() => ({
    opacity: axisOpacity.value.toString(),
  }));
  return <AnimatedLineComp animatedProps={animatedProps} {...rest} />;
}

// Bars
type AnimatedRectProps = {
  x: number;
  barWidth: number;
  bottomY: number;
  finalHeight: number;
  fill: string;
  progress: Animated.SharedValue<number>;
};
const AnimatedRectComp = Animated.createAnimatedComponent(RNRect);

function AnimatedRect({
  x,
  barWidth,
  bottomY,
  finalHeight,
  fill,
  progress,
}: AnimatedRectProps) {
  const animatedProps = useAnimatedProps(() => {
    const h = finalHeight * progress.value;
    const y = bottomY - h;
    return {
      height: h,
      y,
    };
  });
  return (
    <AnimatedRectComp
      x={x}
      width={barWidth}
      animatedProps={animatedProps}
      fill={fill}
      rx={6} // round corners
      ry={6}
    />
  );
}

// Text
type AnimatedTextProps = Omit<React.ComponentProps<typeof RNText>, 'opacity'> & {
  axisOpacity: Animated.SharedValue<number>;
  children?: React.ReactNode;
};
const AnimatedTextComp = Animated.createAnimatedComponent(RNText);

function AnimatedSvgText(props: AnimatedTextProps) {
  const { axisOpacity, children, ...rest } = props;
  const animatedProps = useAnimatedProps(() => ({
    opacity: axisOpacity.value.toString(),
  }));
  return <AnimatedTextComp animatedProps={animatedProps} {...rest}>{children}</AnimatedTextComp>;
}
