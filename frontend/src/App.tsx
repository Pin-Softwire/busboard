import React, { useState, useEffect } from "react";
import { MapContainer, TileLayer, useMap, Marker, Popup, Circle } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import './App.css'

type Arrival = {
  "route": string,
  "stationName": string,
  "platformName": string | null,
  "destination": string,
  "minutesToArrival": number
}

type StopWithArrivals = {
  id: string,
  commonName: string,
  lat: number,
  lon: number,
  arrivals: Arrival[]
}

const getBusesFromLonLat = async (lat: number, lon: number): Promise<StopWithArrivals[]> => {
  const res = await fetch(`http://localhost:3001/api/arrivals?lat=${lat}&lon=${lon}`);
  const data = await res.json();
  return Array.isArray(data) ? data : [];
};

const getLocationFromPostcode = async (postcode: string): Promise<{ latitude: number, longitude: number } | null> => {
  const res = await fetch(`http://localhost:3001/api/location/${postcode}`);
  const data = await res.json();
  return data && typeof data.latitude === 'number' && typeof data.longitude === 'number' ? data : null;
};

const blackMarkerIcon = L.divIcon({
  className: '',
  html: '<div class="black-marker-pin"></div>',
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

const RecenterMap = ({ center, radius }: { center: [number, number], radius: number }): null => {
  const map = useMap();

  useEffect(() => {
    map.invalidateSize();
  }, [map]);

  useEffect(() => {
    const bounds = L.latLng(center).toBounds(radius * 2);
    map.fitBounds(bounds);
  }, [center, radius, map]);

  return null;
};

const App = (): React.ReactElement => {
  const [postcode, setPostcode] = useState<string>("");
  const [tableData, setTableData] = useState<Arrival[][]>([]);
  const [markerPosition, setMarkerPosition] = useState<[number, number]>([51.505, -0.09]);
  const [nearbyStops, setNearbyStops] = useState<StopWithArrivals[]>([]);
  const [isLoadingStops, setIsLoadingStops] = useState<boolean>(false);

  const moveMarkerAndFetchStops = async (lat: number, lon: number): Promise<void> => {
    setMarkerPosition([lat, lon]);
    setIsLoadingStops(true);
    try {
      const stops = await getBusesFromLonLat(lat, lon);
      setNearbyStops(stops);
      setTableData(stops.map((stop) => stop.arrivals));
    } finally {
      setIsLoadingStops(false);
    }
  };

  const formHandler = async (event: React.SubmitEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault(); // to stop the form refreshing the page when it submits
    const location = await getLocationFromPostcode(postcode);
    if (location) {
      await moveMarkerAndFetchStops(location.latitude, location.longitude);
    }
  };

  const updatePostcode = (data: React.ChangeEvent<HTMLInputElement>): void => {
    setPostcode(data.target.value);
  };

  const markerDragEndHandler = async (event: L.LeafletEvent): Promise<void> => {
    const marker = event.target;
    const { lat, lng } = marker.getLatLng();
    await moveMarkerAndFetchStops(lat, lng);
  };

  return (
    <>
      <h1>BusBoard</h1>
      <form action="" onSubmit={formHandler}>
        <label htmlFor="postcodeInput"> Postcode: </label>
        <input type="text" id="postcodeInput" onChange={updatePostcode} />
        <input type="submit" value="Submit" />
      </form>
      
      <div className="map-wrapper">
      {isLoadingStops && (
        <div className="spinner-overlay">
          <div className="spinner" />
        </div>
      )}
      <MapContainer center={markerPosition} zoom={13} scrollWheelZoom={false} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker
          position={markerPosition}
          draggable={true}
          icon={blackMarkerIcon}
          eventHandlers={{ dragend: markerDragEndHandler }}
        >
          <Popup>
            Drag me to find bus stops nearby
          </Popup>
        </Marker>
        <Circle
          center={markerPosition}
          radius={500}
          pathOptions={{ color: 'orange', fillColor: 'orange' }}
        />
        <RecenterMap center={markerPosition} radius={500} />
        {nearbyStops.map((stop) => (
          <Marker key={stop.id} position={[stop.lat, stop.lon]}>
            <Popup>
              <strong>{stop.commonName}</strong>
              {stop.arrivals[0]?.platformName && (
                <span className="platform-badge">{stop.arrivals[0].platformName}</span>
              )}
              <ol>
                {stop.arrivals.map((arrival, arrivalIndex) => (
                  <li key={arrivalIndex}>
                    <span className="route-badge">{arrival.route}</span>
                    to {arrival.destination} - {arrival.minutesToArrival} min
                  </li>
                ))}
              </ol>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
      </div>
      {tableData.filter((stopArrivals) => stopArrivals && stopArrivals.length > 0).map((stopArrivals, stopIndex) => (
        <div style={{justifyItems:"center"}}>
          <table key={stopIndex} style={{width:"15%"}}>
            <caption>Bus stop: {stopArrivals[0].stationName} {stopArrivals[0].platformName ?? ""} </caption>
            <thead>
              <tr>
                <th>Route</th>
                <th>Destination</th>
                <th>Minutes</th>
              </tr>
            </thead>
            <tbody>
              {stopArrivals.map((arrival, arrivalIndex) => (
                <tr key={arrivalIndex}>
                  <td>{arrival.route}</td>
                  <td>{arrival.destination}</td>
                  <td>{arrival.minutesToArrival}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <br></br>
          <hr></hr>
          <br></br>
          </div>
))}     

    </>
  );
};

export default App;