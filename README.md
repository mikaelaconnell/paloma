# Paloma

AI-powered collaborative trip planning app for friend groups. Social media meets trip planner with a beautiful, cool-girl aesthetic.

**Paloma** (Spanish for "dove") is built for the way people actually plan trips today -- scattered across group texts, Instagram DMs, TikTok saves, Pinterest boards, Google Docs, and Notes app. Paloma brings it all into one beautiful space where everyone can collaborate in real-time.

## What Makes Paloma Different

- **Social Media Integration** -- Share a TikTok, Instagram post, or Pinterest pin directly to Paloma. AI analyzes the content (restaurant? hotel? beach?) and suggests adding it to your plan.
- **Pinterest API** -- Connect your Pinterest account, browse boards, search pins, or import an entire board as trip inspo.
- **AI Trip Planner** -- Chat with an AI assistant to build your trip plan from scratch. Works before AND during the trip.
- **Real-Time Collaboration** -- Google Docs-style live editing. Everyone sees changes instantly.
- **Group Polling** -- Can't decide between two restaurants? Create a poll (single choice, multiple, or ranked). See who voted for what.
- **Beautiful Aesthetic** -- Mediterranean color palette, Playfair Display typography, smooth animations. Not another boring travel app.

## Features

### Pre-Trip
- AI trip planning assistant (conversational)
- Mood board (photos, social media links, notes)
- Itinerary builder (day-by-day, drag activities by type)
- Packing list (collaborative, categorized, progress tracking)
- Cost splitting + payment tracking
- Group polls for decisions
- Pinterest board browsing + import
- Invite friends via code

### During Trip
- AI assistant for live help
- Real-time itinerary updates
- Expense tracking as you go
- Share photos and social media finds to the mood board

## Tech Stack

- **Frontend:** Expo (React Native) -- iOS first
- **Backend:** Supabase (auth, PostgreSQL, real-time subscriptions, storage, edge functions)
- **AI:** Claude API for trip planning + social media content analysis
- **Social:** Pinterest API v5 (OAuth, boards, pins, search)
- **Auth:** Email/password, Apple Sign In, Google Sign In

## Project Structure

```
src/
  screens/
    AuthScreen.tsx          # Sign in / sign up
    HomeScreen.tsx           # Trip list, create/join trip
    AIPlannerScreen.tsx      # AI chat to plan a new trip
    TripScreen.tsx           # Trip detail with tabbed content
    SharedInboxScreen.tsx    # Social media link analysis
  components/
    ItineraryTab.tsx         # Day-by-day plan
    MoodBoardTab.tsx         # Photo/inspo masonry grid
    PollsTab.tsx             # Group voting system
    PackingTab.tsx           # Categorized checklist
    CostsTab.tsx             # Expense splitting
    SharedContentCard.tsx    # AI-analyzed social content card
    PinterestBrowser.tsx     # Pinterest board/pin browser
  hooks/
    useAuth.ts               # Auth state management
    useTrips.ts              # Trip CRUD + invite codes
  lib/
    supabase.ts              # Supabase client
    pinterest.ts             # Pinterest API v5 client
    theme.ts                 # Design system (colors, fonts, spacing)
  types/
    index.ts                 # TypeScript interfaces
```

## Setup

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env
# Fill in your Supabase URL + anon key

# Run the schema
# Copy supabase-schema.sql contents into Supabase SQL Editor and run

# Start the app
npx expo start
```

## Environment Variables

```
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
EXPO_PUBLIC_PINTEREST_APP_ID=your-pinterest-app-id
EXPO_PUBLIC_PINTEREST_APP_SECRET=your-pinterest-secret
```

## Database

14 tables with row-level security and real-time enabled:

`profiles` `trips` `trip_members` `itinerary_days` `itinerary_items` `mood_items` `packing_items` `cost_items` `chat_messages` `shared_content` `polls` `poll_options` `poll_votes` `reactions`

Full schema in `supabase-schema.sql`.

## Roadmap

- [x] Project scaffold + UI screens
- [x] Supabase schema + auth
- [x] Pinterest API integration
- [x] Polling system
- [x] Social media content analysis cards
- [ ] Wire screens to Supabase (replace local state)
- [ ] Claude API edge function for AI chat + content analysis
- [ ] iOS Share Sheet extension
- [ ] Real-time subscriptions
- [ ] Apple Sign In + Google Sign In
- [ ] TestFlight build
- [ ] App Store submission
