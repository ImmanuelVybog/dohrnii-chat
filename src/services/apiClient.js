// Production-grade mock backend for Dohrnii Medical Demo Platform

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

const sleep = (ms = 800, signal) => new Promise((resolve, reject) => {
  if (signal?.aborted) return reject(new DOMException('Aborted', 'AbortError'));
  const timer = setTimeout(() => {
    resolve();
  }, ms);
  
  if (signal) {
    signal.addEventListener('abort', () => {
      clearTimeout(timer);
      reject(new DOMException('Aborted', 'AbortError'));
    });
  }
});

const isValidInput = (text) => {
  if (!text) return false;
  if (Array.isArray(text)) {
    return text.length > 0 && text.join(", ").length >= 8;
  }
  if (typeof text === 'object') {
    const content = text.userInput || text.input || text.visitConversation || text.query || "";
    return content.trim().length >= 8;
  }
  const trimmed = text.trim();
  return trimmed.length >= 8;
};

const extractInputString = (input) => {
  if (typeof input === 'string') return input;
  if (Array.isArray(input)) return input.join(", ");
  if (typeof input === 'object' && input !== null) {
    return input.userInput || input.input || input.visitConversation || input.query || "";
  }
  return "";
};

const withPatientContext = (content, patient) => {
  if (!patient) return content;

  const {
    fullName = "Unknown Patient",
    age = "?",
    sex = "?",
    chronicConditions = [],
    longTermMedications = [],
    allergies = [],
    manualTextContext = ""
  } = patient;

  const conditions = chronicConditions.map(c => c.name || c).join(", ") || "None documented";
  const meds = longTermMedications.map(m => `${m.name || m}${m.dose ? ` (${m.dose})` : ""}`).join(", ") || "None documented";
  const allergyList = allergies.map(a => a.substance || a.name || a).join(", ") || "None documented";

  const contextString = `
---
**Patient Context**
- **Name**: ${fullName}
- **Demographics**: ${age}yo ${sex}
- **Active Conditions**: ${conditions}
- **Current Medications**: ${meds}
- **Allergies**: ${allergyList}
${manualTextContext ? `- **Clinical Notes**: ${manualTextContext}\n` : ""}---

`;

  if (typeof content === 'string') {
    return contextString + content;
  } else if (typeof content === 'object' && content !== null) {
    return {
      ...content,
      content: contextString + (content.content || ""),
      contextSummary: {
        fullName, age, sex, conditions, meds, allergies: allergyList, manualTextContext
      }
    };
  }
  return content;
};

const ok = (content, structured = null, references = []) => ({ 
  ok: true, 
  content, 
  structured,
  references
});

const err = (message) => ({ ok: false, content: message });

// ============================================================================
// SCENARIO DETECTION ENGINE
// ============================================================================

const detectScenario = (input) => {
  const text = extractInputString(input);
  if (!text) return "general-medical";
  const lowerInput = text.toLowerCase();
  
  // Cardiovascular emergencies
  if (lowerInput.includes("stroke") || lowerInput.includes("facial droop") || 
      lowerInput.includes("arm weakness") || lowerInput.includes("slurred speech") || 
      lowerInput.includes("hemiparesis") || lowerInput.includes("aphasia") ||
      lowerInput.includes("tia")) {
    return "acute-stroke";
  }

  if (lowerInput.includes("chest pain") || lowerInput.includes("chest discomfort") || 
      lowerInput.includes("angina") || lowerInput.includes("pressure in chest") ||
      lowerInput.includes("myocardial")) {
    return "acute-chest-pain";
  }

  if (lowerInput.includes("palpitation") || lowerInput.includes("irregular heart") ||
      (lowerInput.includes("atrial") && lowerInput.includes("fibrillation"))) {
    return "atrial-fibrillation";
  }

  // Respiratory
  if (lowerInput.includes("shortness of breath") || lowerInput.includes("dyspnea") || 
      lowerInput.includes("difficulty breathing") || lowerInput.includes("sob") ||
      lowerInput.includes("orthopnea")) {
    return "acute-dyspnea";
  }

  if ((lowerInput.includes("copd") || lowerInput.includes("chronic lung")) && 
      (lowerInput.includes("exacerbation") || lowerInput.includes("worsening"))) {
    return "copd-exacerbation";
  }

  if (lowerInput.includes("pneumonia") || 
      (lowerInput.includes("cough") && lowerInput.includes("fever"))) {
    return "pneumonia";
  }

  // Infectious diseases
  if (lowerInput.includes("sepsis") || lowerInput.includes("septic") || 
      lowerInput.includes("shock") ||
      (lowerInput.includes("infection") && (lowerInput.includes("hypotension") || 
       lowerInput.includes("tachycardia") || lowerInput.includes("lactate")))) {
    return "sepsis";
  }

  if (lowerInput.includes("fever") || lowerInput.includes("febrile") || 
      lowerInput.includes("chills") || lowerInput.includes("hyperthermia")) {
    return "fever-undifferentiated";
  }

  // Gastrointestinal
  if (lowerInput.includes("abdominal pain") || lowerInput.includes("stomach ache") || 
      lowerInput.includes("belly pain") || lowerInput.includes("rlq") ||
      lowerInput.includes("llq") || lowerInput.includes("epigastric")) {
    return "abdominal-pain";
  }

  // Neurological
  if (lowerInput.includes("headache") || lowerInput.includes("head pain") || 
      lowerInput.includes("migraine") || lowerInput.includes("thunderclap")) {
    return "headache";
  }

  if (lowerInput.includes("confusion") || lowerInput.includes("altered mental") ||
      lowerInput.includes("delirium")) {
    return "altered-mental-status";
  }

  // Endocrine
  if ((lowerInput.includes("diabetes") || lowerInput.includes("hyperglycemia")) &&
      (lowerInput.includes("new") || lowerInput.includes("onset"))) {
    return "new-diabetes";
  }

  // Chronic disease management
  if (lowerInput.includes("heart failure") || 
      (lowerInput.includes("chf") && lowerInput.includes("exacerbation"))) {
    return "heart-failure";
  }

  // Polypharmacy
  if (lowerInput.includes("polypharmacy") || lowerInput.includes("drug interaction") ||
      (lowerInput.includes("multiple") && lowerInput.includes("medication"))) {
    return "polypharmacy-review";
  }

  return "general-medical";
};

// ============================================================================
// MARKDOWN TO HTML FORMATTER
// ============================================================================

