
import { Question } from "../../types";
import { getRandomInt, getRandomElement, getRandomContext, generateOptions, NAMES, createUniqueOptions, getCharacter, selectQuestionType } from "../utils";

// 3.NBT.A.1 - Rounding
export const genNBT1 = (id: number, customNames?: string[], subcategories?: string[]): Question => {
    const map: Record<string, number[]> = {
        'Nearest 10': [0, 2, 3, 5], // 2=Reverse, 3=Word Problem
        'Nearest 100': [1, 2, 4, 5],
        'Add/Subtract': [7], // Estimation
        'Word Problems': [3, 7]
    };

    const type = selectQuestionType([0, 1, 2, 3, 4, 5, 6, 7], subcategories, map);
    
    if (type === 0) { // Round to 10
        const isThreeDigit = Math.random() > 0.5;
        const n = isThreeDigit ? getRandomInt(101, 998) : getRandomInt(11, 98);
        
        if (n % 10 === 0) return genNBT1(id, customNames, subcategories);
        
        const rounded = Math.round(n / 10) * 10;
        
        return {
            id, standardRef: '3.NBT.A.1', type: 'open-ended',
            text: `Round ${n} to the nearest 10.`,
            visualInfo: { 
                type: 'number-line', 
                start: Math.floor(n/10)*10, 
                end: Math.ceil(n/10)*10, 
                highlightPoints: [n],
                tickCount: 10,
                labelMode: 'all' 
            },
            correctAnswer: `${rounded}`,
            options: generateOptions(`${rounded}`, 'number')
        };
    } else if (type === 1) { // Round to 100
        const n = getRandomInt(101, 899);
        if (n % 100 === 0) return genNBT1(id, customNames, subcategories);
        
        const rounded = Math.round(n / 100) * 100;
        
        return {
            id, standardRef: '3.NBT.A.1', type: 'open-ended',
            text: `Round ${n} to the nearest 100.`,
            visualInfo: { 
                type: 'number-line', 
                start: Math.floor(n/100)*100, 
                end: Math.ceil(n/100)*100, 
                highlightPoints: [n],
                tickCount: 10, 
                labelMode: 'whole'
            },
            correctAnswer: `${rounded}`,
            options: generateOptions(`${rounded}`, 'number')
        };
    } else if (type === 2) { // Reverse
        let isTen = Math.random() > 0.5;
        // Bias based on selection
        if (subcategories?.includes('Nearest 10') && !subcategories?.includes('Nearest 100')) isTen = true;
        if (subcategories?.includes('Nearest 100') && !subcategories?.includes('Nearest 10')) isTen = false;

        const target = isTen ? getRandomInt(2, 9) * 10 : getRandomInt(2, 9) * 100;
        
        const range = isTen ? 5 : 50;
        const correctVal = target + getRandomInt(-range + 1, range - 1);
        
        const wrong1 = target + range + getRandomInt(1, 5);
        const wrong2 = target - range - getRandomInt(1, 5);
        const wrong3 = target + range + getRandomInt(10, 20);
        
        return {
            id, standardRef: '3.NBT.A.1', type: 'multiple-choice',
            text: `Which number rounds to ${target} when rounded to the nearest ${isTen ? '10' : '100'}?`,
            correctAnswer: `${correctVal}`,
            options: createUniqueOptions([`${correctVal}`, `${wrong1}`, `${wrong2}`, `${wrong3}`])
        };
    } else if (type === 3) { // Word Problem
        const ctx = getRandomContext(customNames);
        const n = getRandomInt(25, 450);
        const rounded = Math.round(n/10)*10;
        
        return {
            id, standardRef: '3.NBT.A.1', type: 'multiple-choice',
            text: `${ctx.name} has ${n} ${ctx.item.plural}. About how many ${ctx.item.plural} does ${ctx.name} have? (Round to the nearest 10)`,
            correctAnswer: `${rounded}`,
            options: createUniqueOptions([`${rounded}`, `${Math.floor(n/10)*10}`, `${Math.ceil(n/10)*10}`, `${rounded+10}`])
        };
    } else if (type === 4) { // 4-Digit Rounding (implies 100s/1000s, mapped to 100s for now)
        const n = getRandomInt(1001, 9998);
        const toTen = Math.random() > 0.5;
        const target = toTen ? "10" : "100";
        const rounded = toTen ? Math.round(n/10)*10 : Math.round(n/100)*100;
        
        return {
            id, standardRef: '3.NBT.A.1', type: 'open-ended',
            text: `Round ${n} to the nearest ${target}.`,
            correctAnswer: `${rounded}`,
            options: generateOptions(`${rounded}`, 'number')
        };
    } else if (type === 5) { // Dual Rounding (Compare 10 vs 100)
        const n = getRandomInt(125, 875);
        const r10 = Math.round(n/10)*10;
        const r100 = Math.round(n/100)*100;
        
        return {
            id, standardRef: '3.NBT.A.1', type: 'multiple-choice',
            text: `Round ${n} to the nearest 10 AND the nearest 100.`,
            correctAnswer: `Nearest 10: ${r10}, Nearest 100: ${r100}`,
            options: createUniqueOptions([
                `Nearest 10: ${r10}, Nearest 100: ${r100}`,
                `Nearest 10: ${r100}, Nearest 100: ${r10}`,
                `Nearest 10: ${r10+10}, Nearest 100: ${r100}`,
                `Nearest 10: ${r10}, Nearest 100: ${r100+100}`
            ])
        };
    } else if (type === 6) { // Error Analysis
        const n = getRandomInt(150, 850);
        const correct = Math.round(n/100)*100;
        const wrong = Math.floor(n/100)*100; 
        
        if (correct === wrong) return genNBT1(id, customNames, subcategories);
        
        return {
            id, standardRef: '3.NBT.A.1', type: 'multiple-choice',
            text: `A student rounded ${n} to the nearest 100 and got ${wrong}. Is this correct?`,
            correctAnswer: `No, it should be ${correct}.`,
            options: createUniqueOptions([
                `No, it should be ${correct}.`,
                `Yes, because it is in the ${wrong/100}00s.`,
                `Yes, you always round down.`,
                `No, it should be ${correct + 100}.`
            ])
        };
    } else { // Multi-step Estimation
        const n1 = getRandomInt(105, 495);
        const n2 = getRandomInt(105, 495);
        const r1 = Math.round(n1/100)*100;
        const r2 = Math.round(n2/100)*100;
        const estSum = r1 + r2;
        
        return {
            id, standardRef: '3.NBT.A.1', type: 'multiple-choice',
            text: `Estimate the sum of ${n1} + ${n2} by rounding each number to the nearest 100 first.`,
            correctAnswer: `${estSum}`,
            options: createUniqueOptions([
                `${estSum}`,
                `${n1 + n2}`,
                `${estSum + 100}`,
                `${estSum - 100}`
            ])
        };
    }
};

