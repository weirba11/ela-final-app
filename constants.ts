import { Standard } from './types';

export const AVAILABLE_STANDARDS: Standard[] = [
  // Foundational Skills (RF)
  { 
    id: '3.R.RF.03ab', 
    code: 'RF.3.3', 
    description: 'Prefixes, Suffixes & Word Meaning', 
    category: 'RF',
    subcategories: ['Prefixes', 'Suffixes', 'Word Meaning']
  },

  // Reading Informational (RI) - Non-fiction
  { 
    id: '3.R.RI.01', 
    code: 'RI.3.1', 
    description: 'Text Evidence (Informational)', 
    category: 'RI' 
  },
  { 
    id: 'RI.2', 
    code: 'RI.3.2', 
    description: 'Main Idea & Details', 
    category: 'RI' 
  },
  { 
    id: 'RI.3', 
    code: 'RI.3.3', 
    description: 'Relationships: Events, Ideas, Steps', 
    category: 'RI',
    subcategories: ['Historical Events', 'Scientific Concepts', 'Technical Procedures']
  },
  { 
    id: '3.R.RI.04', 
    code: 'RI.3.4', 
    description: 'Context Clues (Informational)', 
    category: 'RI' 
  },
  { 
    id: '3.R.RI.05', 
    code: 'RI.3.5', 
    description: 'Text Features & Search Tools', 
    category: 'RI',
    subcategories: ['Sidebars', 'Keywords', 'Hyperlinks', 'Headers', 'Charts', 'Graphs']
  },
  { 
    id: 'RI.6', 
    code: 'RI.3.6', 
    description: 'Point of View (Author)', 
    category: 'RI' 
  },
  { 
    id: 'RI.7', 
    code: 'RI.3.7', 
    description: 'Complex Illustrations/Diagrams', 
    category: 'RI',
    subcategories: ['Diagrams', 'Bar Graphs', 'Timelines', 'Maps']
  },
  { 
    id: 'RI.8', 
    code: 'RI.3.8', 
    description: 'Text Structures (Connection)', 
    category: 'RI',
    subcategories: ['Comparison', 'Cause/Effect', 'Sequence'] 
  },
  { 
    id: 'RI.9', 
    code: 'RI.3.9', 
    description: 'Compare and Contrast Texts', 
    category: 'RI' 
  },

  // Reading Literature (RL) - Fiction
  { 
    id: '3.R.RL.01', 
    code: 'RL.3.1', 
    description: 'Text Evidence (Literature)', 
    category: 'RL' 
  },
  { 
    id: 'RL.2', 
    code: 'RL.3.2', 
    description: 'Fables, Folktales, and Myths', 
    category: 'RL',
    subcategories: ['Fables', 'Myths', 'Folktales']
  },
  { 
    id: '3.R.RL.03', 
    code: 'RL.3.3', 
    description: 'Complex Character Traits', 
    category: 'RL' 
  },
  { 
    id: '3.R.RL.04', 
    code: 'RL.3.4', 
    description: 'Context Clues (Literature)', 
    category: 'RL' 
  },
  { 
    id: 'RL.5', 
    code: 'RL.3.5', 
    description: 'Stories, Dramas, and Poems', 
    category: 'RL',
    subcategories: ['Parts of a Story', 'Parts of a Drama', 'Parts of a Poem']
  },
  { 
    id: 'RL.6', 
    code: 'RL.3.6', 
    description: 'Point of View (Narrator/Character)', 
    category: 'RL' 
  },
  { 
    id: 'RL.7', 
    code: 'RL.3.7', 
    description: 'Illustrations in Stories', 
    category: 'RL' 
  },
  { 
    id: 'RL.9', 
    code: 'RL.3.9', 
    description: 'Compare/Contrast Story Elements', 
    category: 'RL' 
  },

  // Language (L)
  { 
    id: '3.L.1', 
    code: '3.L.1', 
    description: 'Grammar and Usage', 
    category: 'L',
    subcategories: [
      'Nouns/Pronouns/Verbs/Adj/Adv', 
      'Regular/Irregular Plural Nouns', 
      'Abstract Nouns', 
      'Regular/Irregular Verbs', 
      'Simple Verb Tenses', 
      'Subject-Verb Agreement', 
      'Comparative/Superlative', 
      'Conjunctions', 
      'Simple/Compound/Complex Sentences'
    ]
  },
  { 
    id: '3.L.2', 
    code: '3.L.2', 
    description: 'Capitalization, Punctuation, Spelling', 
    category: 'L',
    subcategories: [
      'Titles', 
      'Commas in Addresses', 
      'Dialogue Punctuation', 
      'Possessives'
    ]
  },
  { 
    id: '3.L.3', 
    code: '3.L.3', 
    description: 'Knowledge of Language', 
    category: 'L',
    subcategories: ['Word Choice for Effect', 'Spoken vs Written English']
  },
  { 
    id: '3.L.4', 
    code: '3.L.4', 
    description: 'Vocabulary Acquisition', 
    category: 'L',
    subcategories: ['Affixes', 'Root Words', 'Context Clues', 'Dictionary Skills']
  },
  { 
    id: '3.L.5', 
    code: '3.L.5', 
    description: 'Word Relationships', 
    category: 'L',
    subcategories: ['Literal vs Nonliteral', 'Real-life Connections', 'Shades of Meaning']
  },
  { 
    id: '3.L.6', 
    code: '3.L.6', 
    description: 'Conversational & Academic Words', 
    category: 'L' 
  }
];

export const CATEGORY_COLORS: Record<string, string> = {
  'RI': 'bg-green-100 text-green-800 border-green-200',
  'RL': 'bg-blue-100 text-blue-800 border-blue-200',
  'L': 'bg-purple-100 text-purple-800 border-purple-200',
  'RF': 'bg-orange-100 text-orange-800 border-orange-200',
};