<div align="center">

# 🌿 WanderInk

**Every walk becomes a story.**

An AI-powered outdoor exploration journal that transforms 3–5 photographs into evocative, personalized adventure narratives.

[![Next.js](https://img.shields.io/badge/Next.js-16.4.0-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.3.0-blue?style=flat-square&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-6.0-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38bdf8?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)
[![Better Auth](https://img.shields.io/badge/Better_Auth-1.7.7-orange?style=flat-square)](https://better-auth.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-green?style=flat-square&logo=mongodb)](https://www.mongodb.com/)
[![Cloudflare R2](https://img.shields.io/badge/Storage-Cloudflare_R2-F38020?style=flat-square&logo=cloudflare)](https://www.cloudflare.com/products/r2/)
[![License](https://img.shields.io/badge/License-MIT-green.svg?style=flat-square)](LICENSE)

</div>

---

## 📑 Table of Contents

- [Overview](#-overview)
- [System Architecture](#-system-architecture)
- [Core Features](#-core-features)
- [Technology Stack](#-technology-stack)
- [Project Structure](#-project-structure)
- [Environment Variables](#-environment-variables)
- [Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Cloudflare R2 Setup](#cloudflare-r2-setup)
  - [OmniRoute AI Setup](#omniroute-ai-setup)
- [API Reference](#-api-reference)
  - [Authentication](#authentication)
  - [Uploads](#uploads)
  - [Adventures](#adventures)
  - [Public Gallery](#public-gallery)
  - [User Statistics](#user-statistics)
- [Deployment](#-deployment)
  - [Vercel (Frontend)](#vercel-frontend)
  - [Oracle VM / Linux (OmniRoute AI)](#oracle-vm--linux-omniroute-ai)
  - [MongoDB Atlas](#mongodb-atlas)
- [Available Scripts](#-available-scripts)
- [License](#-license)

---

## 🧭 Overview

**WanderInk** bridges the gap between outdoor exploration and personal journaling. Rather than letting snapshots sit buried in a camera roll, WanderInk invites users to take a walk, capture 3–5 mindful photos of their surroundings (landscapes, flora, textures, architectural curiosities), and submit them to a dual-model AI narrative pipeline.

### The WanderInk Pipeline
1. **Client-Side Compression**: Photos are optimized and compressed in the browser to reduce latency and bandwidth.
2. **Direct S3/R2 Ingestion**: Uploads bypass the application server via presigned URLs and stream directly to Cloudflare R2.
3. **Vision Intelligence**: A self-hosted vision model analyzes the collection of photos to extract scenery types, focal objects, lighting, mood, and subtle narrative threads.
4. **Literary Story Crafting**: A companion language model receives the structured visual synthesis and writes an authentic, evocative first-person journal entry (title, summary, full narrative, highlights, and emotional mood score).
5. **Real-Time Streaming**: Generation progress is streamed back to the user in real time using Server-Sent Events (SSE).
6. **Flexible Privacy**: Users can choose to keep journeys completely private (protected by time-limited signed URLs) or publish them to the community gallery.

---

## 🏗️ System Architecture

### High-Level Architecture

```mermaid
flowchart TD
    Client["Client Browser (Next.js 16 + React 19)"]
    NextServer["Next.js Server (App Router & API Routes)"]
    Mongo["MongoDB Atlas (Adventures, Likes, Auth Sessions)"]
    R2["Cloudflare R2 (S3-Compatible Object Storage)"]
    OmniRoute["OmniRoute AI Gateway (Self-Hosted on VM)"]
    VisionLLM["Vision Model (e.g., Qwen 2.5 VL)"]
    StoryLLM["Story Model (e.g., Gemma 2 27B)"]

    Client -- "1. Request Presigned URL" --> NextServer
    NextServer -- "2. Generate PutObject URL" --> Client
    Client -- "3. Direct PUT Upload" --> R2
    Client -- "4. POST /api/adventures" --> NextServer
    Client -- "5. GET /api/adventures/:id/generate (SSE)" --> NextServer

    NextServer -- "6. Read Signed Images" --> R2
    NextServer -- "7. Multi-Image Vision Analysis" --> OmniRoute
    OmniRoute --> VisionLLM
    NextServer -- "8. Stream Vision Progress (SSE)" --> Client
    NextServer -- "9. Generate 1st-Person Story" --> OmniRoute
    OmniRoute --> StoryLLM
    NextServer -- "10. Stream Story Progress (SSE)" --> Client
    NextServer -- "11. Save Story & Highlights" --> Mongo
    NextServer -- "12. SSE Done Event & Redirect" --> Client
```

### Real-Time Generation Sequence

```mermaid
sequenceDiagram
    autonumber
    actor User as User Browser
    participant API as WanderInk API (/api/adventures)
    participant R2 as Cloudflare R2
    participant AI as OmniRoute AI
    participant DB as MongoDB Atlas

    User->>API: POST /api/upload/presign (file metadata)
    API-->>User: Presigned PUT URLs
    User->>R2: Direct upload photos (compressed)
    User->>API: POST /api/adventures (imageKeys, visibility)
    API->>DB: Create adventure (status: 'processing')
    API-->>User: Adventure Created (ID)

    User->>API: GET /api/adventures/:id/generate (SSE connection)
    API->>R2: Generate 24hr presigned GET URLs
    API-->>User: SSE event: vision_start
    loop For each image
        API->>AI: Vision Analysis (callVisionModel)
        AI-->>API: Description, objects, scenes, mood, details
        API-->>User: SSE event: vision_progress (per-photo observations)
    end
    API-->>User: SSE event: vision_complete (aggregated analysis)

    API-->>User: SSE event: story_start
    API->>AI: Story Generation (callStoryModel)
    AI-->>API: Title, summary, fullStory, highlights, moodScore
    API-->>User: SSE event: story_complete

    API->>DB: Update adventure (status: 'completed', story data)
    API-->>User: SSE event: done (redirectUrl)
    User->>User: Navigate to Adventure Story Page
```

---

## ✨ Core Features

- 🌿 **The Mindful Field Journal Ritual**:
  - Promotes intentional outdoor presence over screen addiction.
  - Step outside with notifications silenced, pocket your device between sights, and pause only to collect 3–5 observant moments (flora, textures, lighting, scenery).
  - Designed as an outdoor wellness ritual rather than just an AI demo.
- 📸 **Smart Photo Ingestion**:
  - Accepts 3–5 outdoor photographs per adventure.
  - Client-side compression using `browser-image-compression` keeps files under 5MB and accelerates uploads.
  - Supports JPEG, PNG, and WebP.
- ⚡ **Direct Cloudflare R2 Storage**:
  - Secure presigned PUT URLs allow direct client-to-storage uploads, keeping server memory footprint minimal.
  - Time-limited presigned GET URLs for private adventure assets.
  - Direct CDN delivery for public gallery assets.
- 🤖 **Dual-Stage Vision & Story AI**:
  - **Vision Extraction**: Evaluates composition, natural objects, landscapes, lighting, and environmental tone.
  - **Narrative Synthesizer**: Produces authentic, reflective first-person journals without generic clichés or hallucinations.
- 📡 **Live Generation Streaming (SSE)**:
  - Real-time progress updates via Server-Sent Events.
  - Smooth multi-stage UI displaying image analysis progress, story writing status, and automatic transition upon completion.
- 🌍 **Community Exploration Gallery**:
  - Discover walks shared by other creators.
  - Infinite scrolling pagination with TanStack Query.
  - Search by title, summary, or highlights.
  - Sort by newest, popularity (likes count), or emotional mood score.
- 🔒 **Privacy-First Design**:
  - Adventures default to private.
  - Toggle visibility between `private` and `public` at any time.
  - Private stories are strictly gated by user session; public stories are accessible to everyone.
- 🔐 **Frictionless Authentication**:
  - Powered by Better Auth with MongoDB adapter.
  - Email and password authentication with automatic sign-in upon registration.
  - Robust session management with multi-tab session synchronization.
- 🎨 **Modern, Accessible UI**:
  - Built with Tailwind CSS v4 and Lucide React.
  - Dark and Light mode support with automatic system preference detection (`next-themes`).
  - Toast notifications powered by `sonner`.

---

## 🛠️ Technology Stack

| Layer | Technologies | Purpose |
|---|---|---|
| **Frontend Framework** | [Next.js 16](https://nextjs.org/) (App Router), [React 19](https://react.dev/) | Core application framework and React runtime |
| **Language** | [TypeScript 6](https://www.typescriptlang.org/) | Type-safe development across client and server |
| **Styling** | [Tailwind CSS v4](https://tailwindcss.com/) | Modern utility-first CSS engine |
| **Icons & UI** | [Lucide React](https://lucide.dev/), [class-variance-authority](https://cva.style/) | Iconography and modular UI components |
| **Authentication** | [Better Auth 1.7](https://better-auth.com/) | Authentication, sessions, and security |
| **Database** | [MongoDB Atlas](https://www.mongodb.com/), [Mongoose 9](https://mongoosejs.com/) | Document database and object data modeling |
| **Storage** | [Cloudflare R2](https://www.cloudflare.com/products/r2/) via `@aws-sdk/client-s3` | S3-compatible, zero-egress object storage |
| **State & Fetching** | [TanStack React Query v5](https://tanstack.com/query) | Client-side cache, pagination, and data synchronization |
| **Validation** | [Zod 4](https://zod.dev/), [React Hook Form](https://react-hook-form.com/) | Schema validation and form management |
| **Image Compression**| [browser-image-compression](https://github.com/Donaldcwl/browser-image-compression) | Client-side image pre-processing |
| **AI Gateway** | Self-hosted [OmniRoute](https://github.com/) | OpenAI-compatible gateway routing to Vision & LLM backends |

---

## 📁 Project Structure

```
wanderink/
├── public/                     # Static public assets (icons, images)
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/             # Authentication routes
│   │   │   ├── login/          # User login page
│   │   │   ├── signup/         # User registration page
│   │   │   └── layout.tsx      # Auth pages layout
│   │   ├── (dashboard)/        # Authenticated user routes
│   │   │   ├── dashboard/      # User dashboard & recent adventures
│   │   │   ├── adventures/
│   │   │   │   ├── new/        # Adventure creation & upload wizard
│   │   │   │   └── [id]/       # Private adventure reader & management
│   │   │   └── layout.tsx      # Protected dashboard shell & navigation
│   │   ├── (public)/           # Publicly accessible routes
│   │   │   ├── explore/        # Community discovery gallery
│   │   │   ├── story/[id]/     # Public adventure reader view
│   │   │   └── layout.tsx      # Public routes layout
│   │   ├── api/                # Backend API routes
│   │   │   ├── adventures/     # Adventure CRUD, public lists, likes, SSE
│   │   │   ├── auth/           # Better Auth route handlers
│   │   │   ├── upload/         # Presigned R2 upload URL generation
│   │   │   └── user/           # User dashboard statistics
│   │   ├── globals.css         # Global styles & Tailwind v4 theme definitions
│   │   ├── layout.tsx          # Root HTML layout with providers
│   │   └── page.tsx            # Landing / Marketing home page
│   ├── components/             # Reusable React components
│   │   ├── adventure/          # Adventure cards, uploaders, SSE progress reader
│   │   ├── auth/               # Auth form components
│   │   ├── layout/             # Header, Navigation, and Footer
│   │   ├── providers/          # Theme, Query, and Auth context providers
│   │   └── ui/                 # Custom design system components (Button, Card, Dialog, etc.)
│   ├── hooks/                  # Custom React hooks
│   ├── lib/                    # Shared libraries & utilities
│   │   ├── ai/                 # OmniRoute API client, vision, and story prompts
│   │   ├── auth.ts             # Better Auth server configuration
│   │   ├── auth-client.ts      # Better Auth client configuration
│   │   ├── mongodb.ts          # MongoDB connection helper (Mongoose)
│   │   ├── r2.ts               # Cloudflare R2 S3 client & presigning utilities
│   │   ├── utils.ts            # Class name merger and general helpers
│   │   └── validations.ts      # Zod validation schemas
│   ├── models/                 # Mongoose database models
│   │   ├── Adventure.ts        # Adventure document schema & indexes
│   │   └── AdventureLike.ts    # Adventure likes join schema
│   ├── types/                  # TypeScript interface definitions
│   └── middleware.ts           # Route protection and authentication middleware
├── .env.example                # Environment variable template
├── next.config.ts              # Next.js configuration
├── package.json                # Project dependencies and scripts
└── tsconfig.json               # TypeScript compiler configuration
```

---

## 🔑 Environment Variables

Create a `.env.local` file in the root directory by copying `.env.example`:

```bash
cp .env.example .env.local
```

Configure the following variables:

| Variable | Required | Description | Example / Default |
|---|:---:|---|---|
| `BETTER_AUTH_SECRET` | **Yes** | Secret encryption key for session tokens (min 32 chars) | `openssl rand -base64 32` |
| `BETTER_AUTH_URL` | **Yes** | Base URL for auth callbacks | `http://localhost:3000` |
| `MONGODB_URI` | **Yes** | Connection string for MongoDB Atlas or local MongoDB | `mongodb+srv://user:pass@cluster.mongodb.net/wanderink` |
| `R2_ACCOUNT_ID` | **Yes** | Cloudflare account ID | `1a2b3c4d5e6f...` |
| `R2_ACCESS_KEY_ID` | **Yes** | Cloudflare R2 S3 API Token Access Key | `abc123xyz...` |
| `R2_SECRET_ACCESS_KEY` | **Yes** | Cloudflare R2 S3 API Token Secret Access Key | `secret123...` |
| `R2_BUCKET_NAME` | **Yes** | Cloudflare R2 bucket name | `wanderink-images` |
| `R2_PUBLIC_URL` | **Yes** | Public domain or r2.dev dev URL for bucket assets | `https://pub-xxxxxxxx.r2.dev` |
| `NEXT_PUBLIC_APP_URL` | **Yes** | Public-facing URL of the web app | `http://localhost:3000` |
| `OMNIROUTE_BASE_URL` | **Yes** | Base URL for OpenAI-compatible completions endpoint | `http://your-vm-ip:8000/v1` |
| `OMNIROUTE_API_KEY` | **Yes** | API key for authenticating with OmniRoute | `sk-omniroute-...` |
| `VISION_MODEL` | **Yes** | Model identifier or alias for vision analysis (e.g. `wanderink-vision` or `qwen2.5-vl-72b`) | `wanderink-vision` / `qwen2.5-vl-72b` |
| `STORY_MODEL` | **Yes** | Model identifier or alias for story generation (e.g. `wanderink-story` or `gemma-2-27b`) | `wanderink-story` / `gemma-2-27b` |

---

## 🚀 Getting Started

### Prerequisites

- **Node.js**: `20.x` or later
- **pnpm**: `12.x` or later (`npm i -g pnpm`)
- **MongoDB**: Atlas Cluster (free tier M0 or higher) or local MongoDB instance
- **Cloudflare Account**: With an active R2 bucket
- **OmniRoute / OpenAI-Compatible Server**: Self-hosted or hosted endpoint serving vision and text models

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-username/wanderink.git
   cd wanderink
   ```

2. **Install dependencies:**
   ```bash
   pnpm install
   ```

3. **Configure Environment Variables:**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your credentials
   ```

4. **Start the development server:**
   ```bash
   pnpm dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

---

### Cloudflare R2 Setup

1. In the [Cloudflare Dashboard](https://dash.cloudflare.com/), navigate to **R2**.
2. Click **Create bucket** and name it (e.g. `wanderink-images`).
3. Under bucket **Settings** > **CORS Policy**, add the following configuration:
   ```json
   [
     {
       "AllowedOrigins": [
         "http://localhost:3000",
         "https://your-domain.com"
       ],
       "AllowedMethods": [
         "GET",
         "PUT",
         "HEAD"
       ],
       "AllowedHeaders": [
         "*"
       ],
       "ExposeHeaders": [
         "ETag"
       ],
       "MaxAgeSeconds": 3600
     }
   ]
   ```
4. Under bucket **Settings** > **Public Access**, enable **R2.dev subdomain** or attach a Custom Domain (e.g., `media.yourdomain.com`). Set this URL as `R2_PUBLIC_URL`.
5. Under **Manage R2 API Tokens**, create a token with **Object Read & Write** permissions. Save the **Access Key ID** and **Secret Access Key** into `.env.local`.

---

### OmniRoute AI Setup

WanderInk connects to an OpenAI-compatible API endpoint via OmniRoute.

```bash
# Example: Running OmniRoute with Docker on your VM
docker run -d \
  --name omniroute \
  -p 8000:8000 \
  -e MODELS="qwen2.5-vl-72b,gemma-2-27b" \
  ghcr.io/your-org/omniroute:latest
```

Ensure your firewall allows incoming requests on port 8000 (or configure an Nginx reverse proxy with SSL over HTTPS on port 443).

---

## 📡 API Reference

### Authentication

Better Auth manages authentication sessions and accounts via `/api/auth/[...all]`.

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/sign-up/email` | Register a new account with email, name, and password |
| `POST` | `/api/auth/sign-in/email` | Sign in with email and password |
| `GET` | `/api/auth/session` | Retrieve active user session |
| `POST` | `/api/auth/sign-out` | Revoke session and sign out |

---

### Uploads

#### Generate Presigned Upload URLs
- **Endpoint**: `POST /api/upload/presign`
- **Auth**: Required
- **Body**:
  ```json
  {
    "files": [
      { "name": "forest.jpg", "type": "image/jpeg", "size": 2450000 },
      { "name": "stream.jpg", "type": "image/jpeg", "size": 1820000 },
      { "name": "canopy.jpg", "type": "image/jpeg", "size": 3100000 }
    ],
    "visibility": "private"
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "data": [
      {
        "uploadUrl": "https://<account>.r2.cloudflarestorage.com/...",
        "key": "user123/1712345678-abc.jpg",
        "publicUrl": "https://pub-xxx.r2.dev/user123/...",
        "getUrl": "https://<account>.r2.cloudflarestorage.com/..."
      }
    ]
  }
  ```

---

### Adventures

| Method | Endpoint | Auth | Description |
|---|---|:---:|---|
| `GET` | `/api/adventures` | Yes | List authenticated user's adventures (`page`, `limit`, `status`) |
| `POST` | `/api/adventures` | Yes | Create a new adventure draft with uploaded `imageKeys` and `visibility` |
| `GET` | `/api/adventures/:id` | Yes | Fetch single adventure by ID with signed/public asset URLs |
| `PATCH` | `/api/adventures/:id` | Yes | Update adventure `title` or toggle `visibility` (`private` / `public`) |
| `DELETE` | `/api/adventures/:id` | Yes | Delete adventure document and associated photos from Cloudflare R2 |
| `POST` | `/api/adventures/:id/like` | Yes | Toggle like status for the specified adventure |
| `GET` | `/api/adventures/:id/generate` | Yes | **Server-Sent Events (SSE)** endpoint streaming live AI progress |

#### SSE Generation Stream Events (`/api/adventures/:id/generate`)
1. `event: vision_start` — `{ totalImages: number }`
2. `event: vision_progress` — `{ completed: number, total: number, imageIndex: number, analysis?: ImageAnalysisSummary, failed?: boolean }`
3. `event: vision_complete` — `{ aggregatedAnalysis: AggregatedVisionAnalysis }`
4. `event: story_start` — `{}`
5. `event: story_complete` — `StoryGenerationResult`
6. `event: done` — `{ adventureId: string, redirectUrl: string }`
7. `event: error` — `{ message: string }`

`analysis` carries the per-photo observations (`description`, `mood`, `scenes`, `objects`, `details`)
so the "Step 3: AI is Working" screen can show what the model perceived in each image as it
works through them.

The story call is made with `response_format: json_object` and
`chat_template_kwargs.enable_thinking = false`. Some routed backends otherwise spend the entire
`max_tokens` budget on their reasoning pass and return a `fullStory` that stops mid-sentence.
Incomplete replies are rejected (rather than saved with placeholder text) and retried with a
stricter instruction.

---

### Public Gallery

| Method | Endpoint | Auth | Description |
|---|---|:---:|---|
| `GET` | `/api/adventures/public` | No | Paginated community adventures (`page`, `limit`, `search`, `sort: 'newest' \| 'popular' \| 'mood'`) |
| `GET` | `/api/adventures/public/:id` | No | Fetch public adventure details by ID (read-only) |

---

### User Statistics

| Method | Endpoint | Auth | Description |
|---|---|:---:|---|
| `GET` | `/api/user/stats` | Yes | Returns total adventures, public count, private count, and total likes received |

---

## 🚢 Deployment

### Vercel (Frontend)

1. Push your repository to GitHub.
2. Import the project into [Vercel](https://vercel.com/).
3. In **Project Settings** > **Environment Variables**, add all environment variables defined in `.env.example`.
4. Deploy. Vercel automatically configures the Next.js 16 App Router build.

### Oracle VM / Linux (OmniRoute AI)

Deploy OmniRoute behind Nginx on a Cloud VM (e.g., Oracle Cloud Always Free Ampere A1 or GPU instance):

```bash
# Clone and start OmniRoute
git clone https://github.com/your-org/omniroute.git
cd omniroute
docker compose up -d

# Verify endpoint health
curl http://localhost:8000/v1/models
```

Set up an Nginx reverse proxy with Certbot SSL:
```nginx
server {
    server_name ai.yourdomain.com;

    location / {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_read_timeout 300s;
        proxy_connect_timeout 300s;
        proxy_send_timeout 300s;
    }
}
```

### MongoDB Atlas

1. Create a cluster on [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2. Under **Network Access**, whitelist `0.0.0.0/0` (or Vercel's IP ranges) and your VM's IP address.
3. Under **Database Access**, create a user with read and write permissions to the `wanderink` database.
4. Copy the connection string into `MONGODB_URI`.

---

## 💻 Available Scripts

| Command | Description |
|---|---|
| `pnpm dev` | Starts the Next.js development server on `http://localhost:3000` |
| `pnpm build` | Compiles the production build |
| `pnpm start` | Runs the compiled production server |
| `pnpm lint` | Runs ESLint across the codebase |

---

## 📄 License

This project is open-source and licensed under the [MIT License](LICENSE).