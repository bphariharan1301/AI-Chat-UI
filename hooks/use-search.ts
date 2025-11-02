"use client"

import { useQuery } from "@tanstack/react-query"

export interface SearchResult {
  text: string
  highlight: string
}

export interface MentionResult {
  id: string
  name: string
  username: string
  highlight: string
}

async function fetchSearch(query: string): Promise<SearchResult[]> {
  if (!query.trim()) return []
  
  const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`)
  if (!response.ok) throw new Error("Search failed")
  const data = await response.json()
  return data.results || []
}

async function fetchMentions(query: string): Promise<MentionResult[]> {
  const response = await fetch(
    `/api/mentions?q=${encodeURIComponent(query)}&limit=20`
  )
  if (!response.ok) throw new Error("Mentions fetch failed")
  const data = await response.json()
  return data.results || []
}

export function useSearch(query: string, enabled: boolean = true) {
  return useQuery({
    queryKey: ["search", query],
    queryFn: () => fetchSearch(query),
    enabled: enabled && query.length > 0,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
  })
}

export function useMentions(query: string, enabled: boolean = true) {
  return useQuery({
    queryKey: ["mentions", query],
    queryFn: () => fetchMentions(query),
    enabled: enabled && query.length >= 0, // Allow empty query for initial results
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  })
}

