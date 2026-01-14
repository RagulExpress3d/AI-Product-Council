## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

1. App Overview
The AI Product Manager Council is a productivity tool designed specifically for Amazon PMs, it helps transform raw ideas into polished PRFAQs and Product Requirements by simulating a Amazon leadership review.

2. Problem Statement
Product Managers require access to Bar raisers to review / test their ideas against Amazon’s high bar (Leadership Principles) before formal meetings. Feedback loops are slow, scheduling challenges delay reviews and identifying "One-Way vs. Two-Way Doors" early is difficult for new product managers.

3. Solution
A 24/7 AI-powered "Bar Raiser" council. It consists of:
Master Agent: A synthesizer that guides the discovery process.
LP Auditors: Specialized agents representing specific Amazon Leadership Principles (e.g., Customer Obsession, Bias for Action) that critique the proposal.

4. Feature Breakdown


Discovery (Chat): An interactive session with the Master Agent to define the "5 Whys" and the four product facets: Customer, Problem, Benefit, and Solution.
Review (Council): A deterministic audit where chosen LP agents debate the proposal. Each agent provides feedback, a vote (Approve/Reject), and a specific score.

Docs (Outputs):
PRFAQ: A standard-format Amazon Press Release and FAQ.
Council Report: A summary including "Rejected Paths" (options considered but discarded) and the logic for the chosen path.
One-Way/Two-Way Door Classification: Instant risk assessment of the decision.

5. Agent Prompts & Logic


Master Agent Prompt: Acts as a Senior Principal PM. It is focused on synthesis and ensuring the "Customer" is always at the center. It blocks the user from moving to "Review" until the core product facets are sufficiently defined.

Auditor Agent Prompt: Each agent is injected with a "Superpower" based on a specific Leadership Principle. They are instructed to be "high-bar" and "critical," avoiding generic praise. They look for specific evidence of their assigned LP in the PM's text.

6. Scoring Calculation
Individual LP Score (1 - 5):
1: No evidence of the principle.
3: Principle is present but logic is flawed.
5: Principle is the core engine of the solution.


Readiness Score (1 - 10):
Calculated by the Master Agent after the debate.
Evaluates the "Clarity of Thought" and "Completeness of Requirements."
8-10: Ready for engineering handoff.
1-4: Needs significant refinement in the Discovery phase.

7. Technical Architecture
Frontend: React (TypeScript) with Tailwind CSS for an Amazon-internal "AUI" aesthetic.
Intelligence: Gemini 3 Pro (API) handles the complex reasoning, multi-agent simulation, and document generation.
Structured Output: Uses JSON Schema enforcement to ensure agents return deterministic scores and structured feedback instead of just conversational text.
Persistence: Session-based state management allowing multiple "Product Journeys" to run in parallel.
Export: Generate professional PDF reports without external server-side dependencies.


