export interface FaqItem {
  question: string;
  answer: string;
}

export const FAQ_ITEMS: FaqItem[] = [
  {
    question: "What does Zebra AI review?",
    answer:
      "Zebra AI reviews resume content with a documented 45-check rubric covering structure, contact information, projects, skills, education, writing, and applicable work experience. Job-specific matching is performed only when you provide a job description.",
  },
  {
    question: "What can I do in Zebra AI?",
    answer:
      "You can import or build resumes, run structured reviews, tailor a resume to a job description, review suggested changes, export PDFs, publish a portfolio, and track job applications.",
  },
  {
    question: "Does Zebra AI guarantee that every ATS will accept my resume?",
    answer:
      "No tool can guarantee acceptance by every proprietary ATS. Zebra flags common readability and formatting risks, encourages conventional section structure, and compares your evidence with a supplied job description. Final results can still vary by employer and ATS configuration.",
  },
  {
    question: "How does Zebra AI differ from ChatGPT or generic AI writers?",
    answer:
      "Zebra uses structured resume data, fixed review criteria, and evidence-preserving suggestions. Recommended changes remain pending until you review them, and unsupported employers, achievements, or measurements are prohibited.",
  },
  {
    question: "Can I import an existing PDF or raw text resume?",
    answer:
      "Yes. Zebra AI supports PDF and raw-text imports and maps readable content into editable resume sections. You should review imported fields because PDF extraction quality depends on the source layout.",
  },
  {
    question: "Is Zebra AI free to get started?",
    answer:
      "Yes. New accounts receive starter credits. AI reviews, tailoring, and generation features consume credits; available balances and pack details are shown before purchase.",
  },
];
