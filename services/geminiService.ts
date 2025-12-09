
import { GoogleGenAI, Type, Schema } from "@google/genai";
import { GenerationConfig, WorksheetData, Question } from "../types";
import { getCacheKey, getFromCache, saveToCache } from "./cacheService";

const visualSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    type: { type: Type.STRING, enum: ["text-passage", "editing-task", "table", "bar-graph", "custom-image"] },
    
    // Text Passage
    passageTitle: { type: Type.STRING },
    passageContent: { type: Type.STRING, description: "The reading passage text. Repeat exact content for grouped questions." },
    
    // Editing Task
    sentenceToEdit: { type: Type.STRING },

    // Table
    tableHeaders: { type: Type.ARRAY, items: { type: Type.STRING } },
    tableRows: { type: Type.ARRAY, items: { type: Type.ARRAY, items: { type: Type.STRING } } },

    // Bar Graph
    graphTitle: { type: Type.STRING },
    xAxisLabel: { type: Type.STRING },
    yAxisLabel: { type: Type.STRING },
    dataPoints: { 
        type: Type.ARRAY, 
        items: { 
            type: Type.OBJECT, 
            properties: { 
                label: { type: Type.STRING }, 
                value: { type: Type.NUMBER } 
            } 
        } 
    },
    scale: { type: Type.NUMBER },
    icon: { type: Type.STRING, enum: ['circle', 'rect', 'star', 'smiley'] }
  }
};

const questionSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    id: { type: Type.NUMBER, description: "Unique identifier" },
    standardRef: { type: Type.STRING },
    text: { type: Type.STRING, description: "Question text." },
    type: { type: Type.STRING, enum: ["multiple-choice", "open-ended"] },
    options: { type: Type.ARRAY, items: { type: Type.STRING } },
    correctAnswer: { type: Type.STRING },
    visualInfo: visualSchema
  },
  required: ["id", "standardRef", "text", "type", "correctAnswer"]
};

const worksheetSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING },
    instructions: { type: Type.STRING },
    questions: { type: Type.ARRAY, items: questionSchema }
  },
  required: ["title", "questions"]
};

const groupSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    questions: { type: Type.ARRAY, items: questionSchema }
  },
  required: ["questions"]
};

// --- SYSTEM INSTRUCTION (STATIC ROLE & RULES) ---
const SYSTEM_INSTRUCTION = `
You are an expert, highly reliable 3rd-Grade ELA Worksheet Generator.
Your ONLY task is to return the requested worksheet data as a single JSON object.
You MUST adhere strictly to the provided JSON schema.
DO NOT include any conversational text, explanations, titles, or code block delimiters (e.g., 'json') outside of the JSON object itself.

PEDAGOGICAL & CONTENT RULES:
1. **Target Audience**: 3rd Grade (Age 8-9). Lexile 450L-800L. Simple, clear sentences.
2. **Pedagogy**:
   - **No Giveaways**: Do not explicitly define vocabulary words immediately after using them. Use context clues.
   - **Distractors**: Ensure wrong answers (A, B, C, D) are plausible.
   - **Randomization**: Randomize the position of the correct answer evenly.
3. **Content Diversity**:
   - **RI (Informational)**: Use diverse topics (Science, History, Animals, Space, Geography).
   - **RL (Fiction)**: Use diverse characters and settings (School, Fantasy, Home, Nature).
4. **Formatting**:
   - **Paragraphs**: Use double newlines (\\n\\n) to separate paragraphs in 'passageContent'.
   - **Poetry**: Use single newline (\\n) for line breaks and double (\\n\\n) for stanza breaks.
   - **Styling**: If a question asks about a bold or italicized word, apply Markdown (**word**, *word*) to that word in the passage.
5. **Integrated Passages**: If multiple standards allow, create ONE high-quality passage and group questions under it by using the exact same 'passageTitle' and 'passageContent'.
`;

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

function stripMarkdown(text: string): string {
  return text.replace(/```json/g, "").replace(/```/g, "").trim();
}

function robustJSONParse<T>(jsonString: string): T {
  const cleanText = stripMarkdown(jsonString);
  try {
    return JSON.parse(cleanText) as T;
  } catch (e) {
    console.warn("Initial JSON parse failed. Attempting structural recovery...", e);
  }

  const firstBrace = cleanText.indexOf('{');
  const lastBrace = cleanText.lastIndexOf('}');
  
  if (firstBrace !== -1 && lastBrace !== -1) {
      try {
          return JSON.parse(cleanText.substring(firstBrace, lastBrace + 1)) as T;
      } catch (e) {
         throw new Error("Failed to parse JSON response.");
      }
  }
  throw new Error("No JSON object found in response.");
}

