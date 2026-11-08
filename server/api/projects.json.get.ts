// Prerendered at build time into /api/projects.json; the page embeds the result in its payload.
interface Repo {
  id: number
  name: string
  description: string | null
  stargazers_count: number
  forks_count: number
  language: string | null
  html_url: string
  homepage: string | null
  topics?: string[]
  fork: boolean
  archived: boolean
  pushed_at: string
}

export default defineEventHandler(async () => {
  const { githubToken, public: { githubUsername } } = useRuntimeConfig()
  const headers: Record<string, string> = { 'User-Agent': 's00d.github.io' }
  if (githubToken) headers.Authorization = `Bearer ${githubToken}`

  const repos: Repo[] = []
  for (let page = 1; ; page++) {
    const batch = await $fetch<Repo[]>(`https://api.github.com/users/${githubUsername}/repos`, {
      headers,
      query: { per_page: 100, type: 'owner', page },
    })
    repos.push(...batch)
    if (batch.length < 100) break
  }

  return repos
    .filter(r => !r.fork && !r.archived && r.name !== `${githubUsername}.github.io`)
    .sort((a, b) => b.stargazers_count - a.stargazers_count)
    .map(r => ({
      id: r.id,
      name: r.name,
      description: r.description,
      stars: r.stargazers_count,
      forks: r.forks_count,
      language: r.language,
      url: r.html_url,
      homepage: r.homepage || null,
      topics: r.topics ?? [],
      pushedAt: r.pushed_at,
    }))
})
