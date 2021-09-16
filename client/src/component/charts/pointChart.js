import { useEffect, useState } from "react";
import * as d3 from "d3";
import * as ss from "d3-regression";
import classes from "./pointChart.module.scss";
import chartColors from "../../sass/variable.module.scss";
function debounce(fn, ms) {
  let timer;
  return (_) => {
    clearTimeout(timer);
    timer = setTimeout((_) => {
      timer = null;
      fn.apply(this, arguments);
    }, ms);
  };
}
function PointChart({ data, type, xAxisValue, y1AxisValue, y2AxisValue }) {
  const [_, setDimensions] = useState(window.innerWidth);

  useEffect(() => {
    // -----
    const SVG = d3.select("svg");
    SVG.selectChildren().remove();
    const BUFFER = 40;
    const CONTAINER_WIDTH = d3.select("#pointCharContainer").node().clientWidth;

    const SVG_WIDTH = CONTAINER_WIDTH - BUFFER;
    const SVG_HEIGHT = SVG.node().clientHeight - BUFFER;

    let MAX_Y1_AXIS = d3.max(data, (d) => +d.y1Axis);
    let MAX_Y2_AXIS = d3.max(data, (d) => +d.y2Axis);
    const Y1_AXIS_SCALE = d3
      .scaleLinear()
      .domain([MAX_Y1_AXIS, 0])
      .range([BUFFER, SVG_HEIGHT])
      .nice();
    const Y2_AXIS_SCALE = d3
      .scaleLinear()
      .domain([MAX_Y2_AXIS, 0])
      .range([BUFFER, SVG_HEIGHT])
      .nice();
    const Y1_AXIS = d3.axisLeft(Y1_AXIS_SCALE).ticks(10);
    const Y2_AXIS = d3.axisRight(Y2_AXIS_SCALE).ticks(10, d3.format("$~s"));
    const Y1_AXIS_GROUP = SVG.append("g")
      .attr("id", "y1Axis")
      .attr("transform", `translate(${BUFFER},0)`);
    const Y2_AXIS_GROUP = SVG.append("g")
      .attr("id", "y2Axis")
      .attr("transform", `translate(${SVG_WIDTH - BUFFER / 2},0)`);
    Y1_AXIS(Y1_AXIS_GROUP);
    Y2_AXIS(Y2_AXIS_GROUP);
    const MAX_X_AXIS = d3.max(data, (d) => +d.xAxis);
    const MIN_X_AXIS = d3.min(data, (d) => +d.xAxis);
    const X_AXIS_SCALE = d3
      .scaleLinear()
      .domain([MIN_X_AXIS, MAX_X_AXIS])
      .range([BUFFER, SVG_WIDTH - BUFFER / 2])
      .nice();
    const X_AXIS = d3.axisBottom(X_AXIS_SCALE).ticks(10, "~s");
    const X_AXIS_GROUP = SVG.append("g")
      .attr("id", "xAxis")
      .attr("transform", `translate(0,${SVG_HEIGHT})`);
    X_AXIS(X_AXIS_GROUP);

    SVG.append("g")
      .attr("id", "pointChartY1")
      .selectAll("circle")
      .data(data)
      .join("circle")
      .attr("cx", (d) => X_AXIS_SCALE(d.xAxis))
      .attr("cy", (d) => Y1_AXIS_SCALE(d.y1Axis))
      .attr("r", "5")
      .attr("fill", chartColors.primary)
      .attr("opacity", "0.3");

    SVG.append("g")
      .attr("id", "pointChartY2")
      .selectAll("circle")
      .data(data)
      .join("circle")
      .attr("cx", (d) => X_AXIS_SCALE(d.xAxis))
      .attr("cy", (d) => Y2_AXIS_SCALE(d.y2Axis))
      .attr("r", "5")
      .attr("fill", chartColors.tertiary)
      .attr("opacity", "0.3");

    // const polynomialRegression = ss
    //   .regressionPoly()
    //   .x((d) => d.x)
    //   .y((d) => d.y)
    //   .order(3);

    // const regressionData = polynomialRegression(
    //   data.slice().map(({ xAxis, y1Axis }) => ({
    //     x: X_AXIS_SCALE(xAxis),
    //     y: Y1_AXIS_SCALE(y1Axis),
    //   }))
    // );
    const linearRegressionY1 = ss
      .regressionLinear()
      .x((d) => X_AXIS_SCALE(d.xAxis))
      .y((d) => Y1_AXIS_SCALE(d.y1Axis))
      .domain([BUFFER, SVG_WIDTH - BUFFER / 2]);
    SVG.append("g")
      .attr("id", "trendLineY1")
      .selectAll("line")
      .data(d3.pairs(linearRegressionY1(data)))
      .join("line")
      .attr("x1", (d) => d[0][0])
      .attr("y1", (d) => d[0][1])
      .attr("x2", (d) => d[1][0])
      .attr("y2", (d) => d[1][1])
      .style("fill", "none")
      .style("stroke-width", "1")
      .style("stroke", chartColors.primary);
    const linearRegressionY2 = ss
      .regressionLinear()
      .x((d) => X_AXIS_SCALE(d.xAxis))
      .y((d) => Y2_AXIS_SCALE(d.y2Axis))
      .domain([BUFFER, SVG_WIDTH - BUFFER / 2]);
    SVG.append("g")
      .attr("id", "trendLineY2")
      .selectAll("line")
      .data(d3.pairs(linearRegressionY2(data)))
      .join("line")
      .attr("x1", (d) => d[0][0])
      .attr("y1", (d) => d[0][1])
      .attr("x2", (d) => d[1][0])
      .attr("y2", (d) => d[1][1])
      .style("fill", "none")
      .style("stroke-width", "1")
      .style("stroke", chartColors.tertiary);

    // RESIZE
    const debounceHandleResize = debounce(function handleResize() {
      setDimensions(window.innerWidth);
    }, 1000);
    window.addEventListener("resize", debounceHandleResize);
    return (_) => {
      window.removeEventListener("resize", debounceHandleResize);
    };
  });
  return (
    <div id="pointCharContainer" className={classes.container}>
      <svg className={classes.chart}></svg>
      <p className={classes.note}>
        Left Y-Axis is {y1AxisValue} | Right Y-Axis is {y2AxisValue} | X-Axis is
        the {xAxisValue} <br />
      </p>
      <div className={classes.legend}>
        <div>
          <div className={classes["legend__below"]}></div>
          <small>Impression vs. Clicks</small>
        </div>
        <div>
          <div className={classes["legend__above"]}></div>
          <small>Impression vs. Revenue</small>
        </div>
      </div>
    </div>
  );
}
export default PointChart;
