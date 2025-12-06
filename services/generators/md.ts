import { Question } from "../../types";
import { getRandomInt, getRandomElement, getRandomContext, generateOptions, createUniqueOptions, getCharacter, selectQuestionType, shuffleArray } from "../utils";

// 12. 3.MD.C.7 - Area
export const genMDC7 = (id: number, customNames?: string[], subcategories?: string[]): Question => {
  // Mapping:
  // 'Length x Width Rectangles': [0, 4]
  // 'Tiling': [3]
  // 'Sum of 2 Rectangles': [2]
  // 'L-Shaped': [2] (Type 2 handles both L-shape and split rects)
  // 'Missing Side': [5]
  
  const map: Record<string, number[]> = {
      'Length x Width Rectangles': [0, 4],
      'Tiling': [3],
      'Sum of 2 Rectangles': [2, 7],
      'L-Shaped': [2],
      'Missing Side': [5]
  };
  
  const type = selectQuestionType([0, 2, 3, 4, 5, 6, 7], subcategories, map);
  
  if (type === 0) {
      const w = getRandomInt(3, 9), h = getRandomInt(2, 8);
      return {
        id, standardRef: '3.MD.C.7', type: 'multiple-choice',
        text: `What is the area of this rectangle?`,
        visualInfo: { type: 'area-model', widthLabel: `${w} ft`, heightLabel: `${h} ft` },
        correctAnswer: `${w*h} sq ft`,
        options: createUniqueOptions(generateOptions(`${w*h}`, 'number').map(n => `${n} sq ft`))
      };
  } else if (type === 2) { // Composite / Conjoined Rectangles
      const w1 = getRandomInt(2, 4);
      const h1 = getRandomInt(4, 7);
      const w2 = getRandomInt(3, 6);
      const h2 = getRandomInt(2, h1 - 1); 
      const area = (w1 * h1) + (w2 * h2);
      
      const isEquation = Math.random() > 0.5;

      if (isEquation) {
          return {
              id, standardRef: '3.MD.C.7', type: 'multiple-choice',
              text: `Which equation shows how to find the total area of this figure?`,
              visualInfo: { type: 'composite-area', rect1: {w:w1,h:h1}, rect2: {w:w2,h:h2}, arrangement: 'L-shape' },
              correctAnswer: `(${w1} × ${h1}) + (${w2} × ${h2})`,
              options: createUniqueOptions([
                  `(${w1} × ${h1}) + (${w2} × ${h2})`,
                  `(${w1} + ${h1}) + (${w2} + ${h2})`,
                  `(${w1} × ${w2}) + (${h1} × ${h2})`,
                  `${w1} + ${w2} + ${h1} + ${h2}`
              ])
          };
      } else {
          return {
              id, standardRef: '3.MD.C.7', type: 'multiple-choice',
              text: `Find the total area of this L-shaped figure.`,
              visualInfo: { type: 'composite-area', rect1: {w:w1,h:h1}, rect2: {w:w2,h:h2}, arrangement: 'L-shape' },
              correctAnswer: `${area} sq units`,
              options: createUniqueOptions(generateOptions(`${area}`, 'number').map(n => `${n} sq units`))
          };
      }
  } else if (type === 3) { // Type 3: Tiling (Grid)
      const rows = getRandomInt(3, 6);
      const cols = getRandomInt(3, 8);
      const area = rows * cols;

      const isEquation = Math.random() > 0.5;

      if (isEquation) {
          return {
             id, standardRef: '3.MD.C.7', type: 'multiple-choice',
             text: `Which equation matches the tiled rectangle?`,
             visualInfo: { type: 'tiled-area', rows, cols },
             correctAnswer: `${rows} × ${cols} = ${area}`,
             options: createUniqueOptions([
                 `${rows} × ${cols} = ${area}`,
                 `${rows} + ${cols} = ${rows+cols}`,
                 `${rows} × 2 = ${rows*2}`,
                 `${area} ÷ ${rows} = ${cols}`
             ])
          }
      } else {
           return {
             id, standardRef: '3.MD.C.7', type: 'open-ended',
             text: `Find the area of the rectangle.`,
             visualInfo: { type: 'tiled-area', rows, cols },
             correctAnswer: `${area} sq units`
           }
      }
  } else if (type === 4) { // B2: Word Problem
      const ctx = getRandomElement([
          { item: 'rug', u: 'ft' }, { item: 'garden', u: 'm' }, { item: 'book cover', u: 'in' }, { item: 'screen', u: 'cm' }
      ]);
      const w = getRandomInt(3, 9);
      const h = getRandomInt(3, 9);
      const area = w * h;
      
      return {
          id, standardRef: '3.MD.C.7', type: 'open-ended', 
          text: `A ${ctx.item} is ${w} ${ctx.u} long and ${h} ${ctx.u} wide. What is its area?`,
          correctAnswer: `${area} sq ${ctx.u}`
      };
  } else if (type === 5) { // E1: Unknown Side
      const w = getRandomInt(3, 9);
      const h = getRandomInt(3, 9);
      const area = w * h;
      
      return {
          id, standardRef: '3.MD.C.7', type: 'open-ended',
          text: `The area of a rectangle is ${area} square units. The width is ${w} units. What is the height?`,
          visualInfo: { type: 'area-model', widthLabel: `${w}`, heightLabel: `?` },
          correctAnswer: `${h} units`
      };
  } else if (type === 6) { // H2: Error Analysis
      const w = getRandomInt(4, 8);
      const h = getRandomInt(4, 8);
      const wrong = w + h;
      
      return {
          id, standardRef: '3.MD.C.7', type: 'multiple-choice',
          text: `A student said the area of a ${w} by ${h} rectangle is ${wrong}. What mistake did they make?`,
          correctAnswer: `They added the sides instead of multiplying.`,
          options: createUniqueOptions([
              `They added the sides instead of multiplying.`,
              `They subtracted the sides.`,
              `They found the perimeter.`,
              `They calculated correctly.`
          ])
      };
  } else { // C2: Distributive Missing Part
      const h = getRandomInt(3, 6);
      const w1 = getRandomInt(2, 5);
      const w2 = getRandomInt(2, 5);
      const a1 = h * w1;
      const a2 = h * w2;
      
      return {
          id, standardRef: '3.MD.C.7', type: 'open-ended',
          text: `This rectangle is split into two parts. The first part is ${h} × ${w1} = ${a1}. What is the area of the second part (${h} × ${w2})?`,
          visualInfo: { type: 'composite-area', rect1: {w:w1,h:h}, rect2: {w:w2,h:h}, arrangement: 'distributive' },
          correctAnswer: `${a2}`
      };
  }
};

