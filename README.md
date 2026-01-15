# incogniChat 💬

**A privacy-first, ephemeral group chat platform with modern UX and real-time collaboration features.**

<div align="center">

![Next.js](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.0-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)
![Bun](https://img.shields.io/badge/Bun-1.0-000000?style=for-the-badge&logo=bun&logoColor=white)
![Redis](https://img.shields.io/badge/Upstash_Redis-Serverless-DC382D?style=for-the-badge&logo=redis&logoColor=white)
![Vercel](https://img.shields.io/badge/Deploy-Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)

[🚀 **Live Demo**](#) <!-- Add your deployment link here -->

</div>

---

## 🎯 Why This Project Exists

In an era of permanent digital footprints, sometimes conversations should just... disappear. **incogniChat** solves the problem of temporary, secure group communication without the overhead of authentication, data persistence, or privacy concerns.

**The Problem:** Traditional chat apps store messages indefinitely, require accounts, and leave permanent traces of every conversation.

**The Solution:** A self-destructing chatroom that exists for 20 minutes, requires no signup, and automatically cleans up all data. Perfect for quick team discussions, temporary collaborations, or privacy-conscious communication.

---

## ✨ Key Features

### Core Functionality

- 🔥 **Self-Destructing Rooms** – 20-minute TTL with real-time countdown, automatic cleanup
- ⚡ **Real-time Messaging** – Sub-100ms message delivery via SSE (Server-Sent Events)
- 🚫 **Zero Authentication** – Token-based room access, no accounts or login required
- 🗑️ **True Ephemeral Data** – Everything auto-deletes when room expires or is destroyed
- 👥 **Configurable Capacity** – Room creators set limits (2-10 participants)

### Modern UX Features

- 💬 **Instagram/Messenger-style Bubbles** – Color-coded bubbles for each user in group chats
- 😊 **Emoji Reactions** – Click or long-press to react; supports custom picker with 1000+ emojis
- ✓✓ **Read Receipts** – WhatsApp-style double checkmarks with detailed viewer info
- ⌨️ **Typing Indicators** – Facebook Messenger-style bouncing dots with throttling
- 📱 **Mobile-First Design** – Touch-optimized interactions, long-press gestures, responsive layouts
- 🌈 **Smart Color Coding** – Unique gradient colors per user (group chats only)
- 🎮 **Cyberpunk 2077-Inspired UI** – Neon yellow accents, hexagonal elements, glitch effects, and futuristic aesthetics inspired by one of my favorite games

### Technical Excellence

- 🔒 **Room-Full Protection** – Enforces capacity limits at middleware level
- ⚡ **Optimistic UI Updates** – Instant feedback before server confirmation
- 👁️ **Viewport-based Read Tracking** – Intersection Observer API for automatic read receipts
- 🎨 **Accessibility-Friendly** – ARIA labels, keyboard navigation, semantic HTML
- 📊 **Real-time Capacity Tracking** – Live participant count in room header

---

## 🛠️ Tech Stack Explained

### Frontend

| Technology                  | Purpose         | Why This Choice                                                        |
| --------------------------- | --------------- | ---------------------------------------------------------------------- |
| **Next.js 16** (App Router) | React framework | Server Components, streaming, optimal performance, modern architecture |
| **React 19**                | UI library      | Concurrent features, automatic batching, improved hydration            |
| **TypeScript**              | Type safety     | Catch errors at compile-time, better DX, self-documenting code         |
| **Tailwind CSS v4**         | Styling         | Utility-first, mobile-first, no runtime CSS-in-JS overhead             |
| **TanStack Query v5**       | Server state    | Smart caching, automatic refetching, optimistic updates                |

### Backend

| Technology           | Purpose             | Why This Choice                                                                |
| -------------------- | ------------------- | ------------------------------------------------------------------------------ |
| **Elysia v1.4**      | API framework       | Runs on Bun (3x faster than Node), type-safe routes, minimal overhead          |
| **Bun Runtime**      | JavaScript runtime  | Native TypeScript, faster than Node.js, efficient HTTP streaming               |
| **Zod**              | Schema validation   | Type-safe validation, runtime checks, TypeScript inference                     |
| **Upstash Redis**    | Database            | Serverless, sub-ms latency, built-in TTL support, no infrastructure management |
| **Upstash Realtime** | Real-time streaming | SSE/HTTP streaming, serverless-friendly, auto-reconnect via Redis Streams      |

### Tooling & DevOps

- **nanoid** – Collision-resistant IDs (shorter than UUID, URL-safe)
- **emoji-picker-react** – 1000+ emojis with search and categories
- **Next.js Middleware** – Request interception for auth and capacity checks
- **Dynamic Imports** – Code splitting for emoji picker (reduces initial bundle)

---

## 🏗️ Architecture & Design Highlights

### Serverless-First Architecture

```
Client (Next.js) → API Routes (Elysia) → Redis (Upstash) → Real-time (SSE/HTTP)
                          ↓
                   Middleware Auth Layer
                          ↓
                   Capacity Enforcement
```

**Key Design Decisions:**

1. **TTL-Driven Cleanup** – Leverages Redis TTL to automatically expire rooms, messages, and metadata without cron jobs or manual cleanup
2. **Token-Based Sessions** – HTTP-only cookies with nanoid tokens stored in Redis for stateless authentication
3. **Channel-Per-Room** – Isolated SSE channels prevent cross-room message leakage
4. **SSE Over WebSockets** – Simpler scaling without persistent socket servers, works on all serverless platforms (Vercel, Netlify)
5. **Optimistic Mutations** – UI updates immediately; rollbacks only on server errors
6. **Intersection Observer** – Marks messages as "read" when 50%+ visible for 500ms (battery-efficient)

### Performance Optimizations

- **Dynamic Imports** – Emoji picker loads on-demand (saves ~150KB initial bundle)
- **Debounced Typing Events** – 1s throttle prevents event spam (3s auto-stop)
- **Indexed Reactions** – O(1) reaction lookup using hash maps
- **Component Memoization** – Prevents unnecessary re-renders in message lists
- **SSE Auto-Reconnect** – Built-in reconnection + history replay via Redis Streams (no manual retry logic)

### Security Considerations

- **No PII Collection** – Usernames are randomly generated, not stored permanently
- **HTTPOnly Cookies** – Prevents XSS attacks on session tokens
- **Input Validation** – Zod schemas on all API endpoints (max 1000 chars per message)
- **Rate Limiting Ready** – Middleware architecture supports future rate limiting
- **CORS Protection** – Same-site cookie policy prevents CSRF

---

## 🌟 What Makes This Project Stand Out

### 1. **Privacy by Design**

Unlike most chat apps that "delete" messages by hiding them, incogniChat uses Redis TTL to **physically expire data** from storage. No backups, no recovery, no traces.

### 2. **Advanced UX Patterns**

- **Read Receipts with Intersection Observer** – More battery-efficient than scroll listeners
- **Long-Press Gestures** – 500ms touch detection for mobile reaction picker
- **Color Hashing Algorithm** – Deterministic user colors in group chats (same user = same color)
- **Conditional Rendering** – Different UI for 1-on-1 vs. group chats
- **Cyberpunk 2077 Aesthetic** – Yellow (#fcee0a) primary accents, angular clip-path shapes, neon glows, scanline effects, and "//" comment-style labels. Built as a tribute to one of my all-time favorite games, bringing that dystopian-futuristic vibe to a modern web app.

### 3. **Real-World Scalability**

- **Serverless Redis** – No server maintenance, auto-scales to millions of requests
- **Edge-Ready** – Can deploy to Vercel Edge for <50ms global response times
- **SSE Streaming** – No sticky sessions required, simpler horizontal scaling than WebSockets
- **Auto-Reconnect Built-in** – Redis Streams provide message history replay on reconnection

### 4. **Clean Code Architecture**

- **Custom Hooks** – `useTypingIndicator`, `useReadReceipts`, `useUsername` for reusability
- **Component Composition** – `MessageItem` → `MessageReactions` → `EmojiPicker` (single responsibility)
- **Type Safety** – End-to-end TypeScript from client to database schemas
- **Error Boundaries** – Graceful degradation when features fail

### Trade-offs & Lessons Learned

| Decision                  | Trade-off                                   | Lesson                                          |
| ------------------------- | ------------------------------------------- | ----------------------------------------------- |
| Redis TTL                 | No message history recovery                 | Privacy > convenience for this use case         |
| No database               | Can't scale to millions of concurrent rooms | Serverless Redis is surprisingly cheap at scale |
| Client-side read tracking | Relies on user's viewport                   | Server-side tracking would require polling      |
| Color hashing             | Hash collisions possible with >9 users      | Acceptable for max 10 users per room            |

---

## 🚀 Getting Started

### Prerequisites

- **Bun** v1.0+ (or Node.js 18+)
- **Upstash Account** (free tier available)

### 1. Clone & Install

```bash
git clone https://github.com/yourusername/realtime_chatroom.git
cd realtime_chatroom
bun install  # or npm install
```

### 2. Environment Setup

Create `.env.local`:

```env
UPSTASH_REDIS_REST_URL=your_redis_url
UPSTASH_REDIS_REST_TOKEN=your_redis_token
```

### 3. Run Development Server

```bash
bun dev  # or npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### 4. Build for Production

```bash
bun run build
bun start
```

---

## 🔮 Future Improvements

**Planned Features:**

- [ ] **Voice Messages** – Record and send ephemeral audio clips
- [ ] **File Sharing** – Upload images/files with auto-expiration
- [ ] **End-to-End Encryption** – WebCrypto API for client-side encryption
- [ ] **PWA Support** – Install as native app, push notifications
- [ ] **Room Themes** – Customizable color schemes per room
- [ ] **Message Search** – Client-side search (no server indexing)
- [ ] **Presence Indicators** – Online/offline status dots
- [ ] **Multi-Language Support** – i18n for global audience

**Technical Debt:**

- Add comprehensive unit tests (Jest + React Testing Library)
- Implement rate limiting middleware (per-IP, per-room)
- Add Sentry error tracking for production monitoring
- Optimize bundle size further (current: ~180KB gzipped)

---

## 👨‍💻 About the Author

Built by a **full-stack engineer** passionate about **real-time systems, clean architecture, and privacy-respecting software**.

This project demonstrates:

- ✅ Modern React patterns (hooks, composition, server components)
- ✅ Real-time system design (SSE/HTTP streaming, pub/sub, state management)
- ✅ Serverless architecture (cost-effective, scalable, maintainable)
- ✅ Mobile-first UX (touch gestures, responsive design, accessibility)
- ✅ TypeScript expertise (end-to-end type safety, schema validation)

**Looking to collaborate?** Open to full-time opportunities in frontend, backend, or full-stack roles. Check out my other projects or reach out via [LinkedIn](https://www.linkedin.com/in/abdullah-al-raiyan) or [Email](abdullahalraiyan4@gmail.com).

---

## 📄 License

MIT License - feel free to use this project for learning or inspiration!

---

**⭐ If this project helped you, consider starring the repo!**
