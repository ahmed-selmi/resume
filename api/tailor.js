const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions'
const MAX_TEXT_LENGTH = 16000
const WINDOW_MS = 60_000
const MAX_REQUESTS_PER_WINDOW = 12

const requestTracker = new Map()

function setCorsHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
}

function limitText(value) {
  return String(value || '').trim().slice(0, MAX_TEXT_LENGTH)
}

function parseInput(body) {
  if (!body || typeof body !== 'object') {
    throw new Error('Invalid request body.')
  }

  const jobDescription = limitText(body.jobDescription)
  const profileSeed = limitText(body.profileSeed || '')

  if (jobDescription.length < 80) {
    throw new Error('Job description is too short. Provide at least 80 characters.')
  }

  return { jobDescription, profileSeed }
}

function checkRateLimit(ip) {
  const key = ip || 'unknown'
  const now = Date.now()
  const bucket = requestTracker.get(key)

  if (!bucket || now - bucket.windowStart >= WINDOW_MS) {
    requestTracker.set(key, { windowStart: now, count: 1 })
    return true
  }

  if (bucket.count >= MAX_REQUESTS_PER_WINDOW) {
    return false
  }

  bucket.count += 1
  return true
}

function extractJsonFromModel(content) {
  const trimmed = String(content || '').trim()
  if (!trimmed) {
    throw new Error('Model returned empty content.')
  }

  try {
    return JSON.parse(trimmed)
  } catch {
    const fenced = trimmed.match(/```json\s*([\s\S]*?)```/i)
    if (fenced && fenced[1]) {
      return JSON.parse(fenced[1].trim())
    }
  }

  throw new Error('Model output is not valid JSON.')
}

function normalizeResume(data) {
  const resume = data && typeof data === 'object' ? data : {}

  const safeExperience = Array.isArray(resume.experience)
    ? resume.experience.map((item) => ({
        company: String(item?.company || '').trim(),
        role: String(item?.role || '').trim(),
        startDate: String(item?.startDate || '').trim(),
        endDate: String(item?.endDate || '').trim(),
        location: String(item?.location || '').trim(),
        bullets: Array.isArray(item?.bullets)
          ? item.bullets.map((bullet) => String(bullet || '').trim()).filter(Boolean).slice(0, 5)
          : [],
      }))
    : []

  const safeEducation = Array.isArray(resume.education)
    ? resume.education.map((item) => ({
        institution: String(item?.institution || '').trim(),
        degree: String(item?.degree || '').trim(),
        year: String(item?.year || '').trim(),
      }))
    : []

  return {
    name: String(resume.name || 'Candidate Name').trim(),
    headline: String(resume.headline || 'Tailored Professional Resume').trim(),
    summary: String(resume.summary || '').trim(),
    skills: Array.isArray(resume.skills)
      ? resume.skills.map((skill) => String(skill || '').trim()).filter(Boolean).slice(0, 16)
      : [],
    experience: safeExperience
      .filter((item) => item.role || item.company)
      .slice(0, 8),
    education: safeEducation
      .filter((item) => item.degree || item.institution)
      .slice(0, 5),
  }
}

function buildMessages(jobDescription, profileSeed) {
  const responseShape = {
    name: 'string',
    headline: 'string',
    summary: '2-4 sentences',
    skills: ['8-16 concise skills'],
    experience: [
      {
        company: 'string',
        role: 'string',
        startDate: 'string',
        endDate: 'string',
        location: 'string',
        bullets: ['3-5 quantified outcome bullets'],
      },
    ],
    education: [
      {
        institution: 'string',
        degree: 'string',
        year: 'string',
      },
    ],
  }

  return [
    {
      role: 'system',
      content:
        'You are an expert resume writer. Return ONLY valid JSON with no markdown fences. Use ATS-friendly language, action verbs, and measurable impact. Do not hallucinate tools or employers. If information is missing, keep fields concise and generic rather than inventing specifics.',
    },
    {
      role: 'user',
      content: [
        `Target job description:\n${jobDescription}`,
        profileSeed
          ? `Candidate profile seed:\n${profileSeed}`
          : 'Candidate profile seed:\nNo extra seed was provided.',
        `Return JSON with this shape:\n${JSON.stringify(responseShape, null, 2)}`,
      ].join('\n\n'),
    },
  ]
}

module.exports = async function handler(req, res) {
  setCorsHeaders(res)

  if (req.method === 'OPTIONS') {
    res.status(204).end()
    return
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed.' })
    return
  }

  const ip =
    req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
    req.socket?.remoteAddress ||
    'unknown'

  if (!checkRateLimit(ip)) {
    res.status(429).json({ error: 'Too many requests. Please retry in a minute.' })
    return
  }

  const openRouterKey = process.env.OPENROUTER_API_KEY
  if (!openRouterKey) {
    res.status(500).json({ error: 'OPENROUTER_API_KEY is not configured on the server.' })
    return
  }

  const model = process.env.OPENROUTER_MODEL || 'openai/gpt-4o-mini'

  try {
    const { jobDescription, profileSeed } = parseInput(req.body)
    const messages = buildMessages(jobDescription, profileSeed)

    const upstreamResponse = await fetch(OPENROUTER_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${openRouterKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        temperature: 0.3,
        messages,
      }),
    })

    if (!upstreamResponse.ok) {
      const errorText = await upstreamResponse.text()
      res.status(502).json({
        error: `OpenRouter error: ${errorText.slice(0, 500) || upstreamResponse.statusText}`,
      })
      return
    }

    const completion = await upstreamResponse.json()
    const modelContent =
      completion?.choices?.[0]?.message?.content ||
      completion?.choices?.[0]?.text ||
      ''

    const parsed = extractJsonFromModel(modelContent)
    const normalizedResume = normalizeResume(parsed)

    if (!normalizedResume.summary || normalizedResume.skills.length === 0) {
      res.status(502).json({
        error: 'Model response was incomplete. Please retry with more profile context.',
      })
      return
    }

    res.status(200).json({ resume: normalizedResume })
  } catch (error) {
    res.status(400).json({
      error: error instanceof Error ? error.message : 'Unable to process request.',
    })
  }
}
