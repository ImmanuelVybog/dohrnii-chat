// Mock medical knowledge base with citations
const medicalKnowledgeBase = {
  "hypertension treatment": {
    answer: "First-line treatments for hypertension include thiazide diuretics, ACE inhibitors, ARBs, and calcium channel blockers. The choice depends on patient-specific factors and comorbidities. [CITATION_1] Lifestyle modifications including sodium reduction, weight loss, and exercise are also crucial. [CITATION_2]",
    hasSufficientEvidence: true,
    citations: [
      {
        id: 1,
        title: "2020 International Society of Hypertension Global Hypertension Practice Guidelines",
        journal: "Hypertension",
        year: "2020",
        authors: "Unger T, et al.",
        url: "https://www.ahajournals.org/doi/10.1161/HYPERTENSIONAHA.120.15026"
      },
      {
        id: 2,
        title: "Lifestyle Interventions for Hypertension Management",
        journal: "Current Hypertension Reports",
        year: "2019",
        authors: "Whelton PK, et al.",
        url: "https://link.springer.com/article/10.1007/s11906-019-0982-3"
      }
    ]
  },
  "aspirin contraindications": {
    answer: "Contraindications for aspirin include active bleeding, history of aspirin-induced asthma, severe hepatic or renal impairment, and bleeding disorders. [CITATION_3] Caution is advised in patients with peptic ulcer disease or concurrent anticoagulant use. [CITATION_4]",
    hasSufficientEvidence: true,
    citations: [
      {
        id: 3,
        title: "Aspirin: Pharmacology and Clinical Applications",
        journal: "Nature Reviews Cardiology",
        year: "2021",
        authors: "Patrono C, et al.",
        url: "https://www.nature.com/articles/s41569-021-00561-0"
      },
      {
        id: 4,
        title: "Bleeding Risks with Antiplatelet Therapy",
        journal: "Journal of the American College of Cardiology",
        year: "2020",
        authors: "Bhatt DL, et al.",
        url: "https://www.jacc.org/doi/10.1016/j.jacc.2020.07.035"
      }
    ]
  },
  "troponin interpretation": {
    answer: "Elevated troponin levels indicate myocardial injury. Values above the 99th percentile upper reference limit are considered elevated. [CITATION_5] Clinical context is essential as elevations can occur in myocardial infarction, myocarditis, heart failure, and other conditions. [CITATION_6]",
    hasSufficientEvidence: true,
    citations: [
      {
        id: 5,
        title: "Fourth Universal Definition of Myocardial Infarction",
        journal: "European Heart Journal",
        year: "2019",
        authors: "Thygesen K, et al.",
        url: "https://academic.oup.com/eurheartj/article/40/3/237/5075333"
      },
      {
        id: 6,
        title: "High-Sensitivity Cardiac Troponin in Clinical Practice",
        journal: "JAMA",
        year: "2020",
        authors: "Sandoval Y, et al.",
        url: "https://jamanetwork.com/journals/jama/fullarticle/2766085"
      }
    ]
  },
  "diabetes management guidelines": {
    answer: "Current diabetes management emphasizes individualized glycemic targets, lifestyle modifications, and pharmacologic therapy based on patient characteristics. [CITATION_7] First-line therapy remains metformin, with additional agents chosen based on cardiovascular risk, comorbidities, and patient preferences. [CITATION_8]",
    hasSufficientEvidence: true,
    citations: [
      {
        id: 7,
        title: "Standards of Medical Care in Diabetes—2023",
        journal: "Diabetes Care",
        year: "2023",
        authors: "American Diabetes Association",
        url: "https://diabetesjournals.org/care/issue/46/Supplement_1"
      },
      {
        id: 8,
        title: "Pharmacologic Approaches to Glycemic Treatment",
        journal: "Diabetes Care",
        year: "2023",
        authors: "Davies MJ, et al.",
        url: "https://diabetesjournals.org/care/article/46/Supplement_1/S140/148744"
      }
    ]
  }
};

// Mock insufficient evidence responses
const insufficientEvidenceResponses = [
  "I don't have sufficient evidence-based information to answer this question confidently. Medical decisions require reliable, peer-reviewed sources.",
  "Based on current medical literature, there is insufficient evidence to provide a definitive answer to this question.",
  "This question requires more specific clinical context or may involve emerging research without established guidelines."
];

export const generateAnswer = async (question) => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  const lowerQuestion = question.toLowerCase();
  
  // Check for matches in knowledge base
  for (const [key, data] of Object.entries(medicalKnowledgeBase)) {
    if (lowerQuestion.includes(key)) {
      return {
        answer: data.answer,
        hasSufficientEvidence: data.hasSufficientEvidence,
        citations: data.citations
      };
    }
  }
  
  // Handle insufficient evidence cases
  if (Math.random() < 0.3) { // 30% chance of insufficient evidence
    return {
      answer: insufficientEvidenceResponses[Math.floor(Math.random() * insufficientEvidenceResponses.length)],
      hasSufficientEvidence: false,
      citations: []
    };
  }
  
  // Default response for unmatched questions
  return {
    answer: "I understand you're asking about medical information. However, I need more specific details to provide evidence-based guidance. Please consider asking about specific conditions, treatments, or guidelines with clear clinical context.",
    hasSufficientEvidence: false,
    citations: []
  };
};