// 14. 3.MD.A.1a - Time
export const genMDA1a = (id: number, customNames?: string[], subcategories?: string[]): Question => {
    // 'Telling Time': [0, 3],
    // 'Word Problems': [1, 2, 4, 5, 6]
    
    const map: Record<string, number[]> = {
        'Telling Time': [0, 3],
        'Word Problems': [1, 2, 4, 5, 6]
    };
    
    const type = selectQuestionType([0, 1, 2, 3, 4, 5, 6, 7, 8], subcategories, map);
    
    const h = getRandomInt(1, 12);
    const m = getRandomElement([0, 15, 30, 45, 10, 20, 5, 25, 35, 40, 50, 55]);
    const timeStr = `${h}:${m.toString().padStart(2,'0')}`;
    const char = getCharacter(customNames); 

    if (type === 0) {
        return {
            id, standardRef: '3.MD.A.1a', type: 'multiple-choice',
            text: `What time is shown on the clock?`,
            visualInfo: { type: 'clock', time: timeStr },
            correctAnswer: timeStr,
            options: generateOptions(timeStr, 'time')
        };
    } else if (type === 1) { // Forward with Clock
        const elapsed = getRandomElement([15, 30, 45, 60, 20, 40]);
        let endM = m + elapsed, endH = h;
        while(endM >= 60) { endM -= 60; endH++; }
        if(endH > 12) endH -= 12;
        const endStr = `${endH}:${endM.toString().padStart(2,'0')}`;
        
        return {
            id, standardRef: '3.MD.A.1a', type: 'multiple-choice',
            text: `The clock shows when ${char.name} started eating lunch. Lunch lasted ${elapsed} minutes. When did ${char.subjective} finish?`,
            visualInfo: { type: 'clock', time: timeStr },
            correctAnswer: endStr,
            options: generateOptions(endStr, 'time')
        };
    } else if (type === 2) { // Word Problem Only
        return {
            id, standardRef: '3.MD.A.1a', type: 'open-ended',
            text: `A train arrives at ${timeStr}. It is delayed 30 minutes. What is the new arrival time?`,
            correctAnswer: (() => {
               let eM = m + 30, eH = h;
               if(eM >= 60) { eM-=60; eH++; }
               if(eH > 12) eH -= 12;
               return `${eH}:${eM.toString().padStart(2,'0')}`;
            })()
        };
    } else if (type === 3) { // Time Vocabulary
        const vocabM = getRandomElement([15, 30, 45]);
        const vocabH = getRandomInt(1, 11);
        const vocabTime = `${vocabH}:${vocabM}`;
        
        let correctPhrase = "";
        let distractors = [];
        
        if (vocabM === 15) {
            correctPhrase = `Quarter past ${vocabH}`;
            distractors = [`Quarter to ${vocabH}`, `Half past ${vocabH}`, `Quarter past ${vocabH+1}`];
        } else if (vocabM === 30) {
            correctPhrase = `Half past ${vocabH}`;
            distractors = [`Quarter past ${vocabH}`, `Quarter to ${vocabH}`, `Half past ${vocabH+1}`];
        } else { // 45
            correctPhrase = `Quarter to ${vocabH + 1}`;
            distractors = [`Quarter past ${vocabH}`, `Quarter to ${vocabH}`, `Half past ${vocabH}`];
        }

        const showClock = Math.random() > 0.5;
        if (showClock) {
            return {
                id, standardRef: '3.MD.A.1a', type: 'multiple-choice',
                text: `What is another way to say the time shown?`,
                visualInfo: { type: 'clock', time: vocabTime },
                correctAnswer: correctPhrase,
                options: createUniqueOptions([correctPhrase, ...distractors])
            };
        } else {
             return {
                id, standardRef: '3.MD.A.1a', type: 'multiple-choice',
                text: `Which time is the same as "${correctPhrase}"?`,
                correctAnswer: vocabTime,
                options: generateOptions(vocabTime, 'time')
            };
        }
    } else if (type === 4) { // Time Before (Visual)
        const duration = getRandomElement([15, 30, 45, 60]);
        let startM = m - duration;
        let startH = h;
        while (startM < 0) { startM += 60; startH--; }
        if (startH < 1) startH += 12;
        const startStr = `${startH}:${startM.toString().padStart(2,'0')}`;
        const activity = getRandomElement(['reading', 'homework', 'soccer practice', 'painting']);

        return {
            id, standardRef: '3.MD.A.1a', type: 'multiple-choice',
            text: `The clock shows when ${char.name} finished ${activity}. ${char.Subjective} started ${duration} minutes before this time. What time did ${char.name} start?`,
            visualInfo: { type: 'clock', time: timeStr },
            correctAnswer: startStr,
            options: generateOptions(startStr, 'time')
        };
    } else if (type === 5) { // Find Duration
        const duration = getRandomInt(20, 55);
        let endM = m + duration, endH = h;
        while(endM >= 60) { endM -= 60; endH++; }
        if(endH > 12) endH -= 12;
        const endStr = `${endH}:${endM.toString().padStart(2,'0')}`;
        
        return {
            id, standardRef: '3.MD.A.1a', type: 'open-ended',
            text: `A movie started at ${timeStr} and ended at ${endStr}. How long was the movie?`,
            correctAnswer: `${duration} minutes`
        };
    } else if (type === 6) { // Multi-step
        const dur1 = 20;
        const dur2 = 15;
        let endM = m + dur1 + dur2, endH = h;
        while(endM >= 60) { endM -= 60; endH++; }
        if(endH > 12) endH -= 12;
        const endStr = `${endH}:${endM.toString().padStart(2,'0')}`;

        return {
            id, standardRef: '3.MD.A.1a', type: 'multiple-choice',
            text: `${char.name} practiced piano for ${dur1} minutes, then took a ${dur2} minute break. If ${char.subjective} started at ${timeStr}, what time was it after the break?`,
            correctAnswer: endStr,
            options: generateOptions(endStr, 'time')
        };
    } else if (type === 7) { // Error Analysis
        const wrongM = m + 45; // e.g., 2:30 + 45 -> 2:75 instead of 3:15
        const wrongTime = `${h}:${wrongM}`;
        
        return {
            id, standardRef: '3.MD.A.1a', type: 'multiple-choice',
            text: `A student added 45 minutes to ${timeStr} and got ${wrongTime}. What is wrong with this answer?`,
            correctAnswer: `Minutes cannot be more than 59. They needed to regroup to the next hour.`,
            options: createUniqueOptions([
                `Minutes cannot be more than 59. They needed to regroup to the next hour.`,
                `They subtracted instead of added.`,
                `They should have changed the hour to ${h-1}.`,
                `The answer is correct.`
            ])
        };
    } else { // Number Line Strategy
        return {
            id, standardRef: '3.MD.A.1a', type: 'multiple-choice',
            text: `Which tool would best help you find how much time passed between ${timeStr} and 5:00?`,
            correctAnswer: `A number line showing time jumps.`,
            options: createUniqueOptions([
                `A number line showing time jumps.`,
                `A ruler.`,
                `A multiplication table.`,
                `A scale.`
            ])
        };
    }
};

