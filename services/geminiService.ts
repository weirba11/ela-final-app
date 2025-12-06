
import { GoogleGenAI, Type, Schema } from "@google/genai";
import { GenerationConfig, WorksheetData, Question } from "../types";

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
  '3.R.RF.03ab': `
    **FOCUS**: Prefixes, Suffixes, and Syllabication (RF.3.3)
    - Identify words with prefixes/suffixes in context.
    - Break down words: Prefix/Suffix/Root.
    - Syllabication rules: VCCV, "Split the Twins", VCV (long vs short vowel), -le rule.
    - Create multisyllabic words or identify syllable splits.
    - Tasks: Identify prefix/suffix in a word, choose correct definition based on affix, split syllables.
  `,
  '3.R.RI.04': `
    **FOCUS**: Context Clues (Informational) & Vocabulary (RI.3.4)
    - Determine meaning of **General Academic Words** (e.g., analyze, conclude, compare) and **Domain-Specific Words** (e.g., habitat, condensation) in grade 3 texts.
    - Use **Context Clues** (explicit or implicit) to infer meaning.
    - Distinguish between literal and figurative meanings based on context.
    - **Cognitive Rigor**:
      - DOK 1 (Recall): Identify meaning directly stated or match word to definition.
      - DOK 2 (Skill/Concept): Use context clues to determine meaning; classify word type (academic vs domain).
      - DOK 3 (Strategic Thinking): Explain which clue helped and why; compare meanings across contexts.
    - **CRITICAL FORMATTING RULE**: If the question mentions a "bolded" or "italicized" word (e.g., "What does the bolded word mean?"), you **MUST** apply Markdown bold (**word**) or italics (*word*) to that specific word within the 'passageContent'.
  `,
  '3.R.RL.04': `
    **FOCUS**: Meaning of Words, Context Clues, & Figurative Language (RL.3.4)
    **SKILLS**:
    - **Meaning of Words**: Determine meaning using context clues (explicit and implicit).
    - **Literal vs Nonliteral**: Distinguish literal language (means exactly what it says) from figurative (idioms, similes, metaphors). Explain how context changes meaning.
    - **Mythology Allusions**: Include words/phrases alluding to mythology (e.g., Midas touch, Herculean, Achilles' heel, Pandora's box) and infer meaning.
    
    **OUTPUT CATEGORIES (Create a mix)**:
    1. **Meaning Explicitly Stated**: Short segments where meaning is clearly supported. DOK 1.
    2. **Meaning from Context**: Literary excerpts with subtle clues for unfamiliar vocabulary. DOK 2.
    3. **Literal vs Nonliteral**: Sentences where students classify the phrase as literal or nonliteral and explain why. DOK 1/2.
    4. **Figurative Language Types**: Identify similes, metaphors, idioms and explain the intended meaning. DOK 2/3.
    5. **Mythology/Allusion**: Short contexts using allusion-based words. Students infer meaning.
    
    **COGNITIVE RIGOR**:
    - DOK 1: Identify literal/nonliteral, match word to meaning.
    - DOK 2: Infer meaning from context.
    - DOK 3: Justify meaning with text evidence, explain impact on tone.
    
    **Highly Proficient Tasks**: Include multi-step items (Locate word -> Determine meaning -> Classify -> Explain).
    **FORMATTING**: Bold specific words in the passage (Markdown **word**) if the question asks about them.
  `,
  '3.R.RI.05': `
    **FOCUS**: Text Features & Search Tools (RI.3.5)
    **SKILLS**:
    - Use text features (sidebars, keywords, hyperlinks, bold print, subheadings, captions, glossaries, indexes, electronic menus, icons).
    - Use search tools to locate information relevant to a given topic efficiently.
    
    **VISUAL REQUIREMENTS**:
    - Generate visuals formatted as: 'table' (for charts/TOC), 'text-passage' (formatted like a sidebar, search result, or webpage with hyperlinks/bold text).
    
    **CRITICAL RULES**:
    - **NO SPOILERS**: If creating a Table of Contents (TOC), **DO NOT** write descriptions that give away the answers to Main Idea questions. The TOC should list chapters/sections without summarizing the core solution or main idea found in the text itself.
    - **Topic Variety**: Incorporate **3rd Grade AZ Science or Social Studies** topics (e.g., weather patterns, local plants/animals, state history) for variety.
    
    **Performance**:
    - *Minimally*: Locate explicitly stated info using basic features.
    - *Proficient*: Locate relevant info efficiently.
    - *Highly Proficient*: Analyze and interpret information using complex features and advanced search tools.
  `,
  '3.R.RL.03': `
    **FOCUS**: Character Traits, Actions, and Plot (RL.3.3)
    **SKILLS**:
    - **Character Description**: Describe traits, motivations, and feelings. Identify characteristics that are explicitly stated vs implicitly shown.
    - **Actions and Plot**: Explain how a character's actions contribute to the sequence of events. Connect traits/motivations to what happens next.
    - **Complexity**: Describe complex characters and explain how their actions affect the sequence of events.

    **OUTPUT CATEGORIES (Create a mix)**:
    1. **Identify Character Traits/Feelings/Motivations**: Short excerpts. Name the trait/feeling/motivation. Include explicit and implied examples. (DOK 1/2)
    2. **Evidence-Based Character Questions**: "What in the text shows...?" or "Which detail best supports that the character is [trait]?" (DOK 2/3)
    3. **Action → Sequence of Events**: Questions linking action to plot order. "Because the character did X, what happened next?" or "How did this action move the story forward?" (DOK 2)
    4. **Explicit vs Implicit Characterization**: Decide if a trait/action is clearly stated or inferred. Explain which clues helped. (DOK 2)
    5. **Cause and Effect in Plot**: Focus on how personality leads to action, and action leads to events. Map the chain of events. (DOK 2/3)
    6. **Compare Characters**: Compare traits/motivations between two characters with evidence. (DOK 3)

    **Highly Proficient Tasks (Multi-Step)**:
    - Choose a main character -> Identify a key action -> Describe trait/feeling/motivation connected to action -> Cite evidence -> Explain how action affected the sequence.
  `,
  'RI.2': `
    **FOCUS**: Main Idea & Key Details (RI.3.2)
    **SKILLS**:
    - **Main Idea**: Determine the main idea of an expository (informational) text. Can be explicitly stated or implicit.
    - **Key Details**: Identify, recount, and paraphrase key details. Explain how details support the main idea.
    - **Paraphrasing**: Rewrite details in own words (accurate meaning, not copying).
    
    **OUTPUT CATEGORIES (Create a mix)**:
    1. **Explicit Main Idea Practice**: Short informational passage with directly stated main idea. Identify main idea and 2-3 supporting details. (DOK 1)
    2. **Implicit Main Idea Practice**: Passage where main idea is inferred from repeated/important details. (DOK 2/3)
    3. **Key Detail Identification**: Choose/list key details. Include "Which detail does NOT support the main idea?" (DOK 1)
    4. **Paraphrasing Details**: Rewrite key details in own words. Focus on accurate meaning. (DOK 2)
    5. **Explain How Details Support**: Connect detail to main idea ("This detail supports the main idea because..."). (DOK 3)
    6. **Text Features Connection**: How headings, captions, bold words support/reveal main idea.
    
    **Highly Proficient Tasks (Multi-Step)**:
    - Determine an implicit main idea -> Recount/paraphrase 3 key details -> Explain how each supports main idea.
  `,
  'RI.3': `
    **FOCUS**: Relationships in Informational Text (RI.3.3)
    **SKILLS**:
    - Describe the relationship between a series of historical events, scientific ideas or concepts, or steps in technical procedures.
    - Use language that pertains to time, sequence, and cause/effect.
    
    **OUTPUT CATEGORIES**:
    1. **Historical Events (Time/Sequence)**: Passages about history. Ask about the order of events or how one event led to another.
    2. **Scientific Ideas (Cause/Effect)**: Passages about nature/science. Ask "What happens when...?" or "Why does...?"
    3. **Technical Procedures (Steps)**: "How-to" texts or recipes. Ask about the order of steps or the result of a step.
    4. **Signal Words**: Identify words that show connection (e.g., "because", "finally", "as a result").
    
    **Highly Proficient Tasks**:
    - Explain the relationship between two specific events/ideas using evidence.
  `,
  'RI.9': `
    **FOCUS**: Compare and Contrast Two Texts (RI.3.9)
    **SKILLS**:
    - Compare and contrast the most important points and key details presented in two texts on the same topic.
    - Recognize similarities and differences.
    - Use text evidence to support comparisons.
    
    **VISUAL REQUIREMENT**:
    - The 'passageContent' MUST contain **TWO distinct short texts** labeled clearly (e.g., "**Text 1: [Title]**" and "**Text 2: [Title]**").
    - Topic Ideas: Two texts on the same animal (e.g., Alligators vs Crocodiles), a natural phenomenon, historical figure, or event.
    
    **OUTPUT CATEGORIES**:
    1. **Similarities**: Identify a key detail present in both texts.
    2. **Differences**: Identify a point made in Text 1 that is missing or different in Text 2.
    3. **Compare Main Points**: How is the main focus of Text 1 different from Text 2?
    4. **Highly Proficient**: Explain a key role a detail plays in both texts, or find a point distinct to one.
  `,
  '3.R.RL.01': `
    **FOCUS**: Text Evidence (Literature)
    - Ask/answer questions referring explicitly to the text.
    - Tasks: "Which sentence from the story shows that..."
  `,
  '3.R.RI.01': `
    **FOCUS**: Text Evidence (Informational)
    - Ask/answer questions referring explicitly to the text.
    - Tasks: "According to the text, why do..."
  `,
  'RI.7': `
    **FOCUS**: Complex Illustrations
    - **VISUAL REQUIREMENT**: Generate a 'bar-graph', 'table', or 'text-passage' describing a diagram.
    - Tasks: Interpret data from a graph or table.
  `,
  'RL.7': `
    **FOCUS**: Illustrations + Text Connection (RL.3.7)
    **SKILLS**:
    - Explain how specific aspects of illustrations contribute to what words convey.
    - Identify reflection of character traits, setting, and mood in illustrations.
    - Use explicit details and inferences from illustrations.
    - **COMPARE/CONTRAST**: Identify details present ONLY in the text or ONLY in the illustration.

    **VISUAL REQUIREMENT**:
    - **CRITICAL**: You MUST set 'visualInfo.type' to 'text-passage'.
    - You MUST provide a **bracketed description** of the illustration within the 'passageContent'.
    - Example: "[Illustration: The old house stood on a hill, its windows like angry eyes...]"
    - The questions should then ask about this described illustration.

    **OUTPUT CATEGORIES**:
    1. **Notice & Identify Illustration Details**: Name specific visual details (color, expression, objects, background, perspective).
    2. **Illustration → Character**: How the picture shows feelings, traits, motivations.
    3. **Illustration → Setting**: Emphasize where/when and why it matters.
    4. **Illustration → Mood**: How choices (light/shadow, angle, color) create feeling (tense, calm, gloomy).
    5. **Text + Illustration Match**: Select words/sentences that connect to the illustration.
    6. **Illustration Impact / Meaning Change**: How the illustration adds meaning beyond words.
    7. **Text vs Illustration Differences**:
       - "What detail is found in the illustration but NOT in the text?" (e.g., "The text says the boy was happy, but the illustration shows him holding a red balloon which wasn't mentioned.")
       - "What information does the text provide that is missing from the illustration?"

    **Highly Proficient Tasks**:
    - Identify 2-3 illustration aspects and explain how they support/change understanding.
  `,
  'RL.5': `
    **FOCUS**: Structure of Stories, Dramas, and Poems (RL.3.5)
    **SKILLS**:
    - **Refer to Parts**: Use correct terms: chapter (stories), scene/act (dramas), stanza/verse/line (poems).
    - **Building Over Time**: Describe how each successive part builds on earlier sections.
    - **Structure Help**: Explain how structure develops plot, characters, setting, and conflict/resolution.

    **VISUAL REQUIREMENT (CRITICAL POETRY RULES)**:
    - **CRITICAL**: The 'passageContent' MUST be clearly divided.
    - **Stories**: Use headers like "**CHAPTER 1: [Title]**" and "**CHAPTER 2: [Title]**".
    - **Dramas**: Use headers like "**SCENE 1**" and "**SCENE 2**" with stage directions.
    - **Poems**:
       1. **VISUAL LOOK**: It MUST look like a poem (vertical column), NOT a paragraph.
       2. **LINE BREAKS**: You MUST use a single newline character (\\n) at the end of EVERY line of verse. Do NOT write lines as run-on sentences.
       3. **STANZA BREAKS**: Use double newlines (\\n\\n) to separate stanzas.
       4. **NO LABELS**: DO NOT LABEL STANZAS (e.g. do not write "**Stanza 1**"). Just use the whitespace.

    **OUTPUT CATEGORIES**:
    1. **Identify Terms**: Label parts correctly (e.g., "Which part of the text is this?"). (DOK 1)
    2. **Locate Part**: "In Chapter 2 / Scene 1, what happens?" (DOK 1)
    3. **Successive Building**: "How does Chapter 2 build on the events in Chapter 1?" or "How does Stanza 3 complete the idea in Stanza 1?" (DOK 2)
    4. **Beginning-Middle-End**: Connect sections to conflict (beginning), climax (middle), and resolution (end).
    5. **Author's Purpose**: Explain why the author organized it this way (pacing, suspense, mood). (DOK 3)
    6. **Poem-Specific**: How stanzas add new images/feelings over time.
    7. **Drama-Specific**: How dialogue/actions in a scene advance character plans.

    **Highly Proficient Tasks**:
    - Identify a part -> Describe what it adds -> Explain how it depends on/changes the earlier part.
  `,
  'RL.2': `
    **FOCUS**: Fables, Folktales, and Myths (RL.3.2)
    **CONTENT REQUIREMENT**:
    - **USE REAL ADAPTATIONS**: You MUST use adaptations of **famous/real** fables, myths, or folktales (e.g., Aesop's Fables, Greek Myths, Native American Folktales, Anansi stories, Paul Bunyan).
    - **DO NOT** make up generic stories. Use classic stories like "The Tortoise and the Hare", "King Midas", "The Boy Who Cried Wolf", "Coyote Steals Fire".
    - **Moral/Lesson**: Questions should focus on recounting the story and determining the central message, lesson, or moral.
    - **Paragraphs**: Ensure the story is divided into clear paragraphs using double newlines.
    
    **SKILLS**:
    - Recount stories, including fables, folktales, and myths from diverse cultures.
    - Determine the central message, lesson, or moral and explain how it is conveyed through key details in the text.
  `
};

