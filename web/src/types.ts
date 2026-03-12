export type ResumeExperience = {
  company: string
  role: string
  startDate: string
  endDate: string
  location: string
  bullets: string[]
}

export type ResumeEducation = {
  institution: string
  degree: string
  year: string
}

export type ResumeResult = {
  name: string
  headline: string
  summary: string
  skills: string[]
  experience: ResumeExperience[]
  education: ResumeEducation[]
}

export type TailorRequest = {
  jobDescription: string
  profileSeed: string
}

export type TailorResponse = {
  resume: ResumeResult
}
