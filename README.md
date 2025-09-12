# Landing Page with Email Subscription

A modern landing page built with Astro and Supabase, featuring email subscription functionality.

## 🚀 Tech Stack

- [Astro](https://astro.build) v5.13.7 - Static Site Generator
- [Supabase](https://supabase.com) - Backend for email storage
- CSS - Styling
- TypeScript - Type safety

## 📦 Installation

1. Clone the repository:
\`\`\`bash
git clone https://github.com/hhsantos/electron.git
cd electron
\`\`\`

2. Install dependencies:
\`\`\`bash
npm install
\`\`\`

3. Set up environment variables:
Create a \`.env\` file in the root directory with your Supabase credentials:
\`\`\`env
PUBLIC_SUPABASE_URL=your_supabase_url
PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
\`\`\`

## 🧞 Commands

All commands are run from the root of the project:

| Command           | Action                                             |
| :--------------- | :------------------------------------------------- |
| \`npm install\`    | Installs dependencies                              |
| \`npm run dev\`    | Starts local dev server at \`localhost:4321\`        |
| \`npm run build\`  | Build your production site to \`./dist/\`            |
| \`npm run preview\`| Preview your build locally, before deploying       |

## 🏗️ Project Structure

\`\`\`
/
├── src/
│   ├── components/
│   │   ├── Header.astro
│   │   ├── Hero.astro
│   │   ├── Features.astro
│   │   ├── Stats.astro
│   │   ├── Subscribe.astro
│   │   └── Footer.astro
│   ├── lib/
│   │   └── supabase.ts
│   ├── pages/
│   │   ├── index.astro
│   │   └── api/
│   │       └── subscribe.ts
│   └── styles/
│       └── global.css
└── package.json
\`\`\`

## 🌟 Features

- Responsive design
- Email subscription form
- Supabase integration for data storage
- Server-side form validation
- Interactive form feedback

## 📝 License

MIT License

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (\`git checkout -b feature/AmazingFeature\`)
3. Commit your changes (\`git commit -m 'Add some AmazingFeature'\`)
4. Push to the branch (\`git push origin feature/AmazingFeature\`)
5. Open a Pull Request
