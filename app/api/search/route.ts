import { NextRequest, NextResponse } from "next/server";

// Mock search suggestions database
const searchSuggestions = [
  "How to use React hooks",
  "How to use React Query",
  "How to use React Router",
  "How to build a Next.js app",
  "How to use TypeScript",
  "How to implement authentication",
  "How to use Tailwind CSS",
  "How to create API routes",
  "How to handle form validation",
  "How to implement dark mode",
  "How to use shadcn/ui components",
  "How to optimize React performance",
  "How to deploy to Vercel",
  "How to use React Context",
  "How to implement pagination",
  "How to handle errors in React",
  "How to use useEffect properly",
  "How to create custom hooks",
  "How to test React components",
  "How to implement search functionality",
];

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get("q") || "";

  if (!query.trim()) {
    return NextResponse.json({ results: [] });
  }

  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 200));

  // Filter and match suggestions
  const results = searchSuggestions
    .filter((suggestion) =>
      suggestion.toLowerCase().includes(query.toLowerCase())
    )
    .slice(0, 10)
    .map((suggestion) => ({
      text: suggestion,
      highlight: query,
    }));

  return NextResponse.json({ results });
}
