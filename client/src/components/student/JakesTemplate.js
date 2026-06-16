import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';

// Register standard Times family variants under a single 'Times-Roman' font family name
Font.register({
  family: 'Times-Roman',
  fonts: [
    { src: 'Times-Roman' },
    { src: 'Times-Bold', fontWeight: 'bold' },
    { src: 'Times-Italic', fontStyle: 'italic' },
    { src: 'Times-BoldItalic', fontWeight: 'bold', fontStyle: 'italic' }
  ]
});

const styles = StyleSheet.create({
  page: {
    padding: 35,
    fontFamily: 'Times-Roman',
    fontSize: 9.5,
    color: '#111827',
    lineHeight: 1.3
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 10
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 2
  },
  contactDetails: {
    fontSize: 8.5,
    color: '#374151',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 4
  },
  divider: {
    fontSize: 8.5,
    color: '#9ca3af',
    paddingHorizontal: 2
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 0.5,
    marginTop: 10,
    marginBottom: 4,
    textTransform: 'uppercase',
    borderBottomWidth: 0.5,
    borderBottomColor: '#111827',
    paddingBottom: 1.5
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 1
  },
  boldText: {
    fontWeight: 'bold'
  },
  italicText: {
    fontStyle: 'italic'
  },
  bulletsContainer: {
    marginLeft: 10,
    marginTop: 1.5,
    marginBottom: 4
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 2
  },
  bulletPoint: {
    width: 8,
    fontSize: 9.5
  },
  bulletText: {
    flex: 1,
    fontSize: 9,
    textAlign: 'justify'
  },
  skillsRow: {
    flexDirection: 'row',
    marginBottom: 2.5
  }
});

const JakesTemplate = ({ data }) => {
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
            {personal.phone && personal.email && <Text style={styles.divider}>|</Text>}
            {personal.email && <Text>{personal.email}</Text>}
            {personal.email && personal.location && <Text style={styles.divider}>|</Text>}
            {personal.location && <Text>{personal.location}</Text>}
          </View>
          <View style={[styles.contactDetails, { marginTop: 2 }]}>
            {personal.linkedin && <Text>{personal.linkedin}</Text>}
            {personal.linkedin && personal.github && <Text style={styles.divider}>|</Text>}
            {personal.github && <Text>{personal.github}</Text>}
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
            <Text style={styles.sectionTitle}>Experience</Text>
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
                        <Text style={styles.bulletPoint}>•</Text>
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
            <Text style={styles.sectionTitle}>Projects</Text>
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
                        <Text style={styles.bulletPoint}>•</Text>
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
            <Text style={styles.sectionTitle}>Technical Skills</Text>
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
                <Text style={styles.boldText}>Developer Tools: </Text>
                <Text style={{ flex: 1 }}>{skills.tools}</Text>
              </View>
            )}
          </View>
        )}
      </Page>
    </Document>
  );
};

export default JakesTemplate;
