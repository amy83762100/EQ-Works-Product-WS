/*eslint-disable */
import { useEffect, useState, useRef } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Tooltip,
  LayersControl,
  Circle,
} from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-markercluster";
import BarChart from "../charts/barChart";
import * as L from "leaflet";
import Cards from "../cards/cards";
import classes from "./poi.module.scss";
import chartColors from "../../sass/variable.module.scss";
import "./map.scss";

const createClusterCustomIcon = function (cluster) {
  return L.divIcon({
    html: `<span>${cluster.getChildCount()}</span>`,
    className: "marker-cluster-custom",
    iconSize: L.point(40, 40, true),
  });
};

function POI() {
  const mapRef = useRef();
  const [data, setData] = useState(null);
  const [chartType, setChartType] = useState(null);
  const [position, setPosition] = useState(null);
  const chartTypes = ["events", "impressions", "clicks", "revenue"];
  const maxRadius = 2500,
    minRadius = 1000;
  useEffect(() => {
    fetch(`/api/poi`)
      .then((res) => {
        if (!res.ok && res.status !== 429)
          throw new Error("Oops! Something went wrong.");
        return res.json();
      })
      .then((data) => {
        if (data.status === "fail") throw new Error(data.message);
        setData(data);
      })
      .catch((err) => {
        setData(["fail", `${err}`]);
        console.error(err);
      });
  }, []);
  if (!data) return <Cards>Loading...</Cards>;
  else if (data[0] === "fail") return <Cards err={true}>{data[1]}</Cards>;
  let formattedData = new Object();
  data.forEach((d) => {
    let yAxis;
    switch (chartType) {
      case chartTypes[0]:
        yAxis = d.events;
        break;
      case chartTypes[1]:
        yAxis = d.impressions;
        break;
      case chartTypes[2]:
        yAxis = d.clicks;
        break;
      case chartTypes[3]:
        yAxis = d.revenue;
    }
    let data = {
      xAxis: d.date,
      yAxis: yAxis,
    };

    if (!formattedData[d.poi_id])
      formattedData[d.poi_id] = {
        name: d.name,
        lat: d.lat,
        lon: d.lon,
        data: [data],
        events: +d.events,
        impressions: +d.impressions,
        clicks: +d.events,
        revenue: +d.revenue,
      };
    else {
      formattedData[d.poi_id].data.push(data);
      formattedData[d.poi_id].events += +d.events;
      formattedData[d.poi_id].impressions += +d.impressions;
      formattedData[d.poi_id].clicks += +d.clicks;
      formattedData[d.poi_id].revenue += +d.revenue;
    }
  });
  const keys = Object.keys(formattedData);
  let radius = new Object();
  chartTypes.forEach((type) => {
    const max = Math.max(...keys.map((id) => formattedData[id][type]));
    const min = Math.min(...keys.map((id) => formattedData[id][type]));
    radius[type] = keys.map(
      (id) =>
        ((formattedData[id][type] - min) / (max - min)) *
          (maxRadius - minRadius) +
        minRadius
    );
  });
  function updateMap(e) {
    if (!e.target.value) mapRef.current.setView([52.227, -100.3809], 3);
    else {
      const index = e.target.value;
      setPosition(index);
      setTimeout(() => {
        mapRef.current.flyTo(
          [formattedData[index].lat, formattedData[index].lon],
          13,
          {
            duration: 1,
          }
        );
      }, 300);
    }
  }

  return (
    <Cards>
      <div className={classes.poi}>
        <form>
          <h2>Point of Interest (POI)</h2>
          <div className={classes["opi__options"]}>
            <select onChange={updateMap}>
              <option value="">-- Select a Place --</option>
              {keys.map((d, i) => (
                <option key={i} value={d}>
                  {formattedData[d].name}
                </option>
              ))}
            </select>
            <select onChange={(e) => setChartType(e.target.value)}>
              <option value="">-- Select a Chart Type --</option>
              {chartTypes.map((d, i) => (
                <option key={i} value={d}>
                  {d[0].toUpperCase() + d.slice(1)} vs. Date
                </option>
              ))}
            </select>
          </div>
        </form>
        <MapContainer
          whenCreated={(mapInstance) => {
            mapRef.current = mapInstance;
          }}
          center={[52.227, -100.3809]}
          zoom={3}
          scrollWheelZoom={true}
        >
          <TileLayer
            attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <LayersControl position="topright">
            <LayersControl.BaseLayer checked={!chartType} name="POI Marks">
              <MarkerClusterGroup
                showCoverageOnHover={false}
                spiderfyDistanceMultiplier={2}
                iconCreateFunction={createClusterCustomIcon}
              >
                {keys.map((d, i) => (
                  <Marker
                    key={i}
                    poi_id={d}
                    position={[formattedData[d].lat, formattedData[d].lon]}
                    eventHandlers={{
                      click: (e) => {
                        setPosition(e.target.options.poi_id);
                      },
                    }}
                  >
                    <Popup>{formattedData[d].name}</Popup>
                  </Marker>
                ))}
              </MarkerClusterGroup>
            </LayersControl.BaseLayer>
            {chartTypes.map((type, i) => (
              <LayersControl.BaseLayer
                checked={type === chartType}
                key={i}
                name={type}
              >
                <MarkerClusterGroup
                  showCoverageOnHover={false}
                  spiderfyDistanceMultiplier={2}
                  iconCreateFunction={createClusterCustomIcon}
                >
                  {keys.map((d, j) => (
                    <Circle
                      key={j}
                      center={[formattedData[d].lat, formattedData[d].lon]}
                      radius={radius[type][j]}
                      pathOptions={{
                        color: `${Object.values(chartColors)[i]}`,
                        fillColor: `${Object.values(chartColors)[i]}`,
                      }}
                      poi_id={d}
                      checked={type === chartType}
                      eventHandlers={{
                        click: (e) => {
                          setPosition(e.target.options.poi_id);
                        },
                      }}
                    >
                      <Tooltip>
                        {formattedData[d].name}
                        <br />
                        {type}:{" "}
                        {new Intl.NumberFormat().format(formattedData[d][type])}
                      </Tooltip>
                    </Circle>
                  ))}
                </MarkerClusterGroup>
              </LayersControl.BaseLayer>
            ))}
          </LayersControl>
        </MapContainer>
      </div>

      {position && chartType && (
        <div>
          <h2>{formattedData[position].name}</h2>
          <div className={classes.mode}>
            <h2>{chartType} VS. Date</h2>
          </div>

          <BarChart
            data={formattedData[position].data}
            xAxisValue="date"
            yAxisValue={chartType}
            defaultZoom={24}
          />
        </div>
      )}
    </Cards>
  );
}
export default POI;
