
import { Question } from "../../types";
import { getRandomInt, getRandomElement, shuffleArray, createUniqueOptions, selectQuestionType } from "../utils";

// 7. 3.G.A.2 - Fractions (Equal Parts)
export const genG2 = (id: number, customNames?: string[], subcategories?: string[]): Question => {
    // No specific subs requested, keeping logic
    const type = getRandomInt(0, 7);
    const parts = getRandomElement([2, 3, 4, 6, 8]);
    
    if (type === 0) { // Standard Visual (Equal)
        return {
            id, standardRef: '3.G.A.2', type: 'multiple-choice',
            text: `Which fraction shows the shaded part?`,
            visualInfo: { type: 'fraction-circle', numerator: 1, denominator: parts },
            correctAnswer: `1/${parts}`,
            options: createUniqueOptions([`1/${parts}`, `2/${parts}`, `1/2`, `3/${parts}`])
        };
    } else if (type === 1) { // Unequal Visual (Identify)
        const isCircle = Math.random() > 0.5;
        return {
            id, standardRef: '3.G.A.2', type: 'multiple-choice',
            text: `Does this shape show ${parts} equal parts?`,
            visualInfo: { 
                type: isCircle ? 'fraction-circle' : 'fraction-bar', 
                numerator: 1, 
                denominator: parts, 
                isUnequal: true // Triggers irregular drawing
            },
            correctAnswer: `No`,
            options: ['Yes', 'No']
        };
    } else if (type === 2) { // Logic Check Text
        return {
            id, standardRef: '3.G.A.2', type: 'multiple-choice',
            text: `A shape is cut into ${parts} parts, but they are NOT all the same size. Does this represent equal fractions?`,
            correctAnswer: `No`,
            options: ['Yes', 'No']
        };
    } else if (type === 3) { // Word Problem
        return {
            id, standardRef: '3.G.A.2', type: 'multiple-choice',
            text: `If you partition a rectangle into ${parts} equal rows, what fraction is one row?`,
            correctAnswer: `1/${parts}`,
            options: createUniqueOptions([`1/${parts}`, `${parts}/1`, `1/2`, `2/${parts}`])
        };
    } else if (type === 4) { // ADDED - Partitioning Task
        const shape = Math.random() > 0.5 ? 'rectangle' : 'circle';
        return {
            id, standardRef: '3.G.A.2', type: 'open-ended',
            text: `Partition the ${shape} into ${parts} equal parts.`,
            visualInfo: { 
                type: shape === 'rectangle' ? 'fraction-bar' : 'fraction-circle', 
                numerator: 0, 
                denominator: 1 
            }, // Show empty shape (1/1 empty)
            correctAnswer: `(Teacher Check: Shape divided into ${parts} equal areas)`
        };
    } else if (type === 5) { // ADDED - Shading Task
        return {
            id, standardRef: '3.G.A.2', type: 'open-ended',
            text: `Shade 1/${parts} of the shape below.`,
            visualInfo: { 
                type: 'fraction-bar', 
                numerator: 0, 
                denominator: parts 
            }, // Shows parts but none shaded
            correctAnswer: `(Teacher Check: 1 of ${parts} sections shaded)`
        };
    } else { // ADDED - Error Analysis
        return {
            id, standardRef: '3.G.A.2', type: 'multiple-choice',
            text: `A student says the shaded part is 1/${parts}. Is the student correct?`,
            visualInfo: { type: 'fraction-circle', numerator: 1, denominator: parts, isUnequal: true },
            correctAnswer: `No, because the parts are not equal sizes.`,
            options: createUniqueOptions([
                `No, because the parts are not equal sizes.`,
                `Yes, because 1 part is shaded out of ${parts}.`,
                `Yes, because it is a circle.`,
                `No, because it should be 2/${parts}.`
            ])
        };
    }
};

