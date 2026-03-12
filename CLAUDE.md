# CLAUDE.md - AI Agent Instructions

## Project Overview

**Transmissions** (`transmissions.earth`) is a web application for collecting and displaying human feelings about AI. It is a public service, not a commercial product.

Users engage in a short guided conversation with Claude about how they feel about AI. With their permission, their words are stored anonymously and displayed to others. The goal is to make people feel heard, and to create a record of how humans felt during this particular moment in history.

**Stack**: Next.js (TypeScript) + Tailwind, Claude API (conversation + quote extraction), AWS S3 (full conversation storage), DynamoDB (quotes + tags for display/search).

**Key routes**:
- `/` — landing page with rotating quotes from submissions
- `/talk` — the guided conversation flow
- `/explore` — browse and filter submissions by category
- `/api/conversation` — proxies messages to Claude
- `/api/submit` — extracts quote, saves to S3 + DynamoDB
- `/api/quotes` — fetches quotes for display

**Conversation arc** (guided by system prompt in `lib/claude.ts`):
1. "How do you feel about AI?"
2. Deepen the feeling (adaptive to mood)
3. Their sense of the future
4. How it's affecting their life personally
5. Gentle nudge toward the other side
6. "If the people building AI could hear you right now, what would you say?"

## Critical Working Principles

### 1. Perform the requested task without additions
   - Only do what is explicitly asked
   - Do not add extra features, refactoring, or "improvements" unless requested
   - Do not proactively add comments, docstrings, or type hints to code you didn't change

### 2. Explain Before Acting

Before making any changes:

1. **Read the relevant files** - Never propose changes to code you haven't read
2. **Explain what you're about to do** - Describe the specific changes you'll make
3. **Wait for confirmation** - Get explicit approval before proceeding
4. **Make only the approved changes** - Stick to what was confirmed

**Example workflow**:
```
User: "Fix the conversation not resetting after submit"

You: "I'll read ConversationView.tsx first."
[Read files]

You: "The issue is in ConversationView.tsx:52 — the messages state isn't
cleared on submission. I will:
1. Reset messages to the opening question after a successful submit
2. Clear the input field

Should I proceed with these specific changes?"

User: "Yes"

You: [Make only those changes]
```

### 3. Ask Questions Early

If anything is unclear:
- **Ask immediately** - Don't guess or assume
- **Be specific** - Ask about concrete implementation details
- **Offer options** - When multiple approaches exist, present them clearly
- **Wait for answers** - Don't proceed with assumptions

### 4. Optimize Context Usage

To keep costs down and responses fast:

**Avoid Redundant File Reads**:
- Reference files from earlier in the conversation instead of re-reading
- When asked about code structure, explain from memory first, only read if uncertain
- Use line number references (e.g., "line 42 in ConversationView.tsx") when possible

**Minimize Exploratory Reads**:
- Before reading multiple files to understand structure, ask: "Should I explore the codebase or do you have specific files in mind?"
- When asked "how does X work?", explain the concept first, only read files if the user asks for specifics
- Use targeted searches (Grep with specific patterns) instead of reading full files when looking for specific patterns

**Batch Operations**:
- Prefer single response with multiple related changes over back-and-forth
- Ask: "Should I also handle Y and Z while I'm at it?" to batch related work
- Run build once after multiple changes rather than after each change

## Project Structure

```
transmissions/
├── app/
│   ├── page.tsx              # Landing page with rotating quotes
│   ├── talk/page.tsx         # Conversation flow
│   ├── explore/page.tsx      # Browse + filter by category
│   └── api/
│       ├── conversation/     # Claude proxy endpoint
│       ├── submit/           # Quote extraction + storage
│       └── quotes/           # Fetch quotes
├── components/
│   ├── ConversationView.tsx  # Guided chat UI
│   └── RotatingQuote.tsx     # Fading quote rotator
├── lib/
│   ├── claude.ts             # System prompt + Claude API calls
│   ├── storage.ts            # S3 + DynamoDB helpers
│   └── types.ts              # Shared types
└── .env.local                # API keys (never commit)
```

## Technology Stack

- **Framework**: Next.js (App Router) + TypeScript
- **Styling**: Tailwind CSS
- **AI**: Anthropic Claude API (`claude-opus-4-6`)
- **Storage**: AWS S3 (conversations) + DynamoDB (quotes/metadata)
- **Target**: Web (deployed to AWS)

## Code Organization Principles

### Component Architecture

**Favor components in their own files with their own local state management:**
- **Each component should be in its own file** with its own local state
- **Components should manage their own UI state** (e.g., isOpen, isHovered)
- **Keep state close to where it's used** - avoid lifting state unnecessarily
- **Business logic stays with the parent** - UI components receive callbacks as props

**Component Responsibilities**:
- **UI Components** (like buttons, inputs): Handle rendering and basic UI interactions, receive callbacks via props
- **Container Components** (like ConversationView): Handle business logic, API calls, and data transformations

**Good Example**:
```typescript
// SubmitButton.tsx - Pure UI component
export const SubmitButton = ({ onSubmit }: { onSubmit: () => void }) => {
  return <button onClick={onSubmit}>Submit</button>;
};

// ConversationView.tsx - Container with business logic
const handleSubmit = () => {
  if (messages.length >= 4) {
    submitToBackend(messages);
  }
};
<SubmitButton onSubmit={handleSubmit} />
```

**Bad Example**:
```typescript
// SubmitButton.tsx - UI component doing business logic
export const SubmitButton = ({ messages }) => {
  const handleSubmit = () => {
    submitToBackend(messages); // ❌ API call in UI component
  };
  return <button onClick={handleSubmit}>Submit</button>;
};
```

### When to Extract a Component

Extract code into a separate component when:
- It has reusable UI patterns or styling
- It makes the parent component cleaner and more focused
- It has its own UI-specific state (e.g., hover, focus, open/closed)
- The user explicitly requests it

### Separation of Concerns

- **UI Components**: Presentational only, receive data and callbacks via props
- **Container Components**: Handle data fetching, business logic, and state management
- **API Layer** (`lib/storage.ts`): All AWS communication
- **Claude Layer** (`lib/claude.ts`): All AI calls and prompt logic
- **Utils**: Pure helper functions with no side effects
- **Helper Functions**: Keep helper functions inside the component that uses them rather than passing them as props. This reduces prop drilling and keeps related logic co-located.

### File Organization

- One component per file
- Co-locate component with its CSS module if one exists
- AWS/storage functions go in `lib/storage.ts`
- Claude/AI functions go in `lib/claude.ts`
- Shared types go in `lib/types.ts`
