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

const isStandardJsonResume = (data) => {
  return data && data.basics && data.work && Array.isArray(data.skills);
};

const convertToStandardJsonResume = (data) => {
  if (!data) return {};
  if (isStandardJsonResume(data)) return data;

  return {
    basics: {
      name: data.personal?.name || "",
      email: data.personal?.email || "",
      phone: data.personal?.phone || "",
      url: "",
      summary: "",
      location: {
        address: "",
        postalCode: "",
        city: data.personal?.location || "India",
        countryCode: "IN",
        region: ""
      },
      profiles: [
        {
          network: "GitHub",
          username: "",
          url: data.personal?.github || ""
        },
        {
          network: "LinkedIn",
          username: "",
          url: data.personal?.linkedin || ""
        }
      ]
    },
    education: (data.education || []).map(e => ({
      institution: e.institution || "",
      url: "",
      area: e.field || "",
      studyType: e.degree || "",
      startDate: e.startDate || "",
      endDate: e.endDate || "",
      score: e.cgpa || "",
      courses: []
    })),
    work: (data.experience || []).map(exp => ({
      name: exp.company || "",
      position: exp.role || "",
      url: "",
      startDate: exp.startDate || "",
      endDate: exp.endDate || "",
      summary: "",
      highlights: exp.bullets || []
    })),
    projects: (data.projects || []).map(p => ({
      name: p.name || "",
      description: "",
      highlights: p.bullets || [],
      keywords: p.technologies ? p.technologies.split(",").map(s => s.trim()) : [],
      startDate: p.startDate || "",
      endDate: p.endDate || "",
      url: ""
    })),
    skills: [
      {
        name: "Languages",
        level: "Expert",
        keywords: data.skills?.languages ? data.skills.languages.split(",").map(s => s.trim()) : []
      },
      {
        name: "Frameworks",
        level: "Intermediate",
        keywords: data.skills?.frameworks ? data.skills.frameworks.split(",").map(s => s.trim()) : []
      },
      {
        name: "Tools",
        level: "Intermediate",
        keywords: data.skills?.tools ? data.skills.tools.split(",").map(s => s.trim()) : []
      }
    ]
  };
};

