/*eslint-disable */
import { useEffect, useState, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-markercluster";
import BarChart from "../charts/barChart";
import PointChart from "../charts/pointChart";
import * as L from "leaflet";
import Cards from "../cards/cards";
import classes from "./poi.module.scss";
import btnStyle from "../button/btn.module.scss";
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
  const [position, setPosition] = useState(null);
  const [mode, switchMode] = useState("events");

  useEffect(() => {
    fetch(`/api/poi/${mode}`)
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
  }, [mode]);
  if (!data) return <Cards>Loading...</Cards>;
  else if (data[0] === "fail") return <Cards err={true}>{data[1]}</Cards>;
  let formattedData = new Object();
  data.forEach((d) => {
    const date = new Date(d.date);
    d.date = date.setHours(date.getHours() + d.hour);
    let data;
    if (mode === "events") {
      data = { xAxis: d.date, yAxis: d.events };
    } else {
      data = { xAxis: d.impressions, y1Axis: d.clicks, y2Axis: d.revenue };
    }
    if (!formattedData[d.poi_id])
      formattedData[d.poi_id] = {
        name: d.name,
        lat: d.lat,
        lon: d.lon,
        data: [data],
      };
    else formattedData[d.poi_id].data.push(data);
  });
  const keys = Object.keys(formattedData);

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
    // console.log(mapRef.current.setView([data[index].lat, data[index].lon], 13));
  }
  function switchEventsStats() {
    switchMode(mode === "events" ? "stats" : "events");
  }

  return (
    <Cards>
      <div className={classes.poi}>
        <form>
          <label htmlFor="poiOption">Point of Interest (POI)</label>
          <select
            id="poiOption"
            className={classes["opi__option"]}
            onChange={updateMap}
          >
            <option value="">-- Select a Place --</option>
            {keys.map((d, i) => (
              <option key={i} value={d}>
                {formattedData[d].name}
              </option>
            ))}
          </select>
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
                  click: (e) => setPosition(e.target.options.poi_id),
                }}
              >
                <Popup>{formattedData[d].name}</Popup>
              </Marker>
            ))}
          </MarkerClusterGroup>
        </MapContainer>
      </div>

      {position && (
        <div>
          <h2>{formattedData[position].name}</h2>
          <div className={classes.mode}>
            <h2>{mode} - hourly</h2>
            <button
              className={`${btnStyle.btn} ${btnStyle.btn__color}`}
              onClick={switchEventsStats}
              content={`Show ${mode === "events" ? "stats" : "events"}`}
            >
              {`Show ${mode === "events" ? "stats" : "events"}`}
            </button>
          </div>
          {mode === "events" ? (
            <BarChart
              data={formattedData[position].data}
              xAxisValue="date"
              yAxisValue="events"
              type="hourly"
            />
          ) : (
            <PointChart
              data={formattedData[position].data}
              xAxisValue="impressions"
              y1AxisValue="clicks"
              y2AxisValue="revenue"
              type="hourly"
            />
          )}
        </div>
      )}
    </Cards>
  );
}
export default POI;