// 15. 3.MD.A.1b - Money
export const genMDA1b = (id: number, customNames?: string[], subcategories?: string[]): Question => {
    // 'Counting Money': [0, 1]
    // 'Word Problems': [2, 3, 4]
    // 'Add': [2]
    // 'Subtract': [3]
    
    const map: Record<string, number[]> = {
        'Counting Money': [0, 1],
        'Word Problems': [2, 3, 4],
        'Add': [2],
        'Subtract': [3, 4]
    };
    
    const type = selectQuestionType([0, 1, 2, 3, 4, 5, 6, 7], subcategories, map);
    const char = getCharacter(customNames); 

    const formatMoney = (cents: number) => `$${(cents/100).toFixed(2)}`;

    if (type === 0) { // A1: Visual Counting
        const bills = getRandomInt(0, 2);
        const billVal = getRandomElement([100, 500]);
        const q = getRandomInt(1, 4), d = getRandomInt(1, 5);
        const coinSum = (q*25) + (d*10);
        const totalCents = (bills * billVal) + coinSum;
        const coinsArray = [...Array(bills).fill(billVal), ...Array(q).fill(25), ...Array(d).fill(10)];
        
        return {
            id, standardRef: '3.MD.A.1b', type: 'multiple-choice',
            text: `Count the money shown.`,
            visualInfo: { type: 'money', coins: coinsArray },
            correctAnswer: formatMoney(totalCents),
            options: generateOptions(`${totalCents}`, 'number').map(n => formatMoney(parseInt(n)))
        };

    } else if (type === 1) { // A2: Conversion
        const d = getRandomInt(1, 9);
        const c = getRandomInt(10, 99);
        const total = d*100 + c;
        const isDollarsToCents = Math.random() > 0.5;

        if (isDollarsToCents) {
            return {
                id, standardRef: '3.MD.A.1b', type: 'multiple-choice',
                text: `${formatMoney(total)} is the same as how many cents?`,
                correctAnswer: `${total}¢`,
                options: createUniqueOptions([`${total}¢`, `${d}¢`, `${c}¢`, `${total*10}¢`])
            };
        } else {
            return {
                id, standardRef: '3.MD.A.1b', type: 'multiple-choice',
                text: `${total}¢ is the same as...`,
                correctAnswer: formatMoney(total),
                options: createUniqueOptions([formatMoney(total), `$${d}.0${c}`, `$0.${total}`, `${d} dollars`])
            };
        }

    } else if (type === 2) { // B: Addition
        const p1 = getRandomInt(150, 850); // $1.50 - $8.50
        const p2 = getRandomInt(125, 650);
        const total = p1 + p2;
        const items = ['book', 'toy', 'snack', 'game', 'pencil'];
        const i1 = getRandomElement(items);
        const i2 = getRandomElement(items);

        return {
            id, standardRef: '3.MD.A.1b', type: 'multiple-choice',
            text: `${char.name} bought a ${i1} for ${formatMoney(p1)} and a ${i2} for ${formatMoney(p2)}. How much did ${char.subjective} spend in all?`,
            correctAnswer: formatMoney(total),
            options: createUniqueOptions([formatMoney(total), formatMoney(Math.abs(p1-p2)), formatMoney(total+100), formatMoney(total-50)])
        };

    } else if (type === 3) { // C: Subtraction (Change)
        const has = getRandomInt(500, 2000); // $5.00 - $20.00
        const cost = getRandomInt(150, has - 50);
        const left = has - cost;

        return {
            id, standardRef: '3.MD.A.1b', type: 'multiple-choice',
            text: `${char.name} had ${formatMoney(has)}. ${char.Subjective} spent ${formatMoney(cost)} on lunch. How much money does ${char.subjective} have left?`,
            correctAnswer: formatMoney(left),
            options: createUniqueOptions([formatMoney(left), formatMoney(has+cost), formatMoney(left-100), formatMoney(cost)])
        };

    } else if (type === 4) { // E: Two-Step
        const start = 2000; // $20.00 bill usually
        const c1 = getRandomInt(250, 650);
        const c2 = getRandomInt(250, 650);
        const spent = c1 + c2;
        const change = start - spent;

        return {
            id, standardRef: '3.MD.A.1b', type: 'open-ended',
            text: `${char.name} paid with a $20.00 bill. ${char.Subjective} bought a hat for ${formatMoney(c1)} and socks for ${formatMoney(c2)}. How much change did ${char.subjective} get back?`,
            correctAnswer: formatMoney(change)
        };

    } else if (type === 5) { // D: Choose Operation
        const p1 = getRandomInt(200, 500);
        const p2 = getRandomInt(200, 500);
        
        return {
            id, standardRef: '3.MD.A.1b', type: 'multiple-choice',
            text: `${char.name} wants to buy a toy for ${formatMoney(p1 + p2)}. ${char.Subjective} has ${formatMoney(p1)}. How can ${char.subjective} figure out how much more money is needed?`,
            correctAnswer: `Subtract ${formatMoney(p1)} from ${formatMoney(p1 + p2)}`,
            options: createUniqueOptions([
                `Subtract ${formatMoney(p1)} from ${formatMoney(p1 + p2)}`,
                `Add ${formatMoney(p1)} and ${formatMoney(p1 + p2)}`,
                `Multiply the amounts`,
                `Count the coins`
            ])
        };

    } else if (type === 6) { // G: Error Analysis
        const val = 50; // 50 cents
        const wrong = "0.50¢"; // Common error mixing $ notation style with cent symbol
        
        return {
            id, standardRef: '3.MD.A.1b', type: 'multiple-choice',
            text: `A student wrote fifty cents as "${wrong}". Is this correct?`,
            correctAnswer: `No, it should be $0.50 or 50¢.`,
            options: createUniqueOptions([
                `No, it should be $0.50 or 50¢.`,
                `Yes, because it has a decimal.`,
                `Yes, 0.50 is fifty.`,
                `No, it should be $50.`
            ])
        };

    } else { // C2: Comparison
        const c1 = getRandomInt(300, 800);
        const c2 = c1 - getRandomInt(50, 200);
        const diff = c1 - c2;
        
        return {
            id, standardRef: '3.MD.A.1b', type: 'multiple-choice',
            text: `A puzzle costs ${formatMoney(c1)}. A game costs ${formatMoney(c2)}. How much more does the puzzle cost than the game?`,
            correctAnswer: formatMoney(diff),
            options: createUniqueOptions([formatMoney(diff), formatMoney(c1+c2), formatMoney(c2), formatMoney(diff+100)])
        };
    }
};

