# ShelfAI Smart Library

SHELFAI — COMPLETE MASTER BUILD PROMPT

You are a senior full-stack engineer, UI/UX designer, AI engineer, database architect, and software security engineer.

Build a complete production-quality AI-powered Smart Library Management and Book Discovery Platform called:

SHELFAI

Tagline

Discover. Locate. Return.

Do not create only a UI mockup.

Build the complete working application including:

Frontend

Backend

Database

Authentication

Role-based authorization

Gemini AI integration

AI recommendation system

Book search

Shelf location

Library navigation

Book borrowing

Book return

AI shelf verification

AI misplaced-book detection

Librarian dashboard

AI system monitoring

Notifications

Favorites

Reading history

Analytics

Error handling

Loading states

Empty states

Responsive design

API integration

Seed/demo data

Documentation

The final result must be runnable locally and should feel like a real-world product, not a basic academic project.

1. IMPORTANT DEVELOPMENT RULE

First inspect the existing project structure.

If a project already exists:

Do NOT unnecessarily delete working code.

Reuse existing components where appropriate.

Preserve useful existing functionality.

Refactor only when necessary.

Integrate the new features into the existing architecture.

If the project is empty:

Create the complete project structure.

Do not stop after creating the frontend.

Implement the backend, database, APIs, authentication, and AI integration as well.

2. RECOMMENDED TECH STACK

Use a clean modern full-stack architecture.

Frontend

Use:

React

TypeScript

Vite

React Router

Tailwind CSS

Lucide React icons

Axios or fetch

Modern reusable components

Use TypeScript throughout the frontend.

Backend

Use:

Python

FastAPI

Pydantic

Uvicorn

Database

Use:

MongoDB

Use a clean database structure with proper relationships/references.

AI

Use:

Google Gemini API

The Gemini API must be accessed ONLY from the backend.

3. PROJECT BRANDING

Application name:

ShelfAI

Tagline:

Discover. Locate. Return.

Logo concept:

A minimal combination of:

Open book

Library shelf

AI sparkle

Use a clean premium startup-style logo.

4. DESIGN SYSTEM

Use a warm premium library-inspired visual identity.

Primary

#3B2F2F — Deep Coffee Brown

Use for:

Navbar

Primary buttons

Main headings

Active states

Important controls

Secondary

#F7F3EE — Warm Ivory

Use for:

Main backgrounds

Cards

Sections

Search areas

Accent

#C89B5C — Soft Gold

Use for:

AI indicators

Active states

Recommendation highlights

Shelf location

Important icons

Hover states

Supporting

Primary text:

#241F1C

Secondary text:

#8A817A

Border:

#E5DDD4

Success:

#5F8D6E

Error:

#B85C5C

Maintain approximately:

70% Warm Ivory / 20% Deep Coffee / 10% Soft Gold

Do not use:

Neon colors

Bright blue

Excessive gradients

Excessive gold

Dark backgrounds everywhere

Heavy glassmorphism

5. TYPOGRAPHY

Use:

Inter or Manrope

Use a clear hierarchy.

Headings should be bold but not oversized.

Body text should be highly readable.

Maintain generous whitespace.

6. GENERAL UI STYLE

The application should feel:

Premium + Warm + Minimal + Intelligent + Professional

Use:

Rounded cards

Soft shadows

Clean icons

Subtle borders

Generous spacing

Smooth hover effects

Small micro-interactions

Avoid clutter.

Every page should have one clear purpose.

7. RESPONSIVE DESIGN

The complete application must work on:

Desktop

Laptop

Tablet

Mobile

Desktop:

Use sidebar/top navigation where appropriate.

Mobile:

Use bottom navigation for user pages.

Ensure:

Cards stack correctly

Search works properly

Camera features are usable

Navigation remains accessible

Tables become mobile-friendly

Buttons remain easy to tap

8. AUTHENTICATION

Implement real authentication.

Users must be able to:

Sign up

Login

Logout

Maintain session

Access profile

Reset/change password if supported

Do NOT create fake frontend-only authentication.

Use secure backend authentication.

Use hashed passwords.

Never store plain-text passwords.

9. ROLE-BASED ACCESS

Create two roles:

USER

Can access:

Home

AI Recommendations

Search Books

Book Details

Book Location

Navigation

My Books

Favorites

Reading History

Return Book