// 6. 3.NBT.A.3 - Mult by 10
export const genNBT3 = (id: number, customNames?: string[], subcategories?: string[]): Question => {
    // 0=Mult (Div logic, answer is Tens), 1=Div logic answer is base, 2=Missing Divisor
    // 3=Word Problem, 4=Missing Factor, 5=Basic Comp, 6=Reasoning, 7=Associative, 8=Error
    
    // User requested: By 10, By 100s (Treat as large mult), Missing Number, Division, Multiplication
    // Updated: By 100s now includes Division types
    const map: Record<string, number[]> = {
        'Division': [0, 1, 2],
        'Multiplication': [5, 4, 3], // Basic comp, missing factor, word problem
        'By 10': [5, 0, 1],
        'By 100s': [5, 0, 1, 2], // Added division types 0, 1, 2 for 100s
        'Missing Number': [2, 4]
    };
    
    const type = selectQuestionType([0, 1, 2, 3, 4, 5, 6, 7, 8], subcategories, map);
    
    const isDivisionLogic = [0, 1, 2].includes(type);
    const useHundred = subcategories?.includes('By 100s');

    const base = getRandomInt(2, 9);         
    const tensDigit = getRandomInt(1, 9);
    const multiplier = useHundred ? 100 : 10;
    const operand = tensDigit * multiplier; // e.g. 60 or 600
    const product = base * operand;         // e.g. 240 or 2400

    if (isDivisionLogic) {
        if (type === 0) { // Divide by base
            return {
                id, standardRef: '3.NBT.A.3', type: 'multiple-choice',
                text: `Solve: ${product} ÷ ${base} = ?`,
                correctAnswer: `${operand}`,
                options: generateOptions(`${operand}`, 'number')
            };
        } else if (type === 1) { // Divide by tens/hundreds
            return {
                id, standardRef: '3.NBT.A.3', type: 'multiple-choice',
                text: `Solve: ${product} ÷ ${operand} = ?`,
                correctAnswer: `${base}`,
                options: generateOptions(`${base}`, 'number')
            };
        } else { // Missing Divisor
            return {
                id, standardRef: '3.NBT.A.3', type: 'open-ended',
                text: `Find the missing number: ${product} ÷ ? = ${operand}`,
                correctAnswer: `${base}`,
                options: generateOptions(`${base}`, 'number')
            };
        }
    } else {
        // Multiplication logic
        if (type === 3) { // Word Problem
            const ctx = getRandomContext(customNames);
            return {
                id, standardRef: '3.NBT.A.3', type: 'open-ended',
                text: `Each ${ctx.item.container} holds ${operand} ${ctx.item.plural}. How many ${ctx.item.plural} are in ${base} ${ctx.item.container}s?`,
                correctAnswer: `${product}`
            };
        } else if (type === 4) { // Missing Factor
            return {
                id, standardRef: '3.NBT.A.3', type: 'multiple-choice',
                text: `Find the missing number: ? × ${operand} = ${product}`,
                correctAnswer: `${base}`,
                options: generateOptions(`${base}`, 'number')
            };
        } else if (type === 5) { // Basic Computation
            const isCommutative = Math.random() > 0.5;
            const text = isCommutative 
                ? `${operand} × ${base} = ?`
                : `${base} × ${operand} = ?`;
            return {
                id, standardRef: '3.NBT.A.3', type: 'open-ended',
                text: `Solve: ${text}`,
                correctAnswer: `${product}`,
                options: generateOptions(`${product}`, 'number')
            };
        } else if (type === 6) { // Reasoning
            // Only valid for 10s usually, logic adapted
            if (useHundred) return genNBT3(id, customNames, subcategories); 
            return {
                id, standardRef: '3.NBT.A.3', type: 'multiple-choice',
                text: `Complete the steps:\n\n${base} × ${operand} = ${base} × (${tensDigit} tens) = ___ tens = ${product}`,
                correctAnswer: `${base * tensDigit}`,
                options: createUniqueOptions([
                    `${base * tensDigit}`,
                    `${tensDigit}`,
                    `${base}`,
                    `${base * tensDigit * 10}`
                ])
            };
        } else if (type === 7) { // Associative
             if (useHundred) return genNBT3(id, customNames, subcategories); 
            return {
                id, standardRef: '3.NBT.A.3', type: 'multiple-choice',
                text: `Which expression is the same as ${base} × ${operand}?`,
                correctAnswer: `(${base} × ${tensDigit}) × 10`,
                options: createUniqueOptions([
                    `(${base} × ${tensDigit}) × 10`,
                    `(${base} + ${tensDigit}) × 10`,
                    `${base} × 10 + ${tensDigit}`,
                    `(${base} × 10) × ${operand}`
                ])
            };
        } else { // Error Analysis
            const wrongAns = base * tensDigit; // Forgot zero(s)
            const zeros = useHundred ? "two zeros" : "a zero";
            return {
                id, standardRef: '3.NBT.A.3', type: 'multiple-choice',
                text: `A student solved ${base} × ${operand} and got ${wrongAns}. What mistake did they make?`,
                correctAnswer: `They forgot to place ${zeros} at the end.`,
                options: createUniqueOptions([
                    `They forgot to place ${zeros} at the end.`,
                    `They added instead of multiplied.`,
                    `They multiplied by 10 twice.`,
                    `The answer is correct.`
                ])
            };
        }
    }
};

