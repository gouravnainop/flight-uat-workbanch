// ─────────────────────────────────────────────────────────────────────────────
// FDCircle UAT API Catalog
// Add your UAT flight booking endpoints here.
// The explorer UI is auto-generated from this catalog.
// ─────────────────────────────────────────────────────────────────────────────

// ── Core Types ────────────────────────────────────────────────────────────────

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'

export type ApiCategory =
  | 'Search'
  | 'Booking'
  | 'Reprice'
  | 'Get Bookings'

export interface PathParam {
  name: string
  type: string
  description: string
  example: string
}

export interface QueryParam {
  name: string
  type: "string" | "number" | 'boolean' | 'enum' | 'date'
  required: boolean
  description: string
  example?: string
  enums?: string[]
}

export interface ApiEndpoint {
  /** Unique stable ID — used as React key and for sessionStorage */
  id: string
  name: string
  category: ApiCategory
  method: HttpMethod
  /** Relative path — may contain :params e.g. /bookings/:pnr */
  path: string
  description: string
  /** Whether this endpoint requires API Key + Secret auth headers */
  requiresAuth: boolean
  pathParams?: PathParam[]
  queryParams?: QueryParam[]
  /** TypeScript interface for the request body (shown in TypeScript tab) */
  requestBodyType?: string
  /** TypeScript interface for the response body (shown in TypeScript tab) */
  responseBodyType?: string
  /** Example request body (pre-populated in Try it tab) */
  sampleRequest?: unknown
  /** Optional notes / integration tips */
  notes?: string[]
}

// ── Catalog ───────────────────────────────────────────────────────────────────