function shuffleGroups<T>(array: T[]): T[] {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

// Detailed prompts for "Highly Proficient" standards
const STANDARD_DETAILS: Record<string, string> = {
  '3.R.RF.03ab': `Task: Identify prefix/suffix, break down words, meaning of affix.`,
  '3.R.RI.04': `Task: Distinguish literal vs figurative. DOK 2/3: Use context to determine meaning.`,
  '3.R.RL.04': `Task: Context Clues & Figurative Language (idioms, metaphors, mythology).`,
  '3.R.RI.05': `Task: Text Features (Sidebars, keywords, headers, charts). NO SPOILERS in Table of Contents.`,
  '3.R.RL.03': `Task: Connect character traits/motivations to actions/sequence. Cause/Effect in plot.`,
  'RI.2': `Task: Determine main idea (explicit or implicit) and recount key details.`,
  'RI.3': `Task: Relationships (Cause/Effect, Sequence, or Steps in a process).`,
  'RI.9': `Task: Compare Two Texts. MUST generate TWO short texts (Text 1 & Text 2) in 'passageContent'.`,
  '3.R.RL.01': `Task: Explicit reference to text evidence.`,
  '3.R.RI.01': `Task: Explicit reference to text evidence.`,
  'RI.7': `Task: Complex Illustrations. Generate 'bar-graph', 'table', or diagram description.`,
  'RL.7': `Task: 'visualInfo.type' must be 'text-passage'. Include [Illustration: ...] tag in content.`,
  'RL.5': `Task: Structure (Chapter, Scene, Stanza).`,
  'RL.2': `Task: Fables/Myths. Focus on Moral/Lesson.`
};

export const generateWorksheetContent = async (config: GenerationConfig, existingPassage?: { title: string, content: string }): Promise<WorksheetData> => {
  if (!import.meta.env.VITE_API_KEY) {
    throw new Error("API Key is missing.");
  }

  // 1. Check Cache (Hybrid: Local -> Server)
  const cacheKey = getCacheKey(config, existingPassage);
  const cachedData = await getFromCache(cacheKey);
  
  if (cachedData) {
      return cachedData;
  }

  const totalQuestions = config.selectedStandards.reduce((sum, stdId) => {
    return sum + (config.standardCounts[stdId] || 0);
  }, 0);

  const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_API_KEY });

  const lengthInstruction = {
      short: "100-150 words",
      medium: "200-300 words",
      long: "350-500 words"
  }[config.passageLength || 'medium'];

  let passageContext = "Mode: Generate NEW reading passages/content.";
  if (existingPassage) {
      passageContext = `Mode: EXTEND EXISTING PASSAGE.
      Existing Title: "${existingPassage.title}"
      Existing Content: "${existingPassage.content}"
      Requirement: Use this EXACT content for 'passageContent' in all new questions.`;
  }

  const prompt = `
    Generate a single ELA practice worksheet.
    Grade Level: 3rd Grade (Ages 8-9)
    Total Question Count: Exactly ${totalQuestions}
    
    Configuration:
    - Passage Length: ${lengthInstruction}
    - Student Names: ${config.studentNames ? config.studentNames : 'None provided'}
    - Custom Topic: ${config.customTopic ? config.customTopic : 'General Curriculum'}
    - Subcategory Focus: ${JSON.stringify(config.selectedSubcategories)}
    
    ${passageContext}

    Standards Breakdown:
    ${config.selectedStandards.map(s => {
       const details = STANDARD_DETAILS[s] || 'Standard Practice';
       return `- ID: ${s} | Count: ${config.standardCounts[s]} | Specifics: ${details}`;
    }).join('\n')}
  `;

  let text = "";
  let attempts = 0;
  const maxAttempts = 3;

  while (attempts < maxAttempts) {
      try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                systemInstruction: SYSTEM_INSTRUCTION, 
                responseMimeType: "application/json",
                responseSchema: worksheetSchema,
                temperature: 0.5,
            }
        });
        text = response.text || "";
        if (text) break; 
      } catch (error: any) {
        attempts++;
        if (attempts >= maxAttempts) throw error;
        await delay(2000);
      }
  }

  const data = robustJSONParse<WorksheetData>(text);

  // --- PASSAGE NORMALIZATION ---
  // Fixes issue where AI generates slightly different whitespace for the same passage,
  // preventing the frontend from grouping them correctly.
  const passageCanonicalMap = new Map<string, string>();

  for (const q of data.questions) {
    if (q.visualInfo?.passageContent) {
        // Create a fingerprint for the passage (collapsed whitespace)
        const fingerprint = q.visualInfo.passageContent.trim().replace(/\s+/g, ' ');
        
        // If we've seen this passage before (by fingerprint), use the stored instance string
        if (passageCanonicalMap.has(fingerprint)) {
            q.visualInfo.passageContent = passageCanonicalMap.get(fingerprint);
            // Optionally sync title if needed, but strict content match is the key for grouping
        } else {
            passageCanonicalMap.set(fingerprint, q.visualInfo.passageContent);
        }
    }
  }

  // --- SHUFFLING & GROUPING LOGIC ---
  const groupedQuestions: Question[][] = [];
  let currentGroup: Question[] = [];
  let lastPassageContent: string | null = null;

  for (const q of data.questions) {
      const qPassage = q.visualInfo?.passageContent;
      
      if (qPassage) {
         // Using the normalized strings, this equality check is now robust
         if (lastPassageContent === qPassage) {
             currentGroup.push(q);
         } else {
             if (currentGroup.length > 0) groupedQuestions.push(currentGroup);
             currentGroup = [q];
             lastPassageContent = qPassage;
         }
      } else {
          if (currentGroup.length > 0) groupedQuestions.push(currentGroup);
          groupedQuestions.push([q]);
          currentGroup = [];
          lastPassageContent = null;
      }
  }
  if (currentGroup.length > 0) {
      groupedQuestions.push(currentGroup);
  }

  const shuffledGroups = shuffleGroups(groupedQuestions);
  data.questions = shuffledGroups.flat();

  // 2. Save to Cache (Hybrid: Local & Server)
  await saveToCache(cacheKey, data);

  return data;
};