// 17. 3.MD.B.3 - Graphs
export const genMDB3 = (id: number, customNames?: string[], subcategories?: string[]): Question => {
    // 'Bar Graphs': [0, 1, 3, 4],
    // 'Pictographs': [0, 1, 3, 4],
    // 'Tally Graphs': [2, 3],
    // 'Word Problems': [0, 1, 2, 4, 5]
    
    // We handle graph type selection logic inside (isPicto).
    // We will use logic to force visual type if requested.
    
    const map: Record<string, number[]> = {
        'Bar Graphs': [0, 1, 3, 4, 5],
        'Pictographs': [0, 1, 3, 4, 5],
        'Tally Graphs': [2, 3],
        'Word Problems': [1, 2, 4, 5]
    };
    
    const type = selectQuestionType([0, 1, 2, 3, 4, 5, 6, 7], subcategories, map);
    
    // Force specific graph type flags based on subcategories if applicable
    let forcePicto = false;
    let forceBar = false;
    if (subcategories) {
        if (subcategories.includes('Pictographs') && !subcategories.includes('Bar Graphs')) forcePicto = true;
        if (subcategories.includes('Bar Graphs') && !subcategories.includes('Pictographs')) forceBar = true;
    }

    // Define Themes
    const themes = [
        { name: 'Fruits', items: ['Apples', 'Bananas', 'Grapes', 'Oranges'], icon: 'circle' as const },
        { name: 'Sports', items: ['Soccer', 'Basketball', 'Baseball', 'Tennis'], icon: 'circle' as const },
        { name: 'Snacks', items: ['Pretzels', 'Popcorn', 'Chips', 'Cookies'], icon: 'rect' as const },
        { name: 'Colors', items: ['Blue', 'Red', 'Green', 'Yellow'], icon: 'star' as const },
        { name: 'Zoo', items: ['Lions', 'Bears', 'Monkeys', 'Zebras'], icon: 'smiley' as const }
    ];

    const theme = getRandomElement(themes);
    const subset = shuffleArray(theme.items).slice(0, 3);
    
    const scale = getRandomElement([1, 2, 5, 10]);
    let isPicto = Math.random() > 0.4 && type !== 2 && type !== 3;
    if (forcePicto) isPicto = true;
    if (forceBar) isPicto = false;

    const formatValue = (val: number) => {
        if (val % 1 === 0.5) {
            const w = Math.floor(val);
            return w === 0 ? "1/2" : `${w} 1/2`;
        }
        return `${val}`;
    };

    const data = subset.map(label => {
        if (type === 3) return { label, value: getRandomInt(1, 10) };
        if (type === 2) return { label, value: getRandomInt(1, 35) };
        if (isPicto && scale > 1) {
            const base = getRandomInt(1, 4) * scale;
            if (Math.random() > 0.5) return { label, value: base + (scale/2) }; 
            return { label, value: base }; 
        }
        return { label, value: getRandomInt(1, 5) * scale };
    });

    if (type === 3) { // Draw Your Own
        const subData = data.map(d => `${d.value} ${d.label}`).join(', ');
        let graphType = Math.random() > 0.5 ? 'bar graph' : 'tally chart';
        if (subcategories?.includes('Tally Graphs')) graphType = 'tally chart';
        
        const emptyData = subset.map(label => ({ label, value: 0 }));
        
        return {
            id, standardRef: '3.MD.B.3', type: 'open-ended',
            text: `Use the data below to draw a ${graphType}.\n\nData: ${subData}`,
            visualInfo: { 
                type: graphType === 'bar graph' ? 'bar-graph' : 'tally-chart', 
                graphTitle: `${theme.name} Count`, 
                xAxisLabel: 'Category', 
                yAxisLabel: 'Count',
                dataPoints: emptyData,
                scale: 1
            },
            correctAnswer: `(Teacher Check: Graph should match data)`
        };
    } else if (type === 2) { // Tally Chart
        const target = getRandomElement(data);
        return {
            id, standardRef: '3.MD.B.3', type: 'multiple-choice',
            text: `This tally chart shows favorite ${theme.name.toLowerCase()}. How many voted for ${target.label}?`,
            visualInfo: { type: 'tally-chart', graphTitle: `Favorite ${theme.name}`, dataPoints: data },
            correctAnswer: `${target.value}`,
            options: generateOptions(`${target.value}`, 'number')
        };
    } else if (type === 0) { // Read Graph
        const target = getRandomElement(data);
        const rawOptions = generateOptions(`${target.value}`, 'number');
        const formattedOptions = rawOptions.map(opt => formatValue(parseFloat(opt)));

        return {
            id, standardRef: '3.MD.B.3', type: 'multiple-choice',
            text: isPicto 
                ? `How many ${theme.name.toLowerCase()} are ${target.label}? (Key: Each symbol = ${scale})` 
                : `How many ${target.label} were counted?`,
            visualInfo: { 
                type: isPicto ? 'pictograph' : 'bar-graph', 
                graphTitle: `${theme.name} Count`, 
                xAxisLabel: 'Category', 
                yAxisLabel: 'Count', 
                dataPoints: data, 
                scale, 
                icon: theme.icon 
            },
            correctAnswer: formatValue(target.value),
            options: createUniqueOptions(formattedOptions)
        };
    } else if (type === 1) { // One-Step Compare
        const d1 = data[0], d2 = data[1];
        const diff = Math.abs(d1.value - d2.value);
        return {
            id, standardRef: '3.MD.B.3', type: 'open-ended',
            text: `How many more ${d1.value > d2.value ? d1.label : d2.label} than ${d1.value > d2.value ? d2.label : d1.label}?`,
            visualInfo: { 
                type: isPicto ? 'pictograph' : 'bar-graph', 
                graphTitle: `${theme.name} Count`, 
                xAxisLabel: 'Category', 
                yAxisLabel: 'Count', 
                dataPoints: data, 
                scale,
                icon: theme.icon 
            },
            correctAnswer: formatValue(diff)
        };
    } else if (type === 4) { // Two-Step Compare
        const target = data[0];
        const others = data.slice(1);
        const sumOthers = others.reduce((a,b) => a + b.value, 0);
        
        let qText = "";
        let ans = 0;
        if (target.value > sumOthers) {
            ans = target.value - sumOthers;
            qText = `How many more ${target.label} are there than ${others[0].label} and ${others[1].label} combined?`;
        } else {
            ans = sumOthers - target.value;
            qText = `How many fewer ${target.label} are there than ${others[0].label} and ${others[1].label} combined?`;
        }
        
        const rawOptions = generateOptions(`${ans}`, 'number');
        const formattedOptions = rawOptions.map(opt => formatValue(parseFloat(opt)));

        return {
            id, standardRef: '3.MD.B.3', type: 'multiple-choice',
            text: qText,
            visualInfo: { 
                type: isPicto ? 'pictograph' : 'bar-graph', 
                graphTitle: `${theme.name} Count`, 
                dataPoints: data, 
                scale,
                icon: theme.icon 
            },
            correctAnswer: formatValue(ans),
            options: createUniqueOptions(formattedOptions)
        };
    } else if (type === 5) { // Identify Extremes
        const sorted = [...data].sort((a,b) => b.value - a.value);
        const most = sorted[0];
        const least = sorted[sorted.length-1];
        const isMost = Math.random() > 0.5;
        
        return {
            id, standardRef: '3.MD.B.3', type: 'multiple-choice',
            text: `Which category has the ${isMost ? 'most' : 'least'} votes?`,
            visualInfo: { 
                type: isPicto ? 'pictograph' : 'bar-graph', 
                graphTitle: `${theme.name} Count`, 
                dataPoints: data, 
                scale,
                icon: theme.icon 
            },
            correctAnswer: isMost ? most.label : least.label,
            options: createUniqueOptions(data.map(d => d.label))
        };
    } else if (type === 6) { // Scale Selection
        const max = 45;
        return {
            id, standardRef: '3.MD.B.3', type: 'multiple-choice',
            text: `You are making a bar graph for data that goes up to ${max}. Which scale would fit best on a standard page?`,
            correctAnswer: `Count by 5s`,
            options: createUniqueOptions([
                `Count by 5s`,
                `Count by 1s`,
                `Count by 100s`,
                `Count by 50s`
            ])
        };
    } else { // Error Analysis
        const target = data[0];
        const wrong = target.value / scale;
        if (scale === 1) return genMDB3(id, customNames, subcategories);
        
        return {
            id, standardRef: '3.MD.B.3', type: 'multiple-choice',
            text: `A student counted ${formatValue(wrong)} symbols for ${target.label} and said the total was ${formatValue(wrong)}. The key says 1 symbol = ${scale}. Is the student correct?`,
            visualInfo: { 
                type: 'pictograph', 
                graphTitle: `${theme.name} Count`, 
                dataPoints: data, 
                scale, 
                icon: theme.icon 
            },
            correctAnswer: `No, they forgot to multiply by ${scale}.`,
            options: createUniqueOptions([
                `No, they forgot to multiply by ${scale}.`,
                `Yes, they counted correctly.`,
                `No, they should have added ${scale}.`,
                `Yes, the key doesn't matter.`
            ])
        };
    }
};

