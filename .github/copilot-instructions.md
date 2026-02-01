# Copilot Instructions for HomeskoolERP

## Project Overview
HomeskoolERP is a Next.js-based Educational Resource Planning (ERP) system designed for homeschooling environments. It manages users (admins, teachers, students), academic configurations (boards, classes, subjects, curriculum), sessions, attendance, resources, and allocations. The system uses role-based access control to provide tailored dashboards for different user types.

## Architecture
- **Framework**: Next.js 16 with App Router
- **Database**: Prisma ORM with SQLite
- **Authentication**: NextAuth.js with credentials provider
- **UI Components**: Shadcn/ui (built on Radix UI primitives)
- **Styling**: Tailwind CSS v4
- **Validation**: Zod schemas
- **Forms**: React Hook Form with resolvers
- **Icons**: Lucide React

## Key Technologies
- React 19 with TypeScript
- Server Components and Server Actions for data fetching and mutations
- Middleware for authentication routing
- Prisma Client for database operations
- bcryptjs for password hashing
- date-fns for date utilities

## Authentication & Authorization
- Uses NextAuth with custom credentials provider
- Password hashing with bcryptjs
- Role-based access: ADMIN, TEACHER, STUDENT
- Middleware redirects users to role-specific dashboards
- JWT tokens persist user role in session

## Database Schema
- **User**: Core user model with email, password, role
- **StudentProfile/TeacherProfile**: Extended profiles linked to User
- **Board**: Educational boards (e.g., CBSE, ICSE)
- **Class**: Classes under boards with sections
- **SubjectMaster**: Master list of subjects with categories
- **Subject**: Subjects assigned to classes
- **Chapter/Topic**: Curriculum breakdown
- **TeacherAllocation**: Links teachers to class-subject combinations
- **Session**: Scheduled classes with attendance
- **Attendance**: Student attendance records
- **Resource**: Educational materials
- **Notification**: User notifications

## Components & UI
- **UI Library**: Shadcn/ui components in `src/components/ui/`
- **Admin Components**: Dashboard, sidebar, forms in `src/components/admin/`
- **Auth Components**: Login form in `src/components/auth/`
- **Layout**: Root layout with Geist fonts
- **Styling**: Tailwind with custom utilities, dark mode support

## Server Actions
Located in `src/lib/actions/` and `src/lib/actions.ts`:
- Use `'use server'` directive
- Handle form submissions and data mutations
- Integrate with Prisma for DB operations
- Use `revalidatePath()` for cache invalidation
- Return error objects for client-side handling

## Routing & Middleware
- **App Router**: Route groups for `(auth)` and `(dashboard)`
- **Middleware**: Protects dashboard routes, redirects based on auth status and role
- **Dynamic Redirects**: Login redirects to role-specific pages (/admin, /teacher, /student)

## Development Workflow
- **Scripts**: `npm run dev`, `npm run build`, `npm run lint`
- **Database**: `npx prisma generate`, `npx prisma db push` for schema changes
- **Linting**: ESLint with Next.js config
- **Formatting**: Prettier with Tailwind plugin

## Conventions
- **File Naming**: Kebab-case for components (e.g., `admin-sidebar.tsx`)
- **Imports**: Absolute paths with `@/` alias
- **Types**: TypeScript interfaces in `src/types/`
- **Environment**: `.env` for DATABASE_URL, NEXTAUTH_SECRET
- **Commits**: Descriptive messages, focus on feature additions

## Common Patterns
- **Data Fetching**: Server components fetch data directly with Prisma
- **Forms**: Client components with `useActionState` and server actions
- **Error Handling**: Try-catch in actions, return error strings
- **Role Checks**: Use `auth()` in server components for authorization
- **Revalidation**: Call `revalidatePath()` after mutations
- **UI State**: Client components for interactive elements

## Important Notes
- Always configure Python environment if needed, but this is a Node.js project
- Use `get_errors` tool after edits to check for linting issues
- Prefer server actions over API routes for mutations
- Test authentication flows thoroughly due to role-based redirects
- SQLite is used for development; consider PostgreSQL for production
- The project has extensive lint results files indicating ongoing code quality efforts</content>
<parameter name="filePath">/Users/agrank/Stuffs/ai_projects/homeskoolerp/.github/copilot-instructions.md