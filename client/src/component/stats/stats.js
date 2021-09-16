import { useEffect, useState } from "react";
import * as d3 from "d3";
import Cards from "../cards/cards";
import BarChart from "../charts/barChart";
import classes from "./stats.module.scss";
import PointChart from "../charts/pointChart";

function Stats({ type }) {
  const [data, setData] = useState(null);
  const [chartType, setChartType] = useState("impressions");
  let formatTime = d3.timeFormat(
    `%B %d, %Y${type === "hourly" ? " %H:00" : ""}`
  );
  useEffect(() => {
    fetch(`/api/stats/${type}`)
      .then((res) => {
        if (!res.ok && res.status !== 429)
          throw new Error("Oops! Something went wrong.");
        return res.json();
      })
      .then((data) => {
        if (data.status === "fail") throw new Error(data.message);
        if (type === "hourly")
          data.forEach((d) => {
            const date = new Date(d.date);
            d.date = date.setHours(date.getHours() + d.hour);
          });

        setData(data);
      })
      .catch((err) => {
        setData(["fail", `${err}`]);
        console.error(err);
      });
  }, [type]);
  if (!data) return <Cards>Loading...</Cards>;
  else if (data[0] === "fail") return <Cards err={true}>{data[1]}</Cards>;
  const formattedData = data.map(({ date, impressions, clicks, revenue }) => ({
    xAxis: chartType === "all" ? impressions : date,
    yAxis:
      chartType === "impressions"
        ? impressions
        : chartType === "clicks"
        ? clicks
        : revenue,
    y1Axis: clicks,
    y2Axis: revenue,
  }));
  function updateChart(e) {
    setChartType(e.target.value);
  }
  return (
    <Cards mode={"stats"} type={type}>
      <h2 className={classes.title}>
        {type[0].toUpperCase()}
        {type.slice(1)} Data
      </h2>
      <p>
        <strong>Start: </strong>
        {formatTime(new Date(data[0].date))} | <strong>End: </strong>
        {formatTime(new Date(data[data.length - 1].date))}
      </p>

      <select className={classes.chartOption} onChange={updateChart}>
        <option value="impressions">Impressions vs. Date</option>
        <option value="clicks">Clicks vs. Date</option>
        <option value="revenue">Revenue vs. Date</option>
        <option value="all">Impressions vs. Clicks vs. Revenue</option>
      </select>
      {chartType === "all" ? (
        <PointChart
          data={formattedData}
          xAxisValue="impressions"
          y1AxisValue="clicks"
          y2AxisValue="revenue"
          type={type}
        />
      ) : (
        <BarChart
          data={formattedData}
          xAxisValue="date"
          yAxisValue={chartType}
          type={type}
        />
      )}
    </Cards>
  );
}
export default Stats;