// 18. 3.MD.B.4 - Line Plots & Measurement
export const genMDB4 = (id: number, customNames?: string[], subcategories?: string[]): Question => {
    // 'Measuring Quarter Inch': [2, 6],
    // 'Line Plots': [0, 1, 3, 4, 7]
    const map: Record<string, number[]> = {
        'Measuring Quarter Inch': [2, 6],
        'Line Plots': [0, 1, 3, 4, 7]
    };
    
    const type = selectQuestionType([0, 1, 2, 3, 4, 5, 6, 7], subcategories, map);
    
    const toMixed = (val: number): string => {
        const whole = Math.floor(val);
        const part = val - whole;
        if (part === 0) return `${whole}`;
        const frac = part === 0.25 ? "1/4" : part === 0.5 ? "1/2" : "3/4";
        if (whole === 0) return frac;
        return `${whole} ${frac}`;
    };

    if (type === 2) { // Ruler Measurement
        const objLength = getRandomElement([1.5, 2, 2.5, 3, 3.25, 3.5, 3.75, 4]);
        const startPos = getRandomElement([0, 0, 1, 1.25, 2]);
        const endPos = startPos + objLength;

        const distractors = createUniqueOptions([
            `${toMixed(objLength)} in`,
            `${toMixed(endPos)} in`,
            `${toMixed(objLength + 1)} in`,
            `${toMixed(objLength - 0.5)} in`
        ]);

        return {
            id, standardRef: '3.MD.B.4', type: 'multiple-choice',
            text: `What is the length of the yellow bar?`,
            visualInfo: { type: 'ruler', objectStart: startPos, objectEnd: endPos },
            correctAnswer: `${toMixed(objLength)} in`,
            options: distractors
        };
    } else if (type === 1) { // Create Line Plot
        const base = getRandomInt(2, 12);
        const rangeVals = [base, base + 0.25, base + 0.5, base + 0.75, base + 1];
        
        const dataPoints: number[] = [];
        for(let i=0; i<10; i++) dataPoints.push(getRandomElement(rangeVals));
        
        dataPoints.sort((a,b) => a - b);
        const dataString = dataPoints.map(toMixed).join(', ');

        return {
            id, standardRef: '3.MD.B.4', type: 'open-ended',
            text: `Use the data below to complete the line plot.\n\n${dataString}`,
            visualInfo: { type: 'line-plot', start: base, end: base + 1, plotData: [] }, // Empty plot
            correctAnswer: `(Teacher Check: Line plot should match counts for ${dataString})`
        };
    } else if (type === 6) { // Ruler Error
        const start = 1;
        const end = 4;
        return {
            id, standardRef: '3.MD.B.4', type: 'multiple-choice',
            text: `An object starts at 1 inch on the ruler and ends at 4 inches. A student says it is 4 inches long. Is this correct?`,
            visualInfo: { type: 'ruler', objectStart: start, objectEnd: end },
            correctAnswer: `No, it is 3 inches long (4 - 1).`,
            options: createUniqueOptions([
                `No, it is 3 inches long (4 - 1).`,
                `Yes, it ends at 4.`,
                `No, it is 5 inches long.`,
                `Yes, the start doesn't matter.`
            ])
        };
    } else if (type === 5) { // Choose Scale
        const exampleData = "2, 2 1/4, 2 1/2, 2 3/4, 3";
        return {
            id, standardRef: '3.MD.B.4', type: 'multiple-choice',
            text: `You are making a line plot for these measurements: ${exampleData}. How should you label the scale?`,
            correctAnswer: `Mark every 1/4 inch`,
            options: createUniqueOptions([
                `Mark every 1/4 inch`,
                `Mark only whole numbers`,
                `Mark every 1/2 inch`,
                `Mark every 1 inch`
            ])
        };
    } else if (type === 7) { // Plot Error
        return {
            id, standardRef: '3.MD.B.4', type: 'multiple-choice',
            text: `A student made a line plot for lengths like 4 1/2 and 5 1/2, but only marked whole numbers (4, 5, 6) on the line. What is the problem?`,
            correctAnswer: `There is no place to put the 1/2 measurements.`,
            options: createUniqueOptions([
                `There is no place to put the 1/2 measurements.`,
                `Line plots can't have fractions.`,
                `They should have used a bar graph.`,
                `Nothing is wrong.`
            ])
        };
    } else { // Interpret Plot
        const base = getRandomInt(3, 10);
        const rangeVals = [base, base + 0.25, base + 0.5, base + 0.75, base + 1];
        const data: number[] = [];
        const counts: {[key: number]: number} = {};
        
        for(let i=0; i<12; i++) {
             const val = getRandomElement(rangeVals);
             if (!counts[val]) counts[val] = 0;
             if (counts[val] < 4) {
                 counts[val]++;
                 data.push(val);
             }
        }

        if (type === 3) { // Mode/Total
            const isTotal = Math.random() > 0.5;
            if (isTotal) {
                return {
                    id, standardRef: '3.MD.B.4', type: 'open-ended',
                    text: `How many total items are shown on the line plot?`,
                    visualInfo: { type: 'line-plot', start: base, end: base + 1, plotData: data },
                    correctAnswer: `${data.length}`
                };
            } else {
                let maxFreq = 0;
                let modeVal = 0;
                for(const k in counts) {
                    if(counts[k] > maxFreq) { maxFreq = counts[k]; modeVal = parseFloat(k); }
                }
                return {
                    id, standardRef: '3.MD.B.4', type: 'multiple-choice',
                    text: `Which measurement is the most common?`,
                    visualInfo: { type: 'line-plot', start: base, end: base + 1, plotData: data },
                    correctAnswer: `${toMixed(modeVal)}`,
                    options: createUniqueOptions(Object.keys(counts).map(k => toMixed(parseFloat(k))))
                };
            }
        } else if (type === 4) { // Compare Counts
            const keys = Object.keys(counts).map(parseFloat);
            if (keys.length < 2) return genMDB4(id, customNames, subcategories);
            const v1 = keys[0];
            const v2 = keys[1];
            const diff = Math.abs(counts[v1] - counts[v2]);
            
            return {
                id, standardRef: '3.MD.B.4', type: 'open-ended',
                text: `How many more items are ${toMixed(v1)} inches than ${toMixed(v2)} inches?`,
                visualInfo: { type: 'line-plot', start: base, end: base + 1, plotData: data },
                correctAnswer: `${diff}`
            };
        } else {
            const target = getRandomElement(rangeVals);
            const count = counts[target] || 0;
            return {
                id, standardRef: '3.MD.B.4', type: 'multiple-choice',
                text: `How many items measured exactly ${toMixed(target)} inches?`,
                visualInfo: { type: 'line-plot', start: base, end: base + 1, plotData: data },
                correctAnswer: `${count}`,
                options: ['0', '1', '2', '3', '4', '5']
            };
        }
    }
};

