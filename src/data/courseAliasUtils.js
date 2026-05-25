export function normalizeAliasText(text) {
  return String(text || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function expandCourseAliases(courseNames = []) {
  const expanded = new Set();

  courseNames.forEach((courseName) => {
    if (!courseName) return;

    expanded.add(normalizeAliasText(courseName));

    const beforeColon = courseName.split(':')[0]?.trim();
    if (beforeColon) {
      expanded.add(normalizeAliasText(beforeColon));
    }

    const beforeParen = courseName.split('(')[0]?.trim();
    if (beforeParen && beforeParen !== courseName) {
      expanded.add(normalizeAliasText(beforeParen));
    }
  });

  return [...expanded].filter((alias) => alias.length >= 2);
}
