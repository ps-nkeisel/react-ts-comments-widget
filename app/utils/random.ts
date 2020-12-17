/**
 * Generate a random email string for anonymous commenting
 */
export function generateRandomEmail() {
  let result = '';
  const chars = '0123456789abcdefghijklmnopqrstuvwxyz';
  for (let i = 8; i > 0; --i) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return `${result}@anonymous.vuukle.com`;
}

/** Capitalize first letter */
function capFirst(string: string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

/** Get random number in between ranges */
function getRandomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min)) + min;
}

/** Generate random name and last name for anonymous commenting */
export function generateRandomName() {
  const name1 = [
    'capable',
    'exciting',
    'adorable',
    'adventurous',
    'black',
    'recognized',
    'accomplished',
    'white',
    'determined',
    'active',
    'actual',
    'adept',
    'red',
    'silent',
    'caring',
    'yellow',
    'simple',
    'simplistic',
    'single',
    'unknown',
    'daring',
  ];
  const name2 = [
    'people',
    'mountain',
    'story',
    'art',
    'world',
    'hill',
    'turtle',
    'family',
    'bear',
    'state',
    'hall',
    'system',
    'computer',
    'person',
    'follower',
    'smile',
    'stretch',
    'survivor',
    'land',
    'warrior',
    'holiday',
  ];

  const name = capFirst(name1[getRandomInt(0, name1.length)]) + ' ' + capFirst(name2[getRandomInt(0, name2.length)]);
  return name;
}