// 20. 3.MD.C.8 - Perimeter
export const genMDC8 = (id: number, customNames?: string[], subcategories?: string[]): Question => {
    // 'Missing Side': [0, 9] (includes logic related to missing)
    // 'Sum of All Sides': [1, 5, 4]
    // 'Odd Shapes': [4, 5] (L-shapes and polygons)
    // 'Relate Area and Perimeter': [3, 2, 6, 7, 8]
    const map: Record<string, number[]> = {
        'Missing Side': [0, 9],
        'Sum of All Sides': [1, 5, 4],
        'Odd Shapes': [4, 5],
        'Relate Area and Perimeter': [3, 2, 6, 7, 8]
    };
    
    const type = selectQuestionType([0, 1, 2, 3, 4, 5, 6, 7, 8, 9], subcategories, map);
    
    const objects = [
        { name: 'rug', w: getRandomInt(4, 8), h: getRandomInt(3, 6) },
        { name: 'sandbox', w: getRandomInt(5, 8), h: getRandomInt(5, 8) },
        { name: 'poster', w: getRandomInt(2, 4), h: getRandomInt(3, 5) },
        { name: 'garden', w: getRandomInt(6, 9), h: getRandomInt(4, 7) },
        { name: 'room', w: getRandomInt(8, 10), h: getRandomInt(8, 10) }
    ];
    const obj = getRandomElement(objects);

    if (type === 0) { 
        const w = getRandomInt(3, 9), h = getRandomInt(2, 8);
        const perim = 2 * (w + h);
        return {
            id, standardRef: '3.MD.C.8', type: 'open-ended',
            text: `The perimeter of this rectangle is ${perim}. The width is ${w}. Find the height.`,
            visualInfo: { type: 'area-model', widthLabel: `${w}`, heightLabel: `?` },
            correctAnswer: `${h}`
        };
    } else if (type === 1) { 
        const perim = 2 * (obj.w + obj.h);
        return {
            id, standardRef: '3.MD.C.8', type: 'multiple-choice',
            text: `A ${obj.name} is ${obj.w} ft long and ${obj.h} ft wide. What is the perimeter around it?`,
            correctAnswer: `${perim} ft`,
            options: generateOptions(`${perim}`, 'number').map(n => `${n} ft`)
        };
    } else if (type === 2) { 
        const w1 = getRandomInt(3, 6), h1 = getRandomInt(3, 6);
        const w2 = getRandomInt(3, 6), h2 = getRandomInt(3, 6);
        const p1 = 2*(w1+h1);
        const p2 = 2*(w2+h2);
        
        return {
            id, standardRef: '3.MD.C.8', type: 'multiple-choice',
            text: `Do these two rectangles have the same PERIMETER?`,
            visualInfo: { type: 'composite-area', rect1: { w: w1, h: h1 }, rect2: { w: w2, h: h2 }, arrangement: 'distributive' }, 
            correctAnswer: p1 === p2 ? 'Yes' : 'No',
            options: ['Yes', 'No']
        };
    } else if (type === 3) { // Same Area Different Perimeter
        const area = 12;
        // 1x12 (P=26), 2x6 (P=16), 3x4 (P=14)
        return {
            id, standardRef: '3.MD.C.8', type: 'multiple-choice',
            text: `Rectangles A and B both have an area of 12 sq units. Rectangle A is 3x4. Rectangle B is 2x6. Do they have the same perimeter?`,
            correctAnswer: `No`,
            options: ['Yes', 'No']
        };
    } else if (type === 4) { // Polygon Perimeter
        const sides = [getRandomInt(3,8), getRandomInt(3,8), getRandomInt(3,8), getRandomInt(3,8), getRandomInt(3,8)];
        const numSides = getRandomInt(3, 5);
        const shapeSides = sides.slice(0, numSides);
        const perim = shapeSides.reduce((a,b)=>a+b, 0);
        
        return {
            id, standardRef: '3.MD.C.8', type: 'open-ended',
            text: `Find the perimeter of a shape with sides: ${shapeSides.join(', ')}.`,
            correctAnswer: `${perim}`
        };
    } else if (type === 5) { // L-Shape Perimeter (Visual implicit)
        // Handled via word problem or concept for now to avoid complex visual generation logic in quick fix
        const l1 = getRandomInt(2,5), l2 = getRandomInt(2,5); // Inner cut
        const W = l1 + getRandomInt(2,5);
        const H = l2 + getRandomInt(2,5);
        // Perimeter of L-shape cut from corner is same as outer rect usually (2W + 2H)
        const p = 2 * (W + H);
        
        return {
            id, standardRef: '3.MD.C.8', type: 'open-ended',
            text: `An L-shaped room is made by cutting a corner out of a ${W}m by ${H}m rectangle. What is the perimeter of the room?`,
            correctAnswer: `${p} m`
        };
    } else if (type === 6) { // Draw specific perimeter
        const targetP = getRandomElement([10, 12, 14, 16, 18, 20]);
        return {
            id, standardRef: '3.MD.C.8', type: 'open-ended',
            text: `Draw a rectangle with a perimeter of ${targetP} units.`,
            visualInfo: { type: 'tiled-area', rows: 6, cols: 8 }, // Grid to draw on
            correctAnswer: `(Teacher Check)`
        };
    } else if (type === 7) { // Unknown side word problem
        const w = getRandomInt(4, 10);
        const p = (w * 4); // Square
        return {
            id, standardRef: '3.MD.C.8', type: 'multiple-choice',
            text: `A square garden has a perimeter of ${p} feet. How long is each side?`,
            correctAnswer: `${w} ft`,
            options: createUniqueOptions([`${w} ft`, `${w*2} ft`, `${p/2} ft`, `${w-1} ft`])
        };
    } else if (type === 8) { // Area/Perimeter confusion
        const s = getRandomInt(3, 6);
        const p = s*4;
        const a = s*s;
        if (p === a) return genMDC8(id, customNames, subcategories); // Retry
        
        return {
            id, standardRef: '3.MD.C.8', type: 'multiple-choice',
            text: `A square has side length ${s}. Which is true?`,
            correctAnswer: `Perimeter is ${p}, Area is ${a}.`,
            options: createUniqueOptions([
                `Perimeter is ${p}, Area is ${a}.`,
                `Perimeter is ${a}, Area is ${p}.`,
                `Perimeter and Area are the same.`,
                `Perimeter is ${s+s}, Area is ${s*4}.`
            ])
        };
    } else { // Missing Side Visual
        const sides = [getRandomInt(2,5), getRandomInt(2,5), getRandomInt(2,5)];
        const missing = getRandomInt(2,5);
        const p = sides.reduce((a,b)=>a+b,0) + missing;
        
        return {
            id, standardRef: '3.MD.C.8', type: 'open-ended',
            text: `The perimeter of this shape is ${p}. Lengths of known sides are ${sides.join(', ')}. What is the length of the missing side?`,
            correctAnswer: `${missing}`
        };
    }
};

