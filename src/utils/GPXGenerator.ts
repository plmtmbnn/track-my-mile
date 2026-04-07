export interface WorkoutPoint {
  timestamp: Date;
  speed: number;     // km/h
  distance: number;  // meters
  incline: number;   // %
  power: number;     // Watts
}

/**
 * Generates a valid GPX 1.1 XML string.
 * Simulates small movement for treadmill visibility on Strava.
 */
export const generateGPX = (points: WorkoutPoint[]): string => {
  if (points.length < 2) {
    throw new Error('Minimum 2 points required for GPX');
  }

  // Base coordinate (San Francisco as an example)
  const BASE_LAT = 37.7749;
  const BASE_LON = -122.4194;

  let gpx = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="TrackMyMile" xmlns="http://www.topografix.com/GPX/1/1" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.topografix.com/GPX/1/1 http://www.topografix.com/GPX/1/1/gpx.xsd">
  <trk>
    <name>Treadmill Workout</name>
    <type>9</type> <!-- Strava Run type -->
    <trkseg>
`;

  points.forEach((point, index) => {
    // Simulate slight movement by adding index * small offset to latitude
    const simulatedLat = (BASE_LAT + index * 0.00001).toFixed(6);
    const simulatedLon = BASE_LON.toFixed(6);
    const isoTime = point.timestamp.toISOString();

    gpx += `      <trkpt lat="${simulatedLat}" lon="${simulatedLon}">
        <time>${isoTime}</time>
      </trkpt>
`;
  });

  gpx += `    </trkseg>
  </trk>
</gpx>`;

  return gpx;
};
