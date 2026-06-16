import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontFamily: 'Helvetica',
    fontSize: 9,
    color: '#1f2937',
    lineHeight: 1.25
  },
  headerContainer: {
    borderBottomWidth: 2,
    borderBottomColor: '#0ea5e9', // Sky blue modern accent
    paddingBottom: 8,
    marginBottom: 12
  },
  name: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0ea5e9',
    marginBottom: 2
  },
  contactDetails: {
    fontSize: 8,
    color: '#4b5563',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6
  },
  sectionTitle: {
    fontSize: 9.5,
    fontWeight: 'bold',
    color: '#0ea5e9',
    letterSpacing: 0.5,
    marginTop: 12,
    marginBottom: 6,
    textTransform: 'uppercase',
    backgroundColor: '#f0f9ff',
    paddingHorizontal: 4,
    paddingVertical: 2
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 1
  },
  boldText: {
    fontWeight: 'bold',
    color: '#111827'
  },
  italicText: {
    fontStyle: 'italic',
    color: '#4b5563'
  },
  bulletsContainer: {
    marginLeft: 8,
    marginTop: 1.5,
    marginBottom: 4
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 1.5
  },
  bulletPoint: {
    width: 6,
    fontSize: 9,
    color: '#0ea5e9'
  },
  bulletText: {
    flex: 1,
    fontSize: 8.5,
    color: '#374151',
    textAlign: 'justify'
  },
  skillsRow: {
    flexDirection: 'row',
    marginBottom: 2
  }
});

const ModernMinimalist = ({ data }) => {
  if (!data) return null;
  const { personal = {}, education = [], experience = [], projects = [], skills = {} } = data;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.headerContainer}>
          <Text style={styles.name}>{personal.name || "Student Name"}</Text>
          <View style={styles.contactDetails}>
            {personal.phone && <Text>{personal.phone}</Text>}
            {personal.email && <Text>•  {personal.email}</Text>}
            {personal.location && <Text>•  {personal.location}</Text>}
            {personal.linkedin && <Text>•  {personal.linkedin}</Text>}
            {personal.github && <Text>•  {personal.github}</Text>}
          </View>
        </View>

        {/* Education */}
        {education && education.length > 0 && (
          <View>
            <Text style={styles.sectionTitle}>Education</Text>
            {education.map((edu, idx) => (
              <View key={idx} style={{ marginBottom: 4 }}>
                <View style={styles.row}>
                  <Text style={styles.boldText}>{edu.institution}</Text>
                  <Text style={styles.italicText}>{edu.endDate ? `${edu.startDate || ''} – ${edu.endDate}` : (edu.startDate || '')}</Text>
                </View>
                <View style={styles.row}>
                  <Text style={styles.italicText}>{edu.degree} in {edu.field}</Text>
                  {edu.cgpa && <Text style={styles.boldText}>GPA: {edu.cgpa}</Text>}
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Experience */}
        {experience && experience.length > 0 && (
          <View>
            <Text style={styles.sectionTitle}>Work Experience</Text>
            {experience.map((exp, idx) => (
              <View key={idx} style={{ marginBottom: 4 }}>
                <View style={styles.row}>
                  <Text style={styles.boldText}>{exp.company}</Text>
                  <Text style={styles.italicText}>{exp.startDate} – {exp.endDate}</Text>
                </View>
                <View style={styles.row}>
                  <Text style={styles.italicText}>{exp.role}</Text>
                </View>
                {exp.bullets && exp.bullets.length > 0 && (
                  <View style={styles.bulletsContainer}>
                    {exp.bullets.map((bullet, bIdx) => (
                      <View key={bIdx} style={styles.bulletRow}>
                        <Text style={styles.bulletPoint}>▪</Text>
                        <Text style={styles.bulletText}>{bullet}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Projects */}
        {projects && projects.length > 0 && (
          <View>
            <Text style={styles.sectionTitle}>Academic Projects</Text>
            {projects.map((proj, idx) => (
              <View key={idx} style={{ marginBottom: 4 }}>
                <View style={styles.row}>
                  <Text style={styles.boldText}>{proj.name} | <Text style={styles.italicText}>{proj.technologies}</Text></Text>
                  <Text style={styles.italicText}>{proj.startDate} – {proj.endDate}</Text>
                </View>
                {proj.bullets && proj.bullets.length > 0 && (
                  <View style={styles.bulletsContainer}>
                    {proj.bullets.map((bullet, bIdx) => (
                      <View key={bIdx} style={styles.bulletRow}>
                        <Text style={styles.bulletPoint}>▪</Text>
                        <Text style={styles.bulletText}>{bullet}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Skills */}
        {skills && (
          <View>
            <Text style={styles.sectionTitle}>Skills Summary</Text>
            {skills.languages && (
              <View style={styles.skillsRow}>
                <Text style={styles.boldText}>Languages: </Text>
                <Text style={{ flex: 1 }}>{skills.languages}</Text>
              </View>
            )}
            {skills.frameworks && (
              <View style={styles.skillsRow}>
                <Text style={styles.boldText}>Frameworks: </Text>
                <Text style={{ flex: 1 }}>{skills.frameworks}</Text>
              </View>
            )}
            {skills.tools && (
              <View style={styles.skillsRow}>
                <Text style={styles.boldText}>Tools/Platforms: </Text>
                <Text style={{ flex: 1 }}>{skills.tools}</Text>
              </View>
            )}
          </View>
        )}
      </Page>
    </Document>
  );
};

export default ModernMinimalist;
