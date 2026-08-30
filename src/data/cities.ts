// City landing-page data. Each city renders /run/<slug> via src/pages/run/[city].astro.
// Real running spots per city keep every page genuinely useful + unique (not a thin
// doorway page). Cities span the markets Terrarun is localised for (US/GB/CA/AU/DE/ES/FR/IT/BR/JP/KR).

export interface RunSpot { name: string; note: string }
export interface City {
  slug: string;
  name: string;
  country: string;
  intro: string;
  spots: RunSpot[];
}

export const cities: City[] = [
  {
    slug: 'new-york', name: 'New York', country: 'United States',
    intro: 'From the Central Park loop to the Hudson River path, New York is one of the most run-dense cities on earth — and one of the most fun to conquer block by block.',
    spots: [
      { name: 'Central Park Loop', note: 'The classic 6-mile loop — and a perfect first piece of territory to claim.' },
      { name: 'Hudson River Greenway', note: 'A flat, fast waterfront path running the length of Manhattan’s west side.' },
      { name: 'Prospect Park, Brooklyn', note: 'A leafy 3.35-mile loop and the heart of Brooklyn running.' },
    ],
  },
  {
    slug: 'los-angeles', name: 'Los Angeles', country: 'United States',
    intro: 'Sun, trails and beach paths — LA is built for runners, and every neighbourhood is up for grabs.',
    spots: [
      { name: 'Griffith Park', note: 'Miles of trails with skyline and Observatory views.' },
      { name: 'The Strand (Santa Monica → Venice)', note: 'A flat beachfront path made for fast, scenic loops.' },
      { name: 'Lake Hollywood Reservoir', note: 'A quiet 3.3-mile loop under the Hollywood Sign.' },
    ],
  },
  {
    slug: 'chicago', name: 'Chicago', country: 'United States',
    intro: 'The Lakefront Trail alone is 18 miles of runnable lakeshore. Chicago is a runner’s grid waiting to be claimed.',
    spots: [
      { name: 'Lakefront Trail', note: '18 miles along Lake Michigan, skyline on one side, water on the other.' },
      { name: 'The 606', note: 'An elevated rail-trail cutting across the northwest side.' },
      { name: 'Lincoln Park', note: 'Lagoons, harbour paths and the lakefront all in one.' },
    ],
  },
  {
    slug: 'san-francisco', name: 'San Francisco', country: 'United States',
    intro: 'Hills, bridges and bay views — San Francisco rewards runners who earn their territory the hard way.',
    spots: [
      { name: 'Golden Gate Park', note: 'A long, green corridor stretching to Ocean Beach.' },
      { name: 'The Embarcadero', note: 'A flat waterfront stretch past the piers to the ballpark.' },
      { name: 'Crissy Field', note: 'Run toward the Golden Gate Bridge along the bay.' },
    ],
  },
  {
    slug: 'austin', name: 'Austin', country: 'United States',
    intro: 'Austin runs on the Lady Bird Lake trail and never stops. Warm, green and fiercely competitive — perfect turf-war territory.',
    spots: [
      { name: 'Lady Bird Lake Trail', note: 'A 10-mile loop around the river through the heart of the city.' },
      { name: 'Zilker Park', note: 'Open green space and the gateway to the trail.' },
    ],
  },
  {
    slug: 'london', name: 'London', country: 'United Kingdom',
    intro: 'Royal parks, canal paths and the Thames — London gives runners endless ground to claim and defend.',
    spots: [
      { name: 'Hyde Park & Kensington Gardens', note: 'A huge central green loop, busy with runners at dawn.' },
      { name: 'Regent’s Park', note: 'The Outer Circle is a smooth, fast 4.4-km loop.' },
      { name: 'Thames Path', note: 'Run the river through the centre of the city.' },
    ],
  },
  {
    slug: 'toronto', name: 'Toronto', country: 'Canada',
    intro: 'From the waterfront to the ravines, Toronto is a city of runnable trails — and unclaimed neighbourhoods.',
    spots: [
      { name: 'Martin Goodman Trail', note: 'A flat lakeshore path running across the whole waterfront.' },
      { name: 'High Park', note: 'Toronto’s biggest park, with hills and trails to spare.' },
      { name: 'Don Valley trails', note: 'A green ravine network cutting through the city.' },
    ],
  },
  {
    slug: 'sydney', name: 'Sydney', country: 'Australia',
    intro: 'Coastal paths and harbour views make Sydney a dream to run — and a prize worth fighting for.',
    spots: [
      { name: 'Bondi to Coogee Coastal Walk', note: 'Cliffs, beaches and ocean the whole way.' },
      { name: 'Centennial Park', note: 'A wide, flat loop popular with runners and cyclists.' },
      { name: 'Sydney Harbour foreshore', note: 'Run past the Opera House and over the bridge.' },
    ],
  },
  {
    slug: 'melbourne', name: 'Melbourne', country: 'Australia',
    intro: 'Melbourne’s Tan Track is a rite of passage. The whole city is laced with riverside and bayside paths to conquer.',
    spots: [
      { name: 'The Tan Track', note: 'The famous 3.8-km loop around the Royal Botanic Gardens.' },
      { name: 'Yarra River Trail', note: 'Follow the river out of the city through parkland.' },
      { name: 'St Kilda Foreshore', note: 'A flat, fast bayside path with sunset views.' },
    ],
  },
  {
    slug: 'berlin', name: 'Berlin', country: 'Germany',
    intro: 'Flat, fast and famous for its marathon — Berlin is a runner’s city through and through, with parks made for claiming.',
    spots: [
      { name: 'Tiergarten', note: 'A vast central park crisscrossed with running paths.' },
      { name: 'Tempelhofer Feld', note: 'Run the runways of a former airport — wide open and unique.' },
      { name: 'Mauerpark & the Wall Trail', note: 'Follow the route of the former Berlin Wall.' },
    ],
  },
  {
    slug: 'madrid', name: 'Madrid', country: 'Spain',
    intro: 'From Retiro Park to the river, Madrid runs early and often. Claim the capital one barrio at a time.',
    spots: [
      { name: 'Parque del Retiro', note: 'The city’s green heart, busy with runners at sunrise.' },
      { name: 'Madrid Río', note: 'A long, flat riverside park along the Manzanares.' },
      { name: 'Casa de Campo', note: 'A huge wild park with trails just west of the centre.' },
    ],
  },
  {
    slug: 'barcelona', name: 'Barcelona', country: 'Spain',
    intro: 'Beach, parks and the hill of Montjuïc — Barcelona is a perfect map to paint your colour.',
    spots: [
      { name: 'Barceloneta Beachfront', note: 'A flat, fast seaside promenade.' },
      { name: 'Parc de la Ciutadella', note: 'The central park, ringed with running paths.' },
      { name: 'Montjuïc', note: 'Climb for Olympic history and city-wide views.' },
    ],
  },
  {
    slug: 'paris', name: 'Paris', country: 'France',
    intro: 'The Seine, the canals and two great woods bookend the city — Paris is endlessly runnable, and ready to be conquered.',
    spots: [
      { name: 'Bois de Boulogne', note: 'A huge wooded park on the west edge of the city.' },
      { name: 'Canal Saint-Martin', note: 'A flat, scenic run along the water through the 10th.' },
      { name: 'Champ de Mars & the Seine', note: 'Run under the Eiffel Tower and along the river.' },
    ],
  },
  {
    slug: 'rome', name: 'Rome', country: 'Italy',
    intro: 'Run past two thousand years of history. Rome’s parks and river paths make every loop a sightseeing tour worth owning.',
    spots: [
      { name: 'Villa Borghese', note: 'A central park of gardens and tree-lined paths.' },
      { name: 'Villa Doria Pamphilj', note: 'Rome’s largest park — wide open and quiet.' },
      { name: 'Lungotevere (Tiber path)', note: 'Run the river below street level, away from traffic.' },
    ],
  },
  {
    slug: 'milan', name: 'Milan', country: 'Italy',
    intro: 'Milan runs in its parks — Sempione, Lambro and the new CityLife district all make great turf to claim.',
    spots: [
      { name: 'Parco Sempione', note: 'A central park behind the Castello Sforzesco.' },
      { name: 'Parco Lambro', note: 'A large green space on the city’s east side.' },
      { name: 'CityLife', note: 'A modern car-free district that’s a hit with runners.' },
    ],
  },
  {
    slug: 'sao-paulo', name: 'São Paulo', country: 'Brazil',
    intro: 'Ibirapuera at dawn is São Paulo running culture in one place. The biggest city in the Americas is the biggest map to conquer.',
    spots: [
      { name: 'Parque Ibirapuera', note: 'The city’s most famous park, packed with runners.' },
      { name: 'Marginal Pinheiros cycle path', note: 'A long, flat riverside route.' },
      { name: 'Parque Villa-Lobos', note: 'Open green space on the west side.' },
    ],
  },
  {
    slug: 'tokyo', name: 'Tokyo', country: 'Japan',
    intro: 'The Imperial Palace loop is the beating heart of Tokyo running. A vast, safe, runnable city — and a huge prize.',
    spots: [
      { name: 'Imperial Palace Loop', note: 'The iconic 5-km loop, run by thousands every day.' },
      { name: 'Yoyogi Park', note: 'A green oasis next to Harajuku with running paths.' },
      { name: 'Komazawa Olympic Park', note: 'A dedicated running course from the 1964 Games.' },
    ],
  },
  {
    slug: 'seoul', name: 'Seoul', country: 'South Korea',
    intro: 'The Han River parks string the whole city together with runnable paths. Seoul is built to be claimed.',
    spots: [
      { name: 'Hangang (Han River) Parks', note: 'Flat riverside paths running the length of the city.' },
      { name: 'Namsan Park', note: 'Climb to the tower for the best views in Seoul.' },
      { name: 'Olympic Park', note: 'Wide paths and green space in the southeast.' },
    ],
  },
];
