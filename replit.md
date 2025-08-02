# Overview

This is a modern bookmark management application built with a full-stack TypeScript architecture. The application allows users to save, organize, search, and manage web bookmarks with features like URL metadata fetching, tag-based organization, responsive design, and mobile browser integration. It's designed as a personal bookmark manager similar to Pocket, with seamless sharing capabilities from mobile browsers like Opera and Chrome.

## Recent Changes (August 2025)
- Added Web Share API support for mobile browser integration
- Created dedicated `/share` route for handling shared articles from browsers
- Implemented PWA manifest with share_target for Android app integration
- Added service worker for offline capabilities and share handling
- Created mobile-optimized sharing interface with auto-metadata fetching
- Added informational banner to guide users on mobile sharing features

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React 18 with TypeScript for type safety and component-based development
- **Routing**: Wouter for lightweight client-side routing
- **Styling**: Tailwind CSS with CSS variables for theming support, including dark mode capability
- **UI Components**: Radix UI primitives with shadcn/ui components for accessible, customizable interface elements
- **State Management**: TanStack Query (React Query) for server state management and caching
- **Forms**: React Hook Form with Zod validation for type-safe form handling
- **Build Tool**: Vite for fast development and optimized production builds

## Backend Architecture
- **Runtime**: Node.js with Express.js framework for RESTful API endpoints
- **Language**: TypeScript throughout the entire stack for consistent type safety
- **Database ORM**: Drizzle ORM for type-safe database operations and schema management
- **Storage**: In-memory storage implementation with interface for future database integration
- **API Design**: RESTful endpoints for bookmark CRUD operations, search, and tag management

## Data Storage
- **Current Implementation**: In-memory storage using Map data structure for development/testing
- **Database Ready**: Drizzle configuration set up for PostgreSQL with Neon serverless database
- **Schema**: Bookmarks table with URL, title, description, image, domain, tags array, and timestamp fields
- **Migration Support**: Drizzle Kit configured for database schema migrations

## Key Features
- **URL Metadata Extraction**: Automatic fetching of page title, description, and Open Graph images
- **Tag Organization**: Array-based tagging system with color-coded visual representation
- **Search Functionality**: Full-text search across titles, descriptions, URLs, and tags
- **Responsive Design**: Mobile-first design with grid/list view toggles
- **Form Validation**: Zod schemas for runtime type checking and validation
- **Mobile Browser Integration**: Web Share API support for saving articles directly from Opera, Chrome, and other mobile browsers
- **PWA Capabilities**: Progressive Web App with manifest, service worker, and share target for seamless mobile experience
- **Dedicated Sharing Interface**: Optimized `/share` route for handling shared content with auto-fill functionality

## External Dependencies

- **Database**: Neon PostgreSQL serverless database (configured but not yet connected)
- **UI Library**: Radix UI for accessible component primitives
- **Icons**: Lucide React for consistent iconography
- **Date Handling**: date-fns for date formatting and manipulation
- **Development Tools**: Replit-specific plugins for development environment integration

The application follows a monorepo structure with shared TypeScript types between client and server, ensuring type safety across the entire stack. The architecture is designed to be scalable and maintainable, with clear separation of concerns and modern development practices.