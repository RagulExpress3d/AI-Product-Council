
import { GoogleGenAI, Type } from "@google/genai";
import { AgentPerspective, UserSettings, SpecialRoles, RejectedPath } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const getBasePrompt = (role: string, settings: UserSettings) => {
  const coreContext = `You are a high-level Amazon Product Professional. Your feedback must be rigorous, data-driven, and focused on maintaining the highest bars for product quality.`;
  
  // Default values since we removed these from UI
  const toneContext = 'Be professional and highly critical, focusing on maintaining Amazon\'s high standards.';

  const negativeConstraints = `CRITICAL: NEVER mention seniority levels (e.g., L5, L6, L7, L8) or phrases like 'L5 Thinking' or 'L7 level analysis' in your output. Do not associate the quality of the PM's work with a specific seniority level. Focus purely on the product logic, customer impact, and leadership principles.`;

  if (role === SpecialRoles.MASTER_PM) {
    return `You are the "Master PM". Role: Synthesis and conclusive path finding. ${coreContext} You weigh the council's feedback and ensure the product path strictly adheres to the council mandate: ${settings.lpFocus.join(', ')}. ${toneContext} ${negativeConstraints}`;
  }

  return `You are the AI Auditor for: "${role}". 
  Your SUPERPOWER is to evaluate proposals strictly through the lens of ${role}. 
  ${coreContext} 
  ${toneContext} 
  ${negativeConstraints}
  MANDATE: You must provide a numerical score (1-5) on how well the proposal embodies "${role}". 
  Score 1: No evidence of principle. 
  Score 3: Principle is visible but flawed. 
  Score 5: Principle is the core engine of the proposal.`;
};

export async function getChatResponse(messages: {sender: string, content: string}[], settings: UserSettings): Promise<string> {
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: messages.map(m => ({ role: m.sender === 'User' ? 'user' : 'model', parts: [{ text: m.content }] })),
    config: {
      systemInstruction: getBasePrompt(SpecialRoles.MASTER_PM, settings) + ` Help the user refine their idea. You must evaluate if they have covered: 1. Who is the Customer? 2. What is the Problem? 3. What is the Benefit? 4. What is the Solution? If any are missing, guide them specifically.`,
    }
  });
  return response.text || "I apologize, I'm having trouble processing that right now.";
}

export async function getAgentResponse(role: string, topic: string, context: string, settings: UserSettings): Promise<AgentPerspective> {
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `Topic: ${topic}\n\nContext:\n${context}\n\nTask: Audit this proposal for "${role}".`,
    config: {
      systemInstruction: getBasePrompt(role, settings),
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          content: { type: Type.STRING, description: "Detailed audit feedback" },
          vote: { type: Type.STRING, enum: ["Approve", "Request Changes", "Reject"] },
          reasoning: { type: Type.STRING, description: "Logic behind the vote" },
          score: { type: Type.NUMBER, description: "1-5 deterministic score on LP alignment" }
        },
        required: ["content", "vote", "reasoning", "score"]
      }
    }
  });

  try {
    const data = JSON.parse(response.text || '{}');
    return { ...data, role };
  } catch (e) {
    return { role, content: "Error", vote: 'Request Changes', reasoning: "Error", score: 1 };
  }
}

export async function generatePRFAQ(topic: string, councilDiscussion: string, settings: UserSettings): Promise<{ prfaq: string, report: string, decisionType: string, rejectedPaths: RejectedPath[], readinessScore: number }> {
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `Topic: ${topic}\n\nDebate Summary:\n${councilDiscussion}\n\nTasks:
1. Generate standard Amazon PRFAQ.
2. Generate Council Report. Use SIMPLE ENGLISH. 
   Structure: 
   - Current State: Summarize where the product idea stands.
   - Logic for Rejection/Decision/Approval: Explain the Council's consensus or disagreements.
   - Suggested Next Steps: Clear, actionable path forward.
3. Classify the decision category exactly as one of these two options: "High Impact & Difficult to Reverse (The One-Way Door)" or "Low Impact & Easy to Change (The Two-Way Door)".
4. Assign a Readiness Score (1-10) based on how complete and concept-ready the requirements are for engineering handoff.
5. Extract exactly 2-3 "Rejected Paths" with reasons.`,
    config: {
      systemInstruction: getBasePrompt(SpecialRoles.MASTER_PM, settings),
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          prfaq: { type: Type.STRING },
          report: { type: Type.STRING },
          decisionType: { type: Type.STRING, description: "Either 'High Impact & Difficult to Reverse (The One-Way Door)' or 'Low Impact & Easy to Change (The Two-Way Door)'" },
          readinessScore: { type: Type.NUMBER, description: "Score from 1 to 10" },
          rejectedPaths: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                path: { type: Type.STRING, description: "Description of the alternative path" },
                reason: { type: Type.STRING, description: "Why the council rejected this path" }
              },
              required: ["path", "reason"]
            }
          }
        },
        required: ["prfaq", "report", "decisionType", "readinessScore", "rejectedPaths"]
      }
    }
  });

  try {
    return JSON.parse(response.text || '{}');
  } catch (e) {
    return { prfaq: "Error", report: "Error", decisionType: "Low Impact & Easy to Change (The Two-Way Door)", readinessScore: 5, rejectedPaths: [] };
  }
}