// 19. 3.G.A.1 - Shapes & Quadrilaterals
export const genGA1 = (id: number, customNames?: string[], subcategories?: string[]): Question => {
    // Map Subcategories
    // 'Name the Shape': [0, 1, 6],
    // 'Quadrilaterals': [2, 3, 4, 5]
    
    const map: Record<string, number[]> = {
        'Name the Shape': [0, 1, 6],
        'Quadrilaterals': [2, 3, 4, 5]
    };
    
    const type = selectQuestionType([0, 1, 2, 3, 4, 5, 6], subcategories, map);
    
    // Shapes pool
    const shapes = ['triangle', 'pentagon', 'hexagon', 'rectangle', 'square', 'rhombus', 'trapezoid'];
    const quads = ['rectangle', 'square', 'rhombus', 'trapezoid', 'kite'];
    const nonQuads = ['triangle', 'pentagon', 'hexagon', 'circle'];

    if (type === 0) { // Identify Shape
        const shape = getRandomElement(shapes);
        return {
            id, standardRef: '3.G.A.1', type: 'multiple-choice',
            text: `What is the name of this polygon?`,
            visualInfo: { type: 'geometry-shape', shapeName: shape },
            correctAnswer: shape,
            options: createUniqueOptions([shape, ...shuffleArray(shapes).filter(s=>s!==shape).slice(0,3)])
        };
    } else if (type === 1) { // Identify Attributes (Sides/Vertices)
        const shapeData = [
            { n: 'triangle', s: 3 }, { n: 'quadrilateral', s: 4 }, { n: 'pentagon', s: 5 }, { n: 'hexagon', s: 6 }, { n: 'octagon', s: 8 }
        ];
        const s = getRandomElement(shapeData);
        return {
            id, standardRef: '3.G.A.1', type: 'multiple-choice',
            text: `A polygon with ${s.s} sides and ${s.s} vertices is called a...`,
            correctAnswer: s.n,
            options: createUniqueOptions(shapeData.map(x => x.n))
        };
    } else if (type === 2) { // Quadrilateral Definition
        return {
            id, standardRef: '3.G.A.1', type: 'multiple-choice',
            text: `What makes a shape a quadrilateral?`,
            correctAnswer: `It has exactly 4 sides.`,
            options: createUniqueOptions([
                `It has exactly 4 sides.`,
                `It has equal sides.`,
                `It has 5 angles.`,
                `It is a square.`
            ])
        };
    } else if (type === 3) { // Identify Quadrilateral
        const target = getRandomElement(quads);
        const distractor = getRandomElement(nonQuads);
        return {
            id, standardRef: '3.G.A.1', type: 'multiple-choice',
            text: `Which of these is a quadrilateral?`,
            correctAnswer: target,
            options: createUniqueOptions([target, distractor, 'circle', 'cube'])
        };
    } else if (type === 4) { // NOT a quadrilateral
        const target = getRandomElement(nonQuads);
        const q1 = quads[0], q2 = quads[1], q3 = quads[2];
        return {
            id, standardRef: '3.G.A.1', type: 'multiple-choice',
            text: `Which shape is NOT a quadrilateral?`,
            correctAnswer: target,
            options: createUniqueOptions([target, q1, q2, q3])
        };
    } else if (type === 5) { // Draw
        const shape = getRandomElement(quads);
        return {
            id, standardRef: '3.G.A.1', type: 'open-ended',
            text: `Draw a ${shape}.`,
            visualInfo: { type: 'area-model', widthLabel: ' ', heightLabel: ' ' }, // Empty box
            correctAnswer: `(Teacher Check: Drawing of a ${shape})`
        };
    } else { // Categorization
        const isSquareRhombus = Math.random() > 0.5;
        if (isSquareRhombus) {
            return {
                id, standardRef: '3.G.A.1', type: 'multiple-choice',
                text: `Is a square also a rhombus?`,
                correctAnswer: `Yes, because it has 4 equal sides.`,
                options: createUniqueOptions([
                    `Yes, because it has 4 equal sides.`,
                    `No, a square has right angles.`,
                    `No, they are different shapes.`,
                    `Yes, because it is a rectangle.`
                ])
            };
        } else {
             return {
                id, standardRef: '3.G.A.1', type: 'multiple-choice',
                text: `Is a rectangle always a square?`,
                correctAnswer: `No, only if all 4 sides are equal length.`,
                options: createUniqueOptions([
                    `No, only if all 4 sides are equal length.`,
                    `Yes, they are the same thing.`,
                    `No, a rectangle has 5 sides.`,
                    `Yes, because it has right angles.`
                ])
            };
        }
    }
};
