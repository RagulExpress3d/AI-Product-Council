
import { GoogleGenAI, Type } from "@google/genai";
import { AgentPerspective, UserSettings, SpecialRoles, RejectedPath } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const getBasePrompt = (role: string, settings: UserSettings) => {
  const seniorityContext = `You are an Amazonian at the ${settings.seniority} level. Feedback should be commensurate with this seniority.`;
  
  const toneContext = settings.tone === 'Mentorship' 
    ? 'Maintain a supportive, coaching tone.' 
    : settings.tone === 'Cruel Critique' 
      ? 'Be brutally honest, highlight every flaw, act as an extreme Bar Raiser looking for reasons to reject.' 
      : 'Be professional and highly critical, focusing on maintaining Amazon\'s high standards.';

  if (role === SpecialRoles.MASTER_PM) {
    return `You are the "Master PM" (Seniority: ${settings.seniority}). Role: Synthesis and conclusive path finding. Org Context: ${settings.orgContext}. ${seniorityContext} You weigh the council's feedback and ensure the product path strictly adheres to the council mandate: ${settings.lpFocus.join(', ')}. ${toneContext}`;
  }

  return `You are the AI Auditor for: "${role}". 
  Your SUPERPOWER is to evaluate proposals strictly through the lens of ${role}. 
  ${seniorityContext} 
  ${toneContext} 
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

export async function generatePRFAQ(topic: string, councilDiscussion: string, settings: UserSettings): Promise<{ prfaq: string, report: string, decisionType: string, rejectedPaths: RejectedPath[] }> {
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `Topic: ${topic}\n\nDebate Summary:\n${councilDiscussion}\n\nTasks:
1. Generate standard Amazon PRFAQ.
2. Generate Council Report focused on alignment and trade-offs.
3. Classify as Type 1 (One-Way) or Type 2 (Two-Way) decision.
4. Extract exactly 2-3 "Rejected Paths" that were explicitly discussed or implied as alternatives.`,
    config: {
      systemInstruction: getBasePrompt(SpecialRoles.MASTER_PM, settings),
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          prfaq: { type: Type.STRING },
          report: { type: Type.STRING },
          decisionType: { type: Type.STRING, enum: ["Type 1 (One-Way)", "Type 2 (Two-Way)"] },
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
        required: ["prfaq", "report", "decisionType", "rejectedPaths"]
      }
    }
  });

  try {
    return JSON.parse(response.text || '{}');
  } catch (e) {
    return { prfaq: "Error", report: "Error", decisionType: "Type 2 (Two-Way)", rejectedPaths: [] };
  }
}
