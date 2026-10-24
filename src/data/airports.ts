// Airports the site knows about, keyed by their three-letter IATA code.
// Used to show city names and to work out distances and the route map.
// Flying somewhere new? Add a line here with the airport's code, city, country,
// and latitude/longitude (search "<code> airport coordinates").

export interface Airport {
  name: string;
  city: string;
  country: string;
  lat: number;
  lon: number;
}

export const AIRPORTS: Record<string, Airport> = {
  // China mainland
  PVG: { name: 'Pudong', city: 'Shanghai', country: 'China', lat: 31.1434, lon: 121.8052 },
  SHA: { name: 'Hongqiao', city: 'Shanghai', country: 'China', lat: 31.1979, lon: 121.3363 },
  PEK: { name: 'Capital', city: 'Beijing', country: 'China', lat: 40.0801, lon: 116.5846 },
  PKX: { name: 'Daxing', city: 'Beijing', country: 'China', lat: 39.5098, lon: 116.4105 },
  CAN: { name: 'Baiyun', city: 'Guangzhou', country: 'China', lat: 23.3924, lon: 113.2988 },
  SZX: { name: "Bao'an", city: 'Shenzhen', country: 'China', lat: 22.6393, lon: 113.8107 },
  CTU: { name: 'Shuangliu', city: 'Chengdu', country: 'China', lat: 30.5785, lon: 103.9471 },
  TFU: { name: 'Tianfu', city: 'Chengdu', country: 'China', lat: 30.3125, lon: 104.4415 },
  XIY: { name: 'Xianyang', city: "Xi'an", country: 'China', lat: 34.4471, lon: 108.7516 },
  HGH: { name: 'Xiaoshan', city: 'Hangzhou', country: 'China', lat: 30.2295, lon: 120.4345 },
  NKG: { name: 'Lukou', city: 'Nanjing', country: 'China', lat: 31.742, lon: 118.862 },
  XMN: { name: 'Gaoqi', city: 'Xiamen', country: 'China', lat: 24.544, lon: 118.1277 },
  TAO: { name: 'Jiaodong', city: 'Qingdao', country: 'China', lat: 36.3619, lon: 120.0883 },
  KMG: { name: 'Changshui', city: 'Kunming', country: 'China', lat: 25.1019, lon: 102.9292 },
  SYX: { name: 'Phoenix', city: 'Sanya', country: 'China', lat: 18.3029, lon: 109.4122 },

  CGQ: { name: 'Longjia', city: 'Changchun', country: 'China', lat: 43.9962, lon: 125.685 },
  NBS: { name: 'Changbaishan', city: 'Baishan', country: 'China', lat: 42.0667, lon: 127.6022 },
  ZQZ: { name: 'Ningyuan', city: 'Zhangjiakou', country: 'China', lat: 40.7386, lon: 114.93 },
  DLU: { name: 'Dali', city: 'Dali', country: 'China', lat: 25.6494, lon: 100.3194 },
  DIG: { name: 'Shangri-La', city: 'Diqing', country: 'China', lat: 27.7936, lon: 99.6772 },
  URC: { name: 'Diwopu', city: 'Ürümqi', country: 'China', lat: 43.9071, lon: 87.4742 },
  YIN: { name: 'Yining', city: 'Yining', country: 'China', lat: 43.9558, lon: 81.3303 },
  AAT: { name: 'Altay', city: 'Altay', country: 'China', lat: 47.7499, lon: 88.0858 },
  KJI: { name: 'Kanas', city: 'Buerjin', country: 'China', lat: 48.2223, lon: 86.9959 },
  FYN: { name: 'Koktokay', city: 'Fuyun', country: 'China', lat: 46.8042, lon: 89.512 },

  // Hong Kong, Macau, Taiwan
  HKG: { name: 'Hong Kong Intl', city: 'Hong Kong', country: 'Hong Kong', lat: 22.308, lon: 113.9185 },
  MFM: { name: 'Macau Intl', city: 'Macau', country: 'Macau', lat: 22.1496, lon: 113.5915 },
  TPE: { name: 'Taoyuan', city: 'Taipei', country: 'Taiwan', lat: 25.0777, lon: 121.2328 },

  // East and Southeast Asia
  NRT: { name: 'Narita', city: 'Tokyo', country: 'Japan', lat: 35.7647, lon: 140.3864 },
  HND: { name: 'Haneda', city: 'Tokyo', country: 'Japan', lat: 35.5494, lon: 139.7798 },
  KIX: { name: 'Kansai', city: 'Osaka', country: 'Japan', lat: 34.4347, lon: 135.244 },
  ICN: { name: 'Incheon', city: 'Seoul', country: 'South Korea', lat: 37.4602, lon: 126.4407 },
  GMP: { name: 'Gimpo', city: 'Seoul', country: 'South Korea', lat: 37.5583, lon: 126.7906 },
  SIN: { name: 'Changi', city: 'Singapore', country: 'Singapore', lat: 1.3644, lon: 103.9915 },
  BKK: { name: 'Suvarnabhumi', city: 'Bangkok', country: 'Thailand', lat: 13.69, lon: 100.7501 },

  NGO: { name: 'Chubu Centrair', city: 'Nagoya', country: 'Japan', lat: 34.8584, lon: 136.8054 },
  CTS: { name: 'New Chitose', city: 'Sapporo', country: 'Japan', lat: 42.7752, lon: 141.6923 },
  HKD: { name: 'Hakodate', city: 'Hakodate', country: 'Japan', lat: 41.77, lon: 140.8219 },
  OKA: { name: 'Naha', city: 'Okinawa', country: 'Japan', lat: 26.1958, lon: 127.646 },
  MMY: { name: 'Miyako', city: 'Miyako', country: 'Japan', lat: 24.7828, lon: 125.295 },
  KUL: { name: 'Kuala Lumpur Intl', city: 'Kuala Lumpur', country: 'Malaysia', lat: 2.7456, lon: 101.7099 },
  DPS: { name: 'Ngurah Rai', city: 'Bali', country: 'Indonesia', lat: -8.7482, lon: 115.167 },
  MLE: { name: 'Velana', city: 'Malé', country: 'Maldives', lat: 4.1918, lon: 73.5291 },

  // Australia
  SYD: { name: 'Kingsford Smith', city: 'Sydney', country: 'Australia', lat: -33.9399, lon: 151.1753 },
  MEL: { name: 'Tullamarine', city: 'Melbourne', country: 'Australia', lat: -37.669, lon: 144.841 },
  ASP: { name: 'Alice Springs', city: 'Alice Springs', country: 'Australia', lat: -23.8067, lon: 133.9022 },
  HBA: { name: 'Hobart', city: 'Hobart', country: 'Australia', lat: -42.8361, lon: 147.5103 },
  LST: { name: 'Launceston', city: 'Launceston', country: 'Australia', lat: -41.5453, lon: 147.2142 },

  // Middle East, Europe
  DXB: { name: 'Dubai Intl', city: 'Dubai', country: 'UAE', lat: 25.2532, lon: 55.3657 },
  DOH: { name: 'Hamad', city: 'Doha', country: 'Qatar', lat: 25.2731, lon: 51.6081 },
  IST: { name: 'Istanbul', city: 'Istanbul', country: 'Turkey', lat: 41.2753, lon: 28.7519 },
  LHR: { name: 'Heathrow', city: 'London', country: 'UK', lat: 51.47, lon: -0.4543 },
  CDG: { name: 'Charles de Gaulle', city: 'Paris', country: 'France', lat: 49.0097, lon: 2.5479 },
  FRA: { name: 'Frankfurt', city: 'Frankfurt', country: 'Germany', lat: 50.0379, lon: 8.5622 },
  MUC: { name: 'Munich', city: 'Munich', country: 'Germany', lat: 48.3538, lon: 11.7861 },
  AMS: { name: 'Schiphol', city: 'Amsterdam', country: 'Netherlands', lat: 52.3105, lon: 4.7683 },
  ZRH: { name: 'Zurich', city: 'Zurich', country: 'Switzerland', lat: 47.4582, lon: 8.5555 },
  HEL: { name: 'Helsinki-Vantaa', city: 'Helsinki', country: 'Finland', lat: 60.3172, lon: 24.9633 },

  FCO: { name: 'Fiumicino', city: 'Rome', country: 'Italy', lat: 41.8003, lon: 12.2389 },
  FLR: { name: 'Peretola', city: 'Florence', country: 'Italy', lat: 43.81, lon: 11.2051 },
  BCN: { name: 'El Prat', city: 'Barcelona', country: 'Spain', lat: 41.2974, lon: 2.0833 },
  MAD: { name: 'Barajas', city: 'Madrid', country: 'Spain', lat: 40.4983, lon: -3.5676 },
  TLS: { name: 'Blagnac', city: 'Toulouse', country: 'France', lat: 43.6291, lon: 1.3638 },
  NCE: { name: "Côte d'Azur", city: 'Nice', country: 'France', lat: 43.6584, lon: 7.2159 },
  VIE: { name: 'Vienna Intl', city: 'Vienna', country: 'Austria', lat: 48.1103, lon: 16.5697 },
  OSL: { name: 'Gardermoen', city: 'Oslo', country: 'Norway', lat: 60.1976, lon: 11.1004 },
  BGO: { name: 'Flesland', city: 'Bergen', country: 'Norway', lat: 60.2934, lon: 5.2181 },
  SVG: { name: 'Sola', city: 'Stavanger', country: 'Norway', lat: 58.8767, lon: 5.6378 },
  AES: { name: 'Vigra', city: 'Ålesund', country: 'Norway', lat: 62.5625, lon: 6.1197 },
  KEF: { name: 'Keflavík', city: 'Reykjavík', country: 'Iceland', lat: 63.985, lon: -22.6056 },

  // New York area
  JFK: { name: 'John F. Kennedy', city: 'New York', country: 'USA', lat: 40.6413, lon: -73.7781 },
  EWR: { name: 'Newark Liberty', city: 'Newark', country: 'USA', lat: 40.6895, lon: -74.1745 },
  LGA: { name: 'LaGuardia', city: 'New York', country: 'USA', lat: 40.7769, lon: -73.874 },
  ISP: { name: 'Long Island MacArthur', city: 'Islip', country: 'USA', lat: 40.7952, lon: -73.1002 },

  BDL: { name: 'Bradley', city: 'Hartford', country: 'USA', lat: 41.9389, lon: -72.6832 },

  // Rest of North America
  BOS: { name: 'Logan', city: 'Boston', country: 'USA', lat: 42.3656, lon: -71.0096 },
  PHL: { name: 'Philadelphia', city: 'Philadelphia', country: 'USA', lat: 39.8744, lon: -75.2424 },
  IAD: { name: 'Dulles', city: 'Washington', country: 'USA', lat: 38.9531, lon: -77.4565 },
  DCA: { name: 'Reagan National', city: 'Washington', country: 'USA', lat: 38.8512, lon: -77.0402 },
  ATL: { name: 'Hartsfield-Jackson', city: 'Atlanta', country: 'USA', lat: 33.6407, lon: -84.4277 },
  MIA: { name: 'Miami', city: 'Miami', country: 'USA', lat: 25.7959, lon: -80.287 },
  MCO: { name: 'Orlando', city: 'Orlando', country: 'USA', lat: 28.4312, lon: -81.3081 },
  ORD: { name: "O'Hare", city: 'Chicago', country: 'USA', lat: 41.9742, lon: -87.9073 },
  DTW: { name: 'Detroit Metro', city: 'Detroit', country: 'USA', lat: 42.2162, lon: -83.3554 },
  MSP: { name: 'Minneapolis-St Paul', city: 'Minneapolis', country: 'USA', lat: 44.8848, lon: -93.2223 },
  DFW: { name: 'Dallas/Fort Worth', city: 'Dallas', country: 'USA', lat: 32.8998, lon: -97.0403 },
  IAH: { name: 'George Bush', city: 'Houston', country: 'USA', lat: 29.9902, lon: -95.3368 },
  DEN: { name: 'Denver', city: 'Denver', country: 'USA', lat: 39.8561, lon: -104.6737 },
  PHX: { name: 'Sky Harbor', city: 'Phoenix', country: 'USA', lat: 33.4352, lon: -112.0101 },
  LAS: { name: 'Harry Reid', city: 'Las Vegas', country: 'USA', lat: 36.084, lon: -115.1537 },
  LAX: { name: 'Los Angeles', city: 'Los Angeles', country: 'USA', lat: 33.9416, lon: -118.4085 },
  SAN: { name: 'San Diego', city: 'San Diego', country: 'USA', lat: 32.7338, lon: -117.1933 },
  SFO: { name: 'San Francisco', city: 'San Francisco', country: 'USA', lat: 37.6213, lon: -122.379 },
  SEA: { name: 'Seattle-Tacoma', city: 'Seattle', country: 'USA', lat: 47.4502, lon: -122.3088 },
  ANC: { name: 'Ted Stevens', city: 'Anchorage', country: 'USA', lat: 61.1743, lon: -149.9963 },
  HNL: { name: 'Daniel K. Inouye', city: 'Honolulu', country: 'USA', lat: 21.3245, lon: -157.9251 },
  PIT: { name: 'Pittsburgh', city: 'Pittsburgh', country: 'USA', lat: 40.4915, lon: -80.2329 },
  CLT: { name: 'Charlotte Douglas', city: 'Charlotte', country: 'USA', lat: 35.214, lon: -80.9431 },
  SLC: { name: 'Salt Lake City', city: 'Salt Lake City', country: 'USA', lat: 40.7899, lon: -111.9791 },
  YYC: { name: 'Calgary', city: 'Calgary', country: 'Canada', lat: 51.1215, lon: -114.0076 },
  YVR: { name: 'Vancouver', city: 'Vancouver', country: 'Canada', lat: 49.1967, lon: -123.1815 },
  YYZ: { name: 'Pearson', city: 'Toronto', country: 'Canada', lat: 43.6777, lon: -79.6248 },
  MEX: { name: 'Benito Juárez', city: 'Mexico City', country: 'Mexico', lat: 19.4361, lon: -99.0719 },
  CUN: { name: 'Cancún', city: 'Cancún', country: 'Mexico', lat: 21.0365, lon: -86.8771 },
};

