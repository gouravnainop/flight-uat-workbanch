// ─────────────────────────────────────────────────────────────────────────────
// normalization-template.ts — NormalizedFlight field registry + code generator
// ─────────────────────────────────────────────────────────────────────────────

export interface NormalizedFieldDef {
  key: string
  type: 'string' | 'number' | 'boolean' | 'object'
  desc: string
  example?: string
}

export const NORMALIZED_FLIGHT_FIELDS: NormalizedFieldDef[] = [
  { key: 'flightNumber',              type: 'string',  desc: 'Airline flight number e.g. "6E 123"',      example: '"6E 123"' },
  { key: 'airlineCode',               type: 'string',  desc: 'IATA airline code e.g. "6E"',              example: '"6E"' },
  { key: 'airlineName',               type: 'string',  desc: 'Full airline name',                        example: '"IndiGo"' },
  { key: 'sourceCode',                type: 'string',  desc: 'Origin IATA code',                         example: '"DEL"' },
  { key: 'destinationCode',           type: 'string',  desc: 'Destination IATA code',                    example: '"BOM"' },
  { key: 'sourceCity',                type: 'string',  desc: 'Origin city name',                         example: '"Delhi"' },
  { key: 'destinationCity',           type: 'string',  desc: 'Destination city name',                    example: '"Mumbai"' },
  { key: 'originTerminal',            type: 'string',  desc: 'Departure terminal',                       example: '"T3"' },
  { key: 'destinationTerminal',       type: 'string',  desc: 'Arrival terminal',                         example: '"T1"' },
  { key: 'departureTime',             type: 'string',  desc: 'HH:mm (24h) departure time',              example: '"06:30"' },
  { key: 'arrivalTime',               type: 'string',  desc: 'HH:mm (24h) arrival time',                example: '"09:00"' },
  { key: 'onwardDate',                type: 'string',  desc: 'YYYY-MM-DD departure date',                example: '"2025-08-15"' },
  { key: 'arrivalDate',               type: 'string',  desc: 'YYYY-MM-DD arrival date',                  example: '"2025-08-15"' },
  { key: 'sellingFare',               type: 'number',  desc: 'Per-adult base selling fare',              example: '3500' },
  { key: 'totalAmount',               type: 'number',  desc: 'Total fare for all pax',                   example: '7000' },
  { key: 'totalPayablePrice',         type: 'number',  desc: 'Final payable price (with margin)',         example: '7200' },
  { key: 'basicAmount',               type: 'number',  desc: 'Base fare before taxes',                   example: '2800' },
  { key: 'airportTaxAmount',          type: 'number',  desc: 'Per-adult airport tax',                    example: '700' },
  { key: 'infantCharges',             type: 'number',  desc: 'Per-infant total charge',                  example: '500' },
  { key: 'availableSeats',            type: 'number',  desc: 'Seats available',                          example: '9' },
  { key: 'cabinBaggageWeightAdult',   type: 'string',  desc: 'Cabin baggage e.g. "7KG"',                 example: '"7KG"' },
  { key: 'checkInBaggageWeightAdult', type: 'string',  desc: 'Check-in baggage e.g. "20KG"',             example: '"20KG"' },
  { key: 'productClass',              type: 'string',  desc: 'Fare product class / cabin',               example: '"Economy"' },
  { key: 'fareId',                    type: 'string',  desc: 'Provider fare/offer type',                 example: '"one_way"' },
  { key: 'searchKey',                 type: 'string',  desc: 'Provider offer/search ID',                 example: '"off_abc123"' },
  { key: 'flightKey',                 type: 'string',  desc: 'Provider quote/offer token',               example: '"tok_xyz789"' },
  { key: 'providerId',                type: 'string',  desc: 'OrganizationAllowedOutsourceApi._id',      example: '"6654..."' },
  { key: 'totalMarginAmount',         type: 'number',  desc: 'Total margin added to fare',               example: '200' },
  { key: 'perPaxMargin',              type: 'number',  desc: 'Per-pax margin amount',                    example: '100' },
  { key: 'stopDetails',               type: 'object',  desc: '{ noOfStops, stopData[] }',                example: '' },
  { key: 'returnFlight',              type: 'object',  desc: 'Return leg data (roundtrip only)',          example: '' },
  { key: 'fareBreakup',               type: 'object',  desc: 'Per-pax fare breakdown',                   example: '' },
]

export function generateNormalizationSnippet(
  mappings: Array<{ fdField: string; jsonPath: string; transform?: string }>,
): string {
  const filled = mappings.filter((m) => m.jsonPath.trim())
  if (filled.length === 0) return '// No mappings defined yet'

  const lines = filled.map(({ fdField, jsonPath, transform }) => {
    const getter = `evalPath(raw, '${jsonPath}')`
    const value = transform ? `${transform.replace('value', getter)}` : getter
    return `  ${fdField}: ${value},`
  })

  return [
    'function buildNormalizedFlight(raw: unknown): Partial<NormalizedFlight> {',
    '  return {',
    ...lines,
    '  }',
    '}',
  ].join('\n')
}