const JakesTemplate = ({ data, styling = {} }) => {
  if (!data) return null;
  const normalized = isStandardJsonResume(data) ? data : convertToStandardJsonResume(data);
  const { basics = {}, education = [], work = [], projects = [], skills = [] } = normalized;

  const fontSize = parseFloat(styling.fontSize || 9.5);
  const padding = parseFloat(styling.margins || 35);
  const lineHeight = parseFloat(styling.lineHeight || 1.3);
  const fontFamily = styling.fontFamily || 'Times-Roman';

  const styles = StyleSheet.create({
    page: {
      padding: padding,
      fontFamily: fontFamily,
      fontSize: fontSize,
      color: '#111827',
      lineHeight: lineHeight
    },
    headerContainer: {
      alignItems: 'center',
      marginBottom: 10
    },
    name: {
      fontSize: fontSize + 8.5,
      fontWeight: 'bold',
      marginBottom: 2
    },
    contactDetails: {
      fontSize: fontSize - 1,
      color: '#374151',
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'center',
      gap: 4
    },
    divider: {
      fontSize: fontSize - 1,
      color: '#9ca3af',
      paddingHorizontal: 2
    },
    sectionTitle: {
      fontSize: fontSize + 0.5,
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
      fontSize: fontSize
    },
    bulletText: {
      flex: 1,
      fontSize: fontSize - 0.5,
      textAlign: 'justify'
    },
    skillsRow: {
      flexDirection: 'row',
      marginBottom: 2.5
    }
  });

  const cleanSocialUrl = (url) => {
    if (!url) return '';
    const trimmed = url.trim();
    const clean = trimmed.toLowerCase();
    if (
      clean === 'https://github.com' || 
      clean === 'https://github.com/' || 
      clean === 'github.com' || 
      clean === 'github.com/' ||
      clean.endsWith('github.com') ||
      clean.endsWith('github.com/')
    ) return '';
    if (
      clean === 'https://linkedin.com/in' || 
      clean === 'https://linkedin.com/in/' || 
      clean === 'linkedin.com/in' || 
      clean === 'linkedin.com/in/' ||
      clean.endsWith('linkedin.com/in') ||
      clean.endsWith('linkedin.com/in/')
    ) return '';
    return trimmed;
  };

  const githubProfile = basics.profiles?.find(p => p.network?.toLowerCase() === 'github');
  const linkedinProfile = basics.profiles?.find(p => p.network?.toLowerCase() === 'linkedin');
  const githubUrl = cleanSocialUrl(githubProfile?.url || '');
  const linkedinUrl = cleanSocialUrl(linkedinProfile?.url || '');
  const locationCity = basics.location?.city || '';

  const languagesSkill = skills.find(s => s.name?.toLowerCase() === 'languages');
  const frameworksSkill = skills.find(s => s.name?.toLowerCase() === 'frameworks');
  const toolsSkill = skills.find(s => s.name?.toLowerCase() === 'tools');

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.headerContainer}>
          <Text style={styles.name}>{basics.name || "Student Name"}</Text>
          <View style={styles.contactDetails}>
            {basics.phone && <Text>{basics.phone}</Text>}
            {basics.phone && basics.email && <Text style={styles.divider}>|</Text>}
            {basics.email && <Text>{basics.email}</Text>}
            {basics.email && locationCity && <Text style={styles.divider}>|</Text>}
            {locationCity && <Text>{locationCity}</Text>}
          </View>
          <View style={[styles.contactDetails, { marginTop: 2 }]}>
            {linkedinUrl && <Text>{linkedinUrl}</Text>}
            {linkedinUrl && githubUrl && <Text style={styles.divider}>|</Text>}
            {githubUrl && <Text>{githubUrl}</Text>}
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
                  <Text style={styles.italicText}>{edu.studyType} in {edu.area}</Text>
                  {edu.score && <Text style={styles.boldText}>GPA: {edu.score}</Text>}
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Experience */}
        {work && work.length > 0 && (
          <View>
            <Text style={styles.sectionTitle}>Experience</Text>
            {work.map((w, idx) => (
              <View key={idx} style={{ marginBottom: 4 }}>
                <View style={styles.row}>
                  <Text style={styles.boldText}>{w.name}</Text>
                  <Text style={styles.italicText}>{w.startDate} – {w.endDate}</Text>
                </View>
                <View style={styles.row}>
                  <Text style={styles.italicText}>{w.position}</Text>
                </View>
                {w.highlights && w.highlights.length > 0 && (
                  <View style={styles.bulletsContainer}>
                    {w.highlights.map((bullet, bIdx) => (
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
                  <Text style={styles.boldText}>{proj.name} {proj.keywords && proj.keywords.length > 0 ? `| ${proj.keywords.join(', ')}` : ''}</Text>
                  <Text style={styles.italicText}>{proj.startDate} – {proj.endDate}</Text>
                </View>
                {proj.highlights && proj.highlights.length > 0 && (
                  <View style={styles.bulletsContainer}>
                    {proj.highlights.map((bullet, bIdx) => (
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
        {(languagesSkill || frameworksSkill || toolsSkill) && (
          <View>
            <Text style={styles.sectionTitle}>Technical Skills</Text>
            {languagesSkill?.keywords?.length > 0 && (
              <View style={styles.skillsRow}>
                <Text style={styles.boldText}>Languages: </Text>
                <Text style={{ flex: 1 }}>{languagesSkill.keywords.join(', ')}</Text>
              </View>
            )}
            {frameworksSkill?.keywords?.length > 0 && (
              <View style={styles.skillsRow}>
                <Text style={styles.boldText}>Frameworks: </Text>
                <Text style={{ flex: 1 }}>{frameworksSkill.keywords.join(', ')}</Text>
              </View>
            )}
            {toolsSkill?.keywords?.length > 0 && (
              <View style={styles.skillsRow}>
                <Text style={styles.boldText}>Developer Tools: </Text>
                <Text style={{ flex: 1 }}>{toolsSkill.keywords.join(', ')}</Text>
              </View>
            )}
          </View>
        )}
      </Page>
    </Document>
  );
};

export default JakesTemplate;
