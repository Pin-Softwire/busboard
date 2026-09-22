import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, useMap, Marker, Popup, Circle } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './App.css';

type Arrival = {
  route: string;
  stationName: string;
  platformName: string | null;
  destination: string;
  minutesToArrival: number;
};

type StopWithArrivals = {
  id: string;
  commonName: string;
  lat: number;
  lon: number;
  distance: number;
  arrivals: Arrival[];
};

type Coordinates = {
  latitude: number;
  longitude: number;
};

const getBusesFromLonLat = async (lat: number, lon: number): Promise<StopWithArrivals[]> => {
  const res = await fetch(`http://localhost:3001/api/arrivals?lat=${lat}&lon=${lon}`);
  const data = await res.json();
  return Array.isArray(data) ? data : [];
};

const getLocationFromPostcode = async (postcode: string): Promise<Coordinates | null> => {
  const res = await fetch(`http://localhost:3001/api/location/${postcode}`);
  const data = await res.json();
  return data && typeof data.latitude === 'number' && typeof data.longitude === 'number'
    ? data
    : null;
};

const blackMarkerIcon = L.divIcon({
  className: '',
  html: '<div class="black-marker-pin"></div>',
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

const RecenterMap = ({ center, radius }: { center: [number, number]; radius: number }): null => {
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

const Square = ({ value, onSquareClick }: { value: string | null; onSquareClick: () => void }) => {
  return (
    <button className="square" onClick={onSquareClick}>
      {value}
    </button>
  );
};

const calculateWinner = (squares: (string | null)[]) => {
  const lines = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6],
  ];
  for (let i = 0; i < lines.length; i++) {
    const [a, b, c] = lines[i];
    if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
      return squares[a];
    }
  }
  return null;
};

