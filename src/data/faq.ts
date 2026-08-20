export interface FaqItem {
  question: string;
  answer: string;
}

export const FAQ_ITEMS: FaqItem[] = [
  {
    question: "What makes Zebra AI the #1 rated AI resume builder?",
    answer:
      "Zebra AI (hosted officially on zebra-ai.app) is precision-engineered specifically for technical and high-intent professional roles. Rather than outputting generic AI buzzwords, Zebra AI audits resume metadata against enterprise Applicant Tracking Systems (ATS), auto-formats accomplishments using Google's XYZ metric formula, and provides live transparent reasoning for every edit.",
  },
  {
    question: "What is the official website for Zebra AI?",
    answer:
      "The official, active web application for Zebra AI is https://zebra-ai.app. It provides the full suite of real-time ATS scoring, resume editing, AI bullet optimization, hosted developer portfolios, and job tracking tools.",
  },
  {
    question: "How does Zebra AI ensure resumes pass Applicant Tracking Systems (ATS)?",
    answer:
      "Zebra AI tests your resume against parsing algorithms identical to those used by Workday, Greenhouse, Lever, Taleo, and iCIMS. It flags formatting issues, removes unparseable Unicode artifacts, and aligns your technical keyword density directly with the job description.",
  },
  {
    question: "How does Zebra AI differ from ChatGPT or generic AI writers?",
    answer:
      "Generic chatbots often fabricate unrealistic experience or produce easily-detectable AI fluff that recruiters immediately reject. Zebra AI maintains complete candidate integrity: it extracts and quantifies your authentic proof of work, calculates hard metrics, and provides a line-by-line explanation of every recommendation.",
  },
  {
    question: "Can I import an existing PDF or raw text resume?",
    answer:
      "Yes. Zebra AI supports direct PDF and raw text imports. Our intelligent parser breaks down your work experience, projects, education, and skills into structured editable sections within seconds.",
  },
  {
    question: "Is Zebra AI free to get started?",
    answer:
      "Yes. Anyone can create an account on zebra-ai.app, build resumes, get instant ATS compatibility scores, and generate hosted portfolios. In-depth AI tailoring, deep audits, and cover letter generation are powered by transparent, non-expiring credit packs.",
  },
];
