function normalize(text) {
  return String(text || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function createDestinationAliases(destination) {
  const aliases = [
    destination.id,
    destination.name
  ];

  if (destination.type === 'room' && destination.room) {
    aliases.push(destination.room.name);
    aliases.push(`${destination.room.buildingId} ${destination.room.name}`);

    // Useful examples:
    // PER21_C130 -> per21 c130
    aliases.push(destination.id.replace(/_/g, ' '));

    // C130, room C130, classroom C130
    aliases.push(`room ${destination.room.name}`);
    aliases.push(`classroom ${destination.room.name}`);
  }

  if (destination.id === 'PER21') {
    aliases.push('perolles 21', 'pérolles 21', 'per 21', 'per21', 'building 21');
  }

  if (destination.id === 'PER22') {
    aliases.push('perolles 22', 'pérolles 22', 'per 22', 'per22', 'building 22');
  }

  if (destination.id === 'PER17') {
    aliases.push('perolles 17', 'pérolles 17', 'per 17', 'per17', 'building 17');
  }

  if (destination.id === 'MENSA') {
    aliases.push('mensa', 'cafeteria', 'canteen', 'restaurant');
  }

  return aliases
    .filter(Boolean)
    .map(normalize);
}

function findDestinationInText(text, destinations) {
  const normalizedText = normalize(text);
  const matches = [];

  destinations.forEach((destination) => {
    const aliases = createDestinationAliases(destination);

    aliases.forEach((alias) => {
      if (alias && normalizedText.includes(alias)) {
        matches.push({
          destination,
          alias,
          score: alias.length
        });
      }
    });
  });

  matches.sort((a, b) => b.score - a.score);

  return matches.length > 0 ? matches[0].destination : null;
}

function findAllDestinationsInText(text, destinations) {
  const normalizedText = normalize(text);
  const matches = [];

  destinations.forEach((destination) => {
    const aliases = createDestinationAliases(destination);

    aliases.forEach((alias) => {
      if (alias && normalizedText.includes(alias)) {
        matches.push({
          destination,
          alias,
          score: alias.length
        });
      }
    });
  });

  const unique = new Map();

  matches
    .sort((a, b) => b.score - a.score)
    .forEach((match) => {
      if (!unique.has(match.destination.id)) {
        unique.set(match.destination.id, match.destination);
      }
    });

  return Array.from(unique.values());
}

function stripCommandWords(text) {
  return normalize(text)
    .replace(/^go to /, '')
    .replace(/^take me to /, '')
    .replace(/^navigate to /, '')
    .replace(/^show me the way to /, '')
    .replace(/^route to /, '')
    .replace(/^find /, '')
    .trim();
}

export function parseNavigationCommand(commandText, destinations, defaultFromId = null) {
  const normalizedText = normalize(commandText);

  if (!normalizedText) {
    return {
      success: false,
      error: 'Please enter a navigation command.'
    };
  }

  const cleanedText = stripCommandWords(commandText);

  const fromToMatch =
    cleanedText.match(/^from (.+?) to (.+)$/) ||
    cleanedText.match(/^navigate from (.+?) to (.+)$/) ||
    cleanedText.match(/^go from (.+?) to (.+)$/) ||
    cleanedText.match(/^(.+?) to (.+)$/);

  if (fromToMatch) {
    const fromText = fromToMatch[1];
    const toText = fromToMatch[2];

    const fromDestination = findDestinationInText(fromText, destinations);
    const toDestination = findDestinationInText(toText, destinations);

    if (!fromDestination || !toDestination) {
      return {
        success: false,
        error: 'Could not understand the start or destination.'
      };
    }

    return {
      success: true,
      fromDestinationId: fromDestination.id,
      toDestinationId: toDestination.id
    };
  }

  const foundDestinations = findAllDestinationsInText(cleanedText, destinations);

  if (foundDestinations.length === 0) {
    return {
      success: false,
      error: 'Could not find a known destination in the command.'
    };
  }

  return {
    success: true,
    fromDestinationId: defaultFromId,
    toDestinationId: foundDestinations[0].id
  };
}