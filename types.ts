
export interface Standard {
  id: string;
  code: string;
  description: string;
  category: string;
  subcategories?: string[];
}

export enum QuestionType {
  MULTIPLE_CHOICE = 'Multiple Choice',
  OPEN_ENDED = 'Open Ended',
  MIXED = 'Mixed'
}

export type VisualType = 
  | 'text-passage'
  | 'editing-task'
  | 'custom-image'
  | 'table'
  | 'bar-graph'
  // Math Visual Types
  | 'array-group'
  | 'number-line'
  | 'area-model'
  | 'expression'
  | 'fraction-circle'
  | 'fraction-bar'
  | 'set-model'
  | 'fraction-comparison'
  | 'composite-area'
  | 'tiled-area'
  | 'clock'
  | 'money'
  | 'tally-chart'
  | 'pictograph'
  | 'ruler'
  | 'line-plot'
  | 'measurement-container'
  | 'geometry-shape';

export interface VisualData {
  type: VisualType;
  // Custom Image
  imageUrl?: string;
  imageWidth?: number; // Percentage (10-100)
  
  // ELA / Reading Passage
  passageTitle?: string;
  passageContent?: string;
  
  // Editing / Grammar
  sentenceToEdit?: string;
  
  // Tables (RI.5 Text Features)
  tableHeaders?: string[];
  tableRows?: string[][];

  // Bar Graphs (RI.7) & Math Charts
  graphTitle?: string;
  xAxisLabel?: string;
  yAxisLabel?: string;
  dataPoints?: { label: string; value: number }[];
  scale?: number;
  icon?: 'circle' | 'rect' | 'star' | 'smiley';

  // Math Visual Properties
  rows?: number;
  cols?: number;
  groupCount?: number;
  itemCount?: number;
  itemShape?: string;
  rowLengths?: number[];
  visualOptions?: VisualData[];

  start?: number;
  end?: number;
  tickCount?: number;
  jumps?: { start: number; size: number; count: number }[];
  labelMode?: 'all' | 'whole' | 'endpoints';
  highlightPoints?: number[];
  pointLabels?: { value: number; label: string }[];

  widthLabel?: string;
  heightLabel?: string;
  
  expression?: string;

  numerator?: number;
  denominator?: number;
  isUnequal?: boolean;
  setObjects?: string[];
  compareModels?: VisualData[];

  rect1?: { w: number; h: number };
  rect2?: { w: number; h: number };
  arrangement?: 'L-shape' | 'distributive';

  time?: string;
  coins?: number[];

  objectStart?: number;
  objectEnd?: number;

  plotData?: number[];

  shapeName?: string;
  capacity?: number;
  fluidLevel?: number;
  tickStrategy?: 'standard';
  weight?: number;
}

export interface Question {
  id: number;
  standardRef: string;
  text: string;
  type: 'multiple-choice' | 'open-ended';
  options?: string[];
  correctAnswer: string;
  visualInfo?: VisualData; 
  extraSpace?: number; // Height in pixels to add below question
}

export interface WorksheetData {
  title: string;
  instructions: string;
  questions: Question[];
}

export interface GenerationConfig {
  selectedStandards: string[];
  standardCounts: Record<string, number>; // Map standard ID to quantity
  selectedSubcategories: Record<string, string[]>; // Map standard ID to list of selected subcategories
  questionType: QuestionType;
  includeAnswerKey: boolean;
  titleMode: 'ai' | 'custom';
  customTitle: string;
  columns: 1 | 2;
  studentNames?: string;
  includeName: boolean;
  includeClass: boolean;
  includeDate: boolean;
  fontSize: 'small' | 'medium' | 'large';
  passageLength: 'short' | 'medium' | 'long';
  customTopic?: string;
}