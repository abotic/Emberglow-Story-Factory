# EmberGlow Story Factory

> AI-powered long-form story generation for content creators

[Demo Video Coming Here]

## What is this?

EmberGlow Story Factory is a full-stack application that generates complete story packages for YouTube and content creators. Give it a topic or seed idea, and it creates everything you need: a full script, viral titles, descriptions, hashtags, thumbnail concepts, and scene-by-scene visual prompts for AI image/video generation.

It's designed for creators who produce narrative content—paranormal encounters, history documentaries, horror stories, survival tales—and need high-quality, production-ready scripts with all the metadata and visual direction included.

## Why did I build this?

Creating long-form narrative content is time-consuming. You need a story script, packaging that drives clicks, and detailed visual direction for editors or AI tools. This usually takes hours of work per video.

I wanted to automate the entire creative pipeline: from a simple seed idea to a complete, production-ready package. The result is a system that can generate 60+minute stories with hundreds of scene prompts in few minutes, while maintaining narrative quality and emotional depth.

## Features

### Story Generation
- **AI-Powered Writing**: Creates long-form scripts (5-240 minutes) using OpenAI's GPT models
- **Multiple Genres**: Paranormal encounters, history documentaries, horror, survival, mystery, and more
- **Narrative Depth**: Builds stories around character transformation and emotional arcs
- **Cryptid Seeds**: Special support for paranormal topics with "Surprise Me" feature (no repeated ideas)

### Content Packaging
- **Viral Title Generation**: Creates 8 title variants and ranks them by CTR potential
- **Complete Metadata**: Descriptions, hashtags, and expanded titles ready to paste
- **Visual Direction**: Scene-by-scene prompts for Stable Diffusion 3.5
- **Thumbnail Concepts**: Cinematic, photorealistic prompt for each story

### Ingest Mode
- **Bring Your Own Script**: Upload existing content to generate packaging and visual prompts
- **Auto-Estimation**: Calculates runtime from word count (150 WPM default)
- **Same Quality Output**: All the same metadata and scene prompts as generated stories

### Production Features
- **Job Queue System**: Run up to 6 stories in parallel
- **Real-Time Progress**: SSE-based streaming updates for each generation step
- **Project Browser**: Organized by category with collapsible sections
- **One-Click Copy**: Copy any output (title, script, scene prompts) instantly
- **Smart UI**: Scene prompts and full scripts are collapsible for easy navigation

## Tech Stack

### Backend
- **Runtime**: Node.js with TypeScript
- **Framework**: Fastify (high-performance HTTP)
- **AI**: OpenAI GPT-5 (configurable model)
- **Architecture**: Job queue with concurrency control, SSE streaming

### Frontend  
- **Framework**: React 19 with TypeScript
- **Styling**: Tailwind CSS
- **Build**: Vite
- **State**: React hooks (no external state management needed)

### Project Structure
```
├── server/           # Backend API
│   └── src/
│       ├── config/   # Environment & settings
│       ├── routes/   # HTTP endpoints
│       ├── services/ # Business logic
│       ├── utils/    # Helpers
│       └── types.ts  # TypeScript definitions
│
└── client/           # Frontend UI
    └── src/
        ├── components/
        │   ├── common/   # Reusable UI
        │   ├── forms/    # Input forms
        │   ├── job/      # Job tracking
        │   └── project/  # Browser & details
        ├── lib/          # API client & utils
        ├── types/        # TypeScript definitions
        └── App.tsx
```

## Getting Started

### Prerequisites
- Node.js 20+
- OpenAI API key

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/emberglow-story-factory.git
cd emberglow-story-factory
```

2. **Install dependencies**
```bash
# Backend
cd server
npm install