export const API_CATALOG: ApiEndpoint[] = [
  {
    category: 'Search',
    id: 'get-all-ports',
    description: "It returns unique source cities from ports data, scoped by the API client's organizationId",
    method: 'GET',
    path: "/city",
    name: 'Get All Ports List',
    requiresAuth: true,
    responseBodyType: `export interface FDCirclePortsResponse {
  success: boolean; // True if response is successful
  data: Ports[]; // Array of Ports
  count: number; // Number of Ports in Response
  total?: number; // Total Avaliable Ports
  skip?: number; // Skip for Pagination
  limit?: number; // Limit for Pagination
}

export interface Ports {
  sourceCode: string; // IATA airport/city code Ex: DEL
  sourceName: string; // Ex: Indira Gandhi International Airport
  sourceCountry: string; // Ex: India
  sourceCity: string; // Ex: Delhi
}`,
    notes: ['Can be used to get all the sector list for sector selection'],
    queryParams: [{
      name: 'skip',
      description: 'Number of Ports to Skip',
      required: false,
      type: 'number',
      example: '0',
    }, {
      name: 'limit',
      description: 'Limit of Ports in Response',
      required: false,
      type: 'number',
      example: '100'
    }]
  },

  {
    category: 'Search',
    description: 'It returns sectors available to the API client.',
    method: 'GET',
    path: "/sectors",
    name: 'Get All Sectors List',
    requiresAuth: true,
    id: 'get-all-sectors',
    responseBodyType: `export interface FDCircleSectorsResponse {
  success: boolean
  data: Sectors[]
  count: number
  total: number
  skip: number
  limit: number
}

export interface Sectors {
  nameOfSector: string
  sourceCode: string
  sourceName: string
  sourceCountry: string
  destinationCode: string
  destinationName: string
  destinationCountry: string
  type: string
}`,
    notes: ['Can be used to get all the sector list for sector selection'],
    queryParams: [{
      name: 'skip',
      description: 'Number of Sectors to Skip',
      required: false,
      type: 'number',
      example: '0',
    }, {
      name: 'limit',
      description: 'Limit of Sectors in Response',
      required: false,
      type: 'number',
      example: '100'
    }]
  },

  {
    category: 'Search',
    description: 'It returns the earliest available flight from onward date for the selected route.',
    path: '/onward_date',
    id: 'onward-date',
    method: 'GET',
    requiresAuth: true,
    name: 'Get Onward Date',
    queryParams: [
      {
        name: 'sourceCode',
        description: "Origin of the flight",
        type: 'string',
        required: true,
        example: 'DEL',
      },
      {
        name: 'destinationCode',
        description: "Destination of the flight",
        type: 'string',
        required: true,
        example: 'DXB'
      },
      {
        name: 'tripType',
        description: 'Type of Trip',
        required: false,
        type: 'enum',
        example: 'oneWay',
        enums: ['oneWay', 'roundTrip']
      }
    ],
    responseBodyType: `export interface FDCircleOnwardDate {
  success: boolean
  data: Data
}

export interface Data {
  sourceCode: string
  destinationCode: string
  onward_date: string
  tripType: string
}`,
    notes: ['Use This to Find Earliest Available Inventory']
  },
  {
    category: 'Search',
    description: 'It returns available flights for the selected route and onward date.',
    id: 'search',
    method: 'GET',
    name: 'Search Flight',
    path: '/search_flight',
    requiresAuth: true,
    notes: ['Use This to Find Available Inventory on the date'],
    queryParams: [
      {
        name: 'sourceCode',
        description: "Origin of the flight",
        type: 'string',
        required: true,
        example: 'DEL',
      },
      {
        name: 'destinationCode',
        description: "Destination of the flight",
        type: 'string',
        required: true,
        example: 'DXB'
      },
      {
        name: 'onward_date',
        description: 'Date of the flight',
        required: true,
        type: 'date',
        example: '2022-01-01'
      },
      {
        name: 'adult',
        description: 'Number of Adults',
        required: true,
        type: 'number',
        example: '1'
      },
      {
        name: 'children',
        description: 'Number of Children',
        required: false,
        type: 'number',
        example: '0'
      },
      {
        name: 'infant',
        description: 'Number of Infants',
        required: false,
        type: 'number',
        example: '0'
      },
      {
        name: 'tripType',
        description: 'Type of Trip',
        required: false,
        type: 'enum',
        example: 'oneWay',
        enums: ['oneWay', 'roundTrip']
      },
      {
        name: 'return_date',
        description: 'Return Date (Return Trip Only)',
        required: false,
        type: 'date',
        example: '2022-01-01'
      }
    ],
    responseBodyType: `export interface FDCircleSearchResponse {
  success: boolean
  data: Inventory[]
  count: number
  totalCount: number
}

export interface Inventory {
  invId: string
  sourceCode: string
  sourceCity: string
  sourceAirport: string
  destinationCode: string
  destinationCity: string
  destinationAirport: string
  onward_date: string
  flightNumber: string
  departureTime: string
  arrivalDate: string
  cabinBaggageWeightAdult: number
  cabinBaggageWeightChild: number
  cabinBaggageWeightInfant: number
  totalPayablePrice: number
  checkInBaggageWeightAdult: number
  checkInBaggageWeightChild: number
  tripType: string
  arrivalTime: string
  airlineCode: string
  airlineName: string
  airlineLogo: string
  availableSeats: number
  sellingFare: number
  infantCharges: number
  returnFlight: ReturnFlight
  requested: Requested
  stopData: StopDaum[]
}

export interface ReturnFlight {
  departureDate: string
  departureTime: string
  sector: string
  changedFlightNumber?: string
  arrivalDate: string
  arrivalTime: string
  flightNumber: string
  returnStopData: StopDaum[]
}

export interface Requested {
  adult: number
  children: number
  infant: number
}

export interface StopDaum {
  arrivalTime: string
  sector: string
  changedFlightNumber?: string
  arrivalDate: string
  departureTime: string
  departureDate: string
}
`
  },
  {
    category: 'Reprice',
    description: 'It returns fare and seat availability for a selected inventory.',
    id: 'reprice',
    method: 'GET',
    name: 'Reprice',
    path: '/fare_quote',
    requiresAuth: true,
    queryParams: [
      {
        name: 'invId',
        description: 'Inventory ID from Search',
        required: true,
        type: 'string',
        example: 'ZQeC9bRjP5bnkIhJKd6JID8F0PvBNX2H5mYVGptwjuND1itP-FGxfhaEiCiPleAWP3RYACS4q-5K9zYLJDbX6U6yPhq1_Xm_gfF5CE0yaWOcR0lLN3s37vR919-ZtJoy0ZPGo3C-BL5OJ8QOZtIzfQ'
      },
      {
        name: 'adultChildCount',
        description: 'Number of Adults and Children',
        required: true,
        type: 'number',
        example: '1'
      },
      {
        name: 'infantCount',
        description: 'Number of Infants',
        required: false,
        type: 'number',
        example: '0'
      },
      {
        name: 'onwardDate',
        description: 'Travel Date',
        required: true,
        type: 'date',
        example: '2022-01-01'
      }
    ],
    notes: [
      'Used To View the Latest Prices for a Particular Inventory',
      'Can be Used to Fetch the Seat Availability Before Booking'
    ],
    responseBodyType: `export interface FDCircleRepriceResponse {
  success: boolean
  data: Data
}

export interface Data {
  id: string
  adultChildAmount: number
  infantAmount: number
  totalAmount: number
  availableSeats: number
  infantCharges: number
  sellingFare: number
}
`
  },
  {
    id: 'book-flight',
    category: 'Booking',
    description: 'It creates a booking and returns booking reference and ticket details.',
    method: 'POST',
    name: 'Book Flight',
    path: '/book_flight',
    requiresAuth: true,
    sampleRequest: {
      "invId": "696e2cd5d76b8caeb822bfd9",
      "adult": 1,
      "child": 1,
      "infant": 1,
      "bookerEmail": "jhondoe@mail.com",
      "bookerName": "Jhon Doe",
      "bookerPhone": "1234567890",
      "passengers": [
        {
          "title": "Mr",
          "firstName": "John",
          "lastName": "Doe",
          "travelerType": "Adult",
          "dob": "21/01/2007",
          "passportNumber": "17826497610081268",
          "issueDate": "21/01/2007",
          "expDate": "21/02/2007",
          "nationality": "Indian"
        },
        {
          "title": "Mr",
          "firstName": "Jhon",
          "lastName": "Doe",
          "dob": "01/01/2010",
          "travelerType": "Child"
        },
        {
          "dob": "01/01/2026",
          "firstName": "Jhon",
          "lastName": "Doe",
          "title": "Mrs",
          "travelerType": "Infant",
          "guardian": "Jhon"
        }
      ]
    },
    requestBodyType: `export interface FDCircleBookingRequest {
  invId: string
  adult: number
  child: number
  infant: number
  bookerEmail: string
  bookerName: string
  bookerPhone: string
  passengers: Passenger[]
}

export enum AdultTitles {
    Mr = 'Mr',
    Ms = 'Ms',
    Mrs = 'Mrs'
}

export enum ChildTitles {
    Master = 'Master',
    Miss = 'Miss'
}

export enum TravelerType {
    Adult = 'Adult',
    Child = 'Child',
    Infant = 'Infant'
}

export interface Passenger {
  title: AdultTitles | ChildTitles
  firstName: string
  lastName: string
  travelerType: TravelerType
  dob: string
  passportNumber?: string
  issueDate?: string
  expDate?: string
  nationality?: string
  guardian?: string
}`,
    responseBodyType: `export interface FDCircleBookingResponse {
  success: boolean
  data: Data  
}

export interface Data {
  referenceId: string
}
`,
    notes: [
      'Used To Create Bookings'
    ]
  },
  {
    category: 'Get Bookings',
    description: 'This will return the booking details for the reference id.',
    id: 'get-booking',
    method: 'GET',
    name: 'Get Booking Details',
    path: '/booking_details',
    requiresAuth: true,
    notes: [
      'Can be used to see the status of the tickets',
      'Shows the generated PNR here'
    ],
    queryParams: [
      {
        name: 'referenceId',
        description: 'reference ID from Booking',
        required: true,
        type: 'string',
        example: 'TFG29'
      }
    ],
    responseBodyType: `export interface FDCircleBookingDetail {
  success: boolean
  data: Data
}

export interface Data {
  referenceId: string
  saleData: SaleData
}

export interface SaleData {
  onwardDate: string
  adult: number
  child: number
  infant: number
  bookerName: string
  bookerEmail: string
  bookerPhone: string
  totalPassengers: number
  totalBooking: number
  totalBookingPrice: number
  totalAmt: number
  lastUpdatedAt: string
  bookingDate: string
  bookingTime: string
  onwardFlight: OnwardFlight
  returnFlight?: ReturnFlight
  stopData?: StopDaum[]
  baggage: Baggage
  passengers: Passenger[]
}

export interface OnwardFlight {
  onwardDate: string
  departureTime: string
  arrivalDate: string
  arrivalTime: string
  flightNumber: string
  airportCode: string
  pnr: string
  flightType: string
  sourceCode: string
  sourceName: string
  sourceCountry: string
  destinationCode: string
  destinationName: string
  destinationCountry: string
}

export interface ReturnFlight {
  departureDate: string
  departureTime: string
  sector: string
  arrivalDate: string
  arrivalTime: string
  flightNumber: string
  returnStopData?: ReturnStopDaum[]
}

export interface ReturnStopDaum {
  arrivalTime: string
  sector: string
  portId: string
  arrivalDate: string
  departureTime: string
  departureDate: string
}

export interface StopDaum {
  arrivalTime: string
  sector: string
  arrivalDate: string
  departureTime: string
  departureDate: string
  stopCode: string
}

export interface Baggage {
  cabinBaggageWeightAdult: number
  cabinBaggageWeightChild: number
  cabinBaggageWeightInfant: number
  checkInBaggageWeightAdult: number
  checkInBaggageWeightChild: number
}

export interface Passenger {
  travelerType: string
  title: string
  firstName: string
  lastName: string
  dob: string
  nationality: string
  passportNumber: string
  wheelChair: string
  issueDate: string
  expDate: string
  totalAmt: number
  status: string
  guardian?: string
}`
  },
  {
    category: 'Search',
    description: 'It returns all the available date for the sector',
    id: 'get-all-dates',
    method: 'GET',
    name: 'Get All Dates',
    path: '/getAllDates',
    requiresAuth: true,
    notes: [
      'Can be Used to Create Flight Calenders',
      'This Api Includes the Minimun & Maximum Prices Also'
    ],
    queryParams: [
      {
        description: 'IATA airport/city code Ex: DEL',
        name: 'sourceCode',
        required: true,
        type: 'string',
        example: 'DEL'
      },
      {
        description: 'IATA airport/city code Ex: BOM',
        name: 'destinationCode',
        required: true,
        type: 'string',
        example: 'BOM'
      },
      {
        description: 'Type of Trip',
        name: 'tripType',
        required: false,
        type: 'enum',
        enums: [
          'oneWay',
          'roundTrip'
        ],
        example: 'oneWay'
      }
    ],
    responseBodyType: `export interface FDCircleAllDates {
  success: boolean
  data: Data
}

export interface Data {
  sourceCode: string
  destinationCode: string
  availableDates: AvailableDate[]
}

export interface AvailableDate {
  travelDate: string
  totalAvailableQuantity: number
  minSellingFare: number
  maxSellingFare: number
  minInfantCharges: number
  maxInfantCharges: number
}
`
  },
  {
    category: 'Search',
    description: 'It returns the available sectors for booking which have live inventories',
    id: 'get-available-sectors',
    method: 'GET',
    name: 'Get Available Sectors',
    path: '/available_flights',
    requiresAuth: true,
    notes: [
      'Can Be Used To Find All Bookable Sectors',
      'One Return Sectors Which have available inventories'
    ],
    responseBodyType: `export interface FDCircleAvailableSectors {
  success: boolean
  data: AvailableSector[]
}

export interface AvailableSector {
  sectorName: string
  sourceCode: string
  destinationCode: string
}
`
  }
]

// ── Helpers ───────────────────────────────────────────────────────────────────

export function getEndpointById(id: string): ApiEndpoint | undefined {
  return API_CATALOG.find((ep) => ep.id === id)
}

export function getEndpointsByCategory(
  category: ApiCategory,
): ApiEndpoint[] {
  return API_CATALOG.filter((ep) => ep.category === category)
}

export const API_CATEGORIES: ApiCategory[] = [
  "Search",
  "Booking",
  "Reprice",
  "Get Bookings"
]

/** Resolve a path with path params substituted, e.g. /bookings/:pnr → /bookings/ABCD12 */
export function resolvePath(
  path: string,
  values: Record<string, string>,
): string {
  return path.replace(/:([a-zA-Z]+)/g, (_, key: string) => values[key] ?? `:${key}`)
}
