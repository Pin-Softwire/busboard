import React from 'react';

const AboutTfl = (): React.ReactElement => {
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4 px-6 py-16 text-left">
      <h1 className="text-4xl font-bold tracking-tight">About TfL</h1>
      <p className="text-gray-700">
        Transport for London (TfL) is the local government body responsible for the transport
        system in Greater London. BusBoard uses TfL's open Unified API to fetch live bus stop
        locations and real-time arrival predictions.
      </p>
      <p className="text-gray-700">
        Every stop point shown on the map, and every arrival time in the tables, comes directly
        from TfL's public data — nothing here is stored or cached by this app beyond the current
        page load.
      </p>
      <a href="https://api.tfl.gov.uk" className="font-medium text-blue-600 underline">
        api.tfl.gov.uk
      </a>
    </div>
  );
};

export default AboutTfl;