Notifications

Profile

LIBRARIAN

Can access:

Dashboard

Books

Shelves

Borrowing

Returns

AI Shelf Scanner

Misplaced Books

AI System

Analytics

Notifications

Settings

Users must NOT access librarian routes.

Librarians must NOT automatically access another user's private information.

Protect both frontend routes and backend endpoints.

10. INDIVIDUAL USER DATA

Every user must have isolated personal data.

Store separately:

Profile

Favorites

Search history

Reading history

Borrowing history

AI recommendation history

Interests

Notifications

IMPORTANT:

User A must never receive User B's data.

User A's AI recommendation history must never be used for User B.

All personalized API requests must identify the authenticated user securely from the backend session/token.

Never trust a user_id sent directly from the frontend for authorization.

11. PAGE 1 — LOGIN

The Login page must be the first page.

Use Glassmorphism ONLY on the Login page.

Do not use heavy glassmorphism throughout the main application.

Background

Create:

Warm ivory background

Subtle library/bookshelf visual

Soft blur

Soft lighting

Very subtle gold glow

Keep it elegant.

Glass Card

Centered glass card with:

Semi-transparent ivory/white surface

Backdrop blur

Soft border

Subtle shadow

Rounded corners

Do not make it excessively transparent.

Content

Logo:

ShelfAI

Tagline:

Your intelligent library companion

Fields:

Email / Username

Password

Options:

Remember me

Forgot password?

Primary button:

Login

Bottom:

Don't have an account? Sign Up

After successful login:

Redirect to:

Books Home

Do NOT redirect to a generic empty dashboard.

12. USER NAVIGATION

Create a dedicated User navbar.

Logo:

ShelfAI

Navigation:

Home

AI Recommendations

Search Books

My Books

Favorites

Return Book

Right:

Notifications

Profile

User name

Active page:

Use Soft Gold.

On mobile:

Use bottom navigation.

13. PAGE 2 — BOOKS HOME

After login, immediately show:

Explore Our Library

This page must show the books available in the library.

Do not put AI chat here.

Do not make this a crowded dashboard.

Categories

Show:

All

Fiction

Non-Fiction

Science

Technology

History

Mystery

Self Development

Programming

Book Grid

Each card:

Book cover

Book title

Author

Genre

Rating

Availability

Shelf number

View Book

Example:

The Alchemist

Paulo Coelho

Fiction

Available

Shelf A-03

View Book

Use pagination or lazy loading for large collections.

14. BOOK AVAILABILITY

Use clear statuses:

Available → Green

Borrowed → Soft red/error

Reserved → Gold

Each book must have:

Total copies

Available copies

Borrowed copies

If no copies are available:

Show:

Currently unavailable

Allow:

Join Waitlist / Reserve

if enabled.

15. PAGE 3 — AI RECOMMENDATIONS

Create a separate dedicated page.

Main heading:

Find books you'll love.

This must be the ONLY major heading.

Do not add unnecessary paragraphs below it.

AI Input

Large input:

“Tell me what kind of book you're looking for…”

Examples:

I want a mystery book with a detective story.

Suggest a beginner-friendly Python book.

I want a motivational book.

I want something similar to Harry Potter.

Button:

✦ Ask AI

Interest chips:

Mystery

Thriller

Sci-Fi

Self Growth

Programming

16. GEMINI API

Use Google Gemini API for recommendations.

Flow:

Frontend → Backend → Gemini → Backend → Frontend

Never call Gemini directly from the browser.

SECURITY

Never hard-code an API key.

Never place it inside:

React components

JavaScript

TypeScript

HTML

Public config

GitHub

Console logs

Use:

GEMINI_API_KEY=your_new_api_key_here


Load it only on the backend.

Add .env to .gitignore.

Provide a .env.example file:

GEMINI_API_KEY=
MONGODB_URI=
JWT_SECRET=


IMPORTANT:

If an API key has previously been exposed, do NOT reuse it. Use a newly generated/revoked key.

Never display the actual API key in the UI.

17. GEMINI RECOMMENDATION LOGIC

The backend should:

Receive authenticated user's request.

Retrieve relevant books from MongoDB.

Filter to books that actually exist in the library.

Consider availability.

Consider the user's preferences/history when appropriate.

Send structured library data + user request to Gemini.

Ask Gemini to rank/recommend books.

