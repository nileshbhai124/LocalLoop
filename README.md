# LocalLoop - Neighborhood Sharing Platform

A modern, responsive web application for lending, borrowing, and renting items locally. Built with Next.js 14, React, TypeScript, and Tailwind CSS.

## Features

- **Landing Page** - Hero section, how it works, featured items, and benefits
- **Authentication** - Login and signup pages with validation
- **Browse Items** - Search, filter, and discover items in your neighborhood
- **Item Details** - Detailed view with image gallery, owner info, and booking
- **Dashboard** - User overview with borrowed and listed items
- **List Items** - Easy form to share your items with the community
- **Messages** - Real-time chat interface between users
- **Profile** - User profiles with ratings, reviews, and listed items
- **Notifications** - Dropdown notifications for requests and messages

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Custom components with Radix UI primitives
- **Forms**: React Hook Form
- **State Management**: Zustand
- **HTTP Client**: Axios
- **Icons**: Lucide React

## Color Palette

- **Primary**: #16A34A (Green)
- **Secondary**: #F1F5F9 (Light gray)
- **Accent**: #22C55E
- **Text**: #0F172A
- **Background**: #FFFFFF

## Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn/pnpm

### Installation

1. Clone the repository
2. Install dependencies:

```bash
npm install
# or
yarn install
# or
pnpm install
```

3. Run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure

```
├── app/                    # Next.js app directory
│   ├── browse/            # Browse items page
│   ├── dashboard/         # User dashboard
│   ├── items/[id]/        # Item details page
│   ├── list-item/         # List new item page
│   ├── login/             # Login page
│   ├── messages/          # Chat interface
│   ├── profile/           # User profile page
│   ├── signup/            # Signup page
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Landing page
│   └── globals.css        # Global styles
├── components/            # Reusable components
│   ├── ui/               # Base UI components
│   ├── ChatWindow.tsx
│   ├── FilterPanel.tsx
│   ├── Footer.tsx
│   ├── ItemCard.tsx
│   ├── ItemGrid.tsx
│   ├── Navbar.tsx
│   ├── NotificationBell.tsx
│   ├── SearchBar.tsx
│   └── UserAvatar.tsx
├── hooks/                # Custom React hooks
│   ├── useAuth.ts
│   └── useToast.ts
├── lib/                  # Utility functions
│   ├── axios.ts
│   └── utils.ts
└── types/                # TypeScript types
    └── index.ts
```

## Key Features

### Responsive Design
- Mobile-first approach
- Breakpoints: sm (640px), md (768px), lg (1024px), xl (1280px)
- Optimized for all screen sizes

### Accessibility
- Semantic HTML
- ARIA labels
- Keyboard navigation support
- Focus states

### UX Features
- Loading skeletons
- Empty states
- Error handling
- Toast notifications
- Smooth animations
- Hover effects

## Components

### Reusable UI Components
- **Button** - Multiple variants (primary, secondary, outline, ghost)
- **Card** - Container with shadow and hover effects
- **Input** - Form input with label and error states
- **ItemCard** - Display item with image, price, and owner
- **SearchBar** - Search input with icon
- **FilterPanel** - Advanced filtering options
- **NotificationBell** - Dropdown notifications
- **ChatWindow** - Real-time messaging interface
- **UserAvatar** - User profile picture or initials

## State Management

Using Zustand for global state:
- **useAuth** - Authentication state and user data
- **useToast** - Toast notification system

## API Integration

Axios instance configured with:
- Base URL from environment variables
- Request interceptors for authentication
- Error handling

## Environment Variables

Create a `.env.local` file:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

## Build for Production

```bash
npm run build
npm start
```

## Design Philosophy

- **Clean & Modern** - Minimalistic design inspired by Airbnb and Notion
- **Sustainability Focus** - Green color palette representing eco-friendliness
- **User-Friendly** - Intuitive navigation and clear call-to-actions
- **Community-Driven** - Features that encourage local connections

## Future Enhancements

- Real-time notifications with WebSockets
- Payment integration
- Advanced search with geolocation
- Item availability calendar
- User verification system
- Rating and review system
- Dark mode support
- Progressive Web App (PWA)

## License

MIT License
