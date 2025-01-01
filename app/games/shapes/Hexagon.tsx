import React from "react";
import { Svg, Polygon } from "react-native-svg";

const Hexagon = ({ color = "#3B8686", size = 200 }: { color?: string; size?: number }) => (
  <Svg height={size} width={size} viewBox="0 0 100 100">
    <Polygon
      fill={color}
      points="50,0 93,25 93,75 50,100 7,75 7,25"
    />
  </Svg>
);

export default Hexagon;