export const generateSingleQuestion = async (
    standard: string, 
    index: number, 
    subcategories?: string[],
    existingPassage?: { title: string, content: string }
): Promise<Question> => {
    if (!import.meta.env.VITE_API_KEY) throw new Error("API Key missing");

    const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_API_KEY });
    const standardDetail = STANDARD_DETAILS[standard] || "General practice";
    
    let prompt = "";
    if (existingPassage) {
        prompt = `
            Generate a single ELA question.
            Standard: ${standard}
            Details: ${standardDetail}
            Mode: EXTEND EXISTING PASSAGE.
            Context Title: "${existingPassage.title}"
            Context Content: "${existingPassage.content}"
            Requirement: Use 'text-passage' type with empty content (frontend handles context).
        `;
    } else {
        prompt = `
            Generate a single ELA question.
            Standard: ${standard}
            Details: ${standardDetail}
            Subcategories: ${subcategories ? subcategories.join(', ') : 'None'}
            Mode: NEW INDEPENDENT QUESTION.
            Requirement: Create a new short passage or visual if needed.
        `;
    }

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            systemInstruction: SYSTEM_INSTRUCTION,
            responseMimeType: "application/json",
            responseSchema: questionSchema,
            temperature: 0.5,
        }
    });

    return robustJSONParse<Question>(response.text!);
}

export const regenerateQuestionGroup = async (
    standard: string,
    count: number,
    subcategories?: string[],
    passageLength: 'short' | 'medium' | 'long' = 'medium'
): Promise<Question[]> => {
    if (!import.meta.env.VITE_API_KEY) throw new Error("API Key missing");

    const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_API_KEY });
    const standardDetail = STANDARD_DETAILS[standard] || "General practice";
    
    const lengthMap = {
      short: "Short (100-150 words)",
      medium: "Medium (200-300 words)",
      long: "Long (350-500 words)"
    };

    const prompt = `
        Generate a group of questions sharing a NEW passage.
        Standard: ${standard}
        Question Count: ${count}
        Passage Length: ${lengthMap[passageLength]}
        Subcategories: ${subcategories ? subcategories.join(', ') : 'None'}
        Details: ${standardDetail}
        Requirement: All questions must relate to the ONE new passage generated.
    `;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            systemInstruction: SYSTEM_INSTRUCTION,
            responseMimeType: "application/json",
            responseSchema: groupSchema,
            temperature: 0.5, 
        }
    });

    const data = robustJSONParse<{questions: Question[]}>(response.text!);
    
    // FORCE CONSISTENCY: Ensure all questions in this group share exactly the same passage string
    if (data.questions.length > 0) {
        const masterPassage = data.questions[0].visualInfo?.passageContent;
        const masterTitle = data.questions[0].visualInfo?.passageTitle;
        
        if (masterPassage) {
            data.questions.forEach(q => {
                if (q.visualInfo) {
                    q.visualInfo.passageContent = masterPassage;
                    if (masterTitle) q.visualInfo.passageTitle = masterTitle;
                }
            });
        }
    }

    return data.questions;
};

export const generateIllustration = async (prompt: string, aspectRatio: string = "16:9"): Promise<string> => {
    if (!import.meta.env.VITE_API_KEY) throw new Error("API Key missing");

    const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_API_KEY });

    // Use a simpler cache key for images
    const cacheKey = `img_cache_${aspectRatio}_${prompt.trim().toLowerCase().replace(/\s+/g, '_')}`;
    const cached = localStorage.getItem(cacheKey);
    if (cached) return cached;

    let attempts = 0;
    while (attempts < 3) {
        try {
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash-image',
                contents: {
                    parts: [{ text: prompt }]
                },
                config: {
                    imageConfig: {
                        aspectRatio: aspectRatio 
                    }
                }
            });

            for (const part of response.candidates?.[0]?.content?.parts || []) {
                if (part.inlineData) {
                    const result = `data:image/png;base64,${part.inlineData.data}`;
                    try { localStorage.setItem(cacheKey, result); } catch (e) {} // Best effort save
                    return result;
                }
            }
            throw new Error("No image data found in response");
        } catch (e) {
            attempts++;
            if (attempts >= 3) throw e;
            await delay(1000);
        }
    }

    throw new Error("No image generated.");
};
