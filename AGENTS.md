# Agent Instructions for Streetwise Coach App

## Commands
- **Dev**: `npm run dev` - Start development server on port 3000
- **Build**: `npm run build` - Production build with type checking
- **Lint**: `npm run lint` - Run ESLint (extends next/core-web-vitals)
- **Format**: `npm run format` - Format with Prettier
- **Migrate**: `npm run migrate:gc2` or `npm run migrate:bbs1` - Run curriculum migration scripts

## Architecture
- **Framework**: Next.js 13.4+ App Router, React 18, TypeScript (strict mode)
- **Structure**: Feature-based organization - `app/` (pages), `core/` (domain + services), `features/` (UI components), `layout/` (Sakai template), `data/` (static curriculum)
- **State**: Client-side localStorage via `core/services/storageService.ts`, no external state management
- **UI**: PrimeReact components for all UI elements, PrimeFlex for grid/layout
- **Docs**: Read ARCHITECTURE.md and DOMAIN_MODEL.md for comprehensive system understanding

## Code Style
- **Imports**: Use `@/` path alias for absolute imports from project root
- **TypeScript**: Strict mode enabled, all types in `core/domain/*.types.ts`, use `type` for unions/primitives, `interface` for objects
- **Formatting**: 4-space indent, single quotes, 250 char line width, semicolons required, no trailing commas (see .prettierrc.json)
- **Components**: Use `'use client'` directive for client components, export default for page components
- **Naming**: camelCase for variables/functions, PascalCase for types/components, kebab-case for file names with extensions
- **Services**: All business logic in `core/services/`, use functional exports, no classes
- **Error Handling**: Use try-catch with fallbacks in storage operations, throw descriptive errors in services
- **IDs**: Follow hierarchical patterns: `{curriculumId}-l{num}`, `{lessonId}-s{num}`, `{sliceId}-st{num}`