Gemini must return only books from the provided library dataset.

Backend validates returned book IDs.

Backend sends valid recommendations to frontend.

IMPORTANT:

Gemini must NOT invent books.

Gemini must NOT recommend books outside the library database.

18. STRUCTURED AI RESPONSE

Use structured JSON from the backend.

Example:

{
  "recommendations": [
    {
      "book_id": "BK001",
      "reason": "Matches your interest in mystery and detective stories.",
      "match_score": 94
    }
  ]
}


Validate the response before displaying it.

If Gemini returns an invalid book ID:

Ignore it.

Do not display it.

19. PERSONALIZED AI

Use:

Current request

Favorite books

Search history

Reading history

Selected interests

Previous AI interactions

Keep personalization private to the authenticated user.

Example:

User A:

I like mystery books

Store this preference for User A.

Do not automatically apply it to User B.

20. AI RECOMMENDATION RESULTS

Show:

Recommended for You

Cards should contain:

Book cover

Book title

Author

Genre

Rating

AI match score

Short AI reason

Availability

Shelf location

Find Book

Do NOT display huge AI-generated paragraphs.

Example:

The Hound of the Baskervilles

Arthur Conan Doyle

Mystery • Detective

94% Match

“Matches your interest in detective stories.”

Available

Shelf B-04

Find Book

21. PAGE 4 — SEARCH BOOKS

Create a completely separate page:

Search Books

Purpose:

Find a specific book or author and locate it.

Search placeholder:

“Search by book name or author…”

Support:

Book title

Author

ISBN

Genre

Partial text

Examples:

Harry Potter

J.K. Rowling

The Alchemist

Paulo Coelho

Search must query the backend/database.

Do not use only frontend filtering.

22. SEARCH RESULTS

Each result:

Book cover

Title

Author

Genre

Availability

Section

Shelf

Row

Position

Button:

Locate Book

If multiple copies exist, show the available copies and their locations.

23. PAGE 5 — BOOK DETAILS

Show:

Book cover

Title

Author

Description

Genre

ISBN

Publication year

Rating

Availability

Number of copies

Location card:

Section A

Shelf A-03

Row 2

Position 7

Buttons:

Locate Book

Add to Favorites

If available:

Borrow Book

If unavailable:

Reserve Book

Below:

You May Also Like

Use the AI recommendation engine to show similar books.

24. PAGE 6 — BOOK LOCATION

Create a dedicated:

Book Location

Show:

Book Name

Then:

Section A

↓

Shelf A-03

↓

Row 2

↓

Position 7

Also show a clean visual library map.

Highlight destination shelf with:

#C89B5C

Button:

Start Navigation

25. LIBRARY NAVIGATION

Create a simple visual map.

The map should show:

Entrance

Sections

Shelves

Target shelf

Example:

Entrance → Section A → Shelf A-03

Do not build unnecessary complex GPS functionality.

The primary goal is helping the user understand where the book is physically located.

26. PAGE 7 — MY BOOKS

Create:

My Books

Sections:

Currently Borrowed

Show:

Book

Borrow date

Due date

Status

Return Book

Reading History

Show previously borrowed/read books.

Favorites

Show saved books.

All information must belong to the logged-in user.

27. BORROW BOOK FEATURE

When a user borrows a book:

Update:

Book availability

User borrowing record

Copy status

Create a borrowing record with:

User ID

Book ID

Copy ID

Borrow date

Due date

Return date

Status

Prevent two users from borrowing the same physical copy simultaneously.

28. RESERVATION FEATURE

If all copies are borrowed:

Allow user to:

Reserve Book

Create a waitlist.

When a copy becomes available:

Notify the next eligible user.

Show:

Your position in queue

if appropriate.

29. PAGE 8 — RETURN BOOK

Create a dedicated:

Return Book

Purpose:

After reading a book, the user should return it to the correct physical shelf.

Flow:

SELECT BOOK → SCAN BOOK → SHOW EXPECTED LOCATION → SCAN SHELF → AI VERIFY → CONFIRM RETURN

30. SELECT BOOK

Show currently borrowed books.

Each card:

Book

Due date

Status

Button:

Return This Book

31. SCAN BOOK

Provide:

Scan Book

Support:

Book cover

ISBN

Barcode

QR code if available

Identify the book/copy.

Provide manual fallback:

Select Book Manually

in case camera scanning is unavailable.

32. EXPECTED LOCATION

After identifying the book:

Show:

Expected Location

Section A

Shelf A-03

Row 2

Position 7

Make this highly visible.

33. SCAN SHELF

Allow:

Scan Shelf

Use device camera where available.

Also allow:

Upload Shelf Image

for desktop/demo use.

34. AI SHELF VERIFICATION

Analyze the shelf image.

Determine:

Book identity

Book order

Shelf

Approximate position

Whether the returned book is in the expected location

Correct

Show:

🟢 Correct Location

This book is placed in the correct position.

Button:

Confirm Return

Incorrect

Show:

🟠 Wrong Location

This book belongs to Shelf A-03, Row 2, Position 7.

Button:

Try Again

Do not confirm the physical shelf verification until the user receives a clear result.

Provide a manual override for authorized librarians when computer vision cannot confidently verify the shelf.

35. PAGE 9 — AI MISPLACED BOOK DETECTION

Librarian-only page:

AI Shelf Scanner

Options:

Upload Shelf Image

Scan with Camera

AI should detect:

Books

Book titles

Approximate positions

Shelf

Potentially misplaced books

Show:

Books Detected: 42

Correctly Placed: 38

Potentially Misplaced: 4

For each detected issue:

Book:

Introduction to Algorithms

Detected:

Shelf C-02

Expected:

Shelf B-04

Confidence:

94%

Status:

Potentially Misplaced

Button:

Mark as Misplaced

36. AI COMPUTER VISION ARCHITECTURE

Keep the computer vision system modular.

Create a service layer for shelf analysis.

Do not tightly couple the image recognition logic to the UI.

The architecture should allow the AI/CV model to be replaced later.

If a real CV model is not configured initially:

Implement a clear service abstraction and demo/mock mode with sample shelf images.

Clearly label demo/mock mode.

Do NOT falsely claim real AI detection if the model is not configured.

37. PAGE 10 — AI SYSTEM

Create:

AI System

Purpose:

Monitor and test AI functionality.

Top status:

🟢 AI Online

Gemini API Connected

Services:

Gemini Recommendation

AI Book Recommendation

Shelf Detection

Misplaced Book Detection

Return Shelf Verification

Each should show:

Status

Last checked

Error if any

38. AI TEST

Create:

Test AI

Input:

“Test the AI…”

Button:

✦ Test AI

Send request through backend.

Show:

AI Response

Response Status

Response Time

Example:

🟢 AI connection is working successfully.

If failed:

🔴 AI Connection Failed

Buttons:

Retry

Check Configuration

Never expose the API key.

39. AI HEALTH ENDPOINT

Create backend health endpoints such as:

GET /api/health

and:

GET /api/ai/health

The AI health endpoint should verify configuration/connectivity without exposing secrets.

Return safe status information such as:

{
  "status": "ok",
  "provider": "gemini"
}


Never return the API key.

40. NOTIFICATIONS

Implement a notification system.

Notify users about:

Due dates

Successful return

Reservation availability

Book availability

AI recommendation updates

Library announcements

Show notification badge in navbar.

41. FAVORITES

Users can:

Add to Favorites

Remove from Favorites

Favorites must be user-specific.

Do not store favorites globally.

42. SEARCH HISTORY

Store recent searches per user.

Show on AI/search pages when appropriate.

Allow:

Clear Search History

Do not expose one user's history to another user.

43. FEEDBACK

Add optional feedback for AI recommendations.

For each recommendation:

👍 Helpful

👎 Not useful

This can later improve personalization.

Store:

User

Book

Recommendation

Feedback

Timestamp

44. LIBRARIAN DASHBOARD

Create a separate professional admin dashboard.

Top statistics:

Total Books

Available

Borrowed

Reserved

Misplaced

Active Users

Analytics:

Most borrowed books

Most searched books

Popular categories

Monthly borrowing trends

AI recommendation requests

Frequently misplaced shelves

Most active library hours

Use clean charts.

Do not overload the dashboard.

45. LIBRARIAN NAVBAR

Separate from user navbar.

Logo:

ShelfAI — Admin

Navigation:

Dashboard

Books

Shelves

Borrowing

Returns

AI Shelf Scanner

Misplaced Books

AI System

Analytics

Settings

Right:

Notifications

Admin profile

Logout

