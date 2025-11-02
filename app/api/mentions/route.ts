import { NextRequest, NextResponse } from "next/server";

// Generate placeholder names on-the-fly
function generatePlaceholderNames(query: string, limit: number = 20) {
  const firstNames = [
    "John", "Jane", "Michael", "Sarah", "David", "Emily", "James", "Emma",
    "Robert", "Olivia", "William", "Sophia", "Richard", "Isabella", "Joseph", "Ava",
    "Thomas", "Mia", "Charles", "Charlotte", "Daniel", "Amelia", "Matthew", "Harper",
    "Mark", "Evelyn", "Donald", "Abigail", "Steven", "Elizabeth", "Paul", "Sofia",
  ];

  const lastNames = [
    "Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis",
    "Rodriguez", "Martinez", "Hernandez", "Lopez", "Wilson", "Anderson", "Thomas", "Taylor",
    "Moore", "Jackson", "Martin", "Lee", "Thompson", "White", "Harris", "Sanchez",
    "Clark", "Ramirez", "Lewis", "Robinson", "Walker", "Young", "Allen", "King",
  ];

  const allNames: string[] = [];
  
  // Generate combinations
  for (const firstName of firstNames) {
    for (const lastName of lastNames) {
      const fullName = `${firstName} ${lastName}`;
      const username = `${firstName.toLowerCase()}-${lastName.toLowerCase()}`;
      
      // Check if matches query
      if (
        firstName.toLowerCase().startsWith(query.toLowerCase()) ||
        lastName.toLowerCase().startsWith(query.toLowerCase()) ||
        username.toLowerCase().includes(query.toLowerCase())
      ) {
        allNames.push(`${firstName} ${lastName}`);
      }
    }
  }

  // If query matches, return matching names
  if (query) {
    return allNames.slice(0, limit);
  }

  // If no query, return random names
  const randomNames: string[] = [];
  for (let i = 0; i < limit; i++) {
    const first = firstNames[Math.floor(Math.random() * firstNames.length)];
    const last = lastNames[Math.floor(Math.random() * lastNames.length)];
    randomNames.push(`${first} ${last}`);
  }
  return randomNames;
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get("q") || "";
  const limit = parseInt(searchParams.get("limit") || "20", 10);

  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 150));

  const names = generatePlaceholderNames(query, limit);

  const results = names.map((name) => ({
    id: name.toLowerCase().replace(/\s+/g, "-"),
    name,
    username: name.toLowerCase().replace(/\s+/g, "-"),
    highlight: query,
  }));

  return NextResponse.json({ results });
}

