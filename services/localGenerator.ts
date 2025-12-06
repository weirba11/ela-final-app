
import { Question, WorksheetData, GenerationConfig, QuestionType } from "../types";
import { AVAILABLE_STANDARDS } from "../constants";
import { generateOptions } from "./utils";

// Generators
import { genOA1, genOA2, genOA3, genOA4, genOAB5, genOA9, genOAC7, genOAD8 } from "./generators/oa";
import { genNBT1, genNBT2, genNBT3 } from "./generators/nbt";
import { genNF1, genNF2, genNF3 } from "./generators/nf";
import { genMDC7, genMDA1a, genMDA1b, genMDB3, genMDB4, genMDC8, genMDA2 } from "./generators/md";
import { genG2, genGA1 } from "./generators/g";

// --- MAIN FACTORY ---

export const generateQuestionForStandard = (stdId: string, id: number, qType: QuestionType, customNames?: string[], subcategories?: string[]): Question => {
  let q: Question;
  switch (stdId) {
    case '3.OA.A.1': q = genOA1(id, customNames, subcategories); break;
    case '3.OA.A.2': q = genOA2(id, customNames, subcategories); break;
    case '3.OA.A.3': q = genOA3(id, customNames, subcategories); break;
    case '3.OA.A.4': q = genOA4(id, customNames, subcategories); break;
    case '3.OA.B.5': q = genOAB5(id, customNames, subcategories); break;
    case '3.NBT.A.1': q = genNBT1(id, customNames, subcategories); break;
    case '3.NBT.A.3': q = genNBT3(id, customNames, subcategories); break;
    case '3.G.A.2': q = genG2(id, customNames, subcategories); break;
    case '3.NF.A.1': q = genNF1(id, customNames, subcategories); break;
    case '3.OA.A.9': q = genOA9(id, customNames, subcategories); break;
    case '3.NF.A.2': q = genNF2(id, customNames, subcategories); break;
    case '3.NF.A.3': q = genNF3(id, customNames, subcategories); break;
    case '3.MD.C.7': q = genMDC7(id, customNames, subcategories); break;
    case '3.OA.C.7': q = genOAC7(id, customNames, subcategories); break;
    case '3.MD.A.1a': q = genMDA1a(id, customNames, subcategories); break;
    case '3.MD.A.1b': q = genMDA1b(id, customNames, subcategories); break;
    case '3.OA.D.8': q = genOAD8(id, customNames, subcategories); break;
    case '3.MD.B.3': q = genMDB3(id, customNames, subcategories); break;
    case '3.MD.B.4': q = genMDB4(id, customNames, subcategories); break;
    case '3.G.A.1': q = genGA1(id, customNames, subcategories); break;
    case '3.MD.C.8': q = genMDC8(id, customNames, subcategories); break;
    case '3.MD.A.2': q = genMDA2(id, customNames, subcategories); break;
    case '3.NBT.A.2': q = genNBT2(id, customNames, subcategories); break;
    default: q = { id, standardRef: stdId, type: 'open-ended', text: `Logic pending for ${stdId}`, correctAnswer: "0" };
  }

  // Initialize spacing
  q.extraSpace = 0;

  if (qType === QuestionType.OPEN_ENDED) {
      q.type = 'open-ended';
      delete q.options;
  } else if (qType === QuestionType.MULTIPLE_CHOICE) {
      q.type = 'multiple-choice';
      if (!q.options) q.options = generateOptions(q.correctAnswer || "0", 'number');
  }
  
  return q;
};

// HELPER: Generate signature to detect duplicates
export const getQuestionSignature = (q: Question): string => {
    return JSON.stringify({
        t: q.text,
        v: q.visualInfo || null,
        a: q.correctAnswer
    });
};

export const generateWorksheetContent = async (config: GenerationConfig): Promise<WorksheetData> => {
  // Simulate network delay for UX
  await new Promise(r => setTimeout(r, 150));
  const questions: Question[] = [];
  const seenSignatures = new Set<string>();
  
  // Parse Custom Names
  let customNames: string[] | undefined = undefined;
  if (config.studentNames && config.studentNames.trim().length > 0) {
      customNames = config.studentNames.split(/[\n,]+/).map(n => n.trim()).filter(n => n.length > 0);
  }

  // Build a queue of standards based on requested counts
  const standardQueue: string[] = [];
  
  // We iterate over the SELECTED standards array to maintain some order, 
  // but we pull the count from standardCounts
  config.selectedStandards.forEach(stdId => {
      const count = config.standardCounts[stdId] || 0;
      for(let k=0; k<count; k++) {
          standardQueue.push(stdId);
      }
  });

  // Generate questions
  for (let i = 0; i < standardQueue.length; i++) {
    const std = standardQueue[i];
    const subcategories = config.selectedSubcategories[std];
    let bestQ: Question | null = null;
    
    // Try up to 5 times to generate a unique question for this slot
    for(let attempt = 0; attempt < 5; attempt++) {
        const candidate = generateQuestionForStandard(std, i + 1, config.questionType, customNames, subcategories);
        const sig = getQuestionSignature(candidate);
        
        if (!seenSignatures.has(sig)) {
            seenSignatures.add(sig);
            bestQ = candidate;
            break;
        }
    }
    
    // If we couldn't find a unique one (rare), just take a fresh one
    if (!bestQ) {
        bestQ = generateQuestionForStandard(std, i + 1, config.questionType, customNames, subcategories);
    }

    questions.push(bestQ);
  }

  return {
    title: config.customTitle || "3rd Grade Math Worksheet",
    instructions: "Read each question carefully. Show your work.",
    questions
  };
};
