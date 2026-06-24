# Paloma - Product Vision

## Core Concept
AI-powered collaborative trip planning app for friend groups. Social media meets trip planner with an AI travel assistant that works before AND during the trip.

## Core Differentiators
1. **Social media integration** - Pull inspo from TikTok, Instagram, Pinterest directly into the app. AI identifies what's in the content (restaurant, hotel, beach, activity) and adds it to the plan.
2. **AI trip planner** - Conversational assistant that helps plan the trip AND assists during it (find restaurants, adjust plans, suggest activities).
3. **Real-time collaboration** - Google Docs-style live editing. Everyone sees changes instantly.
4. **Aesthetic** - Beautiful, cool-girl vibe. Not a boring travel app.

## User Flow
1. Download app, create account (email/password, Apple Sign In, Google Sign In)
2. Choose: **Join an existing trip** (via invite code/link) or **Create a new trip**
3. On new trip: AI assistant chats to understand the vision, then generates initial plan
4. Invite friends via link/code
5. Everyone collaborates in real-time: itinerary, mood board, packing, costs
6. During the trip: AI helps find restaurants, adjust plans, identify things from social media

## Social Media → App Flow (Key Innovation)
- User sees a TikTok video of an amazing restaurant in Positano
- Shares the link to the app (via iOS share sheet or paste)
- AI analyzes the content: identifies it as "Restaurant: Da Adolfo, Positano - beachfront dining, seafood"
- Automatically suggests adding it to the itinerary on the right day
- Same for Instagram posts, Pinterest pins, Google Maps links

## Features
### Pre-Trip
- AI trip planning assistant (conversational)
- Mood board (photos, social media links, notes)
- Itinerary builder (day-by-day)
- Packing list (collaborative, categorized)
- Cost splitting + payment tracking
- Who's there when (travel overlap visualization)
- Outfit planner per day

### During Trip
- AI assistant for live help ("find a restaurant near me tonight")
- Real-time itinerary updates
- Expense tracking as you go
- Share photos/moments to mood board

## Auth
- Email/password sign up + sign in
- Apple Sign In
- Google Sign In

## Real-Time
- Supabase real-time subscriptions
- All changes sync instantly across all users
- Presence indicators (who's online)

## Aesthetic
- Beautiful, cool-girl vibe
- Mediterranean/warm color palette
- Playfair Display + DM Sans typography
- Smooth animations
- Feels premium, not corporate

## Tech Stack
- **Frontend:** Expo (React Native) - iOS first
- **Backend:** Supabase (auth, database, real-time, storage, edge functions)
- **AI:** Claude API for trip planning + social media content analysis
- **Social scraping:** Server-side og:image extraction + AI vision analysis

## Monetization
- Free at launch
- Figure out pricing model post-launch based on usage data

## Name
- **Paloma** (Spanish for "dove" - elegance, freedom, travel)
- Backup: Vila