46. BOOK MANAGEMENT

Librarian can:

Add book

Edit book

Delete book

Add copies

Update availability

Assign shelf

Change shelf position

Book fields:

Book ID

ISBN

Title

Author

Genre

Description

Cover

Publication year

Rating

Shelf

Section

Row

Position

Availability

Validate all fields.

47. SHELF MANAGEMENT

Librarian can manage:

Sections

Shelves

Rows

Positions

Example:

Section A

Shelf A-03

Row 2

Position 7

Books must have a structured physical location.

This location must be used by:

Search

AI recommendations

Navigation

Return verification

Misplaced detection

48. DATABASE DESIGN

Create MongoDB collections/models for at least:

users

_id

name

email

password_hash

role

interests

created_at

books

_id

book_id

isbn

title

author

genre

description

cover_url

publication_year

rating

copies

shelves

_id

section

shelf_id

rows

positions

borrowings

_id

user_id

book_id

copy_id

borrowed_at

due_date

returned_at

status

favorites

_id

user_id

book_id

created_at

search_history

_id

user_id

query

created_at

ai_recommendations

_id

user_id

query

recommendations

created_at

reservations

_id

user_id

book_id

queue_position

status

created_at

notifications

_id

user_id

title

message

type

read

created_at

shelf_scans

_id

librarian_id

image/reference

detected_books

misplaced_books

created_at

feedback

_id

user_id

book_id

recommendation_id

feedback

created_at

49. API STRUCTURE

Create clean REST APIs.

Authentication

POST /api/auth/register

POST /api/auth/login

GET /api/auth/me

POST /api/auth/logout

Books

GET /api/books

GET /api/books/{id}

POST /api/books

PUT /api/books/{id}

DELETE /api/books/{id}

Search

GET /api/books/search?q=

AI

POST /api/ai/recommend

POST /api/ai/test

GET /api/ai/health

Borrowing

POST /api/borrow

GET /api/my-books

POST /api/return

Favorites

POST /api/favorites

DELETE /api/favorites/{book_id}

GET /api/favorites

Reservations

POST /api/reservations

GET /api/reservations

Shelf

GET /api/shelves

GET /api/shelves/{id}

Shelf AI

POST /api/ai/shelf-scan

POST /api/ai/verify-return

Notifications

GET /api/notifications

PATCH /api/notifications/{id}/read

Protect every endpoint according to role and ownership.

50. API ERROR HANDLING

Use consistent API responses.

Examples:

Success

{
  "success": true,
  "data": {}
}


Error

{
  "success": false,
  "message": "Book not found"
}


Frontend should display friendly error messages.

Never expose internal stack traces to users.

51. LOADING / EMPTY / ERROR STATES

Every page must have proper states.

Examples:

Loading:

Loading books...

AI:

AI is thinking...

Search:

Searching the library...

Empty:

No books found

Error:

Something went wrong. Please try again.

Do not leave blank screens.

52. CAMERA FEATURES

For:

Scan Book

Scan Shelf

Request camera permission properly.

If permission is denied:

Show:

Camera access is unavailable.

Provide:

Upload Image

and:

Enter ISBN Manually

as fallback options.

The app must remain usable without camera access.

53. SECURITY

Implement:

Password hashing

Secure authentication

Role-based authorization

User ownership checks

Environment variables

Input validation

API validation

File upload validation

File size limits

Safe error handling

CORS configuration

No secret exposure

Do not trust client-side role values.

Backend must enforce authorization.

54. GEMINI PROMPT SAFETY / DATA CONTROL

When sending book information to Gemini:

Only send necessary fields.

Do not send:

Passwords

Tokens

API keys

Sensitive user information

Use only relevant personalization data.

The AI should return recommendations based on actual library books.

55. SEED DATA

Create a seed script with realistic demo data.

Include at least:

30 books

Multiple genres

Multiple authors

Multiple shelves

Different availability states

At least 2 demo users

1 librarian/admin

Include books from:

Fiction

Mystery

Thriller

Science

Technology

Programming

Self Development

History

Do not rely on external APIs just to populate basic demo data.

56. DEMO ACCOUNTS

Provide development/demo credentials through documentation or seed configuration.

Do not hard-code production passwords.

Clearly mark demo accounts as development-only.

57. USER EXPERIENCE

The user journey must be:

LOGIN

↓

