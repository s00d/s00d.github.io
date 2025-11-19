import { defineEventHandler } from 'h3'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const username = config.public.githubUsername

  // Используем Nitro storage для персистентного кеша (сохраняется после перезапуска)
  const storage = useStorage('cache')
  const cacheKey = `github-projects-${username}`
  const cacheTTL = 24 * 60 * 60 * 1000 // 24 часа в миллисекундах

  try {
    // Проверяем кеш
    const cached = await storage.getItem(cacheKey) as { data: any[], timestamp: number } | null

    if (cached && cached.timestamp) {
      const age = Date.now() - cached.timestamp
      if (age < cacheTTL) {
        // Кеш валиден, возвращаем данные из кеша
        console.log(`[Cache HIT] Returning cached projects (age: ${Math.round(age / 1000 / 60)} minutes)`)
        return cached.data
      }
    }

    // Кеш устарел или отсутствует, делаем запрос к GitHub
    console.log('[Cache MISS] Fetching projects from GitHub API')

    // Если токен не задан, GitHub ограничит запросы (60 в час), для локальной разработки ок
    const headers: Record<string, string> = config.githubToken
      ? { Authorization: `Bearer ${config.githubToken}` }
      : {}

    // 1. Получаем репозитории
    const repos: any[] = await $fetch(`https://api.github.com/users/${username}/repos?per_page=100&type=owner`, {
      headers
    })

    // 2. Фильтрация и сортировка
    const projects = repos
      .filter(repo => {
        return (
          repo.fork === false &&       // <--- ГЛАВНОЕ: Убирает форки
          !repo.archived &&            // Убирает архивные
          repo.name !== 's00d.github.io' // Убирает сам сайт портфолио
        )
      })
      .sort((a, b) => b.stargazers_count - a.stargazers_count)
      .slice(0, 30)
      .map(repo => ({
        id: repo.id,
        name: repo.name,
        description: repo.description,
        stars: repo.stargazers_count,
        forks: repo.forks_count,
        language: repo.language,
        url: repo.html_url,
        homepage: repo.homepage,
        topics: repo.topics || []
      }))

    // Сохраняем в кеш
    await storage.setItem(cacheKey, {
      data: projects,
      timestamp: Date.now()
    })

    return projects
  } catch (e) {
    console.error('GitHub Fetch Error:', e)

    // При ошибке пытаемся вернуть данные из кеша, даже если они устарели
    try {
      const cached = await storage.getItem(cacheKey) as { data: any[], timestamp: number } | null
      if (cached && cached.data) {
        console.log('[Cache FALLBACK] Returning stale cache due to API error')
        return cached.data
      }
    } catch (cacheError) {
      console.error('Cache read error:', cacheError)
    }

    return [] // Возвращаем пустой массив при ошибке, чтобы сайт не упал
  }
})