# Frontend
cd ../client
npm install
```

3. **Configure environment**

Create `server/.env`:
```env
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-5
OPENAI_TEMPERATURE=1
PORT=8000
READING_RATE_WPM=150
MAX_CONCURRENCY=6
```

Create `client/.env` (optional):
```env
VITE_API_BASE=http://localhost:8000
```

4. **Run the application**

Terminal 1 (Backend):
```bash
cd server
npm run dev
```

Terminal 2 (Frontend):
```bash
cd client
npm run dev
```

Open http://localhost:5173

## Usage

### Generate a New Story

1. Select **New story** tab
2. Choose a story type (History learning, Paranormal, Horror, etc.)
3. Set target duration (5-240 minutes)
4. For paranormal stories:
   - Select a cryptid subject (Bigfoot, UFO, Loch Ness, etc.)
   - Enter a custom seed or click **Surprise me** for a fresh idea
5. Click **Generate**

The system will:
- Develop a story premise with protagonist and emotional arc
- Generate 8 title variants and rank them
- Create a detailed chapter outline
- Write the full script chapter-by-chapter
- Generate scene-by-scene visual prompts

### Ingest Existing Content

1. Select **Use existing script** tab
2. Choose story type
3. Paste your script (minimum 100 characters)
4. Optionally override the auto-calculated duration
5. Click **Generate scenery**

You'll get all the packaging and visual prompts without rewriting the script.

### Browse & Copy Outputs

1. Open the **Projects** section
2. Click a category to expand it
3. Click any project card to view details
4. Use the **Copy** button on any field
5. Scene prompts and full script are collapsible—click the arrow to expand

## Environment Variables

### Backend (`server/.env`)

| Variable | Default | Description |
|----------|---------|-------------|
| `OPENAI_API_KEY` | - | OpenAI API key (required) |
| `OPENAI_MODEL` | `gpt-5-mini` | Model to use for generation |
| `OPENAI_TEMPERATURE` | `1` | Creativity level (0-2) |
| `PORT` | `8000` | Server port |
| `READING_RATE_WPM` | `150` | Words per minute for duration estimation |
| `MAX_CONCURRENCY` | `6` | Max parallel jobs |
| `MAX_SCENE_STAMPS_PER_PASS` | `120` | Scene prompts per API call |
| `SCENE_SCRIPT_OVERLAP_CHARS` | `1200` | Context overlap for scene generation |
| `TITLE_VARIANT_COUNT` | `8` | Number of title options to generate |
| `TOPIC_GENERATE_COUNT` | `12` | Topics generated per "Surprise me" |
| `TOPIC_HISTORY_LIMIT` | `200` | Topics to remember (no repeats) |

### Frontend (`client/.env`)

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_API_BASE` | `http://localhost:8000` | Backend API URL |

## Architecture Highlights

### Job Queue System
- Configurable concurrency (default: 6 parallel jobs)
- Real-time progress updates via Server-Sent Events
- Graceful cancellation with cleanup
- Automatic retry with fallback to polling if SSE fails

### Story Generation Pipeline
1. **Premise Development**: Creates rich protagonist with motivation and arc
2. **Title Lab**: Generates variants, ranks by CTR potential
3. **Outline**: Divides into chapters with word count targets
4. **Script Writing**: Iterative chapter generation with context
5. **Visual Prompts**: Scene-by-scene with timestamps, camera angles, lighting

### Prompt Engineering
- **Character-Driven**: Stories built around transformation and emotional journeys
- **No Placeholders**: Fluid prose without meta markers like `[[BEAT]]`
- **Consistent Voice**: First-person survival, investigative casefile, or documentary modes
- **Visual Specificity**: Prompts include camera, lighting, aspect ratio, character tags

## Development

### Backend
```bash
cd server
npm run dev      # Development with watch mode
npm run build    # Compile TypeScript
npm run start    # Production mode
npm run lint     # ESLint
npm run format   # Prettier
```

### Frontend
```bash
cd client
npm run dev      # Development with HMR
npm run build    # Production build
npm run preview  # Preview production build
npm run lint     # ESLint
```

## Project Structure Deep Dive

### Backend Services
- **job-manager.ts**: Queue, scheduling, cancellation
- **generator.ts**: Full story generation pipeline
- **ingest.ts**: Existing script processing
- **prompts.ts**: All AI prompt templates
- **openai.ts**: OpenAI client configuration

### Frontend Components
- **forms/**: GenerateForm, IngestForm with validation
- **job/**: JobPanel, RunningJobs with real-time updates
- **project/**: Browser, cards, collapsible details
- **common/**: Reusable Select, CopyBlock, CollapsibleCopyBlock

## Performance Considerations

- **Chunked Scene Generation**: Large scene sets split into batches with script overlap
- **Streaming Updates**: SSE for real-time progress without polling overhead
- **Optimized Prompts**: Context windows managed to avoid token limits
- **Concurrent Jobs**: Parallel execution up to configurable limit

## Future Ideas

- [ ] Custom voice/style profiles
- [ ] Multi-language support
- [ ] Export to video editor formats (DaVinci Resolve, Premiere)
- [ ] A/B testing for title performance
- [ ] Custom scene prompt templates
- [ ] Webhook notifications when jobs complete
- [ ] Script revision/editing interface

## Contributing

This is personal and hobby project, but suggestions and improvements are welcome! Feel free to:
- Open issues for bugs or feature requests
- Submit PRs with improvements
- Fork and adapt for your own use case

## License

MIT License - see LICENSE file for details

## Acknowledgments

Built with:
- [OpenAI](https://openai.com) for GPT models
- [Fastify](https://fastify.io) for the backend framework
- [React](https://react.dev) and [Vite](https://vitejs.dev) for the frontend
- [Tailwind CSS](https://tailwindcss.com) for styling

---

**Note**: This project requires an OpenAI API key and will incur API costs based on usage and model used.