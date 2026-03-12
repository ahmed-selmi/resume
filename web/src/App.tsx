import { pdf } from '@react-pdf/renderer'
import { useMemo, useState } from 'react'
import './App.css'
import { generateTailoredResume } from './api'
import { ResumeDocument } from './ResumeDocument'
import type { ResumeResult } from './types'

function App() {
  const [jobDescription, setJobDescription] = useState('')
  const [profileSeed, setProfileSeed] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const [error, setError] = useState('')
  const [resume, setResume] = useState<ResumeResult | null>(null)

  const isGenerateDisabled = useMemo(() => {
    return isGenerating || jobDescription.trim().length < 80
  }, [isGenerating, jobDescription])

  async function handleGenerate() {
    setError('')
    setResume(null)
    setIsGenerating(true)

    try {
      const result = await generateTailoredResume({
        jobDescription: jobDescription.trim(),
        profileSeed: profileSeed.trim(),
      })
      setResume(result.resume)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate resume.')
    } finally {
      setIsGenerating(false)
    }
  }

  async function handleDownloadPdf() {
    if (!resume) {
      return
    }

    setError('')
    setIsDownloading(true)

    try {
      const blob = await pdf(<ResumeDocument resume={resume} />).toBlob()
      const url = URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = `tailored-resume-${new Date().toISOString().slice(0, 10)}.pdf`
      anchor.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create PDF.')
    } finally {
      setIsDownloading(false)
    }
  }

  return (
    <main className="app">
      <header className="header">
        <h1>AI Resume Tailoring</h1>
        <p>
          Paste a job description and a profile seed, then generate a targeted resume and
          download it as a PDF.
        </p>
      </header>

      <section className="panel">
        <label htmlFor="job-description">Job description</label>
        <textarea
          id="job-description"
          value={jobDescription}
          onChange={(event) => setJobDescription(event.target.value)}
          placeholder="Paste the full job description here..."
          rows={10}
        />

        <label htmlFor="profile-seed">Resume/profile seed (optional)</label>
        <textarea
          id="profile-seed"
          value={profileSeed}
          onChange={(event) => setProfileSeed(event.target.value)}
          placeholder="Paste your current resume text, key achievements, or profile notes..."
          rows={8}
        />

        <div className="actions">
          <button onClick={handleGenerate} disabled={isGenerateDisabled}>
            {isGenerating ? 'Generating...' : 'Generate tailored resume'}
          </button>
          <button onClick={handleDownloadPdf} disabled={!resume || isDownloading}>
            {isDownloading ? 'Preparing PDF...' : 'Download PDF'}
          </button>
        </div>
      </section>

      {error && (
        <section className="panel error">
          <p>{error}</p>
        </section>
      )}

      {resume && (
        <section className="panel preview">
          <h2>{resume.name}</h2>
          <p className="headline">{resume.headline}</p>

          <h3>Summary</h3>
          <p>{resume.summary}</p>

          <h3>Skills</h3>
          <ul className="chips">
            {resume.skills.map((skill) => (
              <li key={skill}>{skill}</li>
            ))}
          </ul>

          <h3>Experience</h3>
          {resume.experience.map((entry, index) => (
            <article key={`${entry.company}-${entry.role}-${index}`} className="experience">
              <p className="experience-role">
                {entry.role} - {entry.company}
              </p>
              <p className="experience-meta">
                {entry.startDate} - {entry.endDate}
                {entry.location ? ` | ${entry.location}` : ''}
              </p>
              <ul>
                {entry.bullets.map((bullet, bulletIndex) => (
                  <li key={`${index}-${bulletIndex}`}>{bullet}</li>
                ))}
              </ul>
            </article>
          ))}

          {resume.education.length > 0 && (
            <>
              <h3>Education</h3>
              <ul>
                {resume.education.map((entry, index) => (
                  <li key={`${entry.institution}-${index}`}>
                    {entry.degree} - {entry.institution}
                    {entry.year ? ` (${entry.year})` : ''}
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>
      )}
      <div className="footer-note">
        <small>
          Powered by OpenRouter through a secure Vercel backend endpoint.
        </small>
      </div>
    </main>
  )
}

export default App