EXPLORE OUR LIBRARY

See available books
↓

AI RECOMMENDATIONS

Tell Gemini what kind of book you want
↓

RECOMMENDED BOOKS

Choose a book
↓

SEARCH BOOKS

Search title or author if needed
↓

BOOK LOCATION

Find exact shelf
↓

START NAVIGATION

Go to the physical shelf
↓

READ BOOK

↓

RETURN BOOK

↓

SCAN SHELF

↓

AI VERIFY

↓

CONFIRM RETURN

Separate:

AI SYSTEM

Test Gemini and monitor AI services.

58. PAGE STRUCTURE

Create these pages:

Public

Login

Register

User

Home / Explore Library

AI Recommendations

Search Books

Book Details

Book Location

Navigation

My Books

Favorites

Return Book

Notifications

Profile

Librarian

Dashboard

Book Management

Shelf Management

Borrowing Management

Return Management

AI Shelf Scanner

Misplaced Books

AI System

Analytics

Settings

Do not combine all these into one giant dashboard.

59. NAVIGATION RULE

Each feature must have its own page.

The User navbar:

Home | AI Recommendations | Search Books | My Books | Favorites | Return Book

The Librarian navbar:

Dashboard | Books | Shelves | Borrowing | AI Scanner | Misplaced | AI System | Analytics

Keep navigation intuitive.

60. AI RECOMMENDATION PAGE UI RULE

This page must remain extremely clean.

Use:

ONE BOLD HEADING

↓

ONE LARGE AI INPUT

↓

SMALL INTEREST CHIPS

↓

RECOMMENDATION CARDS

Do not add unnecessary paragraphs.

Do not overcrowd the screen.

61. LOGIN UI RULE

Glassmorphism is allowed ONLY here.

Main application should use normal premium cards.

Do not turn the entire website into glassmorphism.

62. VISUAL HIERARCHY

Every screen should have:

Clear page heading

Main action

Supporting content

Secondary actions

Do not give every element equal visual importance.

63. ACCESSIBILITY

Implement:

Proper labels

Keyboard navigation

Focus states

Accessible buttons

Sufficient contrast

Alt text for book covers

ARIA where appropriate

Do not rely only on color to communicate status.

64. PERFORMANCE

Optimize:

Images

API requests

Database queries

Pagination

Search

AI calls

Do not call Gemini unnecessarily.

Cache or reuse suitable results where appropriate.

Avoid sending the entire database to Gemini for every request.

Retrieve relevant candidate books first.

65. AI RECOMMENDATION OPTIMIZATION

Do not send thousands of books to Gemini.

First perform backend filtering/search based on:

Genre

Keywords

Author

Availability

User preferences

Then provide a reasonable candidate list to Gemini for ranking.

This reduces:

Cost

Latency

Token usage

66. AI FAILURE FALLBACK

If Gemini is unavailable:

Do not break the application.

Show:

AI is temporarily unavailable.

Provide a fallback:

Browse books by category

The user should still be able to search and locate books.

67. BOOK SEARCH FALLBACK

If AI is unavailable, normal book search must continue working.

Search functionality must NEVER depend on Gemini.

68. RETURN VERIFICATION FALLBACK

If computer vision cannot confidently identify the shelf:

Show:

Unable to confidently verify shelf placement.

Options:

Scan Again

Upload Another Image

Ask Librarian

Authorized librarians can manually verify the return.

69. AUDIT LOG

Add an audit log for important librarian actions.

Track:

Book added

Book edited

Book removed

Shelf changed

Misplaced book marked

Manual return verification

Admin settings changes

Include:

User

Action

Timestamp

Do not expose unnecessary audit information to normal users.

70. ANALYTICS

Create clean charts for:

Books borrowed per month

Popular categories

Most borrowed books

Most searched books

AI recommendation requests

Recommendation success/feedback

Misplaced books by shelf

Library usage trends

Keep analytics readable and not overloaded.

71. NOTIFICATION UX

Notifications should support:

Unread count

Mark as read

Mark all as read

Examples:

Your reserved book is now available.

Your book is due tomorrow.

Return successfully verified.

72. PROFILE PAGE

User profile:

Name

Email

Interests

Favorite genres

Reading preferences

Account settings

Allow user to update preferences.

These preferences can improve AI recommendations.

73. PROJECT STRUCTURE

