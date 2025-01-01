import React from "react";
import { Svg, Polygon } from "react-native-svg";

const Triangle = ({ color = "#33FF57", size = 200 }: { color?: string; size?: number }) => (
  <Svg height={size} width={size} viewBox="0 0 100 100">
    <Polygon fill={color} points="50,0 100,100 0,100" />
  </Svg>
);

export default Triangle;
