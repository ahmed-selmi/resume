import {
  Document,
  Page,
  StyleSheet,
  Text,
  View,
} from '@react-pdf/renderer'
import type { ResumeResult } from './types'

const styles = StyleSheet.create({
  page: {
    paddingTop: 28,
    paddingBottom: 28,
    paddingHorizontal: 32,
    fontSize: 11,
    fontFamily: 'Helvetica',
    color: '#1f2937',
    lineHeight: 1.45,
  },
  header: {
    marginBottom: 12,
  },
  name: {
    fontSize: 22,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 4,
  },
  headline: {
    fontSize: 12,
    color: '#374151',
  },
  section: {
    marginTop: 10,
  },
  sectionTitle: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 5,
    color: '#111827',
  },
  paragraph: {
    fontSize: 11,
  },
  skillWrap: {
    display: 'flex',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  skill: {
    fontSize: 10,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  experienceBlock: {
    marginBottom: 8,
  },
  experienceHeader: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  role: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
  },
  company: {
    fontSize: 11,
    color: '#374151',
  },
  meta: {
    fontSize: 10,
    color: '#4b5563',
    marginBottom: 2,
  },
  bullet: {
    display: 'flex',
    flexDirection: 'row',
    marginBottom: 2,
    gap: 4,
  },
  bulletDot: {
    width: 8,
    fontSize: 10,
  },
  bulletText: {
    flex: 1,
    fontSize: 10,
  },
  educationItem: {
    marginBottom: 4,
  },
})

type ResumeDocumentProps = {
  resume: ResumeResult
}

export function ResumeDocument({ resume }: ResumeDocumentProps) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.name}>{resume.name}</Text>
          <Text style={styles.headline}>{resume.headline}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Professional Summary</Text>
          <Text style={styles.paragraph}>{resume.summary}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Core Skills</Text>
          <View style={styles.skillWrap}>
            {resume.skills.map((skill) => (
              <Text key={skill} style={styles.skill}>
                {skill}
              </Text>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Experience</Text>
          {resume.experience.map((item, index) => (
            <View key={`${item.company}-${item.role}-${index}`} style={styles.experienceBlock}>
              <View style={styles.experienceHeader}>
                <Text style={styles.role}>{item.role}</Text>
                <Text style={styles.meta}>
                  {item.startDate} - {item.endDate}
                </Text>
              </View>
              <Text style={styles.company}>{item.company}</Text>
              {!!item.location && <Text style={styles.meta}>{item.location}</Text>}
              {item.bullets.map((bullet, bulletIndex) => (
                <View key={`${index}-${bulletIndex}`} style={styles.bullet}>
                  <Text style={styles.bulletDot}>-</Text>
                  <Text style={styles.bulletText}>{bullet}</Text>
                </View>
              ))}
            </View>
          ))}
        </View>

        {resume.education.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Education</Text>
            {resume.education.map((entry, index) => (
              <View key={`${entry.institution}-${index}`} style={styles.educationItem}>
                <Text style={styles.role}>{entry.degree}</Text>
                <Text style={styles.meta}>
                  {entry.institution}
                  {entry.year ? ` - ${entry.year}` : ''}
                </Text>
              </View>
            ))}
          </View>
        )}
      </Page>
    </Document>
  )
}
