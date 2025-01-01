import React from "react";
import { Svg, Polygon } from "react-native-svg";

const Rhombus = ({ color = "#88A65E", size = 200 }: { color?: string; size?: number }) => (
  <Svg height={size} width={size} viewBox="0 0 100 100">
    <Polygon fill={color} points="50,0 100,50 50,100 0,50" />
  </Svg>
);

export default Rhombus;
