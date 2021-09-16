import { useEffect, useState } from "react";
import * as d3 from "d3";
import Cards from "../cards/cards";
import BarChart from "../charts/barChart";

function Events({ type }) {
  const [data, setData] = useState(null);
  let formatTime = d3.timeFormat(
    `%B %d, %Y${type === "hourly" ? " %H:00" : ""}`
  );

  useEffect(() => {
    fetch(`/api/events/${type}`)
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
  let formattedData = data.map(({ date, events }) => ({
    xAxis: date,
    yAxis: events,
  }));
  return (
    <Cards mode={"events"} type={type}>
      {!data && <h2>Loading...</h2>}
      {data[0] === "fail" && <h2>{data[1]}</h2>}
      <h2>
        {type[0].toUpperCase()}
        {type.slice(1)} Data
      </h2>
      <p>
        <strong>Start: </strong>
        {formatTime(new Date(data[0].date))} | <strong>End: </strong>
        {formatTime(new Date(data[data.length - 1].date))}
      </p>
      <BarChart
        data={formattedData}
        xAxisValue="date"
        yAxisValue="events"
        type={type}
      />
    </Cards>
  );
}
export default Events;