// 21. 3.MD.A.2 - Volumes & Masses
export const genMDA2 = (id: number, customNames?: string[], subcategories?: string[]): Question => {
    const map: Record<string, number[]> = {
        'Estimate Volume': [2, 3],
        'Estimate Mass': [2, 3],
        'Word Problems': [4, 5],
        'Reading Scales': [1],
        'Reading Volume': [0]
    };
    
    // Select question type
    const type = selectQuestionType([0, 1, 2, 3, 4, 5], subcategories, map);
    const char = getCharacter(customNames);

    if (type === 0) { // Reading Volume
        const capacity = getRandomElement([100, 200, 500, 1000]);
        const level = Math.round(getRandomInt(1, 9) * (capacity/10));
        
        return {
            id, standardRef: '3.MD.A.2', type: 'multiple-choice',
            text: `How much liquid is in the beaker?`,
            visualInfo: { type: 'measurement-container', shapeName: 'beaker', capacity: capacity, fluidLevel: level, tickStrategy: 'standard' },
            correctAnswer: `${level} mL`,
            options: createUniqueOptions([`${level} mL`, `${capacity} mL`, `${level + 10} mL`, `${level - 10} mL`])
        };
    } else if (type === 1) { // Reading Scale
        const maxWeight = 500;
        const weight = getRandomInt(5, 95) * 5; // Multiple of 5
        
        return {
            id, standardRef: '3.MD.A.2', type: 'multiple-choice',
            text: `What is the mass shown on the scale?`,
            visualInfo: { type: 'measurement-container', shapeName: 'scale', weight: weight },
            correctAnswer: `${weight} g`,
            options: createUniqueOptions([`${weight} g`, `${weight + 50} g`, `${weight - 25} g`, `${maxWeight} g`])
        };
    } else if (type === 2) { // Estimation (Unit)
        const isMass = Math.random() > 0.5;
        // Bias if specific subcategory selected
        if (subcategories?.includes('Estimate Volume') && !subcategories?.includes('Estimate Mass')) {
            // Volume context
            const item = getRandomElement(['spoon', 'bucket', 'pool', 'cup']);
            let unit = 'mL';
            if (item === 'bucket' || item === 'pool') unit = 'L';
            
            return {
                id, standardRef: '3.MD.A.2', type: 'multiple-choice',
                text: `Which unit would you use to measure the water in a ${item}?`,
                correctAnswer: item === 'spoon' || item === 'cup' ? 'Milliliters (mL)' : 'Liters (L)',
                options: createUniqueOptions(['Milliliters (mL)', 'Liters (L)', 'Grams (g)', 'Kilograms (kg)'])
            };
        } else {
            // Mass context (default or Estimate Mass)
            const item = getRandomElement(['paper clip', 'bicycle', 'dog', 'feather']);
            const isHeavy = item === 'bicycle' || item === 'dog';
            
            return {
                id, standardRef: '3.MD.A.2', type: 'multiple-choice',
                text: `Which unit is best to measure the mass of a ${item}?`,
                correctAnswer: isHeavy ? 'Kilograms (kg)' : 'Grams (g)',
                options: createUniqueOptions(['Grams (g)', 'Kilograms (kg)', 'Liters (L)', 'Meters (m)'])
            };
        }
    } else if (type === 3) { // Estimation (Magnitude)
        const isMass = Math.random() > 0.5;
        if (isMass) {
            const item = 'large apple';
            return {
                id, standardRef: '3.MD.A.2', type: 'multiple-choice',
                text: `About how much mass does a ${item} have?`,
                correctAnswer: `200 grams`,
                options: createUniqueOptions([`200 grams`, `200 kilograms`, `2 grams`, `20 kilograms`])
            };
        } else {
            const item = 'juice box';
            return {
                id, standardRef: '3.MD.A.2', type: 'multiple-choice',
                text: `About how much liquid is in a ${item}?`,
                correctAnswer: `200 milliliters`,
                options: createUniqueOptions([`200 milliliters`, `20 liters`, `2 milliliters`, `200 liters`])
            };
        }
    } else if (type === 4) { // Add/Sub Word Problem
        const unit = Math.random() > 0.5 ? 'kg' : 'L';
        const start = getRandomInt(20, 100);
        const change = getRandomInt(5, 15);
        const isAdd = Math.random() > 0.5;
        const ans = isAdd ? start + change : start - change;
        const action = isAdd ? (unit === 'kg' ? 'bought' : 'poured in') : (unit === 'kg' ? 'used' : 'poured out');
        const item = unit === 'kg' ? 'flour' : 'water';
        
        return {
            id, standardRef: '3.MD.A.2', type: 'open-ended',
            text: `${char.name} had ${start} ${unit} of ${item}. ${char.Subjective} ${action} ${change} ${unit}. How much ${item} does ${char.subjective} have now?`,
            correctAnswer: `${ans} ${unit}`
        };
    } else { // Mult/Div Word Problem
        const unit = Math.random() > 0.5 ? 'g' : 'mL';
        const groups = getRandomInt(3, 8);
        const perGroup = getRandomInt(5, 100); // 5g to 100g
        const total = groups * perGroup;
        const isMult = Math.random() > 0.5;
        
        if (isMult) {
            return {
                id, standardRef: '3.MD.A.2', type: 'open-ended',
                text: `${char.name} has ${groups} containers. Each holds ${perGroup} ${unit}. What is the total?`,
                correctAnswer: `${total} ${unit}`
            };
        } else {
            return {
                id, standardRef: '3.MD.A.2', type: 'open-ended',
                text: `${char.name} has ${total} ${unit} of soup to divide equally into ${groups} bowls. How much goes in each bowl?`,
                correctAnswer: `${perGroup} ${unit}`
            };
        }
    }
};
