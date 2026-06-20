// Evidence-based study techniques surfaced as recommendations in the app.
// Sources are summarised from cognitive-science literature on retrieval
// practice (Roediger & Karpicke, 2006), spacing, interleaving and the
// "desirable difficulty" framework (Bjork).

export interface StudyMethod {
  id: string;
  name: string;
  tagline: string;
  evidence: 'strong' | 'moderate';
  effort: 'low' | 'medium' | 'high';
  bestFor: string[];
  how: string[];
  why: string;
}

export const STUDY_METHODS: StudyMethod[] = [
  {
    id: 'active-recall',
    name: 'Active Recall',
    tagline: 'Test yourself instead of re-reading.',
    evidence: 'strong',
    effort: 'medium',
    bestFor: ['Facts', 'Definitions', 'Exams'],
    how: [
      'Close your notes and write down everything you remember.',
      'Turn headings into questions and answer them from memory.',
      'Check against your source and mark the gaps for next time.',
    ],
    why: 'The "testing effect": retrieving information strengthens memory far more than passively reviewing it. Landmark work by Roediger & Karpicke (2006) showed self-testing dramatically beats re-reading for long-term retention.',
  },
  {
    id: 'spaced-repetition',
    name: 'Spaced Repetition',
    tagline: 'Review at growing intervals before you forget.',
    evidence: 'strong',
    effort: 'low',
    bestFor: ['Vocabulary', 'Cumulative subjects', 'Long retention'],
    how: [
      'Review new material after 1 day, then 3, 7, 16, 35 days.',
      'Push easy cards further out; bring hard cards back sooner.',
      'Use flashcards (paper or an app) to schedule reviews.',
    ],
    why: 'Spacing reviews leverages the "spacing effect" — memories consolidate better when revisited just as they begin to fade, producing durable long-term knowledge with less total time.',
  },
  {
    id: 'pomodoro',
    name: 'Pomodoro / Focus Blocks',
    tagline: '25–50 min of deep focus, then a short break.',
    evidence: 'moderate',
    effort: 'low',
    bestFor: ['Beating procrastination', 'Sustained focus'],
    how: [
      'Pick one task. Start a focus block (this app grows a tree).',
      'Work with zero distractions until the timer ends.',
      'Take a 5-minute break, then repeat. Longer break every 4 blocks.',
    ],
    why: 'Time-boxing lowers the activation energy to start and protects attention from task-switching, which is one of the biggest hidden costs to productivity.',
  },
  {
    id: 'feynman',
    name: 'Feynman Technique',
    tagline: 'Explain it simply, find the gaps, refine.',
    evidence: 'moderate',
    effort: 'medium',
    bestFor: ['Deep understanding', 'Concepts', 'Problem-solving'],
    how: [
      'Pick a concept and explain it in plain language, as if to a 12-year-old.',
      'Notice where you get stuck or hand-wave — those are your gaps.',
      'Go back to the source, fill the gaps, and simplify again.',
    ],
    why: 'Forcing yourself to teach a concept exposes illusions of competence and converts shallow familiarity into genuine understanding.',
  },
  {
    id: 'interleaving',
    name: 'Interleaving',
    tagline: 'Mix topics rather than blocking one at a time.',
    evidence: 'strong',
    effort: 'medium',
    bestFor: ['Maths', 'Problem types', 'Skills that look similar'],
    how: [
      'Within a session, rotate between 2–3 related topics or problem types.',
      'Resist finishing all of one type before moving on.',
      'Shuffle practice problems so you must choose the right method.',
    ],
    why: 'Interleaving trains you to discriminate between problem types and select the right strategy — a "desirable difficulty" that feels harder but improves transfer to exams.',
  },
  {
    id: 'elaboration',
    name: 'Elaborative Interrogation',
    tagline: 'Keep asking "why is this true?"',
    evidence: 'moderate',
    effort: 'medium',
    bestFor: ['Understanding causes', 'Connecting ideas'],
    how: [
      'For each fact, ask "why?" and "how does this connect to what I know?"',
      'Generate explanations in your own words, not the textbook\'s.',
      'Link new facts to concrete examples from your life.',
    ],
    why: 'Elaboration builds richer memory traces by connecting new information to existing knowledge, making it easier to retrieve later.',
  },
];

/** A simple recommendation rule: blend recall + spacing as exams approach. */
export const RECALL_SPACING_SPLIT = {
  headline: 'Aim for a 60/40 split',
  detail:
    'Spend roughly 60% of study time actively recalling new and recent material, and 40% on spaced repetition of older concepts. Shift toward more spaced repetition as exams get closer.',
};

export function methodById(id?: string): StudyMethod | undefined {
  return STUDY_METHODS.find((m) => m.id === id);
}
