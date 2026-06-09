// The template library. Each tone is a bank of interchangeable parts written to
// sound like a real person, not a generator: plain punctuation (no em-dashes),
// no buzzwords ("leverage", "delve", "synergy"), no robotic throat-clearing.
//
// Every string may contain:
//   - spintax  {a|b|c}      one option is chosen per draw
//   - tokens   [name] [title] [company] [phone] [email] [ref]
//
// Tone is chosen adaptively from the job (sector + seniority). Within a tone, the
// spintax + seeded RNG yield thousands of distinct, coherent emails.

export type Tone = "formal" | "warm" | "confident" | "enthusiastic" | "concise";

export interface ToneBank {
  subjects: string[];
  greetings: string[];
  openers: string[];   // the hook: why I'm writing / why this role
  pitch: string[];     // what I bring
  fit: string[];       // why I fit this employer/role
  cta: string[];       // the ask / next step
  signoffs: string[];  // closing line + valediction lead-in
}

export const TONES: Record<Tone, ToneBank> = {
  // ── Formal: finance, legal, audit, banking, government, NGO ───────────────
  formal: {
    subjects: [
      "Application for the [title] position",
      "[title] application{ |} [ref]",
      "Application: [title] at [company]",
      "Re: [title] vacancy",
    ],
    greetings: [
      "Dear Hiring Manager,",
      "Dear Sir/Madam,",
      "Dear Recruitment Team,",
      "Good day,",
    ],
    openers: [
      "I am writing to apply for the [title] position{ at [company]|}. {Having reviewed the requirements,|After reading the advert carefully,} I am confident my background is a strong match.",
      "I wish to formally express my interest in the [title] role{ at [company]|}. The responsibilities outlined align closely with my experience.",
      "Please accept this email as my application for the [title] position{ advertised by [company]|}. I believe I meet the requirements you have set out.",
    ],
    pitch: [
      "Over the course of my career I have built {solid|practical|dependable} experience that maps directly to what this role calls for, and I take pride in {accuracy|thoroughness|getting the details right}.",
      "I bring a {disciplined|methodical|careful} approach to my work, along with the {technical ability|hands-on experience|competence} this position requires.",
      "My experience has given me the {skills|grounding|capabilities} to contribute from day one, and I am committed to delivering work of a high standard.",
    ],
    fit: [
      "I am particularly drawn to [company] because of its {reputation|standing|track record}, and I would welcome the chance to contribute to it.",
      "What appeals to me about this role is the opportunity to apply my strengths in a setting where {quality|reliability|professionalism} clearly matters.",
      "I am confident that my values and working style would fit well within your team.",
    ],
    cta: [
      "I would be grateful for the opportunity to discuss my application further.",
      "I would welcome the chance to discuss how I can contribute, at a time convenient to you.",
      "Thank you for considering my application. I would be glad to provide any further information you may require.",
    ],
    signoffs: ["Yours faithfully,", "Kind regards,", "Sincerely,", "Respectfully,"],
  },

  // ── Warm: junior/graduate, admin, support, care, education, hospitality ───
  warm: {
    subjects: [
      "Applying for [title]",
      "[title] application from [name]",
      "Interested in the [title] role",
      "Application for [title] at [company]",
    ],
    greetings: ["Hello,", "Good day,", "Hi there,", "Dear Hiring Team,"],
    openers: [
      "I saw your [title] opening{ at [company]|} and would really like to apply. It looks like exactly the kind of role I have been hoping to grow into.",
      "I am excited to apply for the [title] position{ at [company]|}. {The moment I read the advert,|As soon as I saw it,} I felt it was a great fit for me.",
      "I would love to be considered for the [title] role{ at [company]|}. It lines up well with both my skills and the direction I want my career to take.",
    ],
    pitch: [
      "I am {hardworking|reliable|eager to learn} and {pick things up quickly|adapt easily|enjoy a challenge}, and I always give my best to the people I work with.",
      "I bring {energy|a positive attitude|genuine commitment} and a willingness to do whatever it takes to get the job done well.",
      "I am organised, dependable, and comfortable working both on my own and as part of a team.",
    ],
    fit: [
      "What stood out to me about [company] is that it feels like a place where I could learn, contribute, and grow.",
      "I would be proud to be part of [company] and to put my effort into helping the team succeed.",
      "I am keen to bring my skills to a team where I can make a real difference.",
    ],
    cta: [
      "I would really appreciate the chance to chat about how I can help.",
      "I would love the opportunity to discuss my application. Thank you so much for your time.",
      "I would be happy to come in for an interview whenever suits you.",
    ],
    signoffs: ["Warm regards,", "Many thanks,", "Kind regards,", "With thanks,"],
  },

  // ── Confident: mid/senior, tech, engineering, management ──────────────────
  confident: {
    subjects: [
      "[title] application",
      "Application for [title] at [company]",
      "[name] for your [title] role",
      "Re: [title] [ref]",
    ],
    greetings: ["Hello,", "Dear Hiring Manager,", "Good day,", "Dear Team,"],
    openers: [
      "I am applying for the [title] role{ at [company]|} because it matches both what I do well and where I want to take my work next.",
      "Your [title] opening caught my attention. The scope of the role fits the experience I have built, and I am ready to step in and deliver.",
      "I would like to put myself forward for the [title] position{ at [company]|}. I have done work like this before and I know I can do it well here.",
    ],
    pitch: [
      "I focus on {results|outcomes|getting things shipped} rather than busywork, and I have a track record of taking ownership and following through.",
      "I am comfortable {making decisions|solving problems|leading the work} and I keep things moving without needing to be chased.",
      "I combine {strong fundamentals|deep experience|practical know-how} with the discipline to deliver consistently, even under pressure.",
    ],
    fit: [
      "[company] is the kind of place I want to do my best work, and I am confident I would add value quickly.",
      "I have read what this role demands, and I am confident I can meet it and then raise the bar.",
      "I would bring not just the skills you listed, but the judgement to use them well.",
    ],
    cta: [
      "I would welcome a short conversation to show you what I can bring.",
      "I would be glad to walk you through my experience whenever you are free.",
      "Let's set up a time to talk. I think you will find I am a strong fit.",
    ],
    signoffs: ["Best regards,", "Kind regards,", "Regards,", "All the best,"],
  },

  // ── Enthusiastic: sales, retail, marketing, customer-facing ───────────────
  enthusiastic: {
    subjects: [
      "Excited to apply for [title]",
      "[title] at [company] is the role for me",
      "[name] would love to join as [title]",
      "Application for [title]",
    ],
    greetings: ["Hello,", "Hi there,", "Good day,", "Dear Hiring Team,"],
    openers: [
      "The moment I saw your [title] opening{ at [company]|}, I knew I had to apply. This is exactly the kind of role I thrive in.",
      "I am genuinely excited about the [title] position{ at [company]|}, and I am confident I can hit the ground running.",
      "Count me in for the [title] role{ at [company]|}. I love this kind of work and I bring real drive to it.",
    ],
    pitch: [
      "I am {energetic|motivated|driven}, great with people, and I do not stop until the target is met.",
      "I bring {hustle|momentum|a winning attitude} and I genuinely enjoy turning interest into results.",
      "People remember how I make them feel, and I use that to build trust and get to yes.",
    ],
    fit: [
      "[company] has real momentum, and I want to be part of pushing it further.",
      "I can already picture the impact I would make on your team.",
      "This is the kind of opportunity I have been working towards, and I am ready for it.",
    ],
    cta: [
      "Give me ten minutes and I will show you why I am the right fit.",
      "I would love to talk soon. I promise it will be worth your time.",
      "Let's connect. I am ready to start contributing right away.",
    ],
    signoffs: ["Best regards,", "Looking forward,", "Cheers,", "Kind regards,"],
  },

  // ── Concise: when a posting is terse, or for busy recruiters ──────────────
  concise: {
    subjects: [
      "[title] application",
      "Application: [title]",
      "[name] for [title]",
      "[title] [ref]",
    ],
    greetings: ["Hello,", "Good day,", "Dear Hiring Manager,"],
    openers: [
      "I am applying for the [title] role{ at [company]|}. The short version is below.",
      "I would like to apply for the [title] position. Here are the key points.",
      "Applying for [title]. The essentials are below.",
    ],
    pitch: [
      "I have the experience this role needs and a habit of delivering on time.",
      "Right skills, reliable delivery, no drama.",
      "I do solid work, I meet deadlines, and I am easy to work with.",
    ],
    fit: [
      "I think I am a clean fit for what you described.",
      "Happy to prove it in a short call.",
      "I can step in quickly and add value.",
    ],
    cta: [
      "CV attached. Open to a quick call whenever suits.",
      "Happy to share more. Let me know a good time.",
      "Glad to interview at your convenience.",
    ],
    signoffs: ["Regards,", "Kind regards,", "Best,"],
  },
};

// ── Requirement-driven inserts (tone-agnostic, adapt to the job's demands) ──
// These are appended only when the detector flags the matching need.
export const REQUIREMENT_LINES = {
  cv: [
    "My CV is attached for your review.",
    "Please find my CV attached.",
    "I have attached my CV with the full detail.",
  ],
  coverLetter: [
    "I have included this note as my cover letter; I am happy to send a longer one if you prefer.",
    "Consider this my covering letter, with my CV attached.",
  ],
  portfolio: [
    "You can see examples of my work through the links below.",
    "I have included links to my portfolio below so you can see my work first hand.",
    "Samples of my work are linked below.",
  ],
  certificates: [
    "I have attached copies of my certificates as requested.",
    "My qualifications and certificates are attached.",
    "Certified copies of my qualifications are included.",
  ],
  references: [
    "References are available on request.",
    "I can provide references as soon as you need them.",
    "Contactable references are available whenever required.",
  ],
  applyUrl: [
    "I am also happy to complete any online application form you use.",
    "If you would prefer I apply through your portal, just point me to it.",
  ],
} as const;
