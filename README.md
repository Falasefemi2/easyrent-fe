# EasyRent Frontend

EasyRent is a modern rental property listing platform designed for seamless property discovery and management. This repository contains the frontend application built with Next.js, utilizing a functional programming approach with Effect-TS for robust state and side-effect management.

## Features

- Property Discovery: Browse, search, and filter rental listings based on location, price, rooms, and furnishing status.
- User Authentication: Secure sign-up and sign-in functionality with automated token refresh management.
- Listing Management: Users can create, update, and delete their own property listings.
- Media Handling: Support for property image uploads and user avatar management.
- Favorites System: Save and manage a personal list of favorite properties.
- Map Integration: Visualize property locations using interactive maps.
- Responsive Design: Fully optimized for both desktop and mobile devices.

## Tech Stack

- Framework: Next.js (App Router) rewrote to tanstack start
- Language: TypeScript
- Functional Programming: Effect-TS
- Styling: Tailwind CSS 4
- UI Components: Radix UI and shadcn/ui
- Icons: Lucide React and Tabler Icons
- Maps: Leaflet and React-Leaflet
- Runtime: Bun
- Linting and Formatting: Biome

## Getting Started

### Prerequisites

- Bun runtime installed on your machine.
- A running instance of the EasyRent backend API.

### Installation

1. Clone the repository:
   ```bash
   git clone "https://github.com/Falasefemi2/easyrent-fe"
   cd easyrent-fe
   ```

2. Install dependencies:
   ```bash
   bun install
   ```

3. Configure environment variables:
   Create a `.env.local` file in the root directory and add the following:
   ```env
   NEXT_PUBLIC_API_URL=http://your-api-url
   ```

### Running the Application

Start the development server:
```bash
bun dev
```

The application will be available at `http://localhost:3000`.

## Project Structure

- `app/`: Next.js App Router pages and layouts.
- `components/`: Reusable UI components, including shadcn/ui primitives.
- `lib/api/`: API service layer built with Effect-TS for handling network requests.
- `lib/types.ts`: TypeScript interfaces and types for the domain models.
- `public/`: Static assets such as images and icons.

## Scripts

- `bun dev`: Starts the development server.
- `bun build`: Builds the application for production.
- `bun start`: Starts the production server.
- `bun lint`: Runs the linter.
- `bun prepare`: Patches the Effect language service.

## License

This project is private and intended for internal use.
