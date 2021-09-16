import { useEffect, useState, useRef } from "react";
import * as d3 from "d3";
import classes from "./barChart.module.scss";
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

function BarChart({ data, type, xAxisValue, yAxisValue }) {
  const [input, setInput] = useState(null);
  const [_, setDimensions] = useState(window.innerWidth);
  let [zoom, setZoom] = useState(50);
  const zoomRef = useRef(null);
  let zoomMin = 2,
    zoomMax = 100;
  let showScrollBar = data.length > 30;

  useEffect(() => {
    // -----
    const SVG = d3.select("svg");
    SVG.selectChildren().remove();

    // const SVG_WIDTH = SVG.node().clientWidth;

    const formatTime = d3.timeFormat(
      `%B %d, %Y${type === "hourly" ? " %H:00" : ""}`
    );
    const formatTimeShort = d3.timeFormat(
      type === "hourly" ? (zoom >= 50 ? "%H:00" : "") : "%b %d"
    );
    const formatNum = d3.format(",.2~f");
    const CONTAINER_WIDTH = d3.select("#container").node().clientWidth;

    const SVG_WIDTH = showScrollBar ? data.length * zoom : CONTAINER_WIDTH;
    const SVG_HEIGHT = SVG.node().clientHeight;
    SVG.attr("width", SVG_WIDTH);
    zoomMin = Math.round(CONTAINER_WIDTH / data.length);
    const BUFFER = 40;
    // COLOR SCALE
    const COLOR = d3
      .scaleThreshold()
      .domain([d3.mean(data, (d) => d.yAxis)])
      .range([`${chartColors.primary}`, `${chartColors.secondary}`]);

    // Y AXIS SCALE
    let Y_AXIS_MAX = d3.max(data, (d) => +d.yAxis);
    Y_AXIS_MAX += Y_AXIS_MAX / 6;
    const Y_AXIS_SCALE = d3
      .scaleLinear()
      .domain([Y_AXIS_MAX, 0])
      .range([BUFFER, SVG_HEIGHT - BUFFER]);
    // Y AXIS
    const Y_AXIS = d3
      .axisLeft(Y_AXIS_SCALE)
      .tickSizeOuter(0)
      .tickSizeInner(3)
      .ticks(12, "~s");
    // Y AXIS GROUP
    const Y_AXIS_G = SVG.append("g").attr("id", "yAxisG");
    // RENDER Y AXIS
    Y_AXIS(Y_AXIS_G);
    Y_AXIS_G.attr("transform", `translate(${BUFFER},0)`);
    // -----
    // X AXIS SCALE
    const X_AXIS_SCALE = d3
      .scaleLinear()
      .domain([-1, data.length])
      .range([BUFFER, SVG_WIDTH - BUFFER]);

    // X AXIS
    const X_AXIS = d3
      .axisBottom()
      .scale(X_AXIS_SCALE)
      .tickSizeOuter(0)
      .tickSizeInner(0)
      .tickPadding(5)
      .ticks(data.length);

    // X AXIS GROUP
    const X_AXIS_G = SVG.append("g").attr("id", "xAxisG");

    // RENDER X AXIS
    X_AXIS(X_AXIS_G);
    // TRANSFORM X AXIS GROUP
    X_AXIS_G.attr("transform", `translate(0,${SVG_HEIGHT - BUFFER})`)
      .style("fill", "inherit")
      .style("font-size", "inherit")
      .style("font-weight", "inherit");
    // -----
    // HANDLING EVENTS
    function showDetail(currentEl, show) {
      const el = d3.select(currentEl).selectAll(".detail");
      if (show) {
        d3.select(currentEl.parentNode)
          .selectAll("rect:not(.detail)")
          .transition()
          .duration(300)
          .style("opacity", 0.3);
        d3.select(currentEl)
          .select("rect:not(.detail)")
          .transition()
          .duration(300)
          .style("opacity", 1);
        el.attr("display", "flex").raise();
      } else {
        d3.select(currentEl.parentNode)
          .selectAll("rect:not(.detail)")
          .transition()
          .duration(300)
          .style("opacity", 1);
        el.attr("display", "none");
      }
    }
    // RENDER BARS

    let maxBarWidth = X_AXIS_SCALE(1) - X_AXIS_SCALE(0);
    maxBarWidth = Math.floor(maxBarWidth) - maxBarWidth * 0.1;
    data.forEach((count, i) =>
      SVG.append("g")
        .attr("class", "pair")
        .data([count.yAxis])
        .on("click mouseenter", (e) => showDetail(e.currentTarget, true))
        .on("mouseleave", (e) => showDetail(e.currentTarget, false))
    );
    const PAIR_G = d3.selectAll(".pair");
    d3.selectAll(`#xAxisG text`).select(function (d, i, n) {
      if (i > 0 && i < data.length + 1)
        n[i].textContent = `${formatTimeShort(new Date(data[i - 1].xAxis))}`;
      else n[i].textContent = "";
    });
    PAIR_G.each((d, i, n) => {
      d3.select(`#xAxisG text:nth-of-type(${i + 1})`).text(() => "");
      d3.select(n[i])
        .selectAll("rect")
        .data(() => [d])
        .join("rect")
        .attr("width", maxBarWidth)
        .attr("height", () =>
          d ? SVG_HEIGHT - BUFFER - Y_AXIS_SCALE(d) - 1 : 0
        )
        .attr("x", () => X_AXIS_SCALE(i) - maxBarWidth / 2)
        .attr("y", () => Y_AXIS_SCALE(d))
        .attr("rx", "2")
        .attr("ry", "2")
        .style("fill", () => COLOR(d));

      maxBarWidth >= 44 &&
        d3
          .select(n[i])
          .selectAll("text")
          .data(() => [d])
          .join("text")
          .text((d) => formatNum(d))
          .attr("width", maxBarWidth)
          .attr("height", () =>
            d ? SVG_HEIGHT - BUFFER - Y_AXIS_SCALE(d) - 1 : 0
          )
          .attr("x", () => X_AXIS_SCALE(i))
          .attr("y", () => (d ? Y_AXIS_SCALE(d) - 15 : 0))
          .style("fill", "inherit")
          .style("text-anchor", "middle")
          .style("font-size", "inherit")
          .style("font-weight", "inherit");
      // Detail
      let detailEl = d3
        .select(n[i])
        .append("text")
        .data(() => [d])
        .attr("class", "detail")
        .attr("display", "none")
        .attr("width", maxBarWidth)
        .attr("height", () => SVG_HEIGHT - BUFFER - Y_AXIS_SCALE(d) - 1)
        .attr("x", () => X_AXIS_SCALE(i))
        .attr("y", () => BUFFER / 2)
        .style("fill", "inherit")
        .style("text-anchor", "middle")
        .style("font-size", "inherit")
        .style("font-weight", "inherit")
        .style("background-color", "white");
      detailEl
        .append("tspan")
        .text(() => `${formatTime(new Date(data[i].xAxis))}`)
        .attr("x", () => X_AXIS_SCALE(i))
        .attr("y", () => BUFFER / 2);
      detailEl
        .append("tspan")
        .text(() => `${yAxisValue.toUpperCase()}: ${formatNum(d)}`)
        .attr("x", () => X_AXIS_SCALE(i))
        .attr("y", () => BUFFER);
      d3.select(n[i])
        .insert("rect", "text")
        .attr("class", "detail")
        .attr("display", "none")
        .attr("width", BUFFER * 5)
        .attr("height", BUFFER * 1.3)
        .attr("x", () => X_AXIS_SCALE(i) - BUFFER * 2.5)
        .attr("y", () => 0)
        .attr("rx", "5")
        .attr("ry", "5")
        .style("fill", "rgba(250, 250, 250, 0.95)");
    });

    function scrollToData() {
      const dataIndex = data.findIndex(
        (d) =>
          `${new Date(d.xAxis)}`.slice(0, 15) ===
          `${new Date(new Date(input).getTime() + 24 * 60 * 60 * 1000)}`.slice(
            0,
            15
          )
      );
      const searchResultEl = document.getElementById("searchResult");
      if (dataIndex !== -1) {
        zoomRef.current.scrollLeft = 0;
        zoomRef.current.scrollLeft +=
          X_AXIS_SCALE(dataIndex) - CONTAINER_WIDTH / 2;
        showDetail(
          d3.selectAll(`.pair:nth-of-type(${dataIndex + 3})`).node(),
          true
        );
        searchResultEl.textContent = `${formatTime(
          data[dataIndex].xAxis
        )} ${yAxisValue}:${data[dataIndex].yAxis}`;
        searchResultEl.style.color = `${chartColors.tertiary}`;
      } else {
        searchResultEl.textContent = `No data found at ${input}`;
        searchResultEl.style.color = `${chartColors.redLight}`;
      }
    }
    input && scrollToData();

    // RESIZE
    const debounceHandleResize = debounce(function handleResize() {
      setDimensions(window.innerWidth);
    }, 1000);
    window.addEventListener("resize", debounceHandleResize);
    return (_) => {
      window.removeEventListener("resize", debounceHandleResize);
    };
  });

  function getSearchValue(e) {
    setInput(e.target.value);
  }
  function getZoomValue(e) {
    let value = e.target.value;
    if (value < zoomMin) value = zoomMin;
    else if (value > zoomMax) value = zoomMax;
    setZoom(value);
  }
  return (
    <div>
      <div className={classes.setting}>
        <form className={classes.form}>
          <div>
            <label htmlFor="searchByDate">Search by date:</label>
            <input
              id="searchByDate"
              type="date"
              onChange={getSearchValue}
            ></input>
          </div>
          <span id="searchResult"></span>
        </form>
        {showScrollBar && (
          <div className={classes.zoom}>
            <button
              onClick={() => setZoom(zoom > zoomMin ? zoom - 1 : zoomMin)}
            >
              -
            </button>
            <form>
              <label htmlFor="zoom">Zoom: </label>
              <input
                id="zoom"
                type="number"
                pattern="[0-9]"
                value={zoom}
                onChange={getZoomValue}
                required
              ></input>
            </form>
            <button
              onClick={() => setZoom(zoom < zoomMax ? zoom + 1 : zoomMax)}
            >
              +
            </button>
          </div>
        )}
      </div>
      <div id="container" className={classes.container} ref={zoomRef}>
        <svg className={classes.chart}></svg>
      </div>
      <p className={classes.note}>
        Note: Y-Axis is {yAxisValue} | X-Axis is the {xAxisValue} <br />
        Average {yAxisValue} value for the entire period was:{" "}
        {Math.round(d3.mean(data, (d) => d.yAxis))}
      </p>
      <div className={classes.legend}>
        <div>
          <div className={classes["legend__below"]}></div>
          <small>Below Average</small>
        </div>
        <div>
          <div className={classes["legend__above"]}></div>
          <small>Above Average</small>
        </div>
      </div>
    </div>
  );
}
export default BarChart;
