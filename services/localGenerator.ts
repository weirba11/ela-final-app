
/**
 * DEPRECATED
 * 
 * This file previously contained logic for local math worksheet generation.
 * The application has been transitioned to a purely AI-driven ELA (English Language Arts) generator.
 * 
 * All generation logic is now handled in:
 * - services/geminiService.ts (Main AI Orchestrator)
 * - services/generators/ri.ts (Reading Informational)
 * - services/generators/rl.ts (Reading Literature)
 * - services/generators/rf.ts (Foundational Skills)
 * - services/generators/l.ts  (Language)
 */

import { WorksheetData, GenerationConfig } from "../types";

export const generateWorksheetContent = async (config: GenerationConfig): Promise<WorksheetData> => {
    throw new Error("Local generation is deprecated. Please use AI generation.");
};
