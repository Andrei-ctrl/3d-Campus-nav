export function normalizeNavigationText(text) {
  return String(text || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s]/g, ' ')
    .replace(/\bo\s+o\s+p\b/g, 'oop')
    .replace(/\bp\s+o\s+o\b/g, 'poo')
    .replace(/\b([a-h])\s+([12][34]0)\b/g, '$1$2')
    .replace(/\s+/g, ' ')
    .trim();
}

function escapeRegExp(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function scoreAliasMatch(normalizedText, alias, destination) {
  if (!alias || !normalizedText) {
    return 0;
  }

  let score = 0;

  if (normalizedText === alias) {
    score = 1000 + alias.length;
  } else if (normalizedText.includes(alias)) {
    score = 800 + alias.length;
  } else if (alias.includes(normalizedText) && normalizedText.length >= 3) {
    score = 700 + normalizedText.length;
  } else if (normalizedText.length >= 2) {
    const wordPattern = new RegExp(`\\b${escapeRegExp(normalizedText)}\\b`);

    if (wordPattern.test(alias)) {
      score = 650 + normalizedText.length;
    } else {
      const userTokens = normalizedText.split(' ').filter((token) => token.length >= 3);

      if (userTokens.length > 0) {
        const matchedTokens = userTokens.filter((token) =>
          alias.split(' ').some((aliasToken) =>
            aliasToken.includes(token) || token.includes(aliasToken)
          )
        );

        if (matchedTokens.length === userTokens.length) {
          score = 500 + matchedTokens.join('').length;
        }
      }
    }
  }

  if (score > 0 && destination.type === 'room') {
    score += 100;
  }

  return score;
}

function createDestinationAliases(destination) {
  const aliases = [
    destination.id,
    destination.name
  ];

  if (destination.type === 'room' && destination.room) {
    aliases.push(destination.room.name);
    aliases.push(`${destination.room.buildingId} ${destination.room.name}`);
    aliases.push(destination.id.replace(/_/g, ' '));
    aliases.push(`room ${destination.room.name}`);
    aliases.push(`classroom ${destination.room.name}`);
    aliases.push(...(destination.room.aliases || []));
  }

  if (destination.id === 'PER21') {
    aliases.push('perolles 21', 'pérolles 21', 'per 21', 'per21', 'building 21', 'per21 entrance');
  }

  if (destination.id === 'PER22') {
    aliases.push('perolles 22', 'pérolles 22', 'per 22', 'per22', 'building 22', 'per22 entrance');
  }

  if (destination.id === 'PER17') {
    aliases.push('perolles 17', 'pérolles 17', 'per 17', 'per17', 'building 17', 'per17 entrance');
  }

  if (destination.id === 'MENSA') {
    aliases.push('mensa', 'mensa perolles', 'cafeteria', 'canteen', 'restaurant');
  }

  return aliases
    .filter(Boolean)
    .map((alias) => normalizeNavigationText(alias));
}

export function findDestinationByText(text, destinations) {
  const normalizedText = normalizeNavigationText(text);
  const matches = [];

  destinations.forEach((destination) => {
    createDestinationAliases(destination).forEach((alias) => {
      const score = scoreAliasMatch(normalizedText, alias, destination);

      if (score <= 0) return;

      matches.push({
        destination,
        score
      });
    });
  });

  matches.sort((a, b) => b.score - a.score);

  return matches[0]?.destination || null;
}

function stripDestinationCommand(text) {
  return normalizeNavigationText(text)
    .replace(/^(?:please\s+)?(?:go to|take me to|navigate to|show me the way to|route to|find|bring me to|directions to)\s+/, '')
    .replace(/^go to /, '')
    .replace(/^i want to go to /, '')
    .replace(/^i wanna go to /, '')
    .replace(/^i would like to go to /, '')
    .replace(/^want to go to /, '')
    .replace(/^take me to /, '')
    .replace(/^navigate to /, '')
    .replace(/^where is /, '')
    .replace(/^show me the way to /, '')
    .replace(/^route to /, '')
    .replace(/^find /, '')
    .replace(/^my class(?: is)?\s+/, '')
    .replace(/^class(?: is)?\s+/, '')
    .trim();
}

export function resolveNavigationCommand(commandText, destinations) {
  const normalizedText = normalizeNavigationText(commandText);

  if (!normalizedText) {
    return {
      success: false,
      error: 'Please enter a navigation command.'
    };
  }

  const genericFromToMatch = /^(go|take|navigate|where|show|route|find|i want|i wanna|i would)\b/.test(normalizedText)
    ? null
    : normalizedText.match(/^(.+?) to (.+)$/);

  const fromToMatch =
    normalizedText.match(/^from (.+?) to (.+)$/) ||
    normalizedText.match(/^navigate from (.+?) to (.+)$/) ||
    normalizedText.match(/^go from (.+?) to (.+)$/) ||
    genericFromToMatch;

  if (fromToMatch) {
    const fromDestination = findDestinationByText(fromToMatch[1], destinations);
    const toDestination = findDestinationByText(fromToMatch[2], destinations);

    if (!fromDestination || !toDestination) {
      return {
        success: false,
        error: 'Could not understand the start or destination.'
      };
    }

    return {
      success: true,
      fromDestinationId: fromDestination.id,
      toDestinationId: toDestination.id,
      confidence: 0.92,
      source: 'deterministic'
    };
  }

  const destination = findDestinationByText(stripDestinationCommand(commandText), destinations);

  if (!destination) {
    return {
      success: false,
      error: 'Could not find a known destination in the command.'
    };
  }

  return {
    success: true,
    toDestinationId: destination.id,
    confidence: 0.86,
    source: 'deterministic'
  };
}

export function resolveSpokenNavigationCommand(commandText, destinations) {
  const normalizedText = normalizeNavigationText(commandText);

  if (!normalizedText) {
    return {
      success: false,
      error: 'Please say a navigation command.'
    };
  }

  const currentAndDestinationMatch =
    normalizedText.match(/^(?:i am|i m|im|i'm|start|starting)\s+(?:at|from)\s+(.+?)\s+(?:and\s+)?(?:then\s+)?(?:i\s+)?(?:want to|wanna|would like to)?\s*(?:go to|navigate to|take me to|route to|find)\s+(.+)$/) ||
    normalizedText.match(/^(?:from)\s+(.+?)\s+(?:to|go to|navigate to|take me to)\s+(.+)$/);

  if (currentAndDestinationMatch) {
    const fromDestination = findDestinationByText(currentAndDestinationMatch[1], destinations);
    const toDestination = findDestinationByText(currentAndDestinationMatch[2], destinations);

    if (!fromDestination || !toDestination) {
      return {
        success: false,
        error: 'Could not understand the current location or destination.'
      };
    }

    return {
      success: true,
      fromDestinationId: fromDestination.id,
      toDestinationId: toDestination.id,
      confidence: 0.92,
      source: 'deterministic'
    };
  }

  const locationOnlyMatch =
    normalizedText.match(/^(?:i am|i m|im|i'm|start|starting)\s+(?:at|from)\s+(.+)$/);

  if (locationOnlyMatch) {
    const fromDestination = findDestinationByText(locationOnlyMatch[1], destinations);

    if (!fromDestination) {
      return {
        success: false,
        error: 'Could not understand the current location.'
      };
    }

    return {
      success: true,
      fromDestinationId: fromDestination.id,
      toDestinationId: null,
      confidence: 0.86,
      source: 'deterministic',
      locationOnly: true
    };
  }

  return resolveNavigationCommand(commandText, destinations);
}