export const generateWorksheetContent = async (config: GenerationConfig, existingPassage?: { title: string, content: string }): Promise<WorksheetData> => {
  if (!import.meta.env.VITE_API_KEY) {
    throw new Error("API Key is missing.");
  }

  const totalQuestions = config.selectedStandards.reduce((sum, stdId) => {
    return sum + (config.standardCounts[stdId] || 0);
  }, 0);

  const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_API_KEY });

  const subcats = JSON.stringify(config.selectedSubcategories);
  
  // Set length instruction based on config
  const lengthInstruction = {
      short: "Keep reading passages SHORT (approx. 100-150 words).",
      medium: "Keep reading passages MEDIUM length (approx. 200-300 words).",
      long: "Make reading passages LONG and detailed (approx. 350-500 words)."
  }[config.passageLength || 'medium'];

  // Handle Student Names
  let nameInstruction = "";
  if (config.studentNames && config.studentNames.trim().length > 0) {
      nameInstruction = `
        **STUDENT NAMES INSTRUCTION (IMPORTANT)**:
        - You have been provided these student names: [${config.studentNames.trim()}].
        - **FICTION (RL Standards)**: You MUST weave these names into your stories as characters! Make it fun for the class.
        - **WORD PROBLEMS**: Use these names in math or grammar word problems.
        - **NON-FICTION (RI Standards)**: Do **NOT** use these names in historical, scientific, or technical passages. Keep RI texts strictly factual and academic.
      `;
  }

  let passageContextInstruction = "";
  if (existingPassage) {
      passageContextInstruction = `
        **CONTEXTUAL EXTENSION MODE (CRITICAL)**:
        - The user wants to add more questions to the **EXISTING PASSAGE** below.
        - **DO NOT CREATE A NEW PASSAGE.**
        - You MUST use the following passage content EXACTLY as provided for the 'visualInfo.passageContent' of every new question.
        - **Passage Title**: "${existingPassage.title}"
        - **Passage Content**: "${existingPassage.content}"
        - Generate ${totalQuestions} questions that relate to this specific text.
      `;
  } else {
      passageContextInstruction = `
        **NEW CONTENT MODE**:
        - You must create **NEW** high-quality reading passages.
        - **CRITICAL**: For any RL (Fiction) or RI (Informational) standard, you **MUST** generate a passage. Do NOT create standalone questions without a passage for Reading standards.
        - Even if only 1-2 questions are requested, providing a passage is mandatory for Reading standards.
      `;
  }

  let topicInstruction = "";
  if (config.customTopic && config.customTopic.trim().length > 0) {
      topicInstruction = `
        **USER TOPIC REQUEST (HIGHEST PRIORITY)**:
        - The user EXPLICITLY requested the content be about: "${config.customTopic.trim()}".
        - **Fiction (RL)**: Use this as the core plot/theme.
        - **Non-Fiction (RI)**: Use this as the main topic.
        - Ignore other topic randomization rules if they conflict with this specific request.
      `;
  }

  const prompt = `
    You are an expert 3rd Grade ELA teacher.
    
    **TASK**: Create an ELA worksheet with exactly ${totalQuestions} questions.
    
    ${passageContextInstruction}

    **TARGET AUDIENCE**: 3rd Grade students (Age 8-9). 
    - Use appropriate vocabulary (Lexile 450L-800L).
    - Sentences should be simple and clear.

    **PASSAGE LENGTH PREFERENCE**:
    - ${lengthInstruction}

    ${nameInstruction}
    ${topicInstruction}

    **STANDARDS REQUESTED**: 
    ${config.selectedStandards.map(s => {
       const details = STANDARD_DETAILS[s] ? `\n    RULES FOR ${s}: ${STANDARD_DETAILS[s]}` : '';
       return `- ${s}: ${config.standardCounts[s]} questions${details}`;
    }).join('\n')}

    **SUBCATEGORIES**: 
    ${subcats}

    **IMPORTANT RULES**:
    
    1. **INTEGRATED PASSAGE STRATEGY (IMPORTANT)**:
       - **Integration**: If multiple Reading standards are selected, try to create **ONE or TWO high-quality, multi-paragraph passages** that serve multiple questions across these standards.
       - **Grouping**: To associate multiple questions with the same passage, simply provide the **EXACT SAME** 'passageTitle' and 'passageContent' in the JSON for those questions. The frontend will automatically group them.
       - **RI.9 SPECIAL CASE**: If RI.9 is selected, you MUST generate two texts (Text 1 & Text 2) on the same topic within the 'passageContent'.
       - **RL.5 / RL.7 SPECIAL CASE**: If these are selected, you **MUST** populate 'visualInfo' with type='text-passage', 'passageTitle', and 'passageContent'. Do NOT leave them empty.

    2. **AVOID "GIVEAWAYS" (VOCABULARY)**:
       - When testing vocabulary or context clues (RI.4/RL.4), **NEVER** explicitly define the word immediately after using it.
       - **BAD**: "Many desert animals are **nocturnal**. This means they are awake and active at night." (Answer given away).
       - **GOOD**: "Many desert animals are **nocturnal**. While the sun blazes during the day, they sleep in cool burrows. They only come out to hunt when the moon is high." (Requires inference).
       - Make the student use inference skills!

    3. **ANSWER RANDOMIZATION**:
       - Randomize the position of the correct answer (A, B, C, or D) evenly across questions.
       - Ensure distractor options are plausible but incorrect.
    
    4. **RI Standards (Informational) - TOPIC VARIETY IS CRITICAL**:
       - CONTENT MUST BE NON-FICTION.
       - **DIVERSE TOPICS**: You MUST use a wide range of topics. Do **NOT** rely only on Deserts.
         - **Science**: Rainforests, Oceans, Polar Regions (Arctic/Antarctic), Space/Planets, Magnets, Simple Machines, Life Cycles (frogs, butterflies), Weather (blizzards, tornadoes, hurricanes), Coral Reefs, Volcanoes, Earthquakes.
         - **Social Studies**: Famous Inventors, Ancient Civilizations (Egypt, Rome, China), Community Helpers, Maps/Geography (mountains, rivers), Different Cultures/Festivals.
         - **Animals**: Use a WIDE variety (Armadillos, Narwhals, Tree Frogs, Beetles, Hawks, Owls, Geckos, Whales, Penguins, Koalas). NOT just bees or desert animals.
         - **AZ Specific**: You may include **MAXIMUM 1** passage about Desert habitats/Monsoons/Canyons per worksheet. Do not make the whole worksheet about this.
       - **AVOID REPETITION**: If one passage is about a desert, the next MUST be about something completely different (e.g., Space or the Ocean).

    5. **RL Standards (Literature)**:
       - CONTENT MUST BE FICTION.
       - **SUBJECTS**: Use diverse characters and settings.
         - **Settings**: A busy city, a farm, a magical forest, a spaceship, a school, a messy bedroom, a beach, a snowy mountain.
         - **Characters**: Talking animals (squirrels, foxes, wise owls), mythological creatures (dragons, unicorns), or realistic children facing relatable problems (lost homework, making friends).
       - **ILLUSTRATIONS (RL.7)**: If RL.7 is selected, ensure the passage contains at least one **[Illustration: ...description...]** tag that describes a scene relevant to the story's mood, character, or setting.

    6. **Visual Info**:
       - 'text-passage': Fill 'passageTitle', 'passageContent'.
       - 'table': Fill 'tableHeaders' and 'tableRows'.
       - 'bar-graph': Fill 'graphTitle', 'xAxisLabel', 'yAxisLabel', 'dataPoints'.

    7. **Formatting Consistency**:
       - If a question asks about a bolded, italicized, or underlined word, that word **MUST** have the corresponding Markdown formatting in the \`passageContent\`.
       - Bold: **word**
       - Italics: *word*
    
    8. **PARAGRAPH & POETRY FORMATTING (CRITICAL)**:
       - **Prose**: You **MUST** use double newlines (\\n\\n) to separate paragraphs in your 'passageContent'. Break text into 2-4 readable paragraphs.
       - **Poetry**: If generating a poem, you **MUST** use a single newline (\\n) at the end of EVERY line of verse so it renders as a vertical column, NOT a paragraph. Use double newlines (\\n\\n) between stanzas.

    **OUTPUT**:
    Return ONLY valid JSON matching the schema.
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
                responseMimeType: "application/json",
                responseSchema: worksheetSchema,
                temperature: 0.95, // Higher temperature for better variety
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

  // --- SHUFFLING & GROUPING LOGIC ---
  // We want to shuffle the questions so standards are mixed,
  // BUT we must keep questions that share the same passage grouped together
  // so the Integrated Passage Strategy works in the UI.

  const groupedQuestions: Question[][] = [];
  let currentGroup: Question[] = [];
  let lastPassageContent: string | null = null;

  for (const q of data.questions) {
      const qPassage = q.visualInfo?.passageContent;

      // Logic: If there is a passage, and it matches the last one, keep grouping.
      // If it's a standalone question (no passage), it forms its own group (size 1).
      // If it's a NEW passage, it starts a new group.
      
      if (qPassage) {
         if (lastPassageContent === qPassage) {
             currentGroup.push(q);
         } else {
             // New passage
             if (currentGroup.length > 0) groupedQuestions.push(currentGroup);
             currentGroup = [q];
             lastPassageContent = qPassage;
         }
      } else {
          // No passage - always break group
          if (currentGroup.length > 0) groupedQuestions.push(currentGroup);
          // Add this question as a single-item group
          groupedQuestions.push([q]);
          currentGroup = [];
          lastPassageContent = null;
      }
  }
  // Push final group
  if (currentGroup.length > 0) {
      groupedQuestions.push(currentGroup);
  }

  // Shuffle the groups so standards are mixed
  // BUT: If extending existing passage, maybe don't shuffle? 
  // Actually shuffling is fine as long as they are grouped.
  const shuffledGroups = shuffleGroups(groupedQuestions);

  // Flatten back to single array
  data.questions = shuffledGroups.flat();

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
    
    // Add specific standard details if available
    const standardDetail = STANDARD_DETAILS[standard] || "";

    let prompt = "";
    
    if (existingPassage) {
        prompt = `
            You are a 3rd Grade ELA teacher.
            
            **TASK**: Generate exactly ONE NEW question for standard: ${standard} based on the reading passage provided below.
            ${standardDetail}
            
            **PASSAGE CONTEXT**:
            Title: "${existingPassage.title}"
            Content: "${existingPassage.content}"
            
            **RULES**:
            1. The question must be DIFFERENT from previous questions.
            2. Randomize the correct answer position (A, B, C, or D).
            3. Return a valid JSON Question object.
            4. In 'visualInfo', set type to 'text-passage' but leave 'passageContent' empty (frontend handles it).
            5. If referencing a specific word in the text, refer to it exactly as it appears (e.g. if bolded in passage, refer to "the bolded word").
            6. **NO GIVEAWAYS**: Do not explicit define words in the question text that you are asking the student to define.
        `;
    } else {
        prompt = `
            Generate exactly ONE 3rd Grade ELA question for standard: ${standard}.
            Subcategories: ${subcategories ? subcategories.join(', ') : 'General'}.
            ${standardDetail}
            
            RULES:
            - **Grade Level**: 3rd Grade.
            - **Randomize Answer Position**: Ensure the correct answer is randomly placed (A, B, C, or D).
            - If RI, use NON-FICTION. Prioritize variety (Space, Ocean, History, Science) - DO NOT default to Deserts.
            - If RL, use FICTION.
            - **Subjects**: Use a variety of animals, insects (not just bees), birds, or realistic situations.
            - **NO GIVEAWAYS**: If testing vocabulary, use context clues in the passage, do not define it explicitly next to the word.
            - **Formatting**: If the question asks about a bold/italicized word, you MUST apply that Markdown formatting to the word in the 'passageContent'.
            - **Visual Info**: You MUST populate 'visualInfo' with type='text-passage', 'passageTitle', and 'passageContent'.
            - **Formatting (Paragraphs/Poems)**: 
               - Use double newlines (\\n\\n) for paragraphs.
               - For POEMS, use single newline (\\n) for line breaks and double (\\n\\n) for stanza breaks.
            
            Return ONLY the Question JSON object.
        `;
    }

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: questionSchema,
            temperature: 0.9,
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
    const standardDetail = STANDARD_DETAILS[standard] || "";
    
    // Set length instruction based on parameter
    const lengthInstruction = {
      short: "Keep the reading passage SHORT (approx. 100-150 words).",
      medium: "Keep the reading passage MEDIUM length (approx. 200-300 words).",
      long: "Make the reading passage LONG and detailed (approx. 350-500 words)."
    }[passageLength];

    const prompt = `
        You are a 3rd Grade ELA teacher.
        
        **TASK**: Create a brand NEW reading passage (or visual) and exactly ${count} questions about it for standard: ${standard}.
        
        **PASSAGE LENGTH**: ${lengthInstruction}

        **SUBCATEGORIES**: ${subcategories ? subcategories.join(', ') : 'General'}
        
        ${standardDetail}
        
        **RULES**:
        1. **NEW CONTENT**: Do NOT use the same passage as before. Create a fresh story or article.
        2. **Consistency**: All ${count} questions must relate to this NEW passage/visual.
        3. **Visual Info**: Populate 'visualInfo' (passageContent, passageTitle, etc.) IDENTICALLY for all questions in this group so they are grouped together.
        4. **Spoilers**: If creating a Table of Contents (RI.5), do not reveal answers (Main Idea) in the table itself.
        5. **Randomization**: Randomize answer choices.
        6. **Topic/Subjects**: 
           - If Informational (RI), use **DIVERSE TOPICS** (Rainforest, Tundra, Space, Ancient History, Inventions). **AVOID** Deserts if possible to ensure variety.
           - If Fiction (RL), use diverse characters and settings (School, Fantasy, Space, Ocean).
        7. **NO GIVEAWAYS**: Do NOT explicit define vocabulary words in the text immediately after using them. Use context clues.
        8. **Visual Type**: Ensure 'visualInfo.type' is set to 'text-passage' if creating a story/article.
        9. **Formatting (Paragraphs/Poems)**:
           - Use double newlines (\\n\\n) for paragraphs.
           - For POEMS, use single newline (\\n) for line breaks and double (\\n\\n) for stanza breaks.
        
        **OUTPUT**:
        Return a valid JSON object with a "questions" array containing ${count} items.
    `;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: groupSchema,
            temperature: 0.95, // High temp for variety
        }
    });

    const data = robustJSONParse<{questions: Question[]}>(response.text!);
    return data.questions;
};

export const generateIllustration = async (prompt: string): Promise<string> => {
    if (!import.meta.env.VITE_API_KEY) throw new Error("API Key missing");

    const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_API_KEY });

    // Use gemini-2.5-flash-image for image generation
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
                        aspectRatio: "16:9" // Suitable for worksheets
                    }
                }
            });

            for (const part of response.candidates?.[0]?.content?.parts || []) {
                if (part.inlineData) {
                    return `data:image/png;base64,${part.inlineData.data}`;
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