const formatMarkdown = (text) => {
  if (!text) return "";
  
  let html = text
    .replace(/^#### (.*$)/gim, '<h5>$1</h5>')
    .replace(/^### (.*$)/gim, '<h4>$1</h4>')
    .replace(/^## (.*$)/gim, '<h3>$1</h3>')
    .replace(/^# (.*$)/gim, '<h2>$1</h2>')
    .replace(/\*\*(.*?)\*\*/g, '<span class="md-strong">$1</span>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/^\s*-\s+(.*$)/gim, '<ul><li>$1</li></ul>')
    .replace(/<\/ul>\s*<ul>/gim, '')
    .replace(/^\s*\d+\.\s+(.*$)/gim, '<ol><li>$1</li></ol>')
    .replace(/<\/ol>\s*<ol>/gim, '')
    .replace(/^> (.*$)/gim, '<blockquote>$1</blockquote>')
    .replace(/^\s*---+\s*$/gim, '<hr/>')
    .replace(/\n/g, '<br/>');

  // Clean up excessive <br/> tags around block elements
  html = html
    .replace(/<br\/>(<\/?(h[1-6]|ul|ol|li|blockquote|hr|table|tr|td|th|thead|tbody|tfoot|div|p|section|article|aside|header|footer|address|figure|figcaption|pre|code|canvas|video|audio|fieldset|form|main|nav|details|summary))/gim, '$1')
    .replace(/(<\/(h[1-6]|ul|ol|li|blockquote|hr|table|tr|td|th|thead|tbody|tfoot|div|p|section|article|aside|header|footer|address|figure|figcaption|pre|code|canvas|video|audio|fieldset|form|main|nav|details|summary)>)<br\/>/gim, '$1');

  return html.trim();
};

// ============================================================================
// MOCK REFERENCE DATABASE
// ============================================================================

const mockReferences = {
  "acute-chest-pain": [
    {
      id: 1,
      title: "2021 AHA/ACC/ASE/CHEST/SAEM/SCCT/SCMR Guideline for the Evaluation and Diagnosis of Chest Pain",
      authors: "Gulati M, Levy PD, Mukherjee D, et al.",
      journal: "Circulation",
      year: "2021",
      url: "https://www.ahajournals.org/doi/10.1161/CIR.0000000000001029",
      tags: ["Cardiology", "Emergency Medicine", "AHA/ACC"]
    },
    {
      id: 2,
      title: "Fourth Universal Definition of Myocardial Infarction (2018)",
      authors: "Thygesen K, Alpert JS, Jaffe AS, et al.",
      journal: "European Heart Journal",
      year: "2019",
      url: "https://academic.oup.com/eurheartj/article/40/3/237/5079081",
      tags: ["Cardiology", "Guidelines"]
    }
  ],
  "acute-stroke": [
    {
      id: 1,
      title: "2019 Update to the 2018 Guidelines for the Early Management of Acute Ischemic Stroke",
      authors: "Powers WJ, Rabinstein AA, Ackerson T, et al.",
      journal: "Stroke",
      year: "2019",
      url: "https://www.ahajournals.org/doi/10.1161/STR.0000000000000211",
      tags: ["Neurology", "Emergency Medicine", "AHA/ASA"]
    },
    {
      id: 2,
      title: "Time to Treatment With Endovascular Thrombectomy and Outcomes From Ischemic Stroke: A Meta-analysis",
      authors: "Saver JL, Goyal M, van der Lugt A, et al.",
      journal: "JAMA",
      year: "2016",
      url: "https://jamanetwork.com/journals/jama/fullarticle/2545866",
      tags: ["Neurology", "Meta-analysis"]
    }
  ],
  "sepsis": [
    {
      id: 1,
      title: "Surviving Sepsis Campaign: International Guidelines for Management of Sepsis and Septic Shock 2021",
      authors: "Evans L, Rhodes A, Alhazzani W, et al.",
      journal: "Critical Care Medicine",
      year: "2021",
      url: "https://journals.lww.com/ccmjournal/fulltext/2021/11000/surviving_sepsis_campaign__international.15.aspx",
      tags: ["Critical Care", "Infectious Disease", "SSC"]
    }
  ],
  "pneumonia": [
    {
      id: 1,
      title: "Diagnosis and Treatment of Adults with Community-acquired Pneumonia",
      authors: "Metlay JP, Waterer GW, Long AC, et al.",
      journal: "American Journal of Respiratory and Critical Care Medicine",
      year: "2019",
      url: "https://www.atsjournals.org/doi/full/10.1164/rccm.201908-1581ST",
      tags: ["Pulmonology", "Infectious Disease", "ATS/IDSA"]
    }
  ],
  "general-medical": [
    {
      id: 1,
      title: "Clinical Decision Support Systems: Current Challenges and Opportunities",
      authors: "Sutton RT, Pincock D, Baumgart DC, et al.",
      journal: "Journal of Medical Internet Research",
      year: "2020",
      url: "https://www.jmir.org/2020/6/e17232/",
      tags: ["Clinical Decision Support", "Evidence-Based Medicine"]
    }
  ]
};

// ============================================================================
// COMPREHENSIVE MOCK DATA LIBRARY
// ============================================================================

const mockData = {
  "acute-chest-pain": {
    handoverSummary: {
      content: `### Handover Summary: Acute Chest Pain (SBAR Format)

#### SITUATION
**Patient**: [Age]-year-old [Sex] with [Patient's primary concern]
**Chief Complaint**: "[Patient's primary concern]"
**Admission Time**: ${new Date().toLocaleTimeString()}
**Current Location**: Emergency Department / Cardiac Care Unit
**Code Status**: Full code

**Brief History**: Patient presents with [Patient's primary concern]. [Additional history details needed based on specific input].

#### BACKGROUND
**Past Medical History**:
[Past Medical History]

**Medications**:
[Current Medications]

**Allergies**: [Allergies]

**Family History**: [Family Hx]

#### ASSESSMENT
**Working Diagnosis**: **NSTEMI (Non-ST-Elevation Myocardial Infarction)** - High Risk

**Key Findings**:
- **ECG**: ST-segment depression in lateral leads
- **Troponin**: Elevated and rising
- **Vitals**: BP [BP], HR [HR], RR [RR], SpO2 [SpO2]
- **Risk Scores**:
  - HEART Score: High risk
  - TIMI Score: High risk
  - GRACE Score: High risk

**Current Status**: Chest pain improved. Hemodynamically stable. On telemetry.

**Pending Studies**:
- Troponin series
- Echocardiography ordered
- Cardiology consulted - plan for cardiac catheterization

**Complications/Concerns**:
- High bleeding risk on dual antiplatelet + anticoagulation
- [Past Medical History] management
- [Social History] considerations

#### RECOMMENDATION
**Immediate Actions**:
1. **Continue current management**:
   - Aspirin
   - P2Y12 inhibitor
   - Anticoagulation per protocol
   - Beta-blocker (if hemodynamically stable)
   - High-intensity statin

2. **Monitoring**:
   - Continuous cardiac telemetry with ST-segment monitoring
   - Vitals q2h (q15min if chest pain recurs)
   - Serial troponins
   - Serial ECGs
   - Neuro checks
   - Strict I&O

3. **NPO** except medications (anticipating catheterization)

4. **Call MD immediately for**:
   - Recurrent chest pain
   - Hemodynamic instability
   - Any signs of bleeding
   - New arrhythmias
   - Oxygen requirement

5. **Scheduled for cardiac catheterization** - NPO after midnight, consent obtained

6. **Outstanding tasks**:
   - Transthoracic echo
   - Risk factor counseling
   - Specialist consults as indicated
   - Cardiac rehab referral at discharge

**Expected Course**: If catheterization shows significant disease, likely revascularization.

**Questions/Concerns**: Patient anxious about procedure. Family requesting update.`,
      structured: {
        format: "SBAR",
        situation: "[Age]-year-old [Sex] with acute coronary syndrome, now stable",
        background: "[Past Medical History], [Social History]",
        assessment: "High-risk ACS. Troponin elevated. Started on ACS protocol.",
        recommendation: "Continue dual antiplatelet therapy + anticoagulation, serial monitoring, cardiac cath within 24h"
      }
    },
    patientEducation: {
      content: `### Patient Education: Understanding Your Heart Condition

#### What Happened to You?

You came to the hospital because you were having **chest pain**. After running tests, we found that you had what's called a **heart attack** (also known as a "myocardial infarction" or "MI"). 

**In Simple Terms**: 
- Your heart is a muscle that needs oxygen-rich blood to work properly
- Blood flows to your heart through tubes called "arteries"
- Sometimes these arteries can get blocked by cholesterol buildup (like a clogged pipe)
- When a blockage happens, part of your heart muscle doesn't get enough oxygen
- This causes chest pain and can damage the heart muscle

**What We Found**:
- Your heart tests (ECG and blood tests) showed signs of a heart attack
- Your blood test (troponin) was elevated - this is a protein that leaks out when heart muscle is injured
- Your ECG (heart rhythm test) showed changes suggesting decreased blood flow to part of your heart

#### What Happens Next?

**Tomorrow**: You will have a procedure called **cardiac catheterization** (also called an "angiogram"):
- A doctor will insert a small tube into an artery in your wrist or groin
- They will inject dye and take pictures of your heart arteries
- This shows exactly where the blockage is located
- If they find a blockage, they may be able to fix it right away by:
  - Opening the artery with a small balloon (angioplasty)
  - Placing a small metal tube called a "stent" to keep the artery open
  - Or, if blockages are severe, you might need bypass surgery

**Why This Helps**: Opening the blocked artery restores blood flow to your heart and prevents further damage.

#### Medications You'll Be Taking

**1. Aspirin (Blood Thinner)**
- **What it does**: Prevents blood clots from forming
- **How to take**: One tablet (81mg) every day
- **Important**: Take this for the rest of your life unless your doctor tells you to stop
- **Side effects**: May cause stomach upset (take with food), increased bruising

**2. Ticagrelor/Prasugrel (Blood Thinner)**
- **What it does**: Works with aspirin to prevent blood clots in your stent
- **How to take**: As prescribed (usually twice daily)
- **Important**: Do NOT stop taking this without talking to your cardiologist - stopping early can cause the stent to clot
- **Duration**: Usually 12 months minimum after stent placement

**3. Statin (Cholesterol Medicine)**
- **What it does**: Lowers cholesterol, stabilizes plaque in arteries, reduces future heart attack risk
- **How to take**: One tablet every evening
- **Important**: Take even if cholesterol is normal - it helps prevent future heart attacks
- **Side effects**: Rarely causes muscle aches - tell your doctor if this happens

**4. Beta-Blocker (Heart Medicine)**
- **What it does**: Slows heart rate, lowers blood pressure, reduces heart's workload
- **How to take**: As prescribed (usually 1-2 times daily)
- **Important**: Helps your heart recover and prevents future problems
- **Side effects**: May cause fatigue, don't stop suddenly

**5. ACE Inhibitor (Blood Pressure Medicine)**
- **What it does**: Lowers blood pressure, helps heart recover
- **How to take**: Once daily
- **Side effects**: Dry cough (tell doctor if bothersome), don't take if pregnant

#### ⚠️ Warning Signs - When to Call 911

Call 911 immediately if you have:
- **Chest pain or pressure** that lasts more than a few minutes (don't wait to see if it goes away!)
- **Shortness of breath** that's severe or suddenly worse
- **Pain radiating** to your arm, jaw, neck, or back
- **Severe headache** (could be brain bleeding)
- **Weakness or numbness** on one side of your body
- **Vomiting blood** or blood in stool (black/tarry stools)
- **Fainting or severe dizziness**

#### What You Can Do to Prevent Another Heart Attack

**1. STOP SMOKING** - This is the MOST IMPORTANT thing you can do
- Smoking doubles your risk of another heart attack
- Even one cigarette per day increases risk
- We will give you resources to help you quit (patches, gum, counseling, medications)
- Your risk drops significantly within the first year after quitting

**2. Take ALL Your Medications Every Day**
- Set daily reminders on your phone
- Use a pill organizer
- Never run out - refill prescriptions early
- Never stop medications without asking your cardiologist

**3. Eat a Heart-Healthy Diet**
- **Eat More**: Vegetables, fruits, whole grains, fish, lean poultry, nuts
- **Eat Less**: Red meat, processed foods, fried foods, salt, sugar
- **Focus on**: Mediterranean-style diet
- Limit sodium to 2000mg per day (read food labels)

**4. Exercise Regularly**
- **Goal**: 30 minutes of moderate activity, 5 days per week
- **Start slow**: Short walks, gradually increase
- **Join cardiac rehabilitation**: Supervised exercise program (highly recommended!)
- Ask your doctor when it's safe to resume activities

**5. Manage Stress**
- Practice relaxation techniques (deep breathing, meditation)
- Get adequate sleep (7-8 hours per night)
- Stay connected with family and friends
- Consider counseling if feeling depressed or anxious

**6. Control Diabetes**
- Keep blood sugar in target range
- Check blood sugar regularly
- Take diabetes medications as prescribed
- HbA1c goal <7%

**7. Maintain Healthy Weight**
- Losing even 5-10 pounds helps significantly
- BMI goal <25 (or discuss with doctor)

#### Follow-Up Appointments

**Very Important**: Keep all follow-up appointments!

**1 Week After Discharge**:
- See your primary care doctor
- Blood pressure check, medication review

**2-4 Weeks After Discharge**:
- See your cardiologist
- Discuss catheterization results, adjust medications

**6-8 Weeks After Discharge**:
- Repeat blood tests (cholesterol, liver function)
- See endocrinologist for diabetes management

**Cardiac Rehabilitation** (if referred):
- Supervised exercise program
- Education about heart disease
- Significantly improves outcomes
- Usually 2-3 times per week for 12 weeks

#### Questions to Ask Your Doctor

- What exactly happened to my heart?
- How much damage was there?
- What is my heart function (ejection fraction)?
- When can I return to work/driving/sexual activity?
- What are my target numbers for blood pressure, cholesterol, blood sugar?
- Do I need any special diet restrictions?

#### Resources

**Emergency**: Always call 911 for chest pain
**Medication Questions**: Call your cardiologist's office
**Prescription Refills**: Call pharmacy or doctor's office at least 1 week before running out

**Support Groups**:
- American Heart Association: www.heart.org
- Mended Hearts: www.mendedhearts.org

#### Remember

- Heart attacks are treatable, and many people live long, healthy lives afterward
- The key is taking your medications, making lifestyle changes, and keeping follow-up appointments
- Your healthcare team is here to support you
- Don't hesitate to call with questions or concerns

**Your recovery is a journey, and we're with you every step of the way.**`,
      structured: {
        condition: "Myocardial Infarction (Heart Attack)",
        readingLevel: "6th-8th grade",
        keyTakeaways: [
          "You had a heart attack caused by a blocked artery",
          "You will need a procedure to open the artery",
          "Take all medications exactly as prescribed",
          "Quit smoking - this is the most important thing you can do",
          "Call 911 immediately if chest pain returns",
          "Keep all follow-up appointments"
        ],
        warningSign: [
          "Chest pain lasting >5 minutes",
          "Severe shortness of breath",
          "Signs of bleeding",
          "Fainting or severe dizziness"
        ]
      }
    },
    diagnosticWorkup: {
      content: `### Diagnostic Workup: Acute Chest Pain

#### Immediate Diagnostic Studies (Within 10 Minutes)

**1. 12-Lead Electrocardiogram (ECG)**
- **Rationale**: Identifies STEMI requiring immediate catheterization, detects ischemic changes
- **Timing**: Immediate (door-to-ECG goal <10 minutes)
- **Repeat**: Q15-30 minutes until pain-free, then q8h x24h, and PRN with symptom recurrence
- **What to look for**: 
  - ST elevation ≥1mm in contiguous leads (STEMI)
  - ST depression, T wave inversions (NSTEMI/ischemia)
  - New Q waves, bundle branch blocks
  - Comparison with prior ECGs critical

**2. Point-of-Care Testing**
- **Finger-stick glucose**: Rule out hypoglycemia as cause of symptoms
- **Vital signs**: BP bilateral (aortic dissection), O2 saturation, continuous monitoring

#### Urgent Laboratory Studies (Within 20 Minutes)

**3. Cardiac Biomarkers - High-Sensitivity Troponin**
- **Rationale**: Detects myocardial necrosis with high sensitivity and specificity
- **Timing Protocol**: 
  - Initial (0 hours)
  - 1 hour (or 3 hours if standard sensitivity troponin)
  - 3-6 hours if initial negative but high clinical suspicion
- **Interpretation**:
  - Elevated (>99th percentile): Suggests MI if clinical context appropriate
  - Rising pattern: Acute MI (vs chronic elevation from CKD, CHF)
  - Falling pattern: Recent MI (hours to days ago)
- **Limitations**: Can be elevated in PE, myocarditis, CKD, sepsis, CHF

**4. Complete Blood Count (CBC)**
- **Purpose**: 
  - Hemoglobin/hematocrit: Anemia can precipitate demand ischemia (Type 2 MI)
  - WBC: Elevated in MI (leukocytosis common), infection
  - Platelets: Baseline before antiplatelet therapy, rule out thrombocytopenia

**5. Comprehensive Metabolic Panel (CMP)**
- **Electrolytes**: K+, Mg2+ critical for arrhythmia prevention
- **Renal function**: Cr/eGFR needed for medication dosing, contrast safety
- **Glucose**: Diabetes control, stress hyperglycemia
- **Liver function**: Baseline before statin therapy

**6. Coagulation Panel**
- **PT/INR, aPTT**: Baseline before anticoagulation therapy
- **If on warfarin**: Must reverse if urgent catheterization needed

**7. Lipid Panel**
- **Can draw non-fasting**: Acute MI alters lipid metabolism after 24h
- **Purpose**: Baseline for treatment, risk assessment
- **Target**: LDL <70 mg/dL for secondary prevention post-MI

**8. Brain Natriuretic Peptide (BNP or NT-proBNP)**
- **Indications**: If heart failure suspected (dyspnea, edema, rales)
- **Interpretation**: 
  - <100 pg/mL: HF unlikely
  - >400 pg/mL: HF likely
  - Intermediate: Clinical judgment

#### Immediate Imaging Studies

**9. Portable Chest X-Ray (CXR)**
- **Timing**: STAT (but don't delay ECG or biomarkers)
- **Purpose**:
  - Rule out alternate diagnoses: Pneumothorax, pneumonia, aortic dissection (widened mediastinum)
  - Assess for pulmonary edema (heart failure)
  - Cardiomegaly (chronic heart disease)
  - Aortic calcification
- **Views**: PA and lateral if possible, portable AP if patient unstable

**10. Bedside Echocardiography (if available)**
- **Timing**: STAT if hemodynamically unstable
- **Point-of-Care Focused Cardiac Ultrasound (POCUS)**:
  - Wall motion abnormalities (ischemia/infarct)
  - Global LV function (EF estimation)
  - Pericardial effusion (tamponade)
  - RV strain (massive PE)
  - Aortic dissection (intimal flap, aortic regurgitation)
- **Formal Transthoracic Echo**: Order within 24h for all ACS patients

#### Risk Stratification Imaging (Based on Initial Results)

**11. CT Angiography Chest (CTPA + CTA Aorta)**
- **Indications**:
  - Suspected pulmonary embolism (Wells Score moderate-high, elevated D-dimer)
  - Suspected aortic dissection (tearing pain, BP differential, widened mediastinum)
  - Coronary CT angiography (low-intermediate risk, negative biomarkers)
- **Advantages**: Rapid, evaluates multiple diagnoses simultaneously
- **Disadvantages**: Radiation, contrast (nephropathy risk), artifact

**12. CT Perfusion or MRI (Selected Cases)**
- **Indications**: 
  - Extended thrombectomy window (>6 hours)
  - Assess salvageable myocardium
- **Purpose**: Identify penumbra (tissue at risk but not yet infarcted)

#### Advanced/Definitive Diagnostic Studies

**13. Coronary Angiography (Cardiac Catheterization)**
- **Timing**:
  - **STEMI**: IMMEDIATE (door-to-balloon <90 min)
  - **High-risk NSTEMI**: Within 24 hours (TIMI ≥5, GRACE high-risk, refractory ischemia)
  - **Low-moderate risk**: Within 72 hours or as outpatient
- **Purpose**: 
  - Definitive diagnosis of coronary anatomy
  - Immediate treatment via PCI if amenable
  - Guide CABG decision if multi-vessel disease
- **Risks**: Bleeding, stroke (0.2%), death (0.1%), contrast nephropathy, arterial injury

**14. Stress Testing (If ACS Ruled Out)**
- **Types**:
  - **Exercise ECG**: Low-risk patients, able to exercise
  - **Stress Echo**: Intermediate risk, cannot exercise
  - **Nuclear (SPECT)**: Assess perfusion defects
  - **Stress MRI**: High resolution, no radiation
- **Timing**: After biomarkers negative and observation period complete
- **Purpose**: Functional assessment of coronary disease

#### Additional Workup for Specific Clinical Scenarios

**If Atrial Fibrillation Detected on ECG**:
- Thyroid function tests (TSH, free T4)
- Transthoracic echocardiography (atrial size, LV function, valvular disease)
- Consider transesophageal echo if cardioversion planned (r/o atrial thrombus)

**If Type 2 MI Suspected** (demand ischemia):
- Identify and treat precipitant: anemia, tachycardia, hypoxia, sepsis, hypertensive urgency
- May still need cardiac catheterization if significant underlying CAD

**If Cocaine/Stimulant Use Suspected**:
- Urine drug screen
- Avoid beta-blockers (unopposed alpha stimulation)
- Benzodiazepines for agitation/hypertension

#### Timeline Summary

| Time | Action |
|------|--------|
| 0-10 min | ECG, vital signs, finger-stick glucose, IV access |
| 0-20 min | Labs sent: troponin, CBC, CMP, coags, lipids |
| 0-30 min | Portable CXR |
| 1 hour | Repeat troponin |
| 1-2 hours | Risk stratification complete, disposition decision |
| <24h | High-risk: cardiac catheterization |
| 24-72h | Formal echocardiography, stress test if low risk |

#### Diagnostic Pearls

- **Normal ECG ≠ No ACS**: 1-6% of patients with normal initial ECG have acute MI
- **Single Troponin Not Enough**: Serial measurements essential (peaks at 12-24h)
- **Negative D-dimer**: Excellent NPV for PE in low-moderate risk (Wells <4)
- **CXR Sensitivity**: Only 60-80% for aortic dissection - need CT if suspected
- **Time = Myocardium**: Every minute of delay in reperfusion increases infarct size

This comprehensive workup ensures life-threatening causes are identified rapidly while avoiding unnecessary testing in low-risk patients.`,
      structured: {
        immediate: ["12-lead ECG", "Finger-stick glucose", "Vital signs"],
        urgent: ["High-sensitivity troponin (0, 1, 3h)", "CBC", "CMP", "Coagulation panel", "Lipid panel"],
        imaging: ["Portable chest X-ray", "Bedside echocardiography", "CT angiography if dissection/PE suspected"],
        definitive: ["Coronary angiography (timing based on risk stratification)"],
        timeline: "Door-to-ECG <10min, Door-to-needle <60min (tPA), Door-to-balloon <90min (STEMI)"
      }
    },
    guidelines: {
      content: `### Evidence-Based Guidelines: Acute Coronary Syndrome

#### Primary Guidelines

**1. 2021 AHA/ACC/ASE/CHEST/SAEM/SCCT/SCMR Guideline for the Evaluation and Diagnosis of Chest Pain**
- **Organization**: American Heart Association / American College of Cardiology
- **Publication**: October 2021, Circulation
- **Scope**: Comprehensive evaluation of chest pain in ED and outpatient settings

**Key Recommendations**:
- **Class I** (Recommended):
  - High-sensitivity troponin as preferred biomarker (0 and 1-hour protocol)
  - ECG within 10 minutes of ED arrival for suspected ACS
  - HEART score for risk stratification
  - Coronary CT angiography for low-intermediate risk patients with negative biomarkers
  - Early invasive strategy (cardiac cath <24h) for high-risk NSTEMI

- **Class IIa** (Reasonable):
  - Observation unit protocols for low-risk chest pain
  - Stress testing after negative biomarkers in appropriate patients
  - Shared decision-making for diagnostic strategy

**2. 2020 ESC Guidelines for the Management of Acute Coronary Syndromes in Patients Presenting Without Persistent ST-Segment Elevation**
- **Organization**: European Society of Cardiology
- **Publication**: August 2020, European Heart Journal

**Key Updates**:
- 0/1-hour high-sensitivity troponin algorithm for rapid rule-out
- Prasugrel or ticagrelor preferred over clopidogrel (P2Y12 inhibitors)
- Radial access preferred over femoral for PCI
- GRACE score for risk stratification
- Dual antiplatelet therapy duration: 12 months standard, individualized based on bleeding risk

**3. 2013 ACCF/AHA Guideline for the Management of STEMI**
- **Organization**: American College of Cardiology Foundation / American Heart Association
- **Update**: 2015, 2016 focused updates

**Time-Critical Benchmarks**:
- **Door-to-balloon**: <90 minutes (PCI-capable hospitals)
- **Door-to-needle**: <30 minutes (fibrinolysis)
- **First medical contact to device**: <120 minutes (STEMI transfers)

**Reperfusion Strategy**:
- Primary PCI preferred if available within appropriate timeframe
- Fibrinolysis if PCI not available and <12 hours from symptom onset
- Rescue PCI if fibrinolysis fails

#### Pharmacotherapy Guidelines

**4. 2019 ACC/AHA Guideline on the Primary Prevention of Cardiovascular Disease**
- Aspirin for primary prevention: More restricted (calculate ASCVD risk)
- Aspirin for secondary prevention: Lifelong unless contraindicated

**5. 2018 AHA/ACC Cholesterol Guideline**
- **Post-ACS**: High-intensity statin (atorvastatin 80mg or rosuvastatin 40mg)
- **LDL goal**: <70 mg/dL (consider <55 mg/dL in very high risk)
- **Add ezetimibe** if LDL >70 on max statin
- **PCSK9 inhibitor** if LDL persistently elevated despite statin + ezetimibe

**6. 2017 ACC/AHA Hypertension Guideline**
- **Definition**: BP ≥130/80 mmHg
- **Post-MI**: ACE inhibitor or ARB recommended (especially if EF <40%, HTN, DM, CKD)
- **Beta-blocker**: Continue for 3 years post-MI (all patients)

#### Risk Stratification Tools

**TIMI Risk Score for UA/NSTEMI** (Antman et al., JAMA 2000)
- Age ≥65 (1 point)
- ≥3 CAD risk factors (1 point)
- Known CAD (stenosis ≥50%) (1 point)
- Aspirin use in last 7 days (1 point)
- Severe angina (≥2 episodes in 24h) (1 point)
- ST deviation ≥0.5mm (1 point)
- Elevated cardiac biomarker (1 point)

**Interpretation**:
- 0-2 points: Low risk (4-8% event rate at 14 days)
- 3-4 points: Intermediate risk (13-20%)
- 5-7 points: High risk (26-41%)

**GRACE Score** (Fox et al., BMJ 2006)
- More comprehensive than TIMI
- Includes Killip class, creatinine, cardiac arrest, heart rate, systolic BP
- Predicts in-hospital and 6-month mortality
- Online calculator: www.gracescore.org

**HEART Score** (Six et al., Netherlands Heart Journal 2008)
- **H**istory: Highly suspicious (2), Moderately suspicious (1), Slightly suspicious (0)
- **E**CG: ST depression (2), Nonspecific repolarization (1), Normal (0)
- **A**ge: ≥65 (2), 45-65 (1), <45 (0)
- **R**isk factors: ≥3 or h/o CAD (2), 1-2 factors (1), None (0)
- **T**roponin: ≥3x normal limit (2), 1-3x limit (1), Normal (0)

**Interpretation**:
- 0-3: Low risk (1.7% MACE at 6 weeks) - Discharge candidate
- 4-6: Moderate risk (12-17%) - Admit for observation
- 7-10: High risk (50-65%) - Aggressive management

#### Antiplatelet Therapy Duration (Based on Bleeding Risk)

**DAPT Score** (Yeh et al., Circulation 2016)
- Guides duration of dual antiplatelet therapy (DAPT)
- Score ≥2: Consider extended DAPT (>12 months)
- Score <2: Standard 12-month DAPT, then ASA alone

**PRECISE-DAPT Score** (Costa et al., Lancet 2017)
- Predicts bleeding risk during DAPT
- High score: Consider shorter DAPT duration (3-6 months)

#### Special Populations

**Diabetes Mellitus**:
- 2019 ACC/AHA Guideline on Primary Prevention
- SGLT2 inhibitors with demonstrated CV benefit (empagliflozin, canagliflozin)
- GLP-1 agonists with CV benefit (liraglutide, semaglutide)

**Atrial Fibrillation + ACS**:
- Triple therapy (DAPT + anticoagulation) initially
- Transition to dual therapy (P2Y12 + OAC) at 1-4 weeks
- OAC monotherapy after 12 months if stable

**Chronic Kidney Disease**:
- Modify drug doses based on eGFR
- Avoid NSAIDs
- Aggressive CV risk factor modification

#### Cardiac Rehabilitation

**2020 ACC Expert Consensus** on Cardiac Rehabilitation
- **Class I**: All post-MI patients should be referred to cardiac rehab
- **Benefits**: 25% reduction in CV mortality, improved QoL, lower readmission rates
- **Components**: Supervised exercise, nutrition counseling, smoking cessation, stress management

#### Quality Metrics

**ACC Chest Pain - MI Registry**:
- Aspirin within 24h of arrival: Goal >99%
- Beta-blocker at discharge: Goal >98%
- Statin at discharge: Goal >98%
- Door-to-balloon time ≤90 min: Goal >90%

#### References & Resources

- **Full Guidelines**: Available at www.acc.org and www.heart.org
- **Mobile Apps**: 
  - ACC Guideline Clinical App
  - ESC Pocket Guidelines
  - TIMI Risk Score Calculator
  - GRACE Risk Calculator

#### Implementation Notes

These guidelines represent best available evidence but should be individualized to patient circumstances, preferences, and local resources. Regular review of emerging evidence and guideline updates is essential for optimal patient care.`,
      structured: {
        results: [
          {
            id: "g1",
            title: "2021 AHA/ACC Guideline for Evaluation and Diagnosis of Chest Pain",
            source: "American Heart Association / American College of Cardiology",
            year: "2021",
            url: "https://www.ahajournals.org/doi/10.1161/CIR.0000000000001029",
            summary: "Comprehensive recommendations for chest pain evaluation including hs-troponin protocols, risk stratification tools (HEART score), and imaging strategies."
          },
          {
            id: "g2",
            title: "2020 ESC Guidelines for Acute Coronary Syndromes (NSTEMI)",
            source: "European Society of Cardiology",
            year: "2020",
            url: "https://academic.oup.com/eurheartj/article/41/3/407/5614225",
            summary: "European perspective on NSTEMI management with emphasis on rapid rule-out algorithms and contemporary antiplatelet strategies."
          },
          {
            id: "g3",
            title: "2013 ACCF/AHA STEMI Guideline (with 2015/2016 updates)",
            source: "ACCF / AHA",
            year: "2013-2016",
            url: "https://www.ahajournals.org/doi/10.1161/CIR.0b013e3182742cf6",
            summary: "Time-critical reperfusion strategies, door-to-balloon benchmarks, and comprehensive STEMI management."
          }
        ]
      }
    },
    drugInteractions: {
      content: `### Drug-Drug Interactions: Cardiovascular Medications

#### High-Severity Interactions

**1. Aspirin + Warfarin (or other anticoagulants)**
- **Severity**: MAJOR
- **Mechanism**: Additive antiplatelet + anticoagulant effects → Increased bleeding risk
- **Clinical Impact**: 
  - 2-3x increased risk of major bleeding (GI, intracranial)
  - Particularly high risk in elderly, history of bleeding, renal insufficiency
- **Management**:
  - If both required (e.g., mechanical valve + CAD): Use lowest effective aspirin dose (81mg)
  - INR monitoring: Weekly initially, then q2-4 weeks when stable
  - Gastroprotection: PPI (omeprazole 20mg daily)
  - HAS-BLED score to quantify bleeding risk
  - Patient education on bleeding warning signs
  - Consider switching warfarin → DOAC if appropriate (lower bleeding risk)

**2. Dual Antiplatelet Therapy (DAPT) + NSAIDs**
- **Severity**: MAJOR  
- **Mechanism**: Triple antiplatelet effect
- **Clinical Impact**: Severe GI bleeding risk (6-8% annual risk)
- **Management**:
  - **Avoid NSAIDs** if possible (use acetaminophen for pain)
  - If absolutely necessary: Lowest dose, shortest duration
  - Mandatory gastroprotection with PPI
  - Consider COX-2 selective NSAIDs (celecoxib) - lower but not zero GI risk

**3. Beta-Blockers + Calcium Channel Blockers (Non-Dihydropyridine)**
- **Severity**: MAJOR
- **Drugs**: Metoprolol/carvedolol + verapamil or diltiazem
- **Mechanism**: Additive negative chronotropic and inotropic effects
- **Clinical Impact**: 
  - Severe bradycardia, heart block (AV node suppression)
  - Hypotension, heart failure exacerbation
- **Management**:
  - **Avoid combination** when possible
  - If must use: Start at low doses, increase gradually
  - Frequent monitoring: HR, BP, ECG
  - Dihydropyridine CCBs (amlodipine, nifedipine) are safer alternatives - no AV node effect

**4. Statins + Fibrates**
- **Severity**: MODERATE-MAJOR
- **Drugs**: Any statin + gemfibrozil (fenofibrate safer)
- **Mechanism**: Competing metabolism pathways
- **Clinical Impact**: Myopathy, rhabdomyolysis risk
- **Management**:
  - Avoid gemfibrozil + statins (high risk)
  - Fenofibrate + statin: Lower risk but monitor CK
  - Check baseline CK, renal function
  - Educate patient: Report muscle pain/weakness immediately
  - Consider statin dose reduction

#### Moderate-Severity Interactions

**5. ACE Inhibitors + Potassium-Sparing Diuretics / NSAIDs**
- **Severity**: MODERATE
- **Mechanism**: Hyperkalemia risk
- **Clinical Impact**: Arrhythmias, cardiac arrest if severe
- **Management**:
  - Monitor potassium closely (weekly initially)
  - Avoid potassium supplements
  - Check renal function (ACE-I + NSAID = "triple whammy" with diuretics → AKI)
  - Patient education: Limit high-K+ foods

**6. Clopidogrel + PPIs**
- **Severity**: MODERATE (controversial)
- **Mechanism**: PPIs inhibit CYP2C19, reducing clopidogrel activation
- **Clinical Impact**: 
  - Theoretical reduction in antiplatelet effect
  - Clinical significance debated (FDA warning vs guideline recommendations)
  - Strongest interaction with omeprazole, esomeprazole
- **Management**:
  - Prefer ticagrelor or prasugrel (no PPI interaction)
  - If must use clopidogrel + PPI: 
    - Use pantoprazole or lansoprazole (less CYP2C19 interaction)
    - Separate dosing (clopidogrel AM, PPI PM)
  - Consider H2 blocker (famotidine) instead of PPI

**7. Statins + CYP3A4 Inhibitors**
- **Severity**: MODERATE-MAJOR (drug-dependent)
- **Inhibitors**: Diltiazem, verapamil, amiodarone, macrolides (clarithromycin, erythromycin), azole antifungals, grapefruit juice
- **Affected Statins**: Simvastatin, lovastatin, atorvastatin (high CYP3A4 metabolism)
- **Not Affected**: Pravastatin, rosuvastatin, pitavastatin (minimal CYP3A4 metabolism)
- **Clinical Impact**: Increased statin levels → Myopathy risk
- **Management**:
  - Avoid simvastatin + strong CYP3A4 inhibitors
  - Dose limits: Simvastatin max 20mg with diltiazem/verapamil
  - Switch to pravastatin or rosuvastatin if on multiple inhibitors
  - Avoid grapefruit juice (>1 quart daily)

#### Drug-Condition Interactions

**8. Beta-Blockers + Asthma/COPD**
- **Severity**: MODERATE
- **Impact**: Bronchospasm risk (beta-2 receptor blockade)
- **Management**:
  - Prefer cardioselective beta-blockers (metoprolol, bisoprolol, atenolol)
  - Start low dose, titrate slowly
  - Monitor respiratory symptoms
  - Have rescue inhaler available
  - Carvedilol (non-selective) higher risk

**9. NSAIDs + Hypertension / Heart Failure**
- **Severity**: MODERATE
- **Mechanism**: Sodium retention, antagonize antihypertensive effects
- **Impact**: 
  - BP increase (avg 5-10 mmHg systolic)
  - HF exacerbation (fluid retention)
  - Reduced efficacy of ACE-Is, ARBs, diuretics
- **Management**: Avoid NSAIDs; use acetaminophen or topical agents

#### Low-Severity Interactions (Monitor)

**10. Nitrates + Phosphodiesterase-5 Inhibitors**
- **Severity**: MAJOR (if taken together)
- **Drugs**: Nitroglycerin + sildenafil, tadalafil, vardenafil
- **Impact**: Severe, life-threatening hypotension
- **Management**: 
  - **Absolute contraindication** to use within 24-48 hours of each other
  - Patient must inform ED/EMS before receiving nitroglycerin
  - Document in medical record prominently

#### Clinical Decision Support

**When Prescribing New Medication**:
1. Review all current medications (including OTC, supplements)
2. Check drug-drug interactions (electronic system, pharmacy)
3. Check drug-condition interactions
4. Consider patient-specific factors: Age, renal function, liver function
5. Start low, go slow (especially in elderly)
6. Educate patient on warning signs
7. Schedule appropriate monitoring (labs, ECG, BP)

**Red Flag Combinations to AVOID**:
- Warfarin + Aspirin + Clopidogrel (triple antithrombotic - extreme bleeding risk)
- Beta-blocker + diltiazem/verapamil (severe bradycardia/heart block)
- Gemfibrozil + any statin (very high myopathy risk)
- Nitrates + PDE-5 inhibitors taken <48h apart (life-threatening hypotension)

This interaction review helps optimize cardiovascular pharmacotherapy while minimizing adverse effects.`,
      structured: {
        summary: [
          {
            name: "Aspirin + Warfarin",
            severity: "high",
            explanation: "Additive antiplatelet and anticoagulant effects significantly increase bleeding risk. Requires gastroprotection with PPI, close INR monitoring, and patient education on bleeding warning signs."
          },
          {
            name: "Beta-Blocker + Non-DHP Calcium Channel Blocker",
            severity: "high",
            explanation: "Additive negative effects on heart rate and AV conduction can cause severe bradycardia or heart block. Avoid combination when possible; if necessary, use low doses with frequent monitoring."
          },
          {
            name: "Statins + CYP3A4 Inhibitors",
            severity: "moderate",
            explanation: "Increased statin levels raise myopathy/rhabdomyolysis risk. Consider switching to pravastatin or rosuvastatin (not metabolized by CYP3A4) or reducing statin dose."
          }
        ]
      }
    },
    ddx: {
      content: `### Differential Diagnosis: Acute Chest Pain

**Clinical Context**: The presentation of acute chest discomfort requires immediate systematic evaluation to differentiate life-threatening from benign etiologies. Risk stratification should incorporate history, ECG findings, cardiac biomarkers, and validated clinical decision tools.

#### High-Probability Diagnoses

**1. Acute Coronary Syndrome (ACS)** [Critical Priority]
- **Probability**: High (45-60% given classic presentation)
- **Rationale**: Substernal pressure radiating to left arm with diaphoresis represents classic anginal equivalent. Risk factors including hypertension, smoking history significantly elevate pretest probability per Diamond-Forrester classification.
- **Key Discriminators**: Troponin elevation, ST-segment changes on serial ECGs, response to antianginal therapy
- **Immediate Workup**: Serial hs-troponin (0, 1, 3 hours), continuous cardiac monitoring, repeat ECG q15-30min
- **Red Flags**: Hemodynamic instability, new-onset heart failure, electrical instability (VT/VF)

**2. Pulmonary Embolism (PE)** [Critical Priority]
- **Probability**: Moderate (15-25%)
- **Rationale**: Acute onset pleuritic chest pain with tachycardia and hypoxia. Wells Score calculation indicates moderate-to-high probability.
- **Key Discriminators**: D-dimer elevation, RV strain on ECG (S1Q3T3 pattern), hypoxia refractory to supplemental O2
- **Immediate Workup**: D-dimer (if Wells <4), CT pulmonary angiography, bedside echocardiography for RV dysfunction
- **Red Flags**: Massive PE with obstructive shock, cardiac arrest

**3. Aortic Dissection** [Critical Priority]
- **Probability**: Low-Moderate (5-10% but catastrophic if missed)
- **Rationale**: Tearing chest pain radiating to back, history of poorly controlled hypertension. Wide mediastinum on CXR increases suspicion.
- **Key Discriminators**: Blood pressure differential >20mmHg between arms, new aortic regurgitation murmur, pulse deficits
- **Immediate Workup**: CT angiography chest/abdomen/pelvis with IV contrast, transthoracic/transesophageal echo
- **Red Flags**: Hypotension (suggests rupture), neurological deficits (branch vessel involvement)

#### Moderate-Probability Diagnoses

**4. Pericarditis**
- **Probability**: Moderate (10-15%)
- **Rationale**: Positional chest pain relieved by sitting forward, recent viral prodrome
- **Key Discriminators**: Diffuse ST elevation with PR depression on ECG, pericardial friction rub, elevated inflammatory markers
- **Workup**: ECG, troponin (may be mildly elevated), CRP/ESR, echocardiography to assess for effusion

**5. Pneumothorax (Tension if Severe)**
- **Probability**: Low-Moderate (5-8%)
- **Rationale**: Sudden-onset pleuritic pain, decreased breath sounds unilaterally
- **Key Discriminators**: Tracheal deviation, hyperresonance to percussion, absent breath sounds
- **Workup**: Chest X-ray (upright if possible), bedside ultrasound (absent lung sliding)

**6. Esophageal Pathology** (GERD, Esophageal Spasm, Boerhaave Syndrome)
- **Probability**: Low (5-10%)
- **Rationale**: Retrosternal burning, worse with recumbency or meals
- **Key Discriminators**: Response to antacids/PPI trial, normal cardiac workup
- **Red Flags**: Boerhaave syndrome (post-emetic chest pain, subcutaneous emphysema, Hamman sign)

#### Clinical Decision Tools
- **HEART Score**: 5 points (Moderate risk, 12-17% MACE at 6 weeks) - Recommend observation unit with serial biomarkers
- **PERC Rule**: Not satisfied (age >50, HR >100) - Cannot exclude PE clinically
- **Wells Score for PE**: 4.5 points (Moderate probability) - Warrants CT pulmonary angiography

#### Next Steps
1. Immediate: Oxygen, cardiac monitoring, IV access, aspirin 325mg unless contraindicated
2. Urgent labs: hs-troponin series, D-dimer, CBC, CMP, coagulation panel
3. Imaging: Portable CXR immediately, CT angiography chest if PE/dissection suspected
4. Continuous reassessment: Serial ECGs, vital signs q15min initially
5. Disposition: CCU vs observation unit based on HEART score and troponin trend`,
      structured: {
        differentials: [
          {
            condition: "Acute Coronary Syndrome",
            probability: "High",
            rationale: "Classic anginal presentation with cardiac risk factors. Substernal pressure radiating to left arm, diaphoresis, HTN history.",
            workup: "Serial hs-troponin (0, 1, 3hr), continuous ECG monitoring, aspirin loading, cardiology consult for potential catheterization"
          },
          {
            condition: "Pulmonary Embolism",
            probability: "Moderate",
            rationale: "Acute dyspnea, tachycardia, pleuritic component. Wells Score 4.5 (moderate probability).",
            workup: "D-dimer, CT pulmonary angiography, lower extremity Doppler if positive, consider bedside echo for RV strain"
          },
          {
            condition: "Aortic Dissection",
            probability: "Low-Moderate",
            rationale: "Tearing pain to back, HTN history, possible widened mediastinum on CXR. Critical not to miss.",
            workup: "CT angiography chest/abdomen/pelvis with contrast, BP control (IV beta-blocker first), cardiothoracic surgery consult if confirmed"
          },
          {
            condition: "Pericarditis",
            probability: "Low",
            rationale: "Positional pain, recent viral illness, diffuse ST changes possible.",
            workup: "ECG for diffuse ST elevation/PR depression, troponin, CRP/ESR, echocardiography for effusion"
          }
        ]
      }
    },
    clinicalReasoning: {
      content: `### Clinical Reasoning Framework: Acute Chest Pain

#### Case Synthesis
A [Age]-year-old [Sex] patient presents with acute-onset substernal chest discomfort described as "pressure" radiating to the left arm, associated with diaphoresis. This constellation represents a high-risk acute coronary syndrome (ACS) presentation requiring immediate rule-out of life-threatening etiologies.

#### Diagnostic Reasoning Process

**1. Pattern Recognition**
The clinical presentation matches the classic description of angina pectoris:
- **Quality**: Pressure/tightness (vs sharp/stabbing which favors non-cardiac)
- **Location**: Substernal with radiation to left arm (high likelihood ratio for ACS)
- **Associated symptoms**: Diaphoresis suggests sympathetic activation from myocardial ischemia
- **Risk factors**: Age [Age], [Past Medical History] multiply pretest probability

**2. Probability Estimation**
Using validated clinical decision tools:
- **Diamond-Forrester Classification**: High probability (>70%) for obstructive CAD
- **HEART Score Components**:
  - History: 2 points (highly suspicious)
  - ECG: Pending (0-2 points)
  - Age: [Age] (Points assigned based on age)
  - Risk factors: [Past Medical History]
  - Troponin: Pending (0-2 points)
  - **Estimated Score**: High risk (50-65% MACE)

**3. Critical Branch Points**

*Decision Point A: ACS vs Non-ACS Chest Pain*
- **Favoring ACS**: Classic quality, radiation pattern, risk factors, diaphoresis
- **Against ACS**: Would include reproducibility with palpation, very brief duration (<30 seconds), positional variation
- **Diagnostic Strategy**: Cannot exclude clinically → Proceed with ACS protocol

*Decision Point B: STEMI vs NSTEMI/Unstable Angina*
- **Initial ECG**: If ST elevation ≥1mm in contiguous leads → Activate cath lab immediately
- **If no STE**: Proceed with NSTEMI pathway (serial biomarkers, risk stratification)

*Decision Point C: Other Life-Threatening Causes*
Must simultaneously consider:
- **Aortic Dissection**: Blood pressure differential, pulse deficits, mediastinal widening
- **Pulmonary Embolism**: Risk factors for VTE, hypoxia, tachycardia
- **Tension Pneumothorax**: Unilateral decreased breath sounds, tracheal deviation

#### Evidence-Based Management Strategy

**Immediate Actions (First 10 Minutes)**
1. **Monitoring**: Continuous cardiac telemetry, pulse oximetry, automated BP q5min
2. **Oxygen**: Maintain SpO2 >90% (avoid hyperoxia - potential harm in uncomplicated MI)
3. **IV Access**: 2 large-bore peripheral IVs
4. **Medications**:
   - Aspirin 324mg PO (chewed) - 23% relative risk reduction in mortality
   - Nitroglycerin 0.4mg SL q5min x3 for ongoing chest pain (if SBP >90)
   - Morphine 2-4mg IV PRN for refractory pain (use sparingly - associated with worse outcomes in some studies)

**Diagnostic Workup (First 60 Minutes)**
1. **Serial ECGs**: Baseline, repeat q15-30min or with symptom change
2. **Laboratory**:
   - High-sensitivity troponin at 0, 1, 3 hours (rapid rule-out protocol)
   - CBC, CMP, coagulation panel, lipid panel
   - Type & screen (if intervention anticipated)
3. **Imaging**:
   - Portable CXR (assess for cardiomegaly, pulmonary edema, alternate diagnoses)
   - Bedside echocardiography if available (wall motion abnormalities)

**Risk Stratification**
- **TIMI Risk Score for UA/NSTEMI**: Guides timing of invasive strategy
- **GRACE Score**: Estimates in-hospital and 6-month mortality
- **High-risk features requiring urgent catheterization**:
  - Refractory ischemia despite medical therapy
  - Hemodynamic instability
  - Electrical instability (sustained VT/VF)
  - Mechanical complications (acute MR, VSD)

#### Cognitive Biases to Avoid

**1. Anchoring Bias**
- Risk: Fixating on ACS and missing aortic dissection
- Mitigation: Systematic consideration of all critical diagnoses, pulse/BP examination

**2. Premature Closure**
- Risk: Attributing symptoms to GERD or musculoskeletal pain
- Mitigation: Default to "rule out" rather than "rule in" for low-risk-appearing presentations

**3. Availability Bias**
- Risk: Overweighting recent similar cases
- Mitigation: Apply evidence-based decision tools rather than gestalt alone

#### Expected Clinical Course

**If ACS Confirmed**:
- **STEMI**: Door-to-balloon <90 minutes (PCI) or door-to-needle <30 minutes (fibrinolysis if PCI unavailable)
- **NSTEMI High-Risk**: Early invasive strategy within 24 hours
- **NSTEMI Low-Risk**: Medical optimization, stress testing before discharge or as outpatient

**If ACS Ruled Out**:
- Systematic evaluation of alternative diagnoses
- Functional/anatomic testing if intermediate probability
- Close outpatient follow-up with cardiology

#### Key Teaching Points
1. Time = myocardium: Every 30-minute delay in reperfusion increases 1-year mortality by 7.5%
2. Troponin timing matters: Single troponin has poor NPV; serial testing essential
3. Normal ECG ≠ No ACS: 1-6% of patients with normal initial ECG have ACS
4. Treat the patient, not the troponin: Clinical judgment supersedes isolated lab values`,
      structured: {
        primaryDiagnosis: "Acute Coronary Syndrome (suspected)",
        riskLevel: "High",
        urgencyLevel: "Emergent",
        keyClinicalFindings: [
          "Substernal chest pressure",
          "Radiation to left arm",
          "Diaphoresis",
          "Age [Age] with cardiac risk factors"
        ],
        criticalNextSteps: [
          "Serial hs-troponin (0, 1, 3 hours)",
          "Continuous cardiac monitoring",
          "Aspirin 324mg immediately",
          "Cardiology consult"
        ]
      }
    },
    assessmentPlan: {
      content: `### Assessment & Plan: Acute Chest Pain

#### Assessment

**Chief Complaint**: [Age]-year-old [Sex] with [Patient's primary concern]

**Clinical Impression**: Acute Coronary Syndrome (ACS) - Suspected based on:
- Clinical presentation: [Patient's primary concern]
- Risk factors: [Past Medical History]
- HEART Score: High risk category (50-65% probability of MACE at 6 weeks)
- Initial ECG shows ST depression in V4-V6 (posterior/lateral ischemia pattern)
- Troponin I elevated at 0.08 ng/mL (>99th percentile ULN 0.04 ng/mL)

**Differential Considerations**:
- NSTEMI (most likely given troponin elevation and ECG changes)
- Unstable angina (if troponin trending down)
- Aortic dissection (less likely but critical not to miss - checking blood pressures bilaterally, ordering CT angiography)
- Pulmonary embolism (moderate Wells score - will obtain D-dimer and CTPA if indicated)

**Severity Assessment**: High-risk ACS
- **TIMI Risk Score**: High risk
  - Age [Age], CAD risk factors, aspirin use, severe angina, ECG changes, elevated biomarkers
- **GRACE Score**: High risk for in-hospital mortality
- **Indication**: Early invasive strategy within 24 hours per ACC/AHA guidelines

#### Plan

**1. Immediate Stabilization & Monitoring**
- Continuous cardiac telemetry with ST-segment monitoring
- Pulse oximetry - maintain SpO2 >90%
- Automated vitals q15min initially, then q30min when stable
- Supplemental oxygen 2L NC (only if hypoxic - avoid hyperoxia)
- Nothing by mouth (NPO) except medications - anticipating cardiac catheterization

**2. Antiplatelet & Anticoagulation**
- **Aspirin** 325mg loading dose (already administered), then 81mg daily
- **P2Y12 inhibitor**: Ticagrelor 180mg loading dose, then 90mg BID
  - *Rationale*: Superior to clopidogrel in PLATO trial for high-risk ACS
  - *Alternative*: Prasugrel 60mg loading if proceeding to PCI (avoid if age >75, weight <60kg, h/o stroke)
- **Anticoagulation**: Heparin infusion per ACS protocol
  - Bolus 60 units/kg (max 4000 units), infusion 12 units/kg/hr (max 1000 units/hr)
  - Target aPTT 50-70 seconds (1.5-2x control)
  - *Alternative*: Enoxaparin 1mg/kg SQ q12h if going to early invasive approach

**3. Anti-Ischemic Therapy**
- **Beta-blocker**: Metoprolol tartrate 25-50mg PO q6h
  - Target HR 50-60 bpm (unless contraindications: bradycardia, hypotension, acute HF, heart block)
  - Avoid if cocaine-induced chest pain (unopposed alpha-stimulation)
- **Nitrates**: Nitroglycerin 0.4mg SL q5min x3 doses PRN chest pain
  - If ongoing ischemia: Start NTG drip 10 mcg/min, titrate by 10 mcg q5min to pain relief or SBP >90
  - Hold if SBP <90, HR <50 or >100, suspected RV infarct
- **Morphine**: 2-4mg IV PRN for refractory chest pain (use sparingly)
  - *Caution*: CRUSADE study showed association with higher mortality - reserve for severe, refractory pain

**4. Diagnostic Workup**
- **Labs**:
  - Serial hs-troponin at 0, 1, 3 hours (already sent)
  - CBC with differential (anemia, thrombocytopenia check)
  - Comprehensive metabolic panel (renal function, electrolytes)
  - Lipid panel (fasting not required)
  - Coagulation panel (PT/INR, aPTT baseline)
  - Type & screen (in case of intervention)
  - HbA1c (assess diabetes control)
  - BNP/NT-proBNP if heart failure suspected
- **ECG**: Serial ECGs q15-30min until pain-free, then q8h x24h
- **Imaging**:
  - Portable CXR (assess for pulmonary edema, alternate diagnoses)
  - Transthoracic echocardiography (wall motion abnormalities, EF, valvular disease, pericardial effusion)
  - CT angiography chest if aortic dissection cannot be excluded

**5. Consultations**
- **Cardiology** (STAT consult for urgent catheterization consideration)
  - High-risk features: Elevated troponin, dynamic ECG changes, TIMI ≥5
  - Plan: Early invasive strategy within 12-24 hours per ACC/AHA Class I recommendation
- **Cardiac surgery** (standby for potential CABG if left main/3-vessel disease)

**6. Risk Factor Modification (Initiate in Hospital)**
- **Statin**: Atorvastatin 80mg daily (high-intensity statin per guidelines)
  - LDL goal <70 mg/dL for secondary prevention
- **ACE inhibitor**: Lisinopril 5mg daily (if no contraindications)
  - Indicated for EF <40%, hypertension, diabetes, CKD
- **Smoking cessation counseling**: Refer to inpatient cessation program, nicotine replacement
- **Diabetes management**: Consult endocrine if HbA1c >7%

**7. Disposition**
- **Admit to**: Cardiac Care Unit (CCU)
- **Code status**: Full code (confirm with patient/family)
- **Activity**: Strict bed rest until after catheterization
- **Diet**: Cardiac diet (low sodium, low cholesterol) - NPO until after cath
- **DVT prophylaxis**: Heparin infusion providing anticoagulation
- **GI prophylaxis**: Pantoprazole 40mg IV daily (dual antiplatelet therapy)

**8. Goals of Care Discussion**
- Reviewed diagnosis, treatment plan, and potential complications with patient
- Discussed risks/benefits of cardiac catheterization
- Patient understands need for potential PCI vs CABG depending on anatomy
- Family meeting scheduled for tomorrow to discuss long-term management

**9. Monitoring Parameters**
- Chest pain (notify MD immediately if recurrent)
- Vital signs trending
- Troponin trend (should peak and decline if NSTEMI)
- ECG changes
- Signs of bleeding (on dual antiplatelet + anticoagulation)
- Renal function (contrast nephropathy risk with catheterization)

**10. Expected Clinical Milestones**
- **Day 1**: Cardiac catheterization with PCI vs medical management vs CABG based on anatomy
- **Day 2-3**: Post-procedure monitoring, optimization of medical therapy
- **Day 4-5**: Discharge planning, cardiac rehabilitation referral
- **Target LOS**: 3-5 days if uncomplicated

#### Anticipatory Guidance
- If STEMI evolves → Emergent cath lab activation
- If refractory ischemia → Escalate to intra-aortic balloon pump, urgent catheterization
- If cardiogenic shock → ICU transfer, inotropic support, mechanical circulatory support consideration`,
      structured: {
        assessment: {
          primary: "Acute Coronary Syndrome - NSTEMI",
          severity: "High-risk",
          heartScore: 6,
          timiScore: 5,
          graceScore: 142
        },
        plan: {
          stabilization: [
            "Continuous cardiac monitoring",
            "Oxygen if SpO2 <90%",
            "IV access x2",
            "NPO for catheterization"
          ],
          medications: [
            "Aspirin 325mg → 81mg daily",
            "Ticagrelor 180mg → 90mg BID",
            "Heparin drip per protocol",
            "Metoprolol 25-50mg q6h",
            "Nitroglycerin PRN/drip",
            "Atorvastatin 80mg daily"
          ],
          diagnostics: [
            "Serial hs-troponin (0, 1, 3h)",
            "Serial ECGs",
            "CBC, CMP, lipids, coags",
            "Portable CXR",
            "Echocardiography"
          ],
          consultations: [
            "Cardiology STAT - early invasive strategy",
            "Cardiac surgery standby"
          ],
          disposition: "Cardiac Care Unit"
        }
      }
    },
    visitNotes: {
      soap: {
        content: `### SOAP Note: Acute Chest Pain Evaluation

**Date**: ${new Date().toLocaleDateString()}
**Patient**: [Age]-year-old [Sex] with acute coronary syndrome
**MRN**: [Medical Record Number]
**Attending**: [Physician Name]

---

#### SUBJECTIVE

**Chief Complaint**: "[Patient's primary concern]"

**History of Present Illness**:
Patient is a [Age]-year-old [Sex] who presents with [Patient's primary concern]. [Additional history details needed based on specific input].

**Pertinent PMH**:
[Past Medical History]

**Medications**:
[Current Medications]

**Allergies**: [Allergies]

**Family History**:
[Family History]

**Social History**:
[Social History]

**Review of Systems**:
- **Cardiovascular**: As per HPI, denies prior chest pain, palpitations, orthopnea, PND
- **Respiratory**: Shortness of breath with chest pain, no chronic dyspnea, cough, hemoptysis
- **Gastrointestinal**: Mild nausea, no vomiting, diarrhea, abdominal pain
- **Neurological**: No headache, dizziness, weakness, numbness
- **All other systems reviewed and negative**

---

#### OBJECTIVE

**Vital Signs**:
- Temperature: [Temp]°C
- Blood Pressure: [BP] mmHg
- Heart Rate: [HR] bpm
- Respiratory Rate: [RR] breaths/min
- Oxygen Saturation: [SpO2] on room air
- Weight: [Weight], Height: [Height], BMI: [BMI] kg/m²

**Physical Examination**:

*General*: [General appearance]
*HEENT*: [HEENT findings]
*Cardiovascular*: [CV findings]
*Pulmonary*: [Pulmonary findings]
*Abdomen*: [Abdominal findings]
*Extremities*: [Extremity findings]
*Neurological*: [Neuro findings]
*Skin*: [Skin findings]

**Diagnostic Studies**:

[Relevant labs/imaging]

---

#### ASSESSMENT & PLAN

**Problem List**:

**1. Acute Coronary Syndrome - Non-ST-Elevation Myocardial Infarction (NSTEMI)** [Primary Problem]

*Assessment*:
- [Key Findings]
- [Risk Scores]
- Suspected Acute Coronary Syndrome

*Plan*:
- [ACS Management Plan]

**2. Other Medical Problems**
[Secondary Assessment and Plan]

**Disposition**:
- Admit to Cardiac Care Unit
- Code status: Full code (confirmed with patient)
- NPO except medications (anticipating cardiac catheterization)
- Activity: Strict bed rest until post-catheterization
- DVT prophylaxis: Provided by therapeutic anticoagulation
- GI prophylaxis: Pantoprazole 40mg IV daily (on dual antiplatelet therapy)

**Prognosis**: Guarded. Patient has high-risk NSTEMI requiring urgent invasive management. With appropriate revascularization and medical therapy, favorable outcomes expected. Long-term prognosis dependent on left ventricular function, extent of coronary disease, and adherence to secondary prevention strategies.

---

**Attending Physician Signature**: ___________________________
**Date/Time**: ${new Date().toLocaleString()}`,
        structured: {
            subjective: "[Age]-year-old [Sex] with [Patient's primary concern]. History: [Past Medical History].",
            objective: "VS: BP [BP], HR [HR], RR [RR], SpO2 [SpO2], T [Temp]°C. Physical exam: [General appearance]. ECG: ST changes. Labs: Troponin elevated.",
            assessment: "1. High-risk Acute Coronary Syndrome\n2. [Past Medical History]",
            plan: "Admit CCU. Dual antiplatelet therapy. Anticoagulation. Anti-ischemics. Serial troponins/ECGs. STAT cardiology consult. NPO for cath."
          }
      }
    }
  },

  "acute-stroke": {
    ddx: {
      content: `#### Differential Diagnosis: Acute Neurological Deficit

#### Critical Time-Sensitive Diagnoses

**1. Acute Ischemic Stroke (AIS)** [Priority #1]
- **Probability**: Very High (75-85%)
- **Rationale**: Sudden onset focal neurological deficit (facial droop, arm weakness, speech difficulty) in patient with vascular risk factors. NIHSS score ≥4 indicates moderate-to-severe stroke.
- **Mechanism**: Large vessel occlusion (MCA territory) vs small vessel (lacunar) vs cardioembolic
- **Workup**: Non-contrast CT head STAT (r/o hemorrhage), CT angiography head/neck (identify occlusion), CT perfusion (assess salvageable tissue)
- **Time-Critical**: Alteplase (tPA) window 4.5 hours, thrombectomy window 6-24 hours (with imaging selection)

**2. Hemorrhagic Stroke** [Priority #2]  
- **Probability**: Moderate (10-15%)
- **Rationale**: Similar presentation to ischemic stroke. Hypertension is major risk factor for intracerebral hemorrhage.
- **Subtypes**: Intracerebral hemorrhage (ICH), subarachnoid hemorrhage (SAH)
- **Workup**: Non-contrast CT head (hyperdense area), CTA (spot sign predicts hematoma expansion)
- **Red Flags**: Severe headache, vomiting, rapidly declining consciousness

**3. Transient Ischemic Attack (TIA)** [Priority #3]
- **Probability**: Low-Moderate (5-10% if symptoms resolved)
- **Rationale**: Brief episode (<1 hour typically) with complete symptom resolution
- **Significance**: 10-20% risk of stroke within 90 days, highest in first 48 hours
- **Workup**: Same as stroke (many TIAs have infarct on MRI), urgent evaluation, early secondary prevention

#### Stroke Mimics (Non-Vascular)

**4. Todd's Paralysis (Post-Ictal)**
- **Probability**: Low (3-5%)
- **Rationale**: Focal weakness following seizure, can last hours to days
- **Discriminators**: Witnessed seizure activity, history of epilepsy, gradual improvement
- **Workup**: EEG if seizure suspected, brain imaging to exclude structural lesion

**5. Hypoglycemia**
- **Probability**: Low (2-3%)  
- **Rationale**: Can cause focal neurological deficits mimicking stroke
- **Discriminators**: Point-of-care glucose <60 mg/dL, rapid improvement with dextrose
- **Workup**: Immediate finger-stick glucose

**6. Complicated Migraine** (Hemiplegic Migraine)
- **Probability**: Very Low (<2%)
- **Rationale**: Motor weakness during or after migraine aura
- **Discriminators**: Younger age, history of migraines, gradual onset over minutes, headache prominent
- **Workup**: Diagnosis of exclusion after imaging excludes stroke

**7. Brain Tumor/Mass Lesion**
- **Probability**: Low (2-4%)
- **Rationale**: Can present with acute-on-chronic symptoms
- **Discriminators**: Subacute progression, headache worse in morning, seizures
- **Workup**: Brain MRI with contrast

**8. Conversion Disorder/Functional Neurological Symptom**
- **Probability**: Very Low (<1%)
- **Rationale**: Must exclude organic pathology first
- **Discriminators**: Inconsistent exam, non-anatomic deficits, psychiatric history
- **Workup**: Diagnosis of exclusion

#### Clinical Decision Tools

**NIHSS (National Institutes of Health Stroke Scale)**:
- Score ≥5: Moderate stroke, consider thrombectomy if large vessel occlusion
- Helps track evolution and predict outcomes

**ABCD² Score (for TIA risk stratification)**:
- Age ≥60 (1), BP ≥140/90 (1), Clinical features (unilateral weakness 2, speech disturbance without weakness 1), Duration ≥60min (2), <10min (0), Diabetes (1)
- Score ≥4: High risk, requires admission

**RACE Scale (Rapid Arterial oCclusion Evaluation)**:
- Identifies large vessel occlusions for direct transfer to thrombectomy centers
- Score ≥5 suggests LVO

#### Immediate Management Protocol

**Within 10 Minutes (Door-to-Imaging Goal)**:
1. Activate stroke code
2. Non-contrast CT head STAT
3. Finger-stick glucose
4. Labs: CBC, CMP, coagulation panel, troponin, lipid panel
5. ECG (atrial fibrillation screening)
6. Establish large-bore IV access
7. Maintain blood pressure (permissive hypertension unless >220/120)
8. Keep NPO (aspiration risk)

**Within 60 Minutes (Door-to-Needle Goal if tPA candidate)**:
1. Neurology consult
2. Review inclusion/exclusion criteria for thrombolysis
3. Administer alteplase if eligible
4. Continuous neuro checks q15min
5. Blood pressure management per protocol`,
      structured: {
        differentials: [
          {
            condition: "Acute Ischemic Stroke",
            probability: "High",
            rationale: "Sudden focal neurological deficit (facial droop, arm weakness, aphasia) in patient with vascular risk factors. Time-critical diagnosis.",
            workup: "Non-contrast CT head STAT, CT angiography, consider CT perfusion. Labs: CBC, CMP, coags, lipids, troponin. ECG. Activate stroke code. Assess for tPA eligibility."
          },
          {
            condition: "Intracerebral Hemorrhage",
            probability: "Moderate",
            rationale: "Hypertension is major risk factor. Presentation overlaps with ischemic stroke but CT will differentiate.",
            workup: "Non-contrast CT head will show hyperdense hemorrhage. Hold anticoagulation. Neurosurgery consult if large ICH."
          },
          {
            condition: "Transient Ischemic Attack",
            probability: "Low-Moderate",
            rationale: "If symptoms completely resolved, still requires urgent evaluation given high early stroke risk.",
            workup: "Same workup as stroke. MRI brain with DWI may show small infarct despite symptom resolution. Carotid imaging. Echo."
          }
        ]
      }
    },
    clinicalReasoning: {
      content: `### Clinical Reasoning: Acute Stroke Syndrome

#### Time-Sensitive Decision Making

**"Time is Brain"**: Every 15-minute delay in treatment → 4% decrease in favorable outcome
- 1.9 million neurons lost per minute in untreated stroke
- Door-to-imaging goal: 20 minutes
- Door-to-needle (tPA): 60 minutes
- Door-to-groin puncture (thrombectomy): 90 minutes

#### Rapid Assessment Framework

**1. Is This a Stroke?**
- Cincinnati Stroke Scale: Facial droop + Arm drift + Speech abnormality = 72% sensitivity, 97% specificity
- FAST (Face-Arm-Speech-Time): Public recognition tool
- Sudden onset is key feature

**2. What is the Mechanism?**
- **Large vessel occlusion** (30%): Severe deficits, benefits from thrombectomy, NIHSS usually ≥6
- **Lacunar/small vessel** (25%): Pure motor or sensory syndrome, capsular warning syndrome
- **Cardioembolic** (20%): Atrial fibrillation, valvular disease, left atrial thrombus
- **Atherosclerotic** (15%): Carotid stenosis, intracranial atherosclerosis
- **Other/cryptogenic** (10%): Dissection, vasculitis, hypercoagulable states

**3. Is Patient a Thrombolysis Candidate?**

*Inclusion Criteria*:
- Clinical diagnosis of ischemic stroke with measurable deficit
- Symptom onset <4.5 hours (or last known well <4.5h)
- Age ≥18 years
- CT excludes hemorrhage

*Exclusion Criteria (Major)*:
- Intracranial hemorrhage on CT
- BP >185/110 despite treatment
- Platelet count <100,000
- INR >1.7, aPTT elevated (if on anticoagulation)
- Blood glucose <50 mg/dL
- Recent major surgery/trauma (<14 days)
- GI/GU hemorrhage <21 days
- Recent MI <3 months

**4. Is Patient a Thrombectomy Candidate?**
- Large vessel occlusion (ICA, M1 MCA, basilar)
- Significant salvageable tissue on perfusion imaging
- Symptom onset <6 hours (or up to 24h with advanced imaging selection)
- Pre-stroke functional independence

#### Vascular Territory Localization

**Middle Cerebral Artery (MCA)** - Most Common
- Dominant: Aphasia, contralateral hemiparesis (face/arm > leg), hemineglect, gaze preference
- Non-dominant: Hemineglect, spatial deficits, anosognosia

**Anterior Cerebral Artery (ACA)** - Rare
- Contralateral leg weakness, personality changes, executive dysfunction

**Posterior Cerebral Artery (PCA)**
- Homonymous hemianopia, cortical blindness, memory deficits

**Basilar Artery** - High Mortality
- "Locked-in" syndrome, quadriplegia, coma, cranial nerve palsies, ataxia
- Thrombectomy beneficial even up to 24 hours

**Lacunar Syndromes**
- Pure motor hemiparesis
- Pure sensory stroke  
- Ataxic hemiparesis
- Dysarthria-clumsy hand syndrome`,
      structured: {
        primaryDiagnosis: "Acute Ischemic Stroke (suspected)",
        urgency: "EMERGENT - Time-critical intervention",
        nihssScore: ">4 (moderate-severe)",
        vascularTerritory: "[Vascular Territory]"
      }
    }
  },

  "sepsis": {
    ddx: {
      content: `### Differential Diagnosis: Sepsis / Systemic Infection

#### Life-Threatening Diagnoses

**1. Septic Shock** [Critical Priority]
- **Probability**: High if hypotension persistent despite fluids
- **Rationale**: Infection + SOFA score ≥2 + hypotension requiring vasopressors + lactate >2 mmol/L
- **Mortality**: 40% even with appropriate treatment
- **Source Control**: Identify and drain source (abscess, remove infected lines/devices)

**2. Pneumonia with Sepsis**
- **Probability**: High (35% of sepsis cases)
- **Rationale**: Cough, fever, infiltrate on CXR, elevated WBC
- **Severity**: CURB-65, PSI/PORT score for risk stratification
- **Antibiotics**: Ceftriaxone + azithromycin (or levofloxacin)

**3. Urinary Tract Infection / Pyelonephritis / Urosepsis**
- **Probability**: High (25% of sepsis)
- **Rationale**: Dysuria, CVA tenderness, pyuria, positive urine culture
- **Complications**: Abscess, emphysematous pyelonephritis
- **Antibiotics**: Ceftriaxone (or fluoroquinolone)

**4. Intra-Abdominal Infection** (Cholecystitis, Cholangitis, Diverticulitis, Appendicitis)
- **Probability**: Moderate (15% of sepsis)
- **Rationale**: Abdominal pain, peritoneal signs, elevated transaminases/lipase/amylase
- **Imaging**: CT abdomen/pelvis with IV contrast
- **Antibiotics**: Piperacillin-tazobactam or carbapenem + metronidazole

**5. Skin/Soft Tissue Infection** (Cellulitis, Necrotizing Fasciitis)
- **Probability**: Moderate (10%)
- **Rationale**: Erythema, warmth, pain, crepitus (if necrotizing)
- **Emergency**: Necrotizing fasciitis requires urgent surgical debridement
- **Antibiotics**: Vancomycin + piperacillin-tazobactam

#### Critical Management Bundles

**Sepsis-3 Criteria**:
- Suspected infection + SOFA score increase ≥2
- qSOFA (quick SOFA): RR ≥22, altered mentation, SBP ≤100 (2/3 = high risk)

**1-Hour Bundle** (Surviving Sepsis Campaign):
1. Measure lactate, remeasure if >2 mmol/L
2. Blood cultures before antibiotics
3. Broad-spectrum antibiotics
4. Fluid resuscitation 30 mL/kg crystalloid if hypotensive or lactate ≥4
5. Vasopressors if hypotensive during/after fluids (MAP ≥65 mmHg)`,
      structured: {
        differentials: [
          {
            condition: "[Sepsis Source]",
            probability: "High",
            rationale: "[Sepsis Rationale]",
            workup: "Blood cultures x2, sputum culture, lactate, CBC, CMP, coags, procalcitonin. CXR. ABG. Start antibiotics within 1 hour: ceftriaxone + azithromycin. Fluid resuscitation 30 mL/kg. Vasopressors if MAP <65 after fluids."
          },
          {
            condition: "Urosepsis",
            probability: "Moderate",
            rationale: "Dysuria, CVA tenderness, pyuria. Common sepsis source especially in elderly/catheterized patients.",
            workup: "Urinalysis, urine culture. Blood cultures. Renal ultrasound to exclude obstruction/abscess. Antibiotics: ceftriaxone."
          }
        ]
      }
    }
  },

  "general-medical": {
    handoverSummary: {
      content: `### Handover Summary (SBAR Format)

#### SITUATION
**Patient**: [Patient Name], [Age]-year-old [Sex]
**Chief Complaint**: [Patient's primary concern]
**Current Status**: Admitted for [Diagnosis]

#### BACKGROUND
**History**: [History of Present Illness]
**PMH**: [PMH]
**Meds**: [Meds]
**Allergies**: [Allergies]

#### ASSESSMENT
**Diagnosis**: [Diagnosis]
**Key Findings**:
- Vitals: BP [BP], HR [HR], RR [RR], SpO2 [SpO2], Temp [Temp]
- Exam: [Physical Exam Findings]
- Labs/Imaging: [Relevant labs/imaging]

#### RECOMMENDATION
**Plan**:
- [Medications prescribed]
- [Labs ordered]
- [Imaging ordered]
- [Follow-up plan]`,
      structured: {
        format: "SBAR",
        situation: "Patient admitted with [Diagnosis]",
        background: "Relevant history and medications reviewed",
        assessment: "Clinical status stable/unstable as per vitals",
        recommendation: "Continue current management plan"
      }
    },
    patientEducation: {
      content: `### Patient Education Guide for [Diagnosis]

#### Understanding Your Condition
You have been diagnosed with **[Diagnosis]**.
[Education provided]

#### Treatment Plan
- **Medications**: [Medications prescribed]
- **Follow-up**: [Follow-up plan]

#### When to Seek Help
Please seek medical attention if:
- Symptoms worsen
- New symptoms develop
- You have concerns about your condition

#### Lifestyle Modifications
- Take medications as prescribed
- Maintain a healthy diet and hydration
- Rest as needed`,
      structured: {
        condition: "[Diagnosis]",
        readingLevel: "General audience",
        keyTakeaways: [
          "Take medications as prescribed",
          "Follow up as recommended",
          "Monitor symptoms"
        ]
      }
    },
    diagnosticWorkup: {
      content: `### Diagnostic Workup Strategy for [Diagnosis]

#### Initial Evaluation
- **History**: [History of Present Illness]
- **Exam**: [Physical Exam Findings]

#### Laboratory Studies
[Labs ordered]

#### Imaging
[Imaging ordered]

#### Specialized Testing
[Procedures performed]

#### Risk Stratification
[Risk Scores]`,
      structured: {
        immediate: ["[History of Present Illness]", "[Physical Exam Findings]"],
        initial: ["[Labs ordered]"],
        imaging: ["[Imaging ordered]"],
        specialized: ["[Procedures performed]"]
      }
    },
    guidelines: {
      content: `### Clinical Practice Guidelines for [Diagnosis]

#### Key Guidelines
- **Primary Guideline**: [Diagnosis] Management Guidelines
- **Recommendation**: [Medications prescribed]

#### Evidence-Based Resources
- UpToDate: [Diagnosis]
- PubMed: Recent trials on [Diagnosis]`,
      structured: {
        results: [
          {
            id: "resource-1",
            title: "Management Guidelines for [Diagnosis]",
            source: "Clinical Guidelines",
            year: new Date().getFullYear().toString(),
            url: "https://pubmed.ncbi.nlm.nih.gov",
            summary: "Evidence-based management recommendations"
          }
        ]
      }
    },
    drugInteractions: {
      content: `### Drug Interaction Assessment

#### How to Check for Drug Interactions

To provide a comprehensive drug interaction analysis, please specify:

**Required Information**:
1. **Complete Medication List**:
   - Prescription medications (name and dose)
   - Over-the-counter medications
   - Vitamins and supplements
   - Herbal products

2. **Patient Context**:
   - Age
   - Medical conditions (especially kidney/liver disease)
   - Allergies
   - Recent medication changes

#### Common Drug Interaction Categories

**1. Drug-Drug Interactions**
- **Pharmacokinetic**: One drug affects absorption, distribution, metabolism, or excretion of another
- **Pharmacodynamic**: Drugs have additive, synergistic, or antagonistic effects

**2. Drug-Condition Interactions**
- Medication may worsen existing medical condition
- Example: NSAIDs in heart failure or kidney disease

**3. Drug-Food Interactions**
- Food affects drug absorption or metabolism
- Example: Warfarin and vitamin K-rich foods, grapefruit juice and statins

#### High-Risk Medication Classes

Monitor carefully when combining:
- **Anticoagulants/Antiplatelets**: Bleeding risk increases with combination
- **CNS Depressants**: Sedation, respiratory depression with multiple agents
- **QT-Prolonging Drugs**: Arrhythmia risk when combined
- **Nephrotoxic Drugs**: Kidney damage risk, especially in CKD
- **Serotonergic Agents**: Serotonin syndrome risk

#### Resources for Checking Interactions

**Professional Tools**:
- Lexicomp
- Micromedex
- UpToDate Drug Interactions
- Epocrates

**Patient-Friendly Resources**:
- Drugs.com Interaction Checker
- FDA Drug Safety Communications
- Pharmacist consultation

#### When to Be Concerned

**Seek immediate medical attention if**:
- New symptoms after starting medications
- Unusual bruising or bleeding
- Severe drowsiness or confusion
- Rash or allergic reaction
- Rapid heartbeat or chest pain

**Contact your doctor/pharmacist if**:
- Starting a new medication (prescription or OTC)
- Changing medication doses
- Adding supplements or herbal products
- Experiencing new side effects

For a detailed interaction analysis specific to your medication regimen, please provide:
- Complete list of current medications
- Doses and frequencies
- Medical conditions
- Any new medications being considered`,
      structured: {
        summary: [
          {
            name: "General Drug Interaction Guidance",
            severity: "informational",
            explanation: "Provide complete medication list for personalized interaction screening. Always inform healthcare providers of all medications, including OTC and supplements."
          }
        ]
      }
    },
    chat: {
      content: `### Clinical Information

To provide the most helpful clinical guidance, additional information would be beneficial:

**Clinical Context**:
- Specific symptoms or concerns
- Timeline and progression
- Relevant medical history
- Current medications
- Results of any testing

**Assessment**:
Based on general medical principles, a systematic approach should include:
1. Comprehensive history and physical examination
2. Appropriate diagnostic testing based on differential diagnosis
3. Evidence-based management strategies
4. Patient education and shared decision-making

**General Clinical Principles**:
- Always consider life-threatening diagnoses first
- Use validated clinical decision tools when available
- Apply evidence-based guidelines to individual patient circumstances
- Consider patient preferences and values in treatment decisions
- Monitor response to therapy and adjust as needed

For more specific clinical guidance tailored to your situation, please provide additional details about:
- The specific clinical question or scenario
- Patient demographics and relevant background
- Particular areas of concern or decision points

This will allow for more targeted, clinically useful recommendations.`,
      structured: {
        type: "General Clinical Guidance",
        requires: "Additional clinical context for specific recommendations"
      }
    },
    ddx: {
      content: `### Clinical Assessment

Based on the provided clinical information, a systematic approach to differential diagnosis is warranted. The evaluation should incorporate:

1. **Patient Demographics & Risk Factors**: Age, sex, medical history, medications, and social history all influence the differential diagnosis and guide appropriate testing strategies.

2. **Presenting Symptoms**: Characterizing the chief complaint using OPQRST (Onset, Provocation/Palliation, Quality, Region/Radiation, Severity, Timing) helps narrow the differential.

3. **Physical Examination Findings**: Vital signs, general appearance, and system-specific examination findings provide critical diagnostic clues.

4. **Diagnostic Testing Strategy**: Laboratory studies, imaging, and specialized testing should be guided by pretest probability and clinical decision rules.

#### General Diagnostic Approach

**History Taking Framework**:
- Onset: Sudden vs gradual, timing relative to activities/meals/medications
- Character: Description in patient's own words
- Associated symptoms: Review of systems
- Alleviating/Aggravating factors
- Previous similar episodes
- Impact on daily activities
- Patient's concerns/fears

**Physical Examination Priorities**:
- Vital signs (including orthostatics if indicated)
- General appearance and level of distress
- System-focused examination based on chief complaint
- Cardiovascular, respiratory, abdominal, neurological assessments as appropriate

**Initial Diagnostic Studies**:
- Basic laboratory panel: CBC, CMP
- ECG if any cardiovascular concern
- Urinalysis for genitourinary symptoms
- Imaging based on specific clinical scenario
- Additional specialized testing as indicated

#### Risk Stratification
Clinical decision tools and validated scoring systems should be applied when available to guide disposition and management intensity.

#### Evidence-Based Management
Treatment recommendations should follow current clinical practice guidelines, with consideration of patient preferences, contraindications, and resource availability.`,
      structured: {
        differentials: [
          {
            condition: "Requires Additional Clinical Information",
            probability: "Unable to determine",
            rationale: "Comprehensive differential diagnosis requires more specific clinical details including symptoms, examination findings, and relevant medical history.",
            workup: "Systematic history and physical examination, basic laboratory studies, targeted imaging and specialized testing based on clinical presentation."
          }
        ]
      }
    },
    clinicalReasoning: {
      content: `
### Clinical Reasoning: General Medical Assessment

**Case Snapshot**
- Patient: [Patient Name], [Age]-year-old [Sex]
- Presenting Symptoms: [Patient's primary concern]
- Relevant History: [Past Medical History]
- Vitals: BP [BP], HR [HR], RR [RR], Temp [Temp], SpO2 [SpO2]
- Current Meds: [Current Medications]

---

### 1. Key Findings Identified
- Presenting with [Patient's primary concern]
- History of [Past Medical History]
- Vitals: [BP], [HR]

---

### 2. Problem Representation
[Age]-year-old [Sex] with history of [Past Medical History] presenting with [Patient's primary concern], requiring evaluation for potential underlying etiology.

---

### 3. Differential Diagnosis (Ranked)
1. Broad differential based on [Patient's primary concern]
2. Consider infectious vs inflammatory vs metabolic vs structural causes
3. Requires further history and physical exam to narrow

---

### 4. Diagnostic Strategy
- Detailed History and Physical Exam
- Basic Labs (CBC, CMP)
- Focused imaging based on localization

---

### 5. Management Considerations
- Symptom management
- Address underlying cause
- Monitor for red flags

---

### 6. AI Confidence & Safety Layer
- Confidence Score: Moderate
- Risk Level: Variable
- AI Limitations: Dependent on specific clinical details`,
      structured: {
        approach: "Systematic clinical problem-solving",
        keyPrinciples: [
          "Comprehensive data gathering",
          "Thoughtful differential diagnosis",
          "Hypothesis-driven testing",
          "Evidence-based management",
          "Awareness of cognitive biases"
        ]
      }
    },
    assessmentPlan: {
      content: `### Assessment & Plan

#### Clinical Summary
A systematic assessment requires integration of patient history, physical examination findings, and appropriate diagnostic studies to formulate a comprehensive management plan.

#### Diagnostic Evaluation
The workup should be tailored to the specific clinical presentation, with consideration of:
- Acuity and severity of presentation
- Need for urgent intervention
- Risk stratification
- Resource utilization

#### Management Strategy
Treatment plans should be individualized based on:
- Confirmed or suspected diagnoses
- Severity of illness
- Patient comorbidities and contraindications
- Evidence-based guidelines
- Patient preferences

#### Monitoring and Follow-Up
Appropriate follow-up ensures:
- Treatment effectiveness assessment
- Complication monitoring
- Medication adjustment as needed
- Coordination with specialists if indicated

For optimal clinical decision support, please provide additional clinical details including specific symptoms, examination findings, vital signs, and relevant medical history.`,
      structured: {
        assessment: "Requires additional clinical information for specific assessment",
        plan: {
          diagnostics: ["History-directed laboratory studies", "Appropriate imaging", "Specialist consultation if indicated"],
          treatment: ["Address immediate concerns", "Evidence-based management", "Patient education"],
          followUp: ["Monitor treatment response", "Reassess as needed", "Coordinate care"]
        }
      }
    },
    visitNotes: {
      soap: {
        content: `### SOAP Note: General Clinical Encounter

**Date**: ${new Date().toLocaleDateString()}
**Patient**: [Patient Name]
**MRN**: [Medical Record Number]
**Attending**: [Physician Name]

---

#### SUBJECTIVE

**Chief Complaint**: "Patient's primary concern"

**History of Present Illness**:
Patient presents for evaluation of [symptoms/condition].
[Additional history details needed based on specific input]

**Pertinent PMH**:
- [Past Medical History]

**Medications**:
- [Current Medications]

**Allergies**: [Allergies]

**Review of Systems**:
- **General**: [Constitutional symptoms]
- **Cardiovascular**: [CV symptoms]
- **Respiratory**: [Resp symptoms]
- **Gastrointestinal**: [GI symptoms]
- **Neurological**: [Neuro symptoms]

---

#### OBJECTIVE

**Vital Signs**:
- Temperature: [Temp]
- Blood Pressure: [BP]
- Heart Rate: [HR]
- Respiratory Rate: [RR]
- Oxygen Saturation: [SpO2]

**Physical Examination**:
*General*: [General appearance]
*HEENT*: [HEENT findings]
*Cardiovascular*: [CV findings]
*Pulmonary*: [Pulmonary findings]
*Abdomen*: [Abdominal findings]
*Extremities*: [Extremity findings]
*Neurological*: [Neuro findings]
*Skin*: [Skin findings]

**Diagnostic Studies**:
[Relevant labs/imaging]

---

#### ASSESSMENT

**Working Diagnosis**: [Diagnosis]

**Differential Diagnosis**:
1. [Differential 1]
2. [Differential 2]
3. [Differential 3]

---

#### PLAN

**Diagnostics**:
- [Labs ordered]
- [Imaging ordered]

**Treatment**:
- [Medications prescribed]
- [Procedures performed]

**Patient Education**:
- [Education provided]

**Follow-up**:
- [Follow-up plan]`,
        structured: {
          subjective: "Patient presents for evaluation. History of present illness and review of systems as documented above.",
          objective: "Vital signs and physical examination findings as documented above.",
          assessment: "Working diagnosis and differential diagnosis as documented above.",
          plan: [
            "Diagnostic workup as indicated",
            "Pharmacologic management as indicated",
            "Patient education and counseling",
            "Follow-up as clinically appropriate"
          ]
        }
      },
      admission: {
        content: `### Admission Note

**Date**: ${new Date().toLocaleDateString()}
**Patient**: [Patient Name]
**Admitting Diagnosis**: [Diagnosis]

---

#### HPI
[History of Present Illness]

#### Past Medical History
[PMH]

#### Medications
[Meds]

#### Allergies
[Allergies]

#### Social History
[Social Hx]

#### Family History
[Family Hx]

#### Review of Systems
[ROS]

---

#### Physical Exam
[Physical Exam Findings]

#### Labs/Imaging
[Results]

---

#### Assessment & Plan
[A/P]`,
        structured: {
          type: "Admission Note",
          diagnosis: "Admitting Diagnosis",
          plan: "Admission Plan"
        }
      },
      discharge: {
        content: `### Discharge Summary

**Date**: ${new Date().toLocaleDateString()}
**Patient**: [Patient Name]
**Discharge Diagnosis**: [Diagnosis]

---

#### Hospital Course
[Summary of hospital stay]

#### Procedures
[Procedures performed]

#### Discharge Medications
[List of meds]

#### Follow-up
[Follow-up appointments]

#### Discharge Instructions
[Instructions]`,
        structured: {
          reasonForAdmission: "Reason for admission as documented.",
          hospitalCourse: "Summary of hospital course, key events, and clinical progression.",
          dischargeMedications: [
            "Medication 1",
            "Medication 2"
          ],
          followUp: "Follow-up instructions and appointments."
        }
      },
      consult: {
        content: `### Consultation Note

**Date**: ${new Date().toLocaleDateString()}
**Patient**: [Patient Name]
**Reason for Consult**: [Reason]

---

#### HPI
[History of Present Illness]

#### Assessment
[Assessment]

#### Recommendations
[Recommendations]`,
        structured: {
          type: "Consultation Note",
          reason: "Reason for Consult",
          recommendations: "Recommendations"
        }
      },
      procedure: {
        content: `### Procedure Note

**Date**: ${new Date().toLocaleDateString()}
**Patient**: [Patient Name]
**Procedure**: [Procedure Name]

---

#### Indications
[Indications]

#### Description of Procedure
[Details]

#### Complications
[Complications]

#### Post-Procedure Plan
[Plan]`,
        structured: {
          type: "Procedure Note",
          procedure: "Procedure Name",
          plan: "Post-Procedure Plan"
        }
      },
      progress: {
        content: `### Progress Note

**Date**: ${new Date().toLocaleDateString()}
**Patient**: [Patient Name]

---

#### Interval History
[Updates since last note]

#### Exam
[Current exam findings]

#### Assessment/Plan
[Updated A/P]`,
        structured: {
          summary: "Interval history and updates since last evaluation.",
          vitals: "Current vital signs as documented.",
          assessment: "Current assessment and clinical status.",
          plan: "Updated management plan and next steps."
        }
      },
      transfer: {
        content: `### Transfer Summary

**Date**: ${new Date().toLocaleDateString()}
**Patient**: [Patient Name]
**Transfer To**: [Destination]

---

#### Reason for Transfer
[Reason]

#### Current Status
[Status]

#### Transfer Orders
[Orders]`,
        structured: {
          type: "Transfer Summary",
          reason: "Reason for Transfer",
          plan: "Transfer Plan"
        }
      }
    }
  }
};

// Add more comprehensive scenarios following the same pattern for:
// - pneumonia, copd-exacerbation, heart-failure, new-diabetes, etc.
// (Truncated for brevity, but in actual implementation would include 15-20 full scenarios)

// ============================================================================
// RESPONSE GENERATION ENGINE
// ============================================================================

// Helper: Generate dynamic clinical reasoning content based on input and patient data
const generateDynamicClinicalReasoning = (input, patient) => {
  const {
    fullName = "Unknown Patient",
    age = "?",
    sex = "?",
    chronicConditions = [],
    longTermMedications = [],
    allergies = [],
    vitals = {}
  } = patient || {};

  const conditions = chronicConditions.map(c => c.name || c).join(", ") || "None documented";
  const meds = longTermMedications.map(m => `${m.name || m}${m.dose ? ` (${m.dose})` : ""}`).join(", ") || "None documented";
  const allergyList = allergies.map(a => a.substance || a.name || a).join(", ") || "None documented";
  const inputStr = extractInputString(input);
  
  // Extract likely symptoms from input (naive approach: use whole input or first line)
  const presentingSymptoms = inputStr.length > 100 ? inputStr.substring(0, 100) + "..." : inputStr;
  
  // Mock vitals if not provided
  const bp = vitals.bp || "120/80";
  const hr = vitals.hr || "72";
  const rr = vitals.rr || "16";
  const temp = vitals.temp || "37.0°C";
  const spo2 = vitals.spo2 || "98%";
  const weight = vitals.weight || "70 kg";
  const height = vitals.height || "170 cm";
  const bmi = vitals.bmi || "24.2";

  return `
**Case Snapshot**
- Patient: ${fullName}, ${age}${sex ? `, ${sex}` : ""}
- Presenting Symptoms: ${presentingSymptoms}
- Relevant History: ${conditions}
- Vitals: BP ${bp} mmHg, HR ${hr} bpm, RR ${rr}, Temp ${temp}, SpO2 ${spo2}, Wt ${weight}, Ht ${height}, BMI ${bmi}
- Current Meds: ${meds}
- Allergies: ${allergyList}

---

### 1. Key Findings Identified
- Patient presents with: ${presentingSymptoms}
- History notable for: ${conditions}
- No immediate red-flag neurological deficits noted in initial assessment
- No fever or infection indicators reported

---

### 2. Problem Representation (AI Summary)
${age}-year-old ${sex} with history of ${conditions} presenting with ${presentingSymptoms}, requiring evaluation for potential underlying etiology.

---

### 3. Differential Diagnosis (Ranked)
1. Primary symptom-related etiology (High Probability)
2. Secondary systemic cause (Moderate Probability)
3. Medication side effect (Low Probability)
4. Idiopathic/Functional (Diagnosis of exclusion)

---

### 4. Diagnostic Strategy (Simulated AI Plan)
- Detailed history and physical examination
- Targeted laboratory testing based on clinical presentation
- Imaging studies if indicated by specific findings
- Review of systems to identify associated symptoms

---

### 5. Management Considerations (Demo Mode)
- Symptom management and relief
- Addressing underlying cause
- Medication review and adjustment
- Patient education and follow-up planning

---

### 6. AI Confidence & Safety Layer
- Confidence Score: 0.75
- Risk Level: Low-Moderate
- AI Limitations: Assessment based on limited initial input`;
};

// Helper: Replace placeholders in mock content with real patient/input data
const processDynamicPlaceholders = (content, patient, input) => {
  if (!content || typeof content !== 'string') return content;
  
  const {
    fullName = "Unknown Patient",
    age = "?",
    sex = "?",
    chronicConditions = [],
    longTermMedications = [],
    allergies = [],
    vitals = {}
  } = patient || {};

  const conditions = chronicConditions.map(c => c.name || c).join(", ") || "None documented";
  const meds = longTermMedications.map(m => `${m.name || m}${m.dose ? ` (${m.dose})` : ""}`).join(", ") || "None documented";
  const allergyList = allergies.map(a => a.substance || a.name || a).join(", ") || "None documented";
  const inputStr = extractInputString(input);
  const presentingSymptoms = inputStr.length > 100 ? inputStr.substring(0, 100) + "..." : inputStr;
  
  // Extract or default vitals
  const bp = vitals.bp || "120/80";
  const hr = vitals.hr || "72";
  const rr = vitals.rr || "16";
  const temp = vitals.temp || "37.0";
  const spo2 = vitals.spo2 || "98%";
  const weight = vitals.weight || "70";
  const height = vitals.height || "170";
  const bmi = vitals.bmi || "24.2";

  // Detect scenario for context-aware placeholders
  const scenario = detectScenario(input);
  
  // Context-aware defaults
  let diagnosis = "Working diagnosis pending evaluation";
  let differential1 = "Differential diagnosis to be considered";
  let labs = "Routine admission labs";
  let imaging = "Imaging as clinically indicated";
  let planMeds = "Medications as indicated";
  let procedures = "None";
  let neuroFindings = "Non-focal";
  let cvFindings = "Regular rate and rhythm";
  let pulmFindings = "Clear to auscultation";
  let abdFindings = "Soft, non-tender";
  let heentFindings = "Normocephalic, atraumatic";

  switch (scenario) {
    case "acute-stroke":
      diagnosis = "Acute Ischemic Stroke (Suspected)";
      differential1 = "Intracerebral Hemorrhage";
      labs = "CBC, CMP, Coags, Troponin, Lipid Panel";
      imaging = "CT Head Non-Contrast (STAT), CTA Head/Neck, CT Perfusion";
      planMeds = "Alteplase (if eligible), Aspirin, Statin";
      neuroFindings = "Focal deficits present consistent with vascular territory";
      break;
    case "sepsis":
      diagnosis = "Sepsis / Septic Shock";
      differential1 = "Hypovolemic Shock";
      labs = "CBC, CMP, Lactate, Blood Cultures x2, UA/Culture";
      imaging = "CXR, CT Abdomen/Pelvis (source dependent)";
      planMeds = "Broad-spectrum antibiotics (Vanc/Zosyn), IV Fluids, Vasopressors";
      cvFindings = "Tachycardic, warm extremities (early) or cool (late)";
      break;
    case "pneumonia":
      diagnosis = "Community-Acquired Pneumonia";
      differential1 = "Acute Bronchitis";
      labs = "CBC, BMP, Procalcitonin, Sputum Culture";
      imaging = "Chest X-Ray (PA/Lateral)";
      planMeds = "Ceftriaxone + Azithromycin";
      pulmFindings = "Rhonchi/Crackles, dullness to percussion";
      break;
    case "acute-chest-pain":
      diagnosis = "Acute Coronary Syndrome (NSTEMI/Unstable Angina)";
      differential1 = "Aortic Dissection";
      labs = "Troponin x3, CBC, CMP, Coags";
      imaging = "CXR, Echocardiogram";
      planMeds = "Aspirin, Nitroglycerin, Heparin, Beta-blocker";
      cvFindings = "Murmur may be present, S3/S4 if heart failure";
      break;
    case "copd-exacerbation":
      diagnosis = "COPD Exacerbation";
      differential1 = "Pneumonia";
      labs = "ABG, CBC, BMP";
      imaging = "Chest X-Ray";
      planMeds = "Nebulizers (Albuterol/Ipratropium), Steroids, Antibiotics";
      pulmFindings = "Diffuse wheezing, prolonged expiration";
      break;
    default:
      // Use standard defaults
      break;
  }

  let newContent = content;
  
  // Replace standard placeholders
  newContent = newContent.replace(/\[Patient Name\]/g, fullName);
  newContent = newContent.replace(/\[Age\]/g, age);
  newContent = newContent.replace(/\[Sex\]/g, sex);
  
  // Replace Vital Sign Placeholders
  newContent = newContent.replace(/\[BP\]/g, bp);
  newContent = newContent.replace(/\[HR\]/g, hr);
  newContent = newContent.replace(/\[RR\]/g, rr);
  newContent = newContent.replace(/\[Temp\]/g, temp);
  newContent = newContent.replace(/\[SpO2\]/g, spo2);
  newContent = newContent.replace(/\[Weight\]/g, weight);
  newContent = newContent.replace(/\[Height\]/g, height);
  newContent = newContent.replace(/\[BMI\]/g, bmi);

  // Use a consistent fake MRN or generate one
  newContent = newContent.replace(/\[Medical Record Number\]/g, "MRN-" + Math.floor(10000 + Math.random() * 90000));
  newContent = newContent.replace(/\[Physician Name\]/g, "Dr. AI Assistant");
  // Only replace date if it's a placeholder, though mock data uses ${new Date()}
  // But if the mock data uses hardcoded strings with placeholders:
  newContent = newContent.replace(/\[Date\]/g, new Date().toLocaleDateString());
  
  // Replace clinical placeholders
  newContent = newContent.replace(/\[Patient's primary concern\]/g, presentingSymptoms);
  newContent = newContent.replace(/\[symptoms\/condition\]/g, presentingSymptoms);
  newContent = newContent.replace(/\[Additional history details needed based on specific input\]/g, inputStr);
  newContent = newContent.replace(/\[Past Medical History\]/g, conditions);
  newContent = newContent.replace(/\[Current Medications\]/g, meds);
  newContent = newContent.replace(/\[Allergies\]/g, allergyList);
  newContent = newContent.replace(/\[PMH\]/g, conditions);
  newContent = newContent.replace(/\[Meds\]/g, meds);
  newContent = newContent.replace(/\[Social Hx\]/g, "Social history not provided");
  newContent = newContent.replace(/\[Family Hx\]/g, "Family history not provided");
  newContent = newContent.replace(/\[ROS\]/g, "Review of systems consistent with presenting complaint");
  // Construct comprehensive physical exam
  const comprehensiveExam = [
    `General: No acute distress`,
    `HEENT: ${heentFindings}`,
    `CV: ${cvFindings}`,
    `Pulm: ${pulmFindings}`,
    `Abd: ${abdFindings}`,
    `Neuro: ${neuroFindings}`
  ].join("\\n");
  
  newContent = newContent.replace(/\[Physical Exam Findings\]/g, comprehensiveExam);
  newContent = newContent.replace(/\[General appearance\]/g, "No acute distress");
  newContent = newContent.replace(/\[HEENT findings\]/g, heentFindings);
  newContent = newContent.replace(/\[CV findings\]/g, cvFindings);
  newContent = newContent.replace(/\[Pulmonary findings\]/g, pulmFindings);
  newContent = newContent.replace(/\[Abdominal findings\]/g, abdFindings);
  newContent = newContent.replace(/\[Extremity findings\]/g, "No edema");
  newContent = newContent.replace(/\[Neuro findings\]/g, neuroFindings);
  newContent = newContent.replace(/\[Skin findings\]/g, "Intact");
  
  const relevantWorkup = [
    `Labs: ${labs}`,
    `Imaging: ${imaging}`
  ].join("\\n");
  newContent = newContent.replace(/\[Relevant labs\/imaging\]/g, relevantWorkup);
  
  newContent = newContent.replace(/\[Key Findings\]/g, `Clinical presentation suggestive of ${diagnosis}`);
  newContent = newContent.replace(/\[Risk Scores\]/g, "Risk stratification pending complete data");
  newContent = newContent.replace(/\[ACS Management Plan\]/g, "Admit to CCU. Initiate ACS protocol (DAPT, anticoagulation, anti-ischemics). Serial troponins/ECGs. Cardiology consult.");

  // Generate secondary plan based on conditions
  const secondaryPlan = chronicConditions.length > 0 
    ? chronicConditions.map(c => `**${c.name || c}**\n- Continue current management\n- Monitor for exacerbation`).join("\n\n")
    : "No additional chronic conditions requiring active management.";
  newContent = newContent.replace(/\[Secondary Assessment and Plan\]/g, secondaryPlan);
  
  // Specific scenarios
  newContent = newContent.replace(/\[Vascular Territory\]/g, "Vascular territory consistent with presenting symptoms");
  newContent = newContent.replace(/\[Sepsis Source\]/g, "Sepsis Syndrome");
  newContent = newContent.replace(/\[Sepsis Rationale\]/g, "Meets clinical criteria for sepsis/septic shock based on vitals and presentation");

  // General placeholders
  newContent = newContent.replace(/\[Diagnosis\]/g, diagnosis);
  newContent = newContent.replace(/\[Differential \d\]/g, differential1);
  newContent = newContent.replace(/\[Labs ordered\]/g, labs);
  newContent = newContent.replace(/\[Imaging ordered\]/g, imaging);
  newContent = newContent.replace(/\[Medications prescribed\]/g, planMeds);
  newContent = newContent.replace(/\[Procedures performed\]/g, procedures);
  newContent = newContent.replace(/\[Education provided\]/g, `Discussed ${diagnosis} and plan with patient`);
  newContent = newContent.replace(/\[Follow-up plan\]/g, "Follow up with primary care in 1-2 weeks");
  newContent = newContent.replace(/\[Follow-up appointments\]/g, "Follow up with primary care in 1-2 weeks");
  newContent = newContent.replace(/\[History of Present Illness\]/g, `Patient presents with ${presentingSymptoms}. ${inputStr}`);
  newContent = newContent.replace(/\[Results\]/g, "Pending");
  newContent = newContent.replace(/\[A\/P\]/g, `Assessment: ${diagnosis}. Plan: ${planMeds}.`);
  newContent = newContent.replace(/\[List of meds\]/g, planMeds);
  newContent = newContent.replace(/\[Instructions\]/g, `Discussed ${diagnosis} and plan with patient`);
  newContent = newContent.replace(/\[Summary of hospital stay\]/g, `Patient admitted for ${diagnosis}. Condition improved with treatment.`);
  
  // Replace other placeholders with generic text if they remain
  newContent = newContent.replace(/\[.*?\]/g, (match) => {
    // Keep some placeholders if they look like instructions, otherwise replace
    if (match.toLowerCase().includes("symptoms")) return presentingSymptoms;
    if (match.toLowerCase().includes("history")) return inputStr;
    return "Not documented";
  });
  
  return newContent;
};

const generateResponse = (input, type, patient, options = {}) => {
  const scenario = detectScenario(input);
  const scenarioData = mockData[scenario] || mockData["general-medical"];
  
  let data = scenarioData[type];
  
  // Handle visit note sub-types
  if (type === "visitNote") {
    const noteType = options.noteType || (typeof input === 'object' ? input.noteType : null);
    if (noteType) {
      const normalizedType = noteType.toLowerCase().replace(" note", "").replace(" summary", "").trim();
      if (scenarioData.visitNotes && scenarioData.visitNotes[normalizedType]) {
        data = scenarioData.visitNotes[normalizedType];
      } else if (mockData["general-medical"].visitNotes && mockData["general-medical"].visitNotes[normalizedType]) {
        data = mockData["general-medical"].visitNotes[normalizedType];
      }
    }
  }

  // Fallback to general if type missing
  if (!data) {
    data = mockData["general-medical"][type];
  }

  if (!data) {
    return {
      ok: false,
      content: "I'm unable to generate that specific output type for this clinical scenario. Please try a different request."
    };
  }
  
  // DYNAMIC CONTENT GENERATION
  let finalContent = data.content;
  
  // 1. Override Clinical Reasoning for general-medical or if it contains placeholder text
  if (type === "clinicalReasoning" && (scenario === "general-medical" || finalContent.includes("Ramesh K."))) {
    finalContent = generateDynamicClinicalReasoning(input, patient);
  }
  
  // 2. Process placeholders for ALL content types
  // This handles [Patient Name], [Medical Record Number], etc.
  finalContent = processDynamicPlaceholders(finalContent, patient, input);
  
  // Process structured data if it exists
  let structured = data.structured;
  if (structured) {
    // Deep clone to avoid mutating original mock data
    structured = JSON.parse(JSON.stringify(structured));
    
    const processObject = (obj) => {
      for (const key in obj) {
        if (typeof obj[key] === 'string') {
          obj[key] = processDynamicPlaceholders(obj[key], patient, input);
        } else if (typeof obj[key] === 'object' && obj[key] !== null) {
          processObject(obj[key]);
        }
      }
    };
    processObject(structured);
  }
  
  const contentWithContext = withPatientContext(finalContent, patient);
  
  let rawContent = "";
  if (typeof contentWithContext === 'string') {
    rawContent = contentWithContext;
  } else if (typeof contentWithContext === 'object' && contentWithContext !== null) {
    rawContent = contentWithContext.content || "";
  }

  // Get references for this scenario
  const references = mockReferences[scenario] || mockReferences["general-medical"];

  return {
    ok: true,
    content: formatMarkdown(rawContent),
    rawContent: rawContent,
    structured: structured,
    references: references
  };
};

// ============================================================================
// CALCULATOR ENGINE
// ============================================================================

const calculatorRegistry = {
  bmi: {
    name: "Body Mass Index",
    calculate: (inputs) => {
      const weight = parseFloat(inputs.weight);
      const heightCm = parseFloat(inputs.height);
      if (isNaN(weight) || isNaN(heightCm) || heightCm === 0) {
        return { error: "Invalid inputs for BMI calculation" };
      }
      const heightM = heightCm / 100;
      const bmi = weight / (heightM * heightM);
      
      let interpretation = "";
      let category = "";
      if (bmi < 18.5) {
        interpretation = "Underweight - May indicate malnutrition or underlying medical conditions";
        category = "Underweight";
      } else if (bmi >= 18.5 && bmi < 24.9) {
        interpretation = "Normal weight - Associated with lowest health risks";
        category = "Normal";
      } else if (bmi >= 25 && bmi < 29.9) {
        interpretation = "Overweight - Increased risk for cardiovascular disease, diabetes, hypertension";
        category = "Overweight";
      } else if (bmi >= 30 && bmi < 34.9) {
        interpretation = "Obesity Class I - Significant health risks, lifestyle modification and possible medical therapy indicated";
        category = "Obesity I";
      } else if (bmi >= 35 && bmi < 39.9) {
        interpretation = "Obesity Class II - High health risks, aggressive intervention recommended";
        category = "Obesity II";
      } else {
        interpretation = "Obesity Class III (Severe) - Very high health risks, consider bariatric surgery evaluation";
        category = "Obesity III";
      }

      return {
        results: [
          {
            title: "Body Mass Index (BMI)",
            value: bmi.toFixed(1),
            unit: "kg/m²",
            interpretation: interpretation,
            category: category
          }
        ],
        clinicalPearls: "BMI has limitations: does not distinguish muscle from fat, may underestimate adiposity in elderly, overestimate in athletes. Consider waist circumference and body composition for comprehensive assessment."
      };
    }
  },
  
  gfr: {
    name: "Estimated Glomerular Filtration Rate (MDRD)",
    calculate: (inputs) => {
      const scr = parseFloat(inputs.creatinine);
      const age = parseFloat(inputs.age);
      const sex = inputs.sex;
      const race = inputs.race;

      if (isNaN(scr) || isNaN(age) || scr <= 0 || age < 18) {
        return { error: "Invalid inputs for eGFR calculation" };
      }

      // MDRD equation
      let gfr = 175 * Math.pow(scr, -1.154) * Math.pow(age, -0.203);
      if (sex === 'female') {
        gfr *= 0.742;
      }
      if (race === 'black') {
        gfr *= 1.212;
      }

      let interpretation = "";
      let stage = "";
      if (gfr >= 90) {
        interpretation = "Normal or high kidney function. Monitor if risk factors present (diabetes, hypertension, family history)";
        stage = "G1 (Normal)";
      } else if (gfr >= 60 && gfr < 90) {
        interpretation = "Mildly decreased kidney function. May be normal aging. Monitor annually if no other risk factors.";
        stage = "G2 (Mildly decreased)";
      } else if (gfr >= 45 && gfr < 60) {
        interpretation = "Mild to moderately decreased kidney function (CKD Stage 3a). Evaluate for causes, manage cardiovascular risk factors, adjust drug doses.";
        stage = "G3a (Mild-moderate decrease)";
      } else if (gfr >= 30 && gfr < 45) {
        interpretation = "Moderately to severely decreased kidney function (CKD Stage 3b). Nephrology referral recommended. Screen for complications (anemia, bone disease, acidosis).";
        stage = "G3b (Moderate-severe decrease)";
      } else if (gfr >= 15 && gfr < 30) {
        interpretation = "Severely decreased kidney function (CKD Stage 4). Nephrology co-management essential. Prepare for renal replacement therapy.";
        stage = "G4 (Severe decrease)";
      } else {
        interpretation = "Kidney failure (CKD Stage 5). Requires renal replacement therapy (dialysis or transplant).";
        stage = "G5 (Kidney failure)";
      }

      return {
        results: [
          {
            title: "Estimated GFR (MDRD)",
            value: gfr.toFixed(0),
            unit: "mL/min/1.73m²",
            interpretation: interpretation,
            stage: stage
          }
        ],
        clinicalPearls: "MDRD equation less accurate at GFR >60. CKD-EPI equation preferred in clinical practice. Cystatin C-based equations may be more accurate in certain populations. Always interpret in clinical context - elderly may have low GFR without true kidney disease."
      };
    }
  },

  heart_score: {
    name: "HEART Score (Chest pain risk)",
    calculate: (inputs) => {
      const h = parseInt(inputs.history || 0);
      const e = parseInt(inputs.ecg || 0);
      const a = parseInt(inputs.age || 0);
      const r = parseInt(inputs.risk_factors || 0);
      const t = parseInt(inputs.troponin || 0);
      const score = h + e + a + r + t;
      let interpretation = "";
      let risk = "";
      if (score <= 3) {
        interpretation = "Low risk (0.9-1.7% MACE at 6 weeks). Discharge may be considered.";
        risk = "Low Risk";
      } else if (score <= 6) {
        interpretation = "Intermediate risk (12-16.6% MACE at 6 weeks). Clinical observation, serial troponins, and further testing indicated.";
        risk = "Intermediate Risk";
      } else {
        interpretation = "High risk (50-65% MACE at 6 weeks). Immediate invasive strategy / cardiology consultation recommended.";
        risk = "High Risk";
      }
      return {
        results: [{ title: "HEART Score", value: score, interpretation, category: risk }],
        clinicalPearls: "HEART score is validated for predicting 6-week MACE (Major Adverse Cardiac Events) in patients presenting with chest pain in the ED."
      };
    }
  },

  timi_score: {
    name: "TIMI Score (ACS risk)",
    calculate: (inputs) => {
      let score = 0;
      if (inputs.age65 === 'yes') score++;
      if (inputs.riskFactors3 === 'yes') score++;
      if (inputs.knownCAD === 'yes') score++;
      if (inputs.asaUse === 'yes') score++;
      if (inputs.severeAngina === 'yes') score++;
      if (inputs.stChanges === 'yes') score++;
      if (inputs.elevatedMarkers === 'yes') score++;

      let risk = "";
      if (score <= 1) risk = "Low risk (approx. 5% 14-day risk of death, MI, or urgent revascularization)";
      else if (score === 2) risk = "Low-intermediate risk (approx. 8% risk)";
      else if (score === 3) risk = "Intermediate risk (approx. 13% risk)";
      else if (score === 4) risk = "Intermediate-high risk (approx. 20% risk)";
      else risk = "High risk (approx. 26-40% risk)";

      return {
        results: [{ title: "TIMI Score", value: score, interpretation: risk, category: score >= 5 ? "High Risk" : score >= 3 ? "Intermediate Risk" : "Low Risk" }],
        clinicalPearls: "TIMI score is for patients with UA/NSTEMI. It helps guide the decision for an early invasive vs conservative strategy."
      };
    }
  },

  wells_pe: {
    name: "Wells Score (PE probability)",
    calculate: (inputs) => {
      let score = 0;
      if (inputs.dvt_signs === 'yes') score += 3.0;
      if (inputs.alt_dx === 'yes') score += 3.0;
      if (inputs.tachycardia === 'yes') score += 1.5;
      if (inputs.immobility === 'yes') score += 1.5;
      if (inputs.prior_pe_dvt === 'yes') score += 1.5;
      if (inputs.hemoptysis === 'yes') score += 1.0;
      if (inputs.malignancy === 'yes') score += 1.0;

      let interpretation = "";
      if (score < 2) interpretation = "Low probability (approx. 1.3%). Consider D-dimer to rule out.";
      else if (score <= 6) interpretation = "Moderate probability (approx. 16.2%). Consider CTPA or D-dimer.";
      else interpretation = "High probability (approx. 37.5% or higher). CTPA recommended.";

      return {
        results: [{ title: "Wells Score for PE", value: score, interpretation, category: score > 6 ? "High Probability" : score >= 2 ? "Moderate Probability" : "Low Probability" }],
        clinicalPearls: "In patients with low probability, a negative high-sensitivity D-dimer can safely rule out PE without imaging."
      };
    }
  },

  chads_vasc: {
    name: "CHA₂DS₂-VASc (Stroke risk in AFib)",
    calculate: (inputs) => {
      let score = 0;
      if (inputs.chf === 'yes') score += 1;
      if (inputs.htn === 'yes') score += 1;
      if (parseInt(inputs.age) >= 75) score += 2;
      else if (parseInt(inputs.age) >= 65) score += 1;
      if (inputs.dm === 'yes') score += 1;
      if (inputs.stroke === 'yes') score += 2;
      if (inputs.vascular === 'yes') score += 1;
      if (inputs.sex === 'female') score += 1;

      let interpretation = "";
      if (score === 0) interpretation = "Low risk. Anticoagulation typically not recommended.";
      else if (score === 1) interpretation = "Low-moderate risk. Consider anticoagulation in males.";
      else interpretation = "Moderate-high risk. Oral anticoagulation recommended unless contraindicated.";

      return {
        results: [{ title: "CHA₂DS₂-VASc Score", value: score, interpretation, category: score >= 2 ? "High Risk" : score === 1 ? "Intermediate Risk" : "Low Risk" }],
        clinicalPearls: "CHA₂DS₂-VASc is the standard tool for stroke risk stratification in patients with non-valvular atrial fibrillation."
      };
    }
  },

  has_bled: {
    name: "HAS-BLED (Bleeding risk)",
    calculate: (inputs) => {
      let score = 0;
      if (inputs.htn === 'yes') score += 1;
      if (inputs.renal === 'yes') score += 1;
      if (inputs.liver === 'yes') score += 1;
      if (inputs.stroke === 'yes') score += 1;
      if (inputs.bleeding === 'yes') score += 1;
      if (inputs.labile_inr === 'yes') score += 1;
      if (parseInt(inputs.age) >= 65) score += 1;
      if (inputs.drugs === 'yes') score += 1;
      if (inputs.alcohol === 'yes') score += 1;

      let interpretation = "";
      if (score < 3) interpretation = "Low risk for major bleeding. Anticoagulation generally well-tolerated.";
      else interpretation = "High risk for major bleeding. Use caution, address reversible risk factors, and monitor frequently.";

      return {
        results: [{ title: "HAS-BLED Score", value: score, interpretation, category: score >= 3 ? "High Risk" : "Low Risk" }],
        clinicalPearls: "A high HAS-BLED score is not a reason to withhold anticoagulation but rather to identify and mitigate bleeding risk factors."
      };
    }
  },

  qsofa: {
    name: "qSOFA (Quick SOFA)",
    calculate: (inputs) => {
      let score = 0;
      if (parseFloat(inputs.rr) >= 22) score += 1;
      if (inputs.mentations === 'altered') score += 1;
      if (parseFloat(inputs.sbp) <= 100) score += 1;

      let interpretation = "";
      if (score >= 2) interpretation = "High risk for poor outcome (sepsis suspected). Intensify monitoring and evaluate for organ dysfunction.";
      else interpretation = "Low risk for poor outcome. Continue clinical monitoring.";

      return {
        results: [{ title: "qSOFA Score", value: score, interpretation, category: score >= 2 ? "High Risk" : "Low Risk" }],
        clinicalPearls: "qSOFA is used outside the ICU to identify patients with suspected infection who are at risk for poor outcomes."
      };
    }
  },

  sofa: {
    name: "SOFA (Sequential Organ Failure Assessment)",
    calculate: (inputs) => {
      // Simplified SOFA for demo
      let score = 0;
      score += parseInt(inputs.respiratory || 0);
      score += parseInt(inputs.coagulation || 0);
      score += parseInt(inputs.liver || 0);
      score += parseInt(inputs.cardiovascular || 0);
      score += parseInt(inputs.cns || 0);
      score += parseInt(inputs.renal || 0);

      let interpretation = `Total SOFA score: ${score}. Higher scores are associated with increased mortality.`;
      
      return {
        results: [{ title: "SOFA Score", value: score, interpretation, category: score >= 10 ? "Critical" : score >= 5 ? "Severe" : "Mild/Moderate" }],
        clinicalPearls: "SOFA score tracks organ dysfunction over time in the ICU and is highly predictive of mortality."
      };
    }
  },

  curb_65: {
    name: "CURB-65 (Pneumonia severity)",
    calculate: (inputs) => {
      let score = 0;
      if (inputs.confusion === 'yes') score += 1;
      if (parseFloat(inputs.bun) > 19) score += 1; // BUN > 19 mg/dL (7 mmol/L)
      if (parseFloat(inputs.rr) >= 30) score += 1;
      if (parseFloat(inputs.sbp) < 90 || parseFloat(inputs.dbp) <= 60) score += 1;
      if (parseInt(inputs.age) >= 65) score += 1;

      let interpretation = "";
      if (score <= 1) interpretation = "Low risk (0.6-1.5% mortality). Consider outpatient treatment.";
      else if (score === 2) interpretation = "Intermediate risk (9.2% mortality). Consider inpatient admission or close observation.";
      else interpretation = "High risk (15-57% mortality). Urgent inpatient admission, consider ICU if score is 4-5.";

      return {
        results: [{ title: "CURB-65 Score", value: score, interpretation, category: score >= 3 ? "High Risk" : score === 2 ? "Moderate Risk" : "Low Risk" }],
        clinicalPearls: "CURB-65 helps determine the appropriate level of care for patients with community-acquired pneumonia."
      };
    }
  },

  gcs: {
    name: "Glasgow Coma Scale (GCS)",
    calculate: (inputs) => {
      const eye = parseInt(inputs.eye || 4);
      const verbal = parseInt(inputs.verbal || 5);
      const motor = parseInt(inputs.motor || 6);
      const score = eye + verbal + motor;

      let interpretation = "";
      if (score >= 13) interpretation = "Mild brain injury";
      else if (score >= 9) interpretation = "Moderate brain injury";
      else interpretation = "Severe brain injury (comatose). Consider intubation (GCS < 8).";

      return {
        results: [{ title: "GCS Score", value: score, interpretation, category: score <= 8 ? "Severe" : score <= 12 ? "Moderate" : "Mild" }],
        clinicalPearls: "The GCS is the most common scoring system used to describe the level of consciousness in a person following a traumatic brain injury."
      };
    }
  },

  news2: {
    name: "NEWS2 (National Early Warning Score)",
    calculate: (inputs) => {
      // Simplified NEWS2 sum
      const score = parseInt(inputs.rr_score || 0) + 
                    parseInt(inputs.spo2_score || 0) + 
                    parseInt(inputs.air_o2_score || 0) + 
                    parseInt(inputs.sbp_score || 0) + 
                    parseInt(inputs.hr_score || 0) + 
                    parseInt(inputs.consciousness_score || 0) + 
                    parseInt(inputs.temp_score || 0);

      let interpretation = "";
      if (score === 0) interpretation = "Low risk. Routine monitoring.";
      else if (score <= 4) interpretation = "Low risk. Ward-based response, increase monitoring frequency.";
      else if (score <= 6 || (score >= 1 && score < 5 && inputs.any_3 === 'yes')) interpretation = "Medium risk. Urgent ward-based response, clinical assessment by senior nurse/doctor.";
      else interpretation = "High risk. Emergency response, immediate assessment by critical care team.";

      return {
        results: [{ title: "NEWS2 Score", value: score, interpretation, category: score >= 7 ? "High Risk" : score >= 5 ? "Medium Risk" : "Low Risk" }],
        clinicalPearls: "NEWS2 is a standardized tool to detect and respond to clinical deterioration in adult patients."
      };
    }
  },

  egfr_ckd_epi: {
    name: "eGFR (CKD-EPI 2021)",
    calculate: (inputs) => {
      const scr = parseFloat(inputs.creatinine);
      const age = parseFloat(inputs.age);
      const sex = inputs.sex;
      if (isNaN(scr) || isNaN(age)) return { error: "Invalid inputs" };

      // CKD-EPI 2021 Race-free equation
      const k = sex === 'female' ? 0.7 : 0.9;
      const alpha = sex === 'female' ? -0.241 : -0.302;
      const sex_mult = sex === 'female' ? 1.012 : 1.0;
      
      const gfr = 142 * Math.pow(Math.min(scr / k, 1), alpha) * 
                  Math.pow(Math.max(scr / k, 1), -1.200) * 
                  Math.pow(0.9938, age) * sex_mult;

      let interpretation = "";
      if (gfr >= 90) interpretation = "Stage 1 (Normal or high)";
      else if (gfr >= 60) interpretation = "Stage 2 (Mildly decreased)";
      else if (gfr >= 45) interpretation = "Stage 3a (Mild-moderate decrease)";
      else if (gfr >= 30) interpretation = "Stage 3b (Moderate-severe decrease)";
      else if (gfr >= 15) interpretation = "Stage 4 (Severely decreased)";
      else interpretation = "Stage 5 (Kidney failure)";

      return {
        results: [{ title: "eGFR (CKD-EPI 2021)", value: gfr.toFixed(0), unit: "mL/min/1.73m²", interpretation }],
        clinicalPearls: "The 2021 CKD-EPI equation is the current standard, removing race as a variable for more equitable kidney function assessment."
      };
    }
  },

  cr_cl_cg: {
    name: "Creatinine Clearance (Cockcroft-Gault)",
    calculate: (inputs) => {
      const age = parseFloat(inputs.age);
      const weight = parseFloat(inputs.weight);
      const scr = parseFloat(inputs.creatinine);
      const sex = inputs.sex;
      if (isNaN(age) || isNaN(weight) || isNaN(scr) || scr === 0) return { error: "Invalid inputs" };

      let crcl = ((140 - age) * weight) / (72 * scr);
      if (sex === 'female') crcl *= 0.85;

      return {
        results: [{ title: "Creatinine Clearance", value: crcl.toFixed(1), unit: "mL/min", interpretation: "Commonly used for drug dosing adjustments." }],
        clinicalPearls: "Cockcroft-Gault remains widely used for medication dosing despite eGFR being more accurate for overall kidney function."
      };
    }
  },

  anion_gap: {
    name: "Anion Gap",
    calculate: (inputs) => {
      const na = parseFloat(inputs.na);
      const cl = parseFloat(inputs.cl);
      const hco3 = parseFloat(inputs.hco3);
      if (isNaN(na) || isNaN(cl) || isNaN(hco3)) return { error: "Invalid inputs" };

      const gap = na - (cl + hco3);
      let interpretation = "";
      if (gap > 12) interpretation = "High anion gap metabolic acidosis (HAGMA). Consider MUDPILES.";
      else if (gap < 8) interpretation = "Low anion gap. Consider hypoalbuminemia.";
      else interpretation = "Normal anion gap (8-12).";

      return {
        results: [{ title: "Anion Gap", value: gap.toFixed(1), unit: "mEq/L", interpretation }],
        clinicalPearls: "A high anion gap suggests the presence of unmeasured anions (e.g., lactate, ketones, toxins)."
      };
    }
  },

  ascvd_risk: {
    name: "ASCVD 10-year risk",
    calculate: (inputs) => {
      // Simplified ASCVD Risk for demo
      const age = parseInt(inputs.age);
      let risk = 0;
      if (age < 40) risk = 1.5;
      else if (age < 50) risk = 3.5;
      else if (age < 60) risk = 7.5;
      else if (age < 70) risk = 14.5;
      else risk = 22.5;

      if (inputs.smoker === 'yes') risk *= 1.5;
      if (inputs.diabetes === 'yes') risk *= 1.5;

      let category = "";
      if (risk < 5) category = "Low Risk";
      else if (risk < 7.5) category = "Borderline Risk";
      else if (risk < 20) category = "Intermediate Risk";
      else category = "High Risk";

      return {
        results: [{ title: "10-Year ASCVD Risk", value: risk.toFixed(1), unit: "%", interpretation: `Risk category: ${category}.`, category }],
        clinicalPearls: "The ASCVD Risk Estimator Plus helps clinicians and patients build a customized risk reduction plan by estimating 10-year ASCVD risk."
      };
    }
  },

  framingham: {
    name: "Framingham Risk Score",
    calculate: (inputs) => {
      // Simplified Framingham for demo
      const age = parseInt(inputs.age);
      let risk = age > 60 ? 15 : age > 45 ? 8 : 3;
      if (inputs.smoker === 'yes') risk += 5;
      
      return {
        results: [{ title: "10-Year Cardiovascular Risk", value: risk, unit: "%", interpretation: risk > 20 ? "High risk" : risk > 10 ? "Intermediate risk" : "Low risk" }],
        clinicalPearls: "The Framingham Risk Score is used to estimate the 10-year cardiovascular risk of an individual."
      };
    }
  },

  hba1c_eag: {
    name: "HbA1c to eAG converter",
    calculate: (inputs) => {
      const a1c = parseFloat(inputs.hba1c);
      if (isNaN(a1c)) return { error: "Invalid HbA1c" };

      const eag = (28.7 * a1c) - 46.7;
      
      return {
        results: [
          { title: "Estimated Average Glucose (eAG)", value: eag.toFixed(0), unit: "mg/dL" },
          { title: "eAG in mmol/L", value: (eag / 18).toFixed(1), unit: "mmol/L" }
        ],
        clinicalPearls: "eAG helps patients relate their A1c to their daily glucose monitoring values."
      };
    }
  }
};

// ============================================================================
// API CLIENT INTERFACE
// ============================================================================

export const apiClient = {
  /**
   * General clinical chat/question answering
   */
  async chat(question, patient, signal) {
    await sleep(Math.random() * 300 + 600, signal); // Variable latency for realism
    if (!isValidInput(question)) {
      return err("Please provide at least 8 characters of clinical context for a meaningful response.");
    }
    return generateResponse(question, "chat", patient);
  },

  /**
   * Draft differential diagnosis
   */
  async draftDDx(input, patient, signal) {
    await sleep(Math.random() * 400 + 800, signal);
    if (!isValidInput(input)) {
      return err("Please provide more clinical details (at least 8 characters) to generate a differential diagnosis.");
    }
    return generateResponse(input, "ddx", patient);
  },

  /**
   * Draft assessment and plan
   */
  async draftAssessmentPlan(input, patient, signal) {
    await sleep(Math.random() * 500 + 1000, signal);
    if (!isValidInput(input)) {
      return err("Please provide more clinical details to draft an assessment and plan.");
    }
    return generateResponse(input, "assessmentPlan", patient);
  },

  /**
   * Draft diagnostic workup recommendations
   */
  async draftDiagnosticWorkup(input, patient, signal) {
    await sleep(Math.random() * 400 + 700, signal);
    if (!isValidInput(input)) {
      return err("Please provide more clinical context to suggest a diagnostic workup.");
    }
    return generateResponse(input, "diagnosticWorkup", patient);
  },

  /**
   * Draft handover summary (SBAR format)
   */
  async draftHandoverSummary(input, patient, signal) {
    await sleep(Math.random() * 300 + 600, signal);
    if (!isValidInput(input)) {
      return err("Please provide more clinical details to draft a handover summary.");
    }
    return generateResponse(input, "handoverSummary", patient);
  },

  /**
   * Draft patient education handout
   */
  async draftPatientHandout(input, patient, signal) {
    await sleep(Math.random() * 500 + 800, signal);
    if (!isValidInput(input)) {
      return err("Please provide more clinical details to draft a patient handout.");
    }
    return generateResponse(input, "patientEducation", patient);
  },

  /**
   * Generate visit note (SOAP, Progress, Discharge)
   */
  async generateVisitNote(typeOrPayload, patient, input = "", signal) {
    await sleep(Math.random() * 600 + 1200, signal);
    
    let context, type, actualPatient;
    
    if (typeof typeOrPayload === 'object' && typeOrPayload !== null) {
      context = typeOrPayload.userInput || typeOrPayload.visitConversation || "";
      type = typeOrPayload.noteType || "SOAP";
      actualPatient = patient || typeOrPayload.patient;
    } else {
      type = typeOrPayload || "SOAP";
      context = input || type;
      actualPatient = patient;
    }

    if (!isValidInput(context)) {
      return err("Please provide more details about the visit to generate a note.");
    }
    
    return generateResponse(context, "visitNote", actualPatient, { noteType: type });
  },

  /**
   * Check drug interactions
   */
  async checkDrugInteractions(input, patient, signal) {
    await sleep(Math.random() * 400 + 900, signal);
    if (!isValidInput(input)) {
      return err("Please provide drug names (at least 8 characters) to check for interactions.");
    }
    
    // Enhanced drug interaction response
    const medications = Array.isArray(input) ? input : extractInputString(input).split(',').map(m => m.trim());
    
    const interactionData = {
      content: `### Drug Interaction Analysis

**Medications Reviewed**: ${medications.join(", ")}

${patient ? `**Patient Context**: ${patient.fullName}, Age ${patient.age}, with ${patient.chronicConditions?.map(c => c.name).join(', ')}` : ''}

#### Identified Interactions

**1. Major Interaction: Warfarin + Aspirin**
- **Severity**: High (Major)
- **Mechanism**: Additive antiplatelet effects, increased bleeding risk
- **Clinical Impact**: 2-3x increased risk of major bleeding (GI, intracranial)
- **Management**: 
  - Monitor INR closely (target may need adjustment)
  - Assess bleeding risk (HAS-BLED score)
  - Consider gastroprotection (PPI)
  - Educate patient on bleeding symptoms
  - Evaluate if aspirin truly necessary vs higher bleeding risk

**2. Moderate Interaction: Metformin + Contrast Dye**
- **Severity**: Moderate
- **Mechanism**: Increased risk of lactic acidosis if renal function deteriorates post-contrast
- **Clinical Impact**: Rare but serious lactic acidosis
- **Management**:
  - Check eGFR before contrast administration
  - Hold metformin 48h after IV contrast procedures if eGFR <60
  - Resume only after renal function confirmed stable
  - Ensure adequate hydration

**3. Drug-Condition Interaction: NSAIDs with Hypertension**
- **Severity**: Moderate
- **Mechanism**: NSAIDs cause sodium retention, antagonize antihypertensive effects
- **Clinical Impact**: Elevated blood pressure, increased CV risk
- **Management**:
  - Avoid NSAIDs if possible (use acetaminophen for pain)
  - If necessary, use lowest effective dose for shortest duration
  - Monitor blood pressure closely
  - Consider increasing antihypertensive dose if needed

#### Recommendations
1. Continue medications with close monitoring
2. Implement gastroprotection with PPI
3. Regular INR checks (weekly initially)
4. Patient education on bleeding precautions
5. Consider cardiology consultation for optimization of anticoagulation strategy

#### Alternative Medication Considerations
If interaction burden too high:
- Warfarin → Direct oral anticoagulant (DOAC) if appropriate
- Aspirin → Discontinue if indication not compelling
- NSAIDs → Acetaminophen or topical agents`,
      structured: {
        summary: [
          {
            name: "Warfarin + Aspirin",
            severity: "High",
            explanation: "Additive antiplatelet effects significantly increase bleeding risk. Requires close INR monitoring and gastroprotection. Consider risk vs benefit of dual therapy."
          },
          {
            name: "Metformin + IV Contrast",
            severity: "Moderate",
            explanation: "Risk of lactic acidosis if renal function worsens post-contrast. Hold metformin 48h after procedure if eGFR <60, resume when renal function stable."
          }
        ]
      }
    };
    
    return ok(
      formatMarkdown(interactionData.content),
      interactionData.structured,
      mockReferences["general-medical"]
    );
  },

  /**
   * Search clinical guidelines
   */
  async searchGuidelines(input, patient, signal) {
    await sleep(Math.random() * 500 + 1000, signal);
    if (!isValidInput(input)) {
      return err("Please provide a query (at least 8 characters) to search for guidelines.");
    }
    
    const guidelinesResponse = {
      content: `### Clinical Guidelines: ${extractInputString(input)}

Based on your search query, here are the most relevant evidence-based clinical practice guidelines:

#### 1. 2021 AHA/ACC/ASE/CHEST/SAEM/SCCT/SCMR Guideline for the Evaluation and Diagnosis of Chest Pain
**Organization**: American Heart Association / American College of Cardiology
**Year**: 2021
**Key Recommendations**:
- Use of high-sensitivity troponin for rapid rule-out protocols (0 and 1-hour algorithm)
- HEART score for risk stratification in ED patients with chest pain
- Coronary CT angiography (CCTA) as first-line test for low-to-intermediate risk patients
- Functional testing reserved for intermediate-high pretest probability

**Strength of Evidence**: Class I (should be performed), Level A (high-quality evidence from multiple RCTs)

**Clinical Application**: This guideline provides a comprehensive framework for chest pain evaluation, emphasizing accelerated diagnostic pathways to safely discharge low-risk patients while identifying high-risk patients for urgent intervention.

#### 2. Surviving Sepsis Campaign: International Guidelines for Management of Sepsis and Septic Shock 2021
**Organization**: Society of Critical Care Medicine / European Society of Intensive Care Medicine
**Year**: 2021
**Key Recommendations**:
- 1-hour bundle: lactate measurement, blood cultures, broad-spectrum antibiotics, fluid resuscitation (30 mL/kg), vasopressors if needed
- Initial fluid resuscitation with crystalloids (not colloids)
- Norepinephrine as first-line vasopressor
- Target MAP ≥65 mmHg
- Source control within 12 hours when feasible

**Clinical Pearls**: Early recognition and treatment within the first hour significantly improves outcomes. The "golden hour" concept emphasizes immediate action while workup proceeds in parallel.

#### 3. NICE Guideline: Hypertension in Adults - Diagnosis and Management
**Organization**: National Institute for Health and Care Excellence (UK)
**Year**: 2019 (Updated 2022)
**Key Points**:
- Use of ambulatory BP monitoring (ABPM) or home BP monitoring to confirm diagnosis
- Treatment thresholds and targets based on age and comorbidities
- ACE inhibitors or ARBs as first-line for patients <55 or with diabetes
- Calcium channel blockers for patients ≥55 or of African/Caribbean descent
- Consider cardiovascular risk assessment for all

For the full guidelines, please refer to the citation links provided below.`,
      structured: {
        results: [
          {
            id: "guide-001",
            title: "2021 AHA/ACC Guideline for Evaluation and Diagnosis of Chest Pain",
            source: "American Heart Association / American College of Cardiology",
            year: "2021",
            pubdate: "2021-10-28",
            url: "https://www.ahajournals.org/doi/10.1161/CIR.0000000000001029",
            summary: "Comprehensive evidence-based recommendations for chest pain evaluation including rapid rule-out protocols and risk stratification."
          },
          {
            id: "guide-002",
            title: "Surviving Sepsis Campaign: International Guidelines 2021",
            source: "Society of Critical Care Medicine",
            year: "2021",
            pubdate: "2021-11-12",
            url: "https://journals.lww.com/ccmjournal/fulltext/2021/11000/surviving_sepsis_campaign__international.15.aspx",
            summary: "International consensus recommendations for sepsis and septic shock management emphasizing early recognition and 1-hour bundle."
          }
        ]
      }
    };
    
    return ok(
      formatMarkdown(guidelinesResponse.content),
      guidelinesResponse.structured,
      mockReferences["general-medical"]
    );
  },

  /**
   * Explain medical concept
   */
  async explainConcept(query, patient, signal) {
    await sleep(Math.random() * 400 + 700, signal);
    if (!isValidInput(query)) {
      return err("Please specify a medical concept (at least 8 characters) to explain.");
    }
    return generateResponse(query, "chat", patient);
  },

  /**
   * Generate clinical reasoning
   */
  async generateClinicalReasoning(inputOrPayload, patient, signal) {
    await sleep(Math.random() * 600 + 1200, signal);
    let input = inputOrPayload;
    let actualPatient = patient;

    if (typeof inputOrPayload === 'object' && inputOrPayload !== null) {
      input = inputOrPayload.userInput || inputOrPayload.input || "";
      actualPatient = patient;
    }

    if (!isValidInput(input)) {
      return err("Please provide sufficient clinical context (at least 8 characters) for reasoning.");
    }
    
    return generateResponse(input, "clinicalReasoning", actualPatient);
  },

  /**
   * Clinical calculator
   */
  async calculate(calculatorId, inputValues, patient, signal) {
    await sleep(Math.random() * 200 + 400, signal);
    
    const calculator = calculatorRegistry[calculatorId];
    if (!calculator) {
      return err(`Calculator "${calculatorId}" not found. Available calculators: ${Object.keys(calculatorRegistry).join(', ')}`);
    }

    const result = calculator.calculate(inputValues);
    
    if (result.error) {
      return err(result.error);
    }

    const content = `### ${calculator.name}

**Results**:
${result.results.map(r => `
**${r.title}**: ${r.value} ${r.unit || ''}
- **Category**: ${r.category || r.stage || 'N/A'}
- **Interpretation**: ${r.interpretation}
`).join('\n')}

${result.clinicalPearls ? `\n**Clinical Pearls**: ${result.clinicalPearls}` : ''}

${patient ? `\n**Patient**: ${patient.fullName}, Age ${patient.age}` : ''}`;

    return ok(
      formatMarkdown(content),
      result,
      mockReferences["general-medical"]
    );
  },

  /**
   * Format patient context for API calls
   */
  formatPatientContext(patient) {
    if (!patient) return null;
    
    const { 
      fullName, 
      age, 
      sex, 
      chronicConditions = [], 
      longTermMedications = [], 
      allergies = [] 
    } = patient;
    
    return {
      fullName: fullName || "Unknown",
      age: age || null,
      sex: sex || null,
      conditions: chronicConditions.map(c => c.name || c),
      medications: longTermMedications.map(m => ({
        name: m.name || m,
        dose: m.dose || null
      })),
      allergies: allergies.map(a => a.substance || a.name || a)
    };
  }
};