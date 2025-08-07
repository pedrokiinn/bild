'use server';

/**
 * @fileOverview An AI agent to diagnose potential vehicle problems based on checklist responses.
 *
 * - diagnoseVehicleProblems - A function that handles the vehicle problem diagnosis process.
 * - DiagnoseVehicleProblemsInput - The input type for the diagnoseVehicleProblems function.
 * - DiagnoseVehicleProblemsOutput - The return type for the diagnoseVehicleProblems function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';

const DiagnoseVehicleProblemsInputSchema = z.object({
  checklistResponses: z
    .string()
    .describe("A string containing the responses from the daily vehicle checklist."),
  vehicleInfo: z.string().describe("Information about the vehicle, including make, model, and year."),
});
export type DiagnoseVehicleProblemsInput = z.infer<typeof DiagnoseVehicleProblemsInputSchema>;

const DiagnoseVehicleProblemsOutputSchema = z.object({
  potentialProblems: z
    .string()
    .describe("A list of potential mechanical problems that might be developing, based on the checklist responses."),
});
export type DiagnoseVehicleProblemsOutput = z.infer<typeof DiagnoseVehicleProblemsOutputSchema>;

export async function diagnoseVehicleProblems(input: DiagnoseVehicleProblemsInput): Promise<DiagnoseVehicleProblemsOutput> {
  return diagnoseVehicleProblemsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'diagnoseVehicleProblemsPrompt',
  input: {schema: DiagnoseVehicleProblemsInputSchema},
  output: {schema: DiagnoseVehicleProblemsOutputSchema},
  prompt: `You are an expert mechanic specializing in diagnosing vehicle problems based on checklist responses.

You will use the information provided to identify potential mechanical issues that the vehicle might be developing.

Vehicle Information: {{{vehicleInfo}}}
Checklist Responses: {{{checklistResponses}}}

Based on this information, provide a list of potential problems.`,
});

const diagnoseVehicleProblemsFlow = ai.defineFlow(
  {
    name: 'diagnoseVehicleProblemsFlow',
    inputSchema: DiagnoseVehicleProblemsInputSchema,
    outputSchema: DiagnoseVehicleProblemsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
