
import { Question } from "../../types";
import { getRandomInt, getRandomElement, shuffleArray, createUniqueOptions, getCharacter, getRandomContext, selectQuestionType } from "../utils";

// 8. 3.NF.A.1 - Unit Fractions (No specific subs requested, keeping standard)
export const genNF1 = (id: number, customNames?: string[], subcategories?: string[]): Question => {
    // Standard random logic as no subcategories were defined for NF.1
    const type = getRandomInt(0, 7);
    const denominator = getRandomElement([3, 4, 6, 8]);
    
    if (type === 0) {
        // Identify Shaded Fraction (e.g. 3/8)
        const numerator = getRandomInt(1, denominator - 1);
        const isCircle = Math.random() > 0.5;
        
        return {
            id, standardRef: '3.NF.A.1', type: 'multiple-choice',
            text: `What fraction of the shape is shaded?`,
            visualInfo: { type: isCircle ? 'fraction-circle' : 'fraction-bar', numerator: numerator, denominator: denominator },
            correctAnswer: `${numerator}/${denominator}`,
            options: createUniqueOptions([
                `${numerator}/${denominator}`, 
                `${denominator}/${numerator}`, 
                `${numerator}/${denominator+1}`, 
                `1/${denominator}`
            ])
        };
    } else if (type === 1) { // Shade task
        const numerator = getRandomInt(1, denominator - 1);
        const isCircle = Math.random() > 0.5;
        return {
            id, standardRef: '3.NF.A.1', type: 'open-ended',
            text: `Shade ${numerator}/${denominator} of the shape below.`,
            visualInfo: { type: isCircle ? 'fraction-circle' : 'fraction-bar', numerator: 0, denominator: denominator }, 
            correctAnswer: `(Teacher Check: ${numerator} parts should be shaded)`
        };
    } else if (type === 2) { // Set Model
        const totalItems = getRandomInt(3, 8); 
        const numTarget = getRandomInt(1, totalItems - 1);
        const numOther = totalItems - numTarget;
        const shapes = shuffleArray([...Array(numTarget).fill('star'), ...Array(numOther).fill('circle')]);

        return {
            id, standardRef: '3.NF.A.1', type: 'multiple-choice',
            text: `What fraction of the objects are stars?`,
            visualInfo: { type: 'set-model', setObjects: shapes },
            correctAnswer: `${numTarget}/${totalItems}`,
            options: createUniqueOptions([`${numTarget}/${totalItems}`, `${numOther}/${totalItems}`, `${numTarget}/${numOther}`, `1/${totalItems}`])
        };
    } else if (type === 3) { // Conceptual Unit Fraction
        return {
            id, standardRef: '3.NF.A.1', type: 'multiple-choice',
            text: `What fraction is 1 part of ${denominator} equal parts?`,
            correctAnswer: `1/${denominator}`,
            options: createUniqueOptions([`1/${denominator}`, `${denominator}/1`, `2/${denominator}`, `1/${denominator-1}`])
        };
    } else if (type === 4) { // Sum of Unit Fractions
        const num = getRandomInt(2, denominator);
        const parts = Array(num).fill(`1/${denominator}`).join(' + ');
        return {
            id, standardRef: '3.NF.A.1', type: 'multiple-choice',
            text: `What fraction is equal to: ${parts}?`,
            correctAnswer: `${num}/${denominator}`,
            options: createUniqueOptions([`${num}/${denominator}`, `1/${denominator}`, `${num}/${denominator*num}`, `${denominator}/${num}`])
        };
    } else if (type === 5) { // Context Word Problem
        const num = getRandomInt(1, denominator - 1);
        const item = getRandomElement(['pizza', 'cake', 'pie']);
        return {
            id, standardRef: '3.NF.A.1', type: 'multiple-choice',
            text: `A ${item} is cut into ${denominator} equal pieces. ${num} pieces are eaten. What fraction of the ${item} is eaten?`,
            visualInfo: { type: 'fraction-circle', numerator: num, denominator: denominator },
            correctAnswer: `${num}/${denominator}`,
            options: createUniqueOptions([`${num}/${denominator}`, `${denominator}/${num}`, `${denominator - num}/${denominator}`, `1/${denominator}`])
        };
    } else if (type === 6) { // Error Analysis
        return {
            id, standardRef: '3.NF.A.1', type: 'multiple-choice',
            text: `A student says the shaded part is 1/${denominator}. Is the student correct?`,
            visualInfo: { type: 'fraction-circle', numerator: 1, denominator: denominator, isUnequal: true },
            correctAnswer: `No, because the parts are not equal sizes.`,
            options: createUniqueOptions([
                `No, because the parts are not equal sizes.`,
                `Yes, because 1 part is shaded out of ${denominator}.`,
                `Yes, because it is a circle.`,
                `No, because it should be 2/${denominator}.`
            ])
        };
    } else { // Multi-step
        const p1 = getRandomInt(1, Math.floor(denominator/2));
        let p2 = getRandomInt(1, Math.floor(denominator/2));
        while (p1 + p2 >= denominator) { p2--; }
        if (p2 < 1) p2 = 1;
        const total = p1 + p2;
        return {
            id, standardRef: '3.NF.A.1', type: 'open-ended',
            text: `A chocolate bar has ${denominator} equal pieces. Tom eats ${p1} pieces and gives ${p2} pieces to a friend. What fraction of the chocolate bar is gone?`,
            correctAnswer: `${total}/${denominator}`
        };
    }
};