Create a clean structure similar to:

ShelfAI/
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── layouts/
│   │   ├── hooks/
│   │   ├── services/
│   │   ├── types/
│   │   ├── utils/
│   │   └── routes/
│   └── ...
│
├── backend/
│   ├── app/
│   │   ├── api/
│   │   ├── models/
│   │   ├── schemas/
│   │   ├── services/
│   │   ├── auth/
│   │   ├── ai/
│   │   ├── database/
│   │   └── main.py
│   ├── scripts/
│   └── ...
│
├── .env.example
├── .gitignore
├── README.md
└── ...


Adapt the structure if the existing project already has a better architecture.

74. ENVIRONMENT CONFIGURATION

Create:

.env.example

with:

GEMINI_API_KEY=
MONGODB_URI=
JWT_SECRET=
CORS_ORIGINS=


Never commit .env.

75. README

Create a complete README containing:

Project overview

Features

Architecture

Tech stack

Setup instructions

Environment variables

MongoDB setup

Gemini API setup

Frontend setup

Backend setup

Seed data

Demo accounts

API overview

How to run

Troubleshooting

Make setup understandable for a beginner.

76. TESTING

Create basic tests for important functionality.

At minimum test:

Authentication

Register

Login

Unauthorized access

Books

Search

Book details

Availability

Borrowing

Borrow available book

Prevent duplicate borrowing

Return book

AI

Gemini configuration

Recommendation endpoint

Invalid AI response handling

Authorization

User cannot access librarian API

User can only access their own data

77. FINAL QUALITY CHECK

Before considering the project complete, verify:

Authentication

Login works

Register works

Logout works

Sessions work

User

Home displays books

Search works

Author search works

Book details work

Shelf location works

Navigation works

Favorites work

My Books works

Borrow works

Return works

AI

Gemini recommendation works

AI only recommends database books

Personalized recommendation works

AI test works

AI health works

API failure is handled

API key is never exposed

Shelf AI

Shelf image upload works

Camera option works where supported

Return verification works

Misplaced detection flow works

Manual fallback exists

Librarian

Dashboard works

Book management works

Shelf management works

Borrowing management works

AI scanner works

Misplaced book management works

Analytics works

Security

Passwords hashed

Role authorization works

User data isolated

API key hidden

.env ignored

Backend validates permissions

UI

Responsive

No broken links

No empty pages

No console errors

Loading states

Error states

Empty states

Success states

Accessible controls

78. FINAL IMPLEMENTATION INSTRUCTION

Do NOT stop at creating components or placeholder pages.

Implement the actual:

Frontend + Backend + MongoDB + Authentication + REST APIs + Gemini integration + User personalization + Book management + Borrowing + Returning + Shelf verification + Librarian dashboard.

Where an external AI/CV service is genuinely required and cannot be configured automatically:

Create the correct service abstraction.

Create the API endpoint.

Create the frontend integration.

Provide a clear configuration variable.

Provide a safe demo/mock fallback.

Clearly indicate when demo/mock mode is active.

Do not fake a successful AI response when the API is unavailable.

Do not expose secrets.

Do not delete working functionality without reason.

Do not ask unnecessary questions if a reasonable implementation decision can be made.

Make sensible technical decisions and continue implementation.

79. FINAL PRODUCT VISION

ShelfAI should feel like a real smart-library startup product.

The complete experience is:

LOGIN

→ SEE AVAILABLE BOOKS

→ ASK AI WHAT TO READ

→ GEMINI RECOMMENDS FROM ACTUAL LIBRARY BOOKS

→ SEARCH A SPECIFIC BOOK

→ FIND EXACT SHELF

→ NAVIGATE TO BOOK

→ READ

→ RETURN BOOK

→ SCAN SHELF

→ AI VERIFIES CORRECT LOCATION

→ CONFIRM RETURN

Meanwhile librarians can:

MANAGE BOOKS → MANAGE SHELVES → SCAN SHELVES → DETECT MISPLACED BOOKS → MANAGE BORROWING → VIEW AI STATUS → VIEW ANALYTICS

Build the application with a polished, production-quality finish.

The final design must communicate:

Smart + Human + Premium + Library + AI

Brand:

SHELFAI

Discover. Locate. Return.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://index-intel-ai.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/9065d1e1-74de-4722-8d6e-246c5343692c).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
