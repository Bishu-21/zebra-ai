# Zebra AI - Premium Resume Strategist 🦓

Zebra AI is a high-fidelity, intelligent resume creation platform designed for the modern job market. It combines sleek design aesthetics with strategic AI insights to help users build resumes that stand out.

![Zebra AI Dashboard](src/assets/dashboard-preview.png) *(Note: Add actual screenshot link if available)*

## ✨ Key Features

- **High-Fidelity Editor**: A polished, block-based building experience with real-time previewing.
- **Intelligent Scan**: Strategic analysis of resume content with actionable feedback.
- **Tailor to Job**: Seamlessly align your experience with specific job descriptions.
- **Premium Design Logic**: Minimalist-strategic aesthetic with subtle animations and focus on user experience.
- **Universal Export**: One-click professional PDF generation with clean, standardized layout.

## 🛠️ Tech Stack

- **Framework**: [Next.js 15+](https://nextjs.org/) (App Router)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Animations**: [Framer Motion](https://www.framer.com/motion/)
- **Database**: [Neon Postgres](https://neon.tech/)
- **ORM**: [Drizzle ORM](https://orm.drizzle.team/)
- **Authentication**: [Better Auth](https://better-auth.com/)
- **Icons**: [React Icons](https://react-icons.github.io/react-icons/)

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- Neon Database account
- Better Auth credentials

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/Bishu-21/zebra-ai.git
   cd zebra-ai
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   Create a `.env.local` file and add:
   ```env
   # Database
   DATABASE_URL=your_neon_db_url

   # Better Auth
   BETTER_AUTH_SECRET=your_auth_secret
   BETTER_AUTH_URL=http://localhost:3000
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```

### Database Management

Run migrations or push schema changes:
```bash
npx drizzle-kit push
```

## 📄 License

MIT License - feel free to use and adapt this project!