// 10. 3.NF.A.2 - Number Lines
export const genNF2 = (id: number, customNames?: string[], subcategories?: string[]): Question => {
    // 0=Identify Point, 1=Identify Letter, 2=Place Dot, 3=Match Fraction
    // 4..8=Generic
    
    // Determine number generation constraints based on subcategories
    const activeSubs = subcategories || [];
    let constraint: 'lt1' | 'gt1' | 'mixed' | 'improper' | 'any' = 'any';

    const pool: string[] = [];
    if (activeSubs.includes('Less than 1')) pool.push('lt1');
    if (activeSubs.includes('Greater than 1')) pool.push('gt1');
    if (activeSubs.includes('Mixed Numbers')) pool.push('mixed');
    if (activeSubs.includes('Improper Fractions')) pool.push('improper');
    
    if (pool.length > 0) {
        constraint = getRandomElement(pool) as any;
    }

    const type = getRandomInt(0, 8);
    const den = getRandomElement([2, 3, 4, 6, 8]);
    
    // Default Logic (Any)
    let maxWhole = Math.random() > 0.3 ? (Math.random() > 0.5 ? 2 : 3) : 1;
    let num = 1;
    let forceMixed = false;
    let forceImproper = false;

    // Apply Constraint
    if (constraint === 'lt1') {
        maxWhole = 1;
        num = getRandomInt(1, den - 1);
    } else if (constraint === 'gt1') {
        maxWhole = getRandomInt(2, 4);
        num = getRandomInt(den + 1, maxWhole * den - 1);
        if (num % den === 0) num++; // Avoid wholes
    } else if (constraint === 'mixed') {
        maxWhole = getRandomInt(2, 4);
        num = getRandomInt(den + 1, maxWhole * den - 1);
        if (num % den === 0) num++; 
        forceMixed = true;
    } else if (constraint === 'improper') {
        maxWhole = getRandomInt(2, 4);
        num = getRandomInt(den + 1, maxWhole * den - 1);
        if (num % den === 0) num++; 
        forceImproper = true;
    } else {
        // Fallback default logic if no specific constraints (or 'any')
        const totalTicks = maxWhole * den; 
        num = getRandomInt(1, totalTicks);
        if (num % den === 0 && num < totalTicks) num += 1;
        if (num > totalTicks) num = totalTicks - 1;
    }

    const totalTicks = maxWhole * den;
    const val = num / den;

    const toMixed = (n: number, d: number) => {
        const w = Math.floor(n / d);
        const r = n % d;
        if (r === 0) return `${w}`;
        return `${w} ${r}/${d}`;
    };

    const isImproper = num > den;
    // Determine display style based on forces
    let showAsMixed = false;
    if (forceMixed) showAsMixed = true;
    else if (forceImproper) showAsMixed = false;
    else if (isImproper) showAsMixed = Math.random() > 0.5;

    const correctStr = showAsMixed ? toMixed(num, den) : `${num}/${den}`;

    // Generate options
    let options: string[] = [];
    if (showAsMixed) {
        const w = Math.floor(num / den);
        const r = num % den;
        options = createUniqueOptions([
            correctStr,
            `${w} ${r + 1 > den - 1 ? 1 : r + 1}/${den}`, 
            `${w + 1} ${r}/${den}`,
            `${w} ${r}/${den + 1}`
        ]);
    } else {
        options = createUniqueOptions([
            `${num}/${den}`, 
            `${num}/${den+1}`,
            `${num+1}/${den}`,
            `${den}/${num}`
        ]);
    }

    if (type === 0) { // Identify Point
        return {
            id, standardRef: '3.NF.A.2', type: 'multiple-choice',
            text: `What fraction is located at the dot?`,
            visualInfo: { type: 'number-line', start: 0, end: maxWhole, highlightPoints: [val], tickCount: totalTicks, labelMode: 'whole' },
            correctAnswer: correctStr, options: options
        };
    } else if (type === 1) { // Identify Letter
        return {
            id, standardRef: '3.NF.A.2', type: 'multiple-choice',
            text: `What fraction is at point A?`,
            visualInfo: { type: 'number-line', start: 0, end: maxWhole, tickCount: totalTicks, labelMode: 'whole', pointLabels: [{ value: val, label: 'A' }] },
            correctAnswer: correctStr, options: options
        };
    } else if (type === 2) { // Place Dot
        return {
            id, standardRef: '3.NF.A.2', type: 'open-ended',
            text: `Place a dot on the number line at ${correctStr}.`,
            visualInfo: { type: 'number-line', start: 0, end: maxWhole, tickCount: totalTicks, labelMode: 'whole', highlightPoints: [] },
            correctAnswer: `(Teacher Check)`
        };
    } else {
        // Fallback to simple identification for other types
        return {
             id, standardRef: '3.NF.A.2', type: 'multiple-choice',
             text: `Which fraction matches the point shown?`,
             visualInfo: { type: 'number-line', start: 0, end: maxWhole, highlightPoints: [val], tickCount: totalTicks, labelMode: 'whole' },
             correctAnswer: correctStr,
             options: options
        };
    }
};

