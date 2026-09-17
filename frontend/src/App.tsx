import React, { useState } from "react";

type Arrival = {
  "route": string,
  "stationName": string,
  "platformName": string | null,
  "destination": string,
  "minutesToArrival": number
}

const getBuses = async (postcode: string): Promise<Arrival[][]> => {
  const res = await fetch(`http://localhost:3001/api/arrivals/${postcode}`);
  return res.json();
};

const App = (): React.ReactElement => {
  const [postcode, setPostcode] = useState<string>("");
  const [tableData, setTableData] = useState<Arrival[][]>([]);

  const formHandler = async (event: React.SubmitEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault(); // to stop the form refreshing the page when it submits
    const data = await getBuses(postcode);
    console.log(data)
    setTableData(data);
  };

  const updatePostcode = (data: React.ChangeEvent<HTMLInputElement>): void => {
    setPostcode(data.target.value);
  };

  return (
    <>
      <h1>BusBoard</h1>
      <form action="" onSubmit={formHandler}>
        <label htmlFor="postcodeInput"> Postcode: </label>
        <input type="text" id="postcodeInput" onChange={updatePostcode} />
        <input type="submit" value="Submit" />
      </form>
      {tableData.map((stopArrivals, stopIndex) => (
        <table key={stopIndex}>
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
))}

    </>
  );
};

export default App;