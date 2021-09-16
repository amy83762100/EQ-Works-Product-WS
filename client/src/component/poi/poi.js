/*eslint-disable */
import { useEffect, useState, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-markercluster";
import * as L from "leaflet";
import Cards from "../cards/cards";
import classes from "./poi.module.scss";
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

  useEffect(() => {
    fetch("/api/poi")
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
  function updateMap(e) {
    if (!e.target.value) mapRef.current.setView([52.227, -100.3809], 3);
    else {
      const index = e.target.value - 1;
      setTimeout(() => {
        mapRef.current.flyTo([data[index].lat, data[index].lon], 13, {
          duration: 1,
        });
      }, 300);
    }
    // console.log(mapRef.current.setView([data[index].lat, data[index].lon], 13));
  }
  return (
    <div className={classes.poi}>
      <form>
        <label htmlFor="poiOption">Point of Interest (POI)</label>
        <select
          id="poiOption"
          className={classes["opi__option"]}
          onChange={updateMap}
        >
          <option value="">-- Select a Place --</option>
          {data.map((d, i) => (
            <option key={i} value={d.poi_id}>
              {d.name}
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
          {data.map((d, i) => (
            <Marker key={i} position={[d.lat, d.lon]}>
              <Popup>{d.name}</Popup>
            </Marker>
          ))}
        </MarkerClusterGroup>
      </MapContainer>
    </div>
  );
}
export default POI;