// More major airports, so new trips usually work without edits.
Object.assign(AIRPORTS, {
  CGK: { name: 'Soekarno-Hatta', city: 'Jakarta', country: 'Indonesia', lat: -6.1256, lon: 106.6559 },
  MNL: { name: 'Ninoy Aquino', city: 'Manila', country: 'Philippines', lat: 14.5086, lon: 121.0198 },
  CEB: { name: 'Mactan-Cebu', city: 'Cebu', country: 'Philippines', lat: 10.3075, lon: 123.9794 },
  HAN: { name: 'Noi Bai', city: 'Hanoi', country: 'Vietnam', lat: 21.2212, lon: 105.8072 },
  SGN: { name: 'Tan Son Nhat', city: 'Ho Chi Minh City', country: 'Vietnam', lat: 10.8188, lon: 106.652 },
  HKT: { name: 'Phuket', city: 'Phuket', country: 'Thailand', lat: 8.1132, lon: 98.3169 },
  CNX: { name: 'Chiang Mai', city: 'Chiang Mai', country: 'Thailand', lat: 18.7668, lon: 98.9626 },
  PEN: { name: 'Penang', city: 'Penang', country: 'Malaysia', lat: 5.2971, lon: 100.277 },
  DEL: { name: 'Indira Gandhi', city: 'Delhi', country: 'India', lat: 28.5562, lon: 77.1 },
  BOM: { name: 'Chhatrapati Shivaji Maharaj', city: 'Mumbai', country: 'India', lat: 19.0896, lon: 72.8656 },
  AUH: { name: 'Zayed', city: 'Abu Dhabi', country: 'UAE', lat: 24.433, lon: 54.6511 },
  CAI: { name: 'Cairo Intl', city: 'Cairo', country: 'Egypt', lat: 30.1219, lon: 31.4056 },
  JNB: { name: 'O. R. Tambo', city: 'Johannesburg', country: 'South Africa', lat: -26.1392, lon: 28.246 },
  LIS: { name: 'Humberto Delgado', city: 'Lisbon', country: 'Portugal', lat: 38.7742, lon: -9.1342 },
  ATH: { name: 'Eleftherios Venizelos', city: 'Athens', country: 'Greece', lat: 37.9364, lon: 23.9445 },
  PRG: { name: 'Václav Havel', city: 'Prague', country: 'Czechia', lat: 50.1008, lon: 14.26 },
  CPH: { name: 'Kastrup', city: 'Copenhagen', country: 'Denmark', lat: 55.618, lon: 12.6508 },
  ARN: { name: 'Arlanda', city: 'Stockholm', country: 'Sweden', lat: 59.6498, lon: 17.9238 },
  DUB: { name: 'Dublin', city: 'Dublin', country: 'Ireland', lat: 53.4264, lon: -6.2499 },
  YUL: { name: 'Trudeau', city: 'Montreal', country: 'Canada', lat: 45.4706, lon: -73.7408 },
  AUS: { name: 'Austin-Bergstrom', city: 'Austin', country: 'USA', lat: 30.1975, lon: -97.6664 },
  PDX: { name: 'Portland', city: 'Portland', country: 'USA', lat: 45.5898, lon: -122.5951 },
  BNE: { name: 'Brisbane', city: 'Brisbane', country: 'Australia', lat: -27.3842, lon: 153.1175 },
  PER: { name: 'Perth', city: 'Perth', country: 'Australia', lat: -31.9385, lon: 115.9672 },
  AKL: { name: 'Auckland', city: 'Auckland', country: 'New Zealand', lat: -37.0082, lon: 174.785 },
} satisfies Record<string, Airport>);

export function getAirport(code: string): Airport {
  const airport = AIRPORTS[code.toUpperCase()];
  if (!airport) {
    throw new Error(
      `Unknown airport code "${code}". Add it to src/data/airports.ts with its city, country and coordinates.`,
    );
  }
  return airport;
}

/** Great-circle distance between two airports, in kilometres. */
export function distanceKm(from: string, to: string): number {
  const a = getAirport(from);
  const b = getAirport(to);
  const rad = Math.PI / 180;
  const dLat = (b.lat - a.lat) * rad;
  const dLon = (b.lon - a.lon) * rad;
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLon / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(h));
}