const Home = (): React.ReactElement => {
  const [postcode, setPostcode] = useState<string>('');
  const [markerPosition, setMarkerPosition] = useState<[number, number]>([51.505, -0.09]);
  const [nearbyStops, setNearbyStops] = useState<StopWithArrivals[]>([]);
  const [isLoadingStops, setIsLoadingStops] = useState<boolean>(false);
  const [xIsNext, setXIsNext] = useState(true);
  const [squares, setSquares] = useState(Array(9).fill(null));

  const moveMarkerAndFetchStops = async (lat: number, lon: number): Promise<void> => {
    setMarkerPosition([lat, lon]);
    setIsLoadingStops(true);
    try {
      const stops = await getBusesFromLonLat(lat, lon);
      setNearbyStops(stops);
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

  const handleSquareClick = (i: number) => {
    if (squares[i] || calculateWinner(squares)) {
      return;
    }
    const nextSquares = squares.slice();
    if (xIsNext) {
      nextSquares[i] = 'X';
    } else {
      nextSquares[i] = 'O';
    }
    setSquares(nextSquares);
    setXIsNext(!xIsNext);
  };

  const resetBoard = () => {
    const newBoard = Array(9).fill(null);
    setSquares(newBoard);
  };

  const winner = calculateWinner(squares);
  let status;
  if (winner) {
    status = 'Winner: ' + winner;
  } else {
    status = 'Next player: ' + (xIsNext ? 'X' : 'O');
  }

  const visibleStops = nearbyStops
    .filter((stop) => stop.arrivals.length > 0)
    .sort((a, b) => a.distance - b.distance);

  return (
    <div className="flex flex-col items-center justify-center gap-4 pt-6 pb-16 text-center">
      <h1 className="font-serif text-5xl font-bold tracking-tight">BusBoard</h1>
      <form action="" onSubmit={formHandler} className="flex items-center gap-3">
        <label htmlFor="postcodeInput" className="font-medium">
          {' '}
          Postcode:{' '}
        </label>
        <input
          className="rounded border border-gray-300 bg-white px-3 py-2 text-black placeholder:text-gray-400 placeholder:italic"
          placeholder="Type postcode here"
          type="text"
          id="postcodeInput"
          onChange={updatePostcode}
          required
        />
        <input
          type="submit"
          value="Submit"
          className="rounded bg-black px-4 py-2 text-white hover:bg-gray-800"
        />
      </form>

      <div className="map-wrapper overflow-hidden rounded-3xl shadow-xl ring-1 ring-black/10 transition-transform duration-200 hover:scale-[1.01] hover:shadow-2xl">
        {isLoadingStops && (
          <div className="spinner-overlay">
            <div className="spinner" />
          </div>
        )}
        <MapContainer
          center={markerPosition}
          zoom={13}
          scrollWheelZoom={false}
          style={{ height: '100%', width: '100%' }}
        >
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
            <Popup>Drag me to find bus stops nearby</Popup>
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
      <div className="mx-auto max-h-[32rem] w-[90vmin] overflow-y-scroll rounded-2xl border border-gray-300 bg-white p-4 text-black shadow-md">
        {visibleStops.length === 0 ? (
          <div className="flex h-40 items-center justify-center text-center text-sm text-gray-400 italic">
            No nearby stops yet — search a postcode or drag the marker to see arrivals.
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {visibleStops.map((stop) => (
              <table key={stop.id} className="w-full overflow-hidden rounded-xl border border-gray-200">
                <caption className="bg-black px-4 py-3 text-left text-white">
                  <span className="text-base font-bold tracking-wide">{stop.commonName}</span>
                  {stop.arrivals[0]?.platformName && (
                    <span className="ml-2 rounded bg-orange-500 px-2 py-0.5 text-xs font-bold text-black">
                      {stop.arrivals[0].platformName}
                    </span>
                  )}
                  <span className="ml-2 text-xs text-gray-300">
                    {Math.round(stop.distance)}m away
                  </span>
                </caption>
                <thead>
                  <tr className="bg-gray-100 text-xs tracking-wide text-gray-600 uppercase">
                    <th className="px-4 py-2 text-center">Route</th>
                    <th className="px-4 py-2 text-center">Destination</th>
                    <th className="px-4 py-2 text-center">Minutes</th>
                  </tr>
                </thead>
                <tbody>
                  {stop.arrivals.map((arrival, arrivalIndex) => (
                    <tr key={arrivalIndex} className="odd:bg-white even:bg-gray-50 hover:bg-orange-50">
                      <td className="border-t border-gray-100 px-4 py-2">{arrival.route}</td>
                      <td className="border-t border-gray-100 px-4 py-2">{arrival.destination}</td>
                      <td className="border-t border-gray-100 px-4 py-2">{arrival.minutesToArrival}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ))}
          </div>
        )}
      </div>
      <div style={{ justifyItems: 'center' }}>
        <h2> Play a game of tic-tac-toe</h2>
        <div className="status">{status}</div>
        <div className="board-row">
          <Square value={squares[0]} onSquareClick={() => handleSquareClick(0)} />
          <Square value={squares[1]} onSquareClick={() => handleSquareClick(1)} />
          <Square value={squares[2]} onSquareClick={() => handleSquareClick(2)} />
        </div>
        <div className="board-row">
          <Square value={squares[3]} onSquareClick={() => handleSquareClick(3)} />
          <Square value={squares[4]} onSquareClick={() => handleSquareClick(4)} />
          <Square value={squares[5]} onSquareClick={() => handleSquareClick(5)} />
        </div>
        <div className="board-row">
          <Square value={squares[6]} onSquareClick={() => handleSquareClick(6)} />
          <Square value={squares[7]} onSquareClick={() => handleSquareClick(7)} />
          <Square value={squares[8]} onSquareClick={() => handleSquareClick(8)} />
        </div>
        <div>
          <button onClick={resetBoard}>Reset</button>
        </div>
      </div>
    </div>
  );
};

export default Home;
