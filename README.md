# WanderInk

> **Every walk becomes a story.**

An AI-powered outdoor exploration journal that transforms 3-5 photos into beautiful, personalized adventure stories.

## Features

- 📸 **Photo Upload** - Drag & drop 3-5 photos with client-side compression
- 🤖 **AI Analysis** - Vision AI extracts objects, scenes, mood, and details
- 📖 **Story Generation** - Get a personalized exploration journal with title, summary, full story, and highlights
- 🌍 **Public Gallery** - Browse community adventures with infinite scroll, search, and sorting
- 🔒 **Privacy-First** - Private adventures use signed URLs, self-hosted AI on your infrastructure
- 🌙 **Dark Mode** - Full dark mode support with system preference detection
- ✨ **Real-time Progress** - Server-Sent Events for live AI generation updates

## Tech Stack

- **Frontend**: Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4
- **Auth**: Better Auth (email/password with verification)
- **Database**: MongoDB Atlas with Mongoose
- **Storage**: Cloudflare R2 (S3-compatible)
- **AI**: Self-hosted OmniRoute (Qwen for vision, Gemma for story)
- **Deployment**: Vercel (frontend), Oracle VM (AI)

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm 12+
- MongoDB Atlas cluster
- Cloudflare R2 bucket
- Oracle VM with OmniRoute running Qwen and Gemma models

### Installation

```bash
# Clone and install dependencies
git clone <repo-url>
cd wanderink
pnpm install

# Copy environment variables
cp .env.example .env.local
# Edit .env.local with your credentials

# Run development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

### Environment Variables

```env
# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/wanderink

# Cloudflare R2
R2_ACCOUNT_ID=your-account-id
R2_ACCESS_KEY_ID=your-access-key-id
R2_SECRET_ACCESS_KEY=your-secret-access-key
R2_BUCKET_NAME=wanderink-images
R2_PUBLIC_URL=https://pub-xxx.r2.dev

# Better Auth
BETTER_AUTH_SECRET=generate-with-openssl-rand-base64-32
BETTER_AUTH_URL=http://localhost:3000

# AI (OmniRoute on Oracle VM)
OMNIROUTE_BASE_URL=http://your-oracle-vm:port/v1
OMNIROUTE_API_KEY=your-omniroute-api-key
VISION_MODEL=qwen2.5-vl-72b
STORY_MODEL=gemma-2-27b

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Project Structure

```
src/
├── app/
│   ├── (auth)/           # Authentication pages
│   ├── (dashboard)/      # Protected user pages
│   ├── (public)/         # Public pages (explore, story)
│   ├── api/              # API routes
│   ├── globals.css       # Global styles
│   └── layout.tsx        # Root layout
├── components/
│   ├── ui/               # Custom UI components
│   ├── auth/             # Auth components
│   ├── adventure/        # Adventure-specific components
│   ├── layout/           # Header, Footer
│   └── providers/        # React context providers
├── lib/                  # Utilities and configurations
├── models/               # Mongoose models
├── hooks/                # Custom React hooks
└── types/                # TypeScript types
```

## Deployment

### Vercel (Frontend)

1. Connect your GitHub repository to Vercel
2. Add all environment variables in Vercel dashboard
3. Deploy - Vercel auto-detects Next.js

### Oracle VM (AI)

```bash
# On your Oracle VM, run OmniRoute with Docker
docker run -d \
  --name omnirune \
  -p 8000:8000 \
  -e MODELS="qwen2.5-vl-72b,gemma-2-27b" \
  ghcr.io/your-org/omnirune:latest

# Set up Nginx reverse proxy with SSL
# Configure firewall for port 443
```

### MongoDB Atlas

1. Create a cluster
2. Add Vercel IP ranges and Oracle VM IP to network access
3. Create database user with read/write permissions
4. Add connection string to environment variables

### Cloudflare R2

1. Create an R2 bucket
2. Configure CORS for your domain
3. Create API token with R2 permissions
4. Add credentials to environment variables

## API Endpoints

### Authentication
- `POST /api/auth/signin` - Sign in
- `POST /api/auth/signup` - Sign up
- `POST /api/auth/signout` - Sign out
- `POST /api/auth/send-verification-email` - Send verification email
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password

### Adventures
- `GET /api/adventures` - List user's adventures
- `POST /api/adventures` - Create adventure
- `GET /api/adventures/:id` - Get adventure
- `PATCH /api/adventures/:id` - Update adventure
- `DELETE /api/adventures/:id` - Delete adventure
- `GET /api/adventures/:id/generate` - SSE: Stream AI generation
- `POST /api/adventures/:id/like` - Toggle like

### Public
- `GET /api/adventures/public` - List public adventures (paginated)
- `GET /api/adventures/public/:id` - Get public adventure

### Upload
- `POST /api/upload/presign` - Get presigned upload URLs

### User
- `GET /api/user/stats` - Get user dashboard stats

## Scripts

```bash
pnpm dev        # Start development server
pnpm build      # Build for production
pnpm start      # Start production server
pnpm lint       # Run ESLint
```

## License

MIT