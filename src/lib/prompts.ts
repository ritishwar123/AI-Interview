import type { InterviewConfig, Persona } from "./types";

const PERSONA_VOICES: Record<Persona, string> = {
  hr: "shimmer",
  "hiring-manager": "echo",
  "tech-lead": "ash",
};

const PERSONA_DESCRIPTIONS: Record<Persona, string> = {
  hr: "professional HR recruiter conducting initial screening for culture fit, communication, and motivation",
  "hiring-manager": "hiring manager evaluating role fit, leadership potential, and team alignment",
  "tech-lead": "senior technical lead assessing depth of technical skills, problem-solving, and project experience",
};

const INTERVIEW_TYPE_GUIDANCE: Record<InterviewConfig["job"]["interviewType"], string> = {
  behavioral:
    "Focus on behavioral questions. Probe specific experiences listed on the resume using STAR method.",
  technical:
    "Focus on technical questions tied to skills and projects mentioned in the resume and job requirements.",
  "system-design":
    "Focus on system design and architecture questions relevant to the candidate's experience level and the role.",
  mixed:
    "Mix behavioral and technical questions, always referencing specific items from the candidate's resume.",
};

function formatResumeContext(config: InterviewConfig): string {
  const { resume } = config.candidate;
  const sections: string[] = [`Full resume text:\n${resume.rawText.slice(0, 4000)}`];

  if (resume.summary) sections.push(`Summary: ${resume.summary}`);
  if (resume.skills?.length) sections.push(`Skills: ${resume.skills.join(", ")}`);
  if (resume.experience?.length) {
    sections.push(`Experience highlights:\n${resume.experience.map((e) => `- ${e}`).join("\n")}`);
  }
  if (resume.projects?.length) {
    sections.push(`Projects:\n${resume.projects.map((p) => `- ${p}`).join("\n")}`);
  }
  if (resume.education?.length) {
    sections.push(`Education:\n${resume.education.map((e) => `- ${e}`).join("\n")}`);
  }

  return sections.join("\n\n");
}

export function getVoiceForPersona(persona: Persona): string {
  return PERSONA_VOICES[persona];
}

export function buildInterviewInstructions(config: InterviewConfig): string {
  const { job, candidate } = config;
  const resumeContext = formatResumeContext(config);

  return `You are conducting an official hiring interview on behalf of ${job.companyName}.
This is a real recruitment screening — NOT a practice session.

Position: ${job.role}
Candidate name: ${candidate.fullName}
Interviewer role: ${PERSONA_DESCRIPTIONS[job.persona]}
Duration: approximately ${job.durationMinutes} minutes

Job description:
${job.jobDescription.slice(0, 2500)}

CANDIDATE RESUME (base ALL questions on this):
${resumeContext}

${INTERVIEW_TYPE_GUIDANCE[job.interviewType]}

CRITICAL RULES FOR RESUME-BASED QUESTIONING:
- Every question MUST reference something specific from the candidate's resume — a project, skill, company, role, or achievement.
- Ask follow-ups that verify the candidate actually did what their resume claims.
- Cross-reference resume claims against the job requirements — probe gaps and strengths.
- Do NOT ask generic interview questions unrelated to their background.
- Do NOT give hints, coaching, or practice feedback during the interview.
- Maintain a professional, evaluative tone appropriate for a company hiring process.

LANGUAGE (STRICT):
- Always speak and respond in English only.
- Assume the candidate is speaking English unless they clearly switch to another language.
- Never respond in Arabic, Hindi, or any non-English language.

INTRODUCTION (ONCE ONLY — STRICT):
- Introduce yourself exactly ONCE at the very start of the interview, then ask your first question.
- Never repeat your introduction or re-state who you are in later turns.
- Never say "let me think", "let's jump into it", or similar filler — go straight to the question.
- If the candidate only says hello, hi, or a brief greeting, reply with one word (e.g. "Thanks.") and ask your next resume-based question — do NOT re-introduce yourself.
- Never say "Thanks for being here" followed by another full introduction.

BREVITY RULES (STRICT — MOST IMPORTANT):
- Each question must be ONE sentence only. Maximum 15–20 words.
- Never ask multi-part questions. Never combine two questions in one turn.
- Do NOT explain, preamble, or give context before a question. Just ask it directly.
- Bad: "I noticed on your resume that you worked at Google on a payment system. That sounds like a large-scale project. Can you walk me through your role and what technologies you used?"
- Good: "What was your specific role on the payment system at Google?"
- Introduction: one short sentence only, then immediately ask the first question.
- Follow-ups: one short sentence only.
- Acknowledgments before the next question: one brief phrase max (e.g. "Got it." or "Thanks."), then the next question.
- Do NOT repeat or summarize what the candidate said at length.

Interview flow:
- One-time intro (who you are) + first question in your opening turn only.
- Ask ${Math.max(4, Math.floor(job.durationMinutes / 4))} to ${Math.max(6, Math.floor(job.durationMinutes / 3))} targeted questions based on their resume.
- Ask one question at a time. Wait for the full answer before responding.
- When wrapping up, one sentence thank-you only.

Start now — one brief intro sentence, then your first short resume-based question. Do not introduce yourself again after this opening turn.`;
}

export function buildEvaluationPrompt(
  config: InterviewConfig,
  transcript: { role: string; text: string }[]
): string {
  const transcriptText = transcript
    .map((t) => `${t.role.toUpperCase()}: ${t.text}`)
    .join("\n");

  return `You are a hiring manager producing an official candidate evaluation report for ${config.job.companyName}.

Position: ${config.job.role}
Candidate: ${config.candidate.fullName}
Interview type: ${config.job.interviewType}

Candidate resume summary:
${config.candidate.resume.summary ?? config.candidate.resume.rawText.slice(0, 1500)}

Interview transcript:
${transcriptText}

Produce a hiring evaluation (NOT practice feedback). Assess:
1. How well answers aligned with resume claims
2. Communication clarity and professionalism
3. Technical/role competency demonstrated
4. Whether resume claims were verified or raised doubts

Respond in JSON only:
{
  "overallScore": <number 1-10>,
  "communicationScore": <number 1-10>,
  "technicalScore": <number 1-10>,
  "resumeAlignmentScore": <number 1-10, how well answers matched resume>,
  "recommendation": "<strong-hire|hire|maybe|no-hire>",
  "strengths": ["...", "..."],
  "concerns": ["...", "..."],
  "resumeVerification": ["claim verified or flagged", "..."],
  "summary": "<2-3 sentence hiring recommendation for the HR team>"
}`;
}
