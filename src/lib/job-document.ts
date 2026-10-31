export function validateJobDocument(file: File): string | null {
  if (!/\.(pdf|txt)$/i.test(file.name)) return "Choose a PDF or TXT job description.";
  if (file.size === 0) return "The job document is empty.";
  if (file.size > 5 * 1024 * 1024) return "The job document exceeds the 5 MB limit.";
  return null;
}

export function validateJobText(text: string): string | null {
  if (text.trim().length < 80) return "The document has too little readable job text. Check the file or paste the description.";
  if (text.length > 30_000) return "The job description exceeds 30,000 characters. Remove unrelated content and try again.";
  return null;
}
