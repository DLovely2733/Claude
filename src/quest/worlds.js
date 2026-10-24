// The five Canada Quest worlds. Content areas come from Alberta Education;
// outcome ids refer to the June 2026 draft (curriculum/draft-2026-06-ss7-9.json).
// `status` is honest: only worlds with built, playable missions say so.

export const WORLD_STATUS = {
  playable: { label: 'Open', tone: 'ok' },
  'not-built': { label: 'Being built', tone: 'warn' },
};

export const WORLDS = [
  {
    id: 'cities',
    name: 'Canada’s Changing Cities',
    area: 'urbanization',
    icon: '🏙️',
    color: '#d98c2b',
    outcomeIds: ['G9-LO1', 'G9-LO5'],
    status: 'not-built',
    summary: 'Postwar immigration, population movement, urbanization and changing industries.',
    planned: [
      'Your town is growing! Where should new houses, roads and services go?',
      'Push and pull: why people moved to Canada after the Second World War',
      'From farms to suburbs: watch a community change over time',
      'New industries: oil and gas, hydroelectricity, automobiles and paper',
    ],
  },
  {
    id: 'world',
    name: 'Canada and the World',
    area: 'collective-security',
    icon: '🕊️',
    color: '#3a7bd5',
    outcomeIds: ['G9-LO3', 'G9-LO4'],
    status: 'not-built',
    summary: 'Canada’s independent role in the Second World War and international cooperation after the war.',
    planned: [
      'Museum: Canada declares war independently (1939)',
      'Contributions: Hong Kong, Dieppe, Italy, D-Day and the liberation of Europe, presented respectfully',
      'Chinese Canadians in Force 136 and the Cree code talkers',
      'After the war: NATO, the Korean War, NORAD and peacekeeping',
      'Countries need to work together. What can they do to help keep peace?',
    ],
  },
  {
    id: 'decisions',
    name: 'Decisions That Changed Canada',
    area: 'government-policies',
    icon: '📜',
    color: '#8a5cc2',
    outcomeIds: ['G9-LO2', 'G9-LO4', 'G9-LO5'],
    status: 'not-built',
    summary: 'Independence and the Constitution, residential schools and the Sixties Scoop, social programs and trade agreements.',
    planned: [
      'From colony to nation: the Balfour Declaration and the Statute of Westminster',
      'Residential schools and the Sixties Scoop: a respectful, guided exhibit built with Indigenous-led sources (no game mechanics or rewards)',
      'The welfare state: healthcare and pensions',
      'Trade with the United States and NAFTA',
      'The Constitution Act (1982) and the Charter',
    ],
    sensitive: 'Residential schools content must use credible, Indigenous-led sources (for example the National Centre for Truth and Reconciliation) and licensed testimony, reviewed by the teacher before release.',
  },
  {
    id: 'government',
    name: 'Inside Canadian Government',
    area: 'political-system',
    icon: '🏛️',
    color: '#1b6a4e',
    outcomeIds: ['G9-LO6'],
    status: 'playable',
    summary: 'How power is distributed and exercised in Canada’s government, how laws are made and how rights are protected.',
    planned: [
      'The courts and the Supreme Court of Canada',
      'The Charter of Rights and Freedoms and government actions',
      'Orders in Council, regulations and ministerial decisions',
      'Natural resources: federal–provincial conflict',
    ],
  },
  {
    id: 'living',
    name: 'Living in Canada',
    area: 'citizenship',
    icon: '🤝',
    color: '#c0392b',
    outcomeIds: ['G9-LO7', 'G9-LO2', 'G9-LO4'],
    status: 'not-built',
    summary: 'Expanding citizenship and rights, immigration, multiculturalism, and rights and responsibilities.',
    planned: [
      'Your community wants to make a change. How can citizens participate?',
      'The Canadian Citizenship Act (1947) and the Canadian Bill of Rights (1960)',
      'Women’s suffrage and the Famous Five',
      'Immigration, multiculturalism and the Charter',
    ],
  },
];

export const worldById = (id) => WORLDS.find((w) => w.id === id) || null;
