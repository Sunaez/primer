import React from "react";
import { Svg, Polygon } from "react-native-svg";

const Star = ({ color = "#F8CA00", size = 200 }: { color?: string; size?: number }) => (
  <Svg height={size} width={size} viewBox="0 0 100 100">
    <Polygon
      fill={color}
      points="50,0 61,35 98,35 68,57 79,91 50,70 21,91 32,57 2,35 39,35"
    />
  </Svg>
);

export default Star;
