
export const BOY_NAMES = ['Liam', 'Noah', 'Oliver', 'Elijah', 'James', 'Lucas', 'Benjamin', 'Mason', 'Ethan', 'Jackson', 'Aiden', 'Leo', 'Max', 'Sam', 'Kai', 'Caleb', 'Ryan', 'Daniel', 'Jack', 'Henry'];
export const GIRL_NAMES = ['Olivia', 'Emma', 'Ava', 'Charlotte', 'Sophia', 'Mia', 'Amelia', 'Harper', 'Isabella', 'Sofia', 'Chloe', 'Zoe', 'Maya', 'Ruby', 'Eva', 'Lily', 'Grace', 'Aria', 'Ellie', 'Nora'];

export const NAMES = [...BOY_NAMES, ...GIRL_NAMES];

export const ADJECTIVES = ['red', 'blue', 'shiny', 'small', 'large', 'green', 'heavy', 'golden', 'tasty', 'round', 'striped', 'spotted', 'purple', 'wooden', 'plastic', 'silver', 'bright', 'fuzzy', 'smooth', 'rough', 'tiny', 'huge', 'colorful', 'dark', 'fancy'];
export const ITEMS = [
    { single: 'apple', plural: 'apples', container: 'basket' },
    { single: 'marble', plural: 'marbles', container: 'jar' },
    { single: 'sticker', plural: 'stickers', container: 'page' },
    { single: 'cookie', plural: 'cookies', container: 'box' },
    { single: 'pencil', plural: 'pencils', container: 'pack' },
    { single: 'toy car', plural: 'toy cars', container: 'case' },
    { single: 'flower', plural: 'flowers', container: 'bouquet' },
    { single: 'coin', plural: 'coins', container: 'stack' },
    { single: 'book', plural: 'books', container: 'shelf' },
    { single: 'crayon', plural: 'crayons', container: 'box' },
    { single: 'bead', plural: 'beads', container: 'necklace' },
    { single: 'card', plural: 'cards', container: 'deck' },
    { single: 'cupcake', plural: 'cupcakes', container: 'tray' },
    { single: 'balloon', plural: 'balloons', container: 'bunch' },
    { single: 'marker', plural: 'markers', container: 'set' },
    { single: 'lego brick', plural: 'lego bricks', container: 'pile' },
    { single: 'donut', plural: 'donuts', container: 'box' },
    { single: 'painting', plural: 'paintings', container: 'wall' },
    { single: 'photo', plural: 'photos', container: 'album' },
    { single: 'seashell', plural: 'seashells', container: 'bucket' },
    { single: 'button', plural: 'buttons', container: 'jar' },
    { single: 'stamp', plural: 'stamps', container: 'collection' }
];

export const getRandomInt = (min: number, max: number): number => Math.floor(Math.random() * (max - min + 1)) + min;
export const getRandomElement = <T>(arr: T[]): T => arr[getRandomInt(0, arr.length - 1)];
export const shuffleArray = <T>(array: T[]): T[] => {
  const newArr = [...array];
  for (let i = newArr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
  }
  return newArr;
};

// Helper to remove duplicates from option lists before shuffling
export const createUniqueOptions = (options: string[]): string[] => {
    return shuffleArray(Array.from(new Set(options)));
};

export const getRandomContext = (customNames?: string[]) => {
    // If custom names provided, use them with high probability
    let name = "";
    if (customNames && customNames.length > 0) {
        name = getRandomElement(customNames);
    } else {
        name = getRandomElement(NAMES);
    }
    
    const item = getRandomElement(ITEMS);
    const adj = getRandomElement(ADJECTIVES);
    return { name, item, adj };
};

export interface Character {
    name: string;
    subjective: string; // he/she
    objective: string;  // him/her
    possessive: string; // his/her
    Subjective: string; // He/She
    Possessive: string; // His/Her
}

export const getCharacter = (customNames?: string[]): Character => {
    let name = "";
    let isGirl = Math.random() > 0.5;

    if (customNames && customNames.length > 0) {
        name = getRandomElement(customNames);
        // Try to guess gender from common list? No, default to random gender or specific logic.
        // For simplicity, just assign random pronouns if unknown, or maybe we just default to neutral? 
        // Or we keep random gender assignment which is standard for mixed lists.
    } else {
        name = getRandomElement(isGirl ? GIRL_NAMES : BOY_NAMES);
    }

    return {
        name,
        subjective: isGirl ? 'she' : 'he',
        objective: isGirl ? 'her' : 'him',
        possessive: isGirl ? 'her' : 'his',
        Subjective: isGirl ? 'She' : 'He',
        Possessive: isGirl ? 'Her' : 'His'
    };
};

export const generateOptions = (correct: string, type: 'number' | 'time' | 'text'): string[] => {
    const opts = new Set([correct]);
    let attempts = 0;
    while(opts.size < 4 && attempts < 20) {
        attempts++;
        if (type === 'number') {
            const num = parseFloat(correct.replace(/[^0-9.-]/g, ''));
            const variation = num + getRandomInt(-5, 5);
            if (variation !== num && variation >= 0) opts.add(`${variation}`);
        } else if (type === 'time') {
            const [h, m] = correct.split(':').map(Number);
            const newM = (m + getRandomInt(1, 3) * 15) % 60;
            opts.add(`${h}:${newM.toString().padStart(2, '0')}`);
        } else {
            opts.add(`Answer Choice ${opts.size + 1}`);
        }
    }
    return shuffleArray(Array.from(opts));
};

// Selects a question type index based on active subcategories
export const selectQuestionType = (
  allTypes: number[],
  selectedSubs: string[] | undefined,
  mapping: Record<string, number[]>
): number => {
  // If no specific subcategories selected, return random from all valid types
  if (!selectedSubs || selectedSubs.length === 0) return getRandomElement(allTypes);
  
  const allowedTypes = new Set<number>();
  selectedSubs.forEach(sub => {
    if (mapping[sub]) mapping[sub].forEach(t => allowedTypes.add(t));
  });
  
  // Fallback: If map logic fails (empty), return random from all
  if (allowedTypes.size === 0) return getRandomElement(allTypes);
  
  return getRandomElement(Array.from(allowedTypes));
};
