export interface FaqItem {
  question: string;
  answer: string;
}

export const FAQ_ITEMS: FaqItem[] = [
  {
    question: "What does Zebra AI do?",
    answer:
      "Zebra AI helps you turn an existing resume and a target job into a reviewed, editable document. You can import a file, run a structured review, compare the resume with a job description, accept or reject suggested edits, and export a PDF.",
  },
  {
    question: "Does tailoring overwrite my original resume?",
    answer:
      "No. Suggested edits for a job application stay pending until you accept, edit, or reject them. The original resume remains in place. The version you export includes only the changes you approved.",
  },
  {
    question: "Does Zebra AI guarantee that an ATS or employer will accept my resume?",
    answer:
      "No. No tool can promise that. Zebra flags common formatting and readability issues and compares your evidence with a job description you provide. Results still depend on the employer and their systems.",
  },
  {
    question: "How do credits work?",
    answer:
      "New accounts receive starter credits. Resume reviews, job matching, cover letters, and LinkedIn drafts use credits. Saving a resume and exporting a PDF do not. Credit packs are one-time purchases (10 for ₹99, 50 for ₹400, 100 for ₹800), not a subscription. If checkout is unavailable, existing credits still work.",
  },
  {
    question: "What files can I import?",
    answer:
      "You can import PDF, DOCX, or plain text, or paste text directly. Mapped fields should be reviewed because extraction quality depends on the source layout.",
  },
  {
    question: "What can I export?",
    answer:
      "You can export a resume or cover letter as a PDF. DOCX export is not available.",
  },
];