// 11. 3.NF.A.3 - Equivalent & Comparing Fractions
export const genNF3 = (id: number, customNames?: string[], subcategories?: string[]): Question => {
    // Fraction Models (0), Number Lines (9), Compare Fraction (0, 1, 5, 6), Equivalent (2, 3), Equal to 1 (4), Whole Number (4)
    
    const map: Record<string, number[]> = {
        'Fraction Models': [0],
        'Number Lines': [9],
        'Compare Fraction': [0, 1, 5, 6],
        'Equivalent': [2, 3, 7],
        'Equal to 1': [4], // Subtype 4 has logic for this
        'Whole Number': [4] // Subtype 4 has logic for this
    };

    const type = selectQuestionType([0, 1, 2, 3, 4, 5, 6, 7, 8, 9], subcategories, map);
    
    if (type === 0) { // Dual Models Comparison
        const d1 = getRandomElement([3, 4, 6, 8]);
        const d2 = getRandomElement([3, 4, 6, 8]);
        const n1 = getRandomInt(1, d1-1);
        const n2 = getRandomInt(1, d2-1);
        
        const val1 = n1/d1;
        const val2 = n2/d2;
        const correctSym = Math.abs(val1 - val2) < 0.001 ? '=' : (val1 > val2 ? '>' : '<');
        
        const isBar = Math.random() > 0.5;
        const visualType = isBar ? 'fraction-bar' : 'fraction-circle';

        return {
            id, standardRef: '3.NF.A.3', type: 'multiple-choice',
            text: `Compare the fractions shown: ${n1}/${d1} ___ ${n2}/${d2}`,
            visualInfo: { 
                type: 'fraction-comparison',
                compareModels: [
                    { numerator: n1, denominator: d1, type: visualType },
                    { numerator: n2, denominator: d2, type: visualType }
                ]
            },
            correctAnswer: correctSym,
            options: createUniqueOptions(['>', '<', '='])
        };
        
    } else if (type === 1) { // Compare Same Denom (Without Models)
        const d = getRandomElement([2, 3, 4, 6, 8]);
        const n1 = getRandomInt(1, d);
        const n2 = getRandomInt(1, d);
        if (n1 === n2) return genNF3(id, customNames, subcategories); 

        const correctSym = n1 > n2 ? '>' : '<';

        return {
            id, standardRef: '3.NF.A.3', type: 'multiple-choice',
            text: `Compare: ${n1}/${d} ___ ${n2}/${d}`,
            correctAnswer: correctSym,
            options: createUniqueOptions(['>', '<', '='])
        };
        
    } else if (type === 2) { // Equivalent Missing Number
        const den = getRandomElement([2, 3, 4, 6]);
        const mult = getRandomElement([2, 3]);
        if (den * mult > 12) return genNF3(id, customNames, subcategories); 
        
        const num = getRandomInt(1, den - 1);
        
        return {
            id, standardRef: '3.NF.A.3', type: 'open-ended',
            text: `Fill in the missing number to make the fractions equal.\n\n${num}/${den} = ?/${den*mult}`,
            correctAnswer: `${num*mult}`
        };
        
    } else if (type === 3) { // Identify Equivalent - EXPANDED BASES
        const bases = [
            { n: 1, d: 2, multipliers: [2, 3, 4] }, 
            { n: 1, d: 3, multipliers: [2] },       
            { n: 1, d: 4, multipliers: [2] },       
            { n: 2, d: 3, multipliers: [2] },       
            { n: 3, d: 4, multipliers: [2] },       
            { n: 2, d: 2, multipliers: [2, 3, 4] }, 
        ];
        
        const base = getRandomElement(bases);
        const factor = getRandomElement(base.multipliers);
        const correctOption = `${base.n * factor}/${base.d * factor}`;
        const distractors = [
            `${base.n}/${base.d * factor}`, 
            `${base.n * factor}/${base.d + factor}`, 
            `${base.n + 1}/${base.d + 1}`,
            `${base.d}/${base.n}`
        ];
        
        return {
            id, standardRef: '3.NF.A.3', type: 'multiple-choice',
            text: `Which fraction is equivalent to ${base.n}/${base.d}?`,
            correctAnswer: correctOption,
            options: createUniqueOptions([correctOption, ...distractors])
        };

    } else if (type === 4) { // Wholes as Fractions / Equal to 1
        let isWholeToFrac = Math.random() > 0.5;
        // Logic filter
        if (subcategories?.includes('Equal to 1')) isWholeToFrac = false;
        if (subcategories?.includes('Whole Number')) isWholeToFrac = true;

        if (isWholeToFrac) {
            const whole = getRandomInt(2, 4);
            return {
                id, standardRef: '3.NF.A.3', type: 'multiple-choice',
                text: `Write a fraction that is equal to the whole number ${whole}.`,
                correctAnswer: `${whole}/1`,
                options: createUniqueOptions([`${whole}/1`, `1/${whole}`, `${whole}/${whole}`, `${whole}${whole}/1`])
            };
        } else {
            const denom = getRandomElement([2, 3, 4, 5, 6, 8]);
            return {
                id, standardRef: '3.NF.A.3', type: 'multiple-choice',
                text: `Which fraction is equal to 1 whole?`,
                correctAnswer: `${denom}/${denom}`,
                options: createUniqueOptions([`${denom}/${denom}`, `${denom}/1`, `1/${denom}`, `${denom}0/${denom}`])
            };
        }
    } else if (type === 5) { // Compare Same Numerator
        const n = getRandomInt(1, 3);
        const d1 = getRandomElement([2, 3]);
        const d2 = getRandomElement([6, 8]);
        
        return {
            id, standardRef: '3.NF.A.3', type: 'multiple-choice',
            text: `Compare: ${n}/${d1} ___ ${n}/${d2}`,
            correctAnswer: '>',
            options: createUniqueOptions(['>', '<', '='])
        };

    } else if (type === 6) { // Order 3 Fractions
        const n = 1;
        const denoms = shuffleArray([2, 3, 4, 6, 8]).slice(0, 3).sort((a,b) => a-b);
        const set = denoms.map(d => ({ n, d })); 
        // Smallest denominator = largest fraction
        // Least to greatest: 1/8, 1/4, 1/2
        const correctOrder = [...set].sort((a,b) => (a.n/a.d) - (b.n/b.d)).map(f => `${f.n}/${f.d}`).join(', ');
        
        return {
            id, standardRef: '3.NF.A.3', type: 'multiple-choice',
            text: `Which list shows the fractions in order from least to greatest?`,
            correctAnswer: correctOrder,
            options: createUniqueOptions([
                correctOrder,
                `${n}/${denoms[0]}, ${n}/${denoms[1]}, ${n}/${denoms[2]}`, // Greatest to least
                `${n}/${denoms[1]}, ${n}/${denoms[0]}, ${n}/${denoms[2]}`, // Mixed
                `${denoms[0]}/${n}, ${denoms[1]}/${n}, ${denoms[2]}/${n}` // Numerator swap
            ])
        };

    } else if (type === 7) { // Context Equivalent
        const char = getCharacter(customNames);
        const items = ['sandwich', 'pizza', 'burrito'];
        const item = getRandomElement(items);
        const pairs = [{n1:1, d1:2, n2:2, d2:4}, {n1:1, d1:3, n2:2, d2:6}];
        const pair = getRandomElement(pairs);
        
        return {
            id, standardRef: '3.NF.A.3', type: 'multiple-choice',
            text: `${char.name} ate ${pair.n1}/${pair.d1} of a ${item}. ${char.Possessive} friend ate ${pair.n2}/${pair.d2} of a same-sized ${item}. Did they eat the same amount?`,
            correctAnswer: `Yes, because ${pair.n1}/${pair.d1} and ${pair.n2}/${pair.d2} are equivalent.`,
            options: createUniqueOptions([
                `Yes, because ${pair.n1}/${pair.d1} and ${pair.n2}/${pair.d2} are equivalent.`,
                `No, because ${pair.n2}/${pair.d2} is bigger.`,
                `No, because ${pair.d2} is bigger than ${pair.d1}.`
            ])
        };

    } else if (type === 8) { // Error Analysis
        return {
            id, standardRef: '3.NF.A.3', type: 'multiple-choice',
            text: `A student says that 1/3 is greater than 1/2 because 3 is bigger than 2. Is this correct?`,
            correctAnswer: `No, because 1/3 splits the whole into more pieces, so pieces are smaller.`,
            options: createUniqueOptions([
                `No, because 1/3 splits the whole into more pieces, so pieces are smaller.`,
                `Yes, because 3 > 2.`,
                `No, they are equal.`,
                `Yes, bigger denominators mean bigger fractions.`
            ])
        };

    } else { // Number Line Equivalence
        const pool = [{ n: 1, d: 2, eqN: 2, eqD: 4 }, { n: 1, d: 3, eqN: 2, eqD: 6 }];
        const selection = getRandomElement(pool);
        const val = selection.n / selection.d;
        
        return {
            id, standardRef: '3.NF.A.3', type: 'multiple-choice',
            text: `The point on the number line shows ${selection.n}/${selection.d}. Which other fraction is at the same spot?`,
            visualInfo: { type: 'number-line', start: 0, end: 1, tickCount: selection.d, highlightPoints: [val], labelMode: 'whole' },
            correctAnswer: `${selection.eqN}/${selection.eqD}`,
            options: createUniqueOptions([`${selection.eqN}/${selection.eqD}`, `1/${selection.d + 1}`, `${selection.n + 1}/${selection.d}`])
        };
    }
};
