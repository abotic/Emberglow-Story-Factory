# EmberGlow Story Factory

Generate complete long-form narrated YouTube packages using OpenAI:

- ≥ 1 hour narration script
- Thumbnail prompt
- Hero video prompt (Luma)
- Scene prompts every 30s (+ ~20% extras)
- YouTube description with chapters
- Hashtags
- SEO title
- Save & browse projects locally

## Tech

- **Server:** Fastify + TypeScript, Zod validation, OpenAI SDK
- **Client:** React + TypeScript + Vite + Tailwind
- **Storage:** Local JSON in `/projects`

## Prerequisites

- Node 18+
- An OpenAI API key

## Setup

```bash
git clone <your-fork>
cd story-factory
