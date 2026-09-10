# CareerPath Frontend

Personalized AI-powered English learning path and professional communication training platform for engineers and professionals.

## Tech Stack
- **Framework**: React 18 + TypeScript + Vite
- **Routing**: TanStack Router
- **State & Data**: TanStack Query / React Context
- **UI Components**: Tailwind CSS + shadcn/ui + Radix UI + Lucide Icons
- **Internationalization**: i18next (English, Vietnamese, Japanese)
- **Charts**: Recharts (radar skill evaluation)

## Getting Started

### 1. Prerequisites
- Node.js 18+
- npm or pnpm

### 2. Environment Configuration
Copy `.env.example` to `.env` (or configure your development environment):
```bash
cp .env.example .env
```

Key environment variables:
- `VITE_API_URL`: Backend API URL (e.g. `http://localhost:8000`)
- `VITE_AUTH_API_URL`: Authentication service URL (e.g. `http://localhost:8001`)

### 3. Install Dependencies
```bash
npm install
```

### 4. Run Development Server
```bash
npm run dev
```

### 5. Build for Production
```bash
npm run build
```

## Features
- **Onboarding & Track Selection**: Choose career track and evaluate required skill weights (Documentation, Communication, Troubleshooting, Business).
- **Placement Diagnostic Test**: Multi-tier adaptive diagnostic exam to evaluate proficiency.
- **Personalized Roadmap**: AI-generated roadmap with interactive modules, units, and quizzes.
- **Study Settings & Analytics**: Daily study goals, completion metrics, and streak tracking.
- **Role-Based Access Control**: Learner and Admin portals with killswitch controls.