// 22. 3.NBT.A.2 - Add/Sub (Comprehensive Audit Update)
export const genNBT2 = (id: number, customNames?: string[], subcategories?: string[]): Question => {
    // Subcategories: Subtract Across 0s, Addition Carrying, Word Problems
    
    // We'll override the 'type' probability logic if subcategories are present
    let forcedCategory: 'A' | 'B' | null = null;
    let forcedSubtypes: number[] = [];

    if (subcategories && subcategories.length > 0) {
        if (subcategories.includes('Word Problems')) forcedCategory = 'B';
        
        // Computation filters
        if (subcategories.includes('Subtract Across 0s')) {
            forcedCategory = 'A';
            forcedSubtypes.push(8, 9); // Subtype 8 is standard across zeros, 9 is zero in tens
        }
        if (subcategories.includes('Addition Carrying')) {
            forcedCategory = 'A';
            forcedSubtypes.push(2, 3, 4); // Regrouping add types
        }
    }

    let type = 'A';
    // If no forced category, use probability
    if (!forcedCategory) {
        const rand = Math.random();
        if (rand > 0.85) type = 'D';
        else if (rand > 0.70) type = 'C';
        else if (rand > 0.40) type = 'B';
    } else {
        type = forcedCategory;
    }
    
    const char = getCharacter(customNames);
    const ctx = getRandomContext(customNames);
    const item = ctx.item.plural;
    const getDigit = (min=0, max=9) => getRandomInt(min, max);

    // --- CATEGORY A: COMPUTATION ---
    if (type === 'A') {
        let subType = 1;
        if (forcedSubtypes.length > 0) {
            subType = getRandomElement(forcedSubtypes);
        } else {
            // Include new subtype 9 randomly
            subType = getRandomInt(1, 9);
        }

        let n1 = 0, n2 = 0, ans = 0, op = '+';

        if (subType === 1) { // Add, No Regroup
            const u1 = getDigit(0, 4), u2 = getDigit(0, 9 - u1);
            const t1 = getDigit(0, 4), t2 = getDigit(0, 9 - t1);
            const h1 = getDigit(1, 4), h2 = getDigit(1, 9 - h1);
            n1 = h1*100 + t1*10 + u1; n2 = h2*100 + t2*10 + u2;
            ans = n1 + n2;
        } else if (subType === 2) { // Add, Ones Regroup
            const u1 = getDigit(5, 9), u2 = getDigit(10 - u1, 9);
            const t1 = getDigit(0, 3), t2 = getDigit(0, 8 - t1); 
            const h1 = getDigit(1, 4), h2 = getDigit(1, 8 - h1);
            n1 = h1*100 + t1*10 + u1; n2 = h2*100 + t2*10 + u2;
            ans = n1 + n2;
        } else if (subType === 3) { // Add, Tens Regroup
            const u1 = getDigit(0, 4), u2 = getDigit(0, 9 - u1);
            const t1 = getDigit(5, 9), t2 = getDigit(10 - t1, 9);
            const h1 = getDigit(1, 3), h2 = getDigit(1, 8 - h1); 
            n1 = h1*100 + t1*10 + u1; n2 = h2*100 + t2*10 + u2;
            ans = n1 + n2;
        } else if (subType === 4) { // Add, Both Regroup
            const u1 = getDigit(5, 9), u2 = getDigit(10 - u1, 9);
            const t1 = getDigit(5, 8), t2 = getDigit(10 - t1, 9); 
            const h1 = getDigit(1, 3), h2 = getDigit(1, 4);
            n1 = h1*100 + t1*10 + u1; n2 = h2*100 + t2*10 + u2;
            ans = n1 + n2;
        } else if (subType === 5) { // Sub, No Regroup
            op = '-';
            const u2 = getDigit(0, 8), u1 = getDigit(u2, 9);
            const t2 = getDigit(0, 8), t1 = getDigit(t2, 9);
            const h2 = getDigit(1, 4), h1 = getDigit(h2 + 1, 9);
            n1 = h1*100 + t1*10 + u1; n2 = h2*100 + t2*10 + u2;
            ans = n1 - n2;
        } else if (subType === 6) { // Sub, Ones Regroup
            op = '-';
            const u2 = getDigit(2, 9), u1 = getDigit(0, u2 - 1);
            const t2 = getDigit(0, 7), t1 = getDigit(t2 + 1, 9);
            const h2 = getDigit(1, 4), h1 = getDigit(h2 + 1, 9);
            n1 = h1*100 + t1*10 + u1; n2 = h2*100 + t2*10 + u2;
            ans = n1 - n2;
        } else if (subType === 7) { // Sub, Tens Regroup
            op = '-';
            const u2 = getDigit(0, 8), u1 = getDigit(u2, 9);
            const t2 = getDigit(2, 9), t1 = getDigit(0, t2 - 1);
            const h2 = getDigit(1, 4), h1 = getDigit(h2 + 1, 9);
            n1 = h1*100 + t1*10 + u1; n2 = h2*100 + t2*10 + u2;
            ans = n1 - n2;
        } else if (subType === 8) { // Sub, Across Zeros (Standard 500 - 231)
            op = '-';
            const h1 = getDigit(3, 9);
            n1 = h1 * 100; // e.g. 500
            n2 = getRandomInt(111, n1 - 10);
            ans = n1 - n2;
        } else { // Sub, Zero in Tens Place (905 - 263)
            op = '-';
            const h1 = getDigit(3, 9);
            const u1 = getDigit(1, 9);
            n1 = h1 * 100 + u1; // e.g. 905
            
            // Generate n2 such that it forces regrouping from the zero
            // Ones needs to be > u1 so we borrow from 0
            const u2 = getDigit(u1 + 1, 9);
            const t2 = getDigit(1, 9); // Any tens value > 0 triggers borrow from hundreds eventually
            const h2 = getDigit(1, h1 - 1);
            
            n2 = h2 * 100 + t2 * 10 + u2;
            ans = n1 - n2;
        }

        return {
            id, standardRef: '3.NBT.A.2', type: 'open-ended',
            text: `Solve: ${n1} ${op} ${n2} = ?`,
            correctAnswer: `${ans}`,
            options: generateOptions(`${ans}`, 'number')
        };
    }

    // --- CATEGORY B: WORD PROBLEMS ---
    else if (type === 'B') {
        const subType = getRandomInt(1, 5); // Increased variety
        let text = "", ans = 0;
        
        if (subType === 1) { // Add with Regrouping
            const n1 = getRandomInt(150, 450);
            const n2 = getRandomInt(150, 450);
            ans = n1 + n2;
            text = `${char.name} collected ${n1} ${item}. ${char.Subjective} found ${n2} more. How many ${item} does ${char.subjective} have in total?`;
        } else if (subType === 2) { // Sub with Regrouping
            const n1 = getRandomInt(500, 950);
            const n2 = getRandomInt(200, 450);
            ans = n1 - n2;
            text = `There were ${n1} ${item} at the store. ${n2} were sold. How many ${item} are left?`;
        } else if (subType === 3) { // Unknown Addend / Missing Number
            const total = getRandomInt(500, 900);
            const part = getRandomInt(200, 400);
            const missing = total - part;
            ans = missing;
            text = `${char.name} has ${part} ${item}. ${char.Subjective} wants to have ${total} ${item} in total. How many more does ${char.subjective} need?`;
        } else if (subType === 4) { // Comparison (How many more?)
            const n1 = getRandomInt(400, 800);
            const n2 = getRandomInt(150, 350);
            ans = n1 - n2;
            const otherChar = getCharacter(customNames).name === char.name ? 'Alex' : getCharacter(customNames).name;
            text = `${char.name} has ${n1} points. ${otherChar} has ${n2} points. How many more points does ${char.name} have than ${otherChar}?`;
        } else { // Start / Change / End (Working Backwards or Change Unknown)
            const start = getRandomInt(200, 500);
            const end = getRandomInt(600, 900);
            ans = end - start;
            text = `${char.name} started with ${start} ${item}. ${char.Subjective} received a gift of some ${item}. Now ${char.subjective} has ${end}. How many ${item} were in the gift?`;
        }
        
        return {
            id, standardRef: '3.NBT.A.2', type: 'multiple-choice',
            text: text,
            correctAnswer: `${ans}`,
            options: generateOptions(`${ans}`, 'number')
        };
    }

    // --- CATEGORY C: PROPERTIES ---
    else if (type === 'C') {
        const subType = getRandomInt(1, 3);
        if (subType === 1) { 
            const n1 = getRandomInt(200, 400); 
            const n2 = getRandomInt(300, 500); 
            
            // Calculate place value components
            const h1 = Math.floor(n1/100)*100;
            const h2 = Math.floor(n2/100)*100;
            const t1 = Math.floor((n1%100)/10)*10;
            const t2 = Math.floor((n2%100)/10)*10;
            const o1 = n1%10;
            const o2 = n2%10;

            return {
                id, standardRef: '3.NBT.A.2', type: 'multiple-choice',
                text: `Use place value to solve ${n1} + ${n2}.\n\n(${h1} + ${h2}) + (___) + (${o1} + ${o2})`,
                correctAnswer: `${t1} + ${t2}`, 
                options: createUniqueOptions([
                    `${t1} + ${t2}`,
                    `${h1 + t1} + ${h2 + t2}`, // Distractor: Old incorrect logic (370+310)
                    `${Math.floor(n1/10)*10} + ${Math.floor(n2/10)*10}`, // Distractor: full value
                    `${o1} + ${o2}`
                ])
            };
        } else if (subType === 2) { 
            const a = getRandomInt(20, 50);
            const b = getRandomInt(20, 50);
            const eq = `${a} + ${b} = ${b} + ${a}`;
            return {
                id, standardRef: '3.NBT.A.2', type: 'multiple-choice',
                text: `Which property is shown by this equation?\n${eq}`,
                correctAnswer: `Commutative Property`,
                options: createUniqueOptions(['Associative Property', 'Commutative Property', 'Identity Property', 'Zero Property'])
            };
        } else {
            const n = getRandomInt(15, 30);
            return {
                id, standardRef: '3.NBT.A.2', type: 'multiple-choice',
                text: `Which strategy makes it easiest to solve ${n} + 99?`,
                correctAnswer: `Add ${n} + 100, then subtract 1`,
                options: createUniqueOptions([
                    `Add ${n} + 100, then subtract 1`,
                    `Add ${n} + 100, then add 1`,
                    `Subtract 100 from ${n}`,
                    `Add 90, then add 9`
                ])
            };
        }
    } else { // CATEGORY D: ERROR
        const isAdd = Math.random() > 0.5;
        if (isAdd) {
            return {
                id, standardRef: '3.NBT.A.2', type: 'multiple-choice',
                text: `Student A solved 48 + 35 and got 73. What mistake did they make?`,
                correctAnswer: `Forgot to regroup (carry) the 10`,
                options: createUniqueOptions([
                    `Forgot to regroup (carry) the 10`,
                    `Added the ones wrong`,
                    `Subtracted instead of added`,
                    `Added too many tens`
                ])
            };
        } else {
            return {
                id, standardRef: '3.NBT.A.2', type: 'multiple-choice',
                text: `Student B solved 72 - 38 and got 46. What mistake did they make?`,
                correctAnswer: `Subtracted the smaller number from the larger number in the ones place`,
                options: createUniqueOptions([
                    `Subtracted the smaller number from the larger number in the ones place`,
                    `Forgot to borrow from the tens`,
                    `Subtracted the tens wrong`,
                    `Added instead of subtracted`
                ])
            };
        }
    }
};
