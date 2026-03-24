# Armoire

**Stop guessing. Start dressing.**

Armoire is an AI-powered wardrobe assistant that helps you organize your closet and generate personalized outfit recommendations. Upload your clothes, and let AI create the perfect outfit for any occasion — using only what you already own.

## Features

- **Digital Closet** — Upload photos of your clothes and organize by category, season, and color
- **AI Outfit Generator** — Get personalized outfit recommendations based on occasion, weather, and style preferences
- **Save & Organize** — Save AI-generated outfits and build a collection of go-to looks
- **Outfit Calendar** — Track what you wear each day and discover wardrobe patterns

## Tech Stack

- **Frontend:** Next.js 15 (App Router), React 19, TypeScript
- **Styling:** Tailwind CSS v4, shadcn/ui
- **Backend:** Next.js API Routes
- **Database & Auth:** Supabase (PostgreSQL, Auth, Storage)
- **AI:** OpenAI GPT-4o-mini
- **Deployment:** Vercel

## Getting Started

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/armoire.git
   cd armoire
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.local.example .env.local
   ```
   Fill in your Supabase and OpenAI API keys.

4. Run the SQL migration in your Supabase project (see `supabase/migrations/`).

5. Start the dev server:
   ```bash
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000)

## Environment Variables

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/public key |
| `OPENAI_API_KEY` | OpenAI API key for outfit generation |

## Project Structure

```
src/
  app/
    (auth)/          # Login & signup pages
    (main)/          # Authenticated app pages
      closet/        # Digital closet + add items
      generate/      # AI outfit generator
      outfits/       # Saved outfits
      calendar/      # Outfit calendar
    api/             # API routes
  components/        # Reusable components
  lib/supabase/      # Supabase client helpers
  types/             # TypeScript types
```

## Author

Built by Tanya Patel — CS4800 Software Engineering with AI
