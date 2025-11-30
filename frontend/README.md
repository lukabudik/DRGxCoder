# DRGxCoder Frontend

Next.js 14 frontend for the DRGxCoder AI-powered ICD-10 diagnosis prediction system.

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: TanStack Query (React Query)
- **Forms**: React Hook Form
- **Icons**: Lucide React
- **Auth**: Supabase (to be added)

## Project Structure

```
frontend/
├── app/                  # Next.js app router pages
│   ├── layout.tsx       # Root layout with providers
│   └── page.tsx         # Home page
├── components/
│   └── ui/              # Reusable UI components
│       ├── button.tsx
│       ├── card.tsx
│       └── badge.tsx
├── lib/
│   ├── api.ts           # API client for FastAPI backend
│   └── providers.tsx    # React Query provider
├── types/
│   └── index.ts         # TypeScript types
└── .env.local           # Environment variables

```

## Getting Started

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   Create `.env.local`:
   ```
   NEXT_PUBLIC_API_URL=http://localhost:8000
   ```

3. **Run development server:**
   ```bash
   npm run dev
   ```

4. **Open browser:**
   Navigate to [http://localhost:3000](http://localhost:3000)

## API Integration

The frontend connects to the FastAPI backend at `http://localhost:8000` (configurable via `NEXT_PUBLIC_API_URL`).

Available API functions in `lib/api.ts`:
- `api.predict()` - Create new prediction
- `api.getPrediction(id)` - Get prediction details
- `api.listPredictions()` - List all predictions
- `api.submitFeedback()` - Submit approval/rejection
- `api.getCase(id)` - Get case details
- `api.listCases()` - List all cases
- `api.searchCodes()` - Search diagnosis codes
- `api.getCodeDetails(code)` - Get code usage statistics

## UI Components

Clean, reusable components built with Tailwind CSS:
- **Button**: Primary, secondary, outline, ghost variants
- **Card**: Card, CardHeader, CardTitle, CardContent
- **Badge**: Status badges with color variants

## Development Roadmap

### Phase 1: Core Features (Current)
- [x] Project setup
- [x] UI components
- [x] API client
- [x] Type definitions
- [ ] Prediction form page
- [ ] Results display page
- [ ] Feedback interface

### Phase 2: Additional Features
- [ ] Cases list page
- [ ] Case details page
- [ ] Code search page
- [ ] Code details page

### Phase 3: Authentication
- [ ] Supabase auth integration
- [ ] Login/signup pages
- [ ] Protected routes
- [ ] User profile

## Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
```

## Notes

- Backend must be running at `http://localhost:8000`
- All API calls are client-side (React Query)
- Authentication will be added in next phase
