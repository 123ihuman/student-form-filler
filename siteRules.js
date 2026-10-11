// siteRules.js — clean, single copy of each site

window.SITE_RULES = window.SITE_RULES || {};
window.SITE_RULES = {

          'nielit.gov.in': {
    dateFormat: 'dd-Mon-yyyy',
    disableAutoFileInject: true,
    fieldOverrides: {
      examName: "CCC"
    },
    extraAliases: {
      onlineReferenceNumber: ["have you got online reference", "online reference number"],
      appliedPreviously: ["whether applied previously", "applied previously in ccc"],
      careOf: ["care of"],
      stdCode: ["std code", "std"],
      occupation: ["occupation", "व्यवसाय", "occupation / व्यवसाय"],
      highestQualification: ["highest educational qualification", "highest education qualification",
                             "उच्चतम शैक्षिक योग्यता", "highest qualification",
                             "educational qualification", "शैक्षिक योग्यता"],
            addressLine1: ["address line 1", "address line1", "address 1"],
      addressLine2: ["address line 2", "address line2", "address 2"],
      addressLine3: ["address line 3", "address line3", "address 3"],
      district: ["district", "district name"],
      appliedAs: ["applied as", "direct institute"],
      appliedForExamination: ["applied for examination", "exam cycle"],
      examinationLocation1: ["examination location 1", "exam location 1"],
      examinationLocation2: ["examination location 2", "exam location 2"],
      aadhaarNumber: ["applicant aadhar card number", "aadhar card number", "aadhaar card number", "applicant aadhaar"],
      apaarId: ["applicant apaar id", "apaar id"],
      isProviderPresent: ["is provider present"],
      consentRelation: ["consent relation"],
      consentProviderName: ["consent provider name"],
      consentProviderAuthenticationMode: ["consent provider authentication mode"],
      consentProviderAuthenticationId: ["consent provider authentication id"],
      consentDate: ["consent date"],
      consentTime: ["consent time"],
      consentPlace: ["consent place"]
    },
        fileRequirements: {
      photo:     { width: 132, height: 170, minKB: 5, maxKB: 50, dpi: 200, format: 'image/jpeg' },
      signature: { width: 170, height: 132, minKB: 5, maxKB: 20, dpi: 150, format: 'image/jpeg' },
      thumbLeft: { width: 170, height: 132, minKB: 5, maxKB: 20, dpi: 150, format: 'image/jpeg' }
    }
  },

  'ssc.gov.in': {
    dateFormat: 'dd-mm-yyyy',
    fieldOverrides: {
      examName: "Stenographer Grade-III"
    },
    extraAliases: {
      highestQualification: ["highest level of education qualification", "highest level of education", "highest qualification", "education qualification", "highest educational qualification"],
      tenthBoard: ["matriculation 10th class education board", "10th education board", "matriculation board", "10th class education board"],
      tenthRollNumber: ["roll number", "matriculation roll number", "10th roll number"],
      tenthRegistrationNumber: ["registration number", "matriculation registration number"],
      tenthYear: ["year of passing matriculation", "matriculation year of passing", "10th year of passing", "year of passing 10th"],
      twelfthYear: ["year of passing 12th", "12th year of passing", "senior secondary year of passing"],
      graduationYear: ["year of passing graduation", "graduation year of passing", "degree year of passing"]
    }
  },

  'ssc.nic.in': {
    dateFormat: 'dd-mm-yyyy',
    extraAliases: {
      highestQualification: ["highest level of education qualification", "highest level of education", "highest qualification"],
      tenthYear: ["year of passing matriculation", "year of passing 10th"],
      twelfthYear: ["year of passing 12th"]
    }
  },

  'ibps.in': {
    dateFormat: 'dd-mm-yyyy',
    extraAliases: {
      highestQualification: ["educational qualification", "graduation"],
      graduationPercentage: ["graduation percentage", "degree percentage", "graduation marks"]
    }
  },

  'rrbapply.gov.in': {
    dateFormat: 'dd/mm/yyyy',
    extraAliases: {
      nationality: ["country of nationality", "nationality"],
      changedName: ["have you changed your name", "changed name", "name changed"],
      fullName: ["full name", "applicant full name"],
      fatherName: ["father's name", "fathers name"],
      motherName: ["mother's name", "mothers name"],
      mobile: ["mobile number", "mobile no"],
      email: ["email address", "email id"],
      dob: ["date of birth", "effective date", "jquery effectivedate"],
      password: ["password", "create password", "pwd"],
      confirmPassword: ["confirm password", "re-enter password", "retype password"]
    }
  },

  'upsc.gov.in': {
    dateFormat: 'dd/mm/yyyy',
    extraAliases: {
      highestQualification: ["educational qualification"],
      examCenter1: ["centre of examination 1", "exam centre 1"],
      examCenter2: ["centre of examination 2", "exam centre 2"]
    }
  },

  'cdn.digialm.com': {
    dateFormat: 'dd-mm-yyyy',
    extraAliases: {
      examName: ["exam name", "examination name", "परीक्षा का नाम"],
      postApplied: ["post applied", "post applied for", "अभीप्तिद पद"],
      mpDomicile: ["are you m p domicile", "m p domicile", "mp domicile", "native of m p", "मूल निवासी"],
      exServicemen: ["ex servicemen", "ex serviceman", "भूतपूर्व सैनिक"],
      mpGovtEmployee: ["permanent or temporary employee", "mp government employee", "मध्य प्रदेश सरकार", "employee of madhya pradesh", "m p government"],
      contractualBasis: ["contractual basis", "worked for not less than 5 years", "contractual"],
      declaration: ["i agree", "i hereby declare", "declaration", "मैं सहमत हूँ"]
    }
  },

  'mponline.gov.in': {
    dateFormat: 'dd-mm-yyyy'
  },

    'cbseitms.nic.in': {
    dateFormat: 'dd-mm-yyyy',
    disableAutoFileInject: true,
    extraAliases: {
      fullName: ["उम्मीदवार का नाम", "name of the candidate", "name of candidate", "candidate name", "candidate's name"],
      dob: ["जन्म की तारीख", "date of birth", "dob", "birth date", "जन्म तिथि"],
      mobile: ["मोबाइल नंबर", "mobile no", "mobile number"],
      email: ["ईमेल आईडी", "email-id", "email id", "email"],
      motherName: ["माता का नाम", "mother's name", "mother name"],
      fatherName: ["पिता का नाम", "father's name", "father name"],
      alternateMobile: ["वैकल्पिक मोबाइल नंबर", "alternate mobile number", "alternate mobile no", "alternate mobile"],
      identificationMark: ["पहचान चिन्ह", "identification mark", "identifying mark"],
      gender: ["लिंग", "gender"],
      category: ["श्रेणी", "category", "category gen sc st obc", "श्रेणी gen sc st obc"],
      religion: ["धर्म", "religion", "select religion"],
      school: ["name of the school", "school name", "स्कूल का नाम"],
      recognized: ["recognized", "recognised", "मान्यता प्राप्त"],
      state: ["name of the state", "राज्य का नाम"],
      district: ["name of the district", "जिले का नाम"],
      disability: ["disability", "दिव्यांगता", "disability if any"],
      disabilityPercentage: ["percentage of disability", "दिव्यांगता का प्रतिशत"]
    },
    fileRequirements: {
      photo:           { minKB: 10, maxKB: 100, format: 'image/jpeg' },
      signature:       { minKB: 10, maxKB: 100, format: 'image/jpeg' },
      parentSignature: { minKB: 10, maxKB: 100, format: 'image/jpeg' },
      udidCertificate: { minKB: 50, maxKB: 300, format: 'image/jpeg' }
    }
  },

  'cbseitms.rribbps.in': {
    dateFormat: 'dd-mm-yyyy',
    fileRequirements: {
      photo:           { minKB: 10, maxKB: 100, format: 'image/jpeg' },
      signature:       { minKB: 10, maxKB: 100, format: 'image/jpeg' },
      parentSignature: { minKB: 10, maxKB: 100, format: 'image/jpeg' },
      udidCertificate: { minKB: 50, maxKB: 300, format: 'image/jpeg' }
    }
  }

};

function getSiteRule() {
  const host = location.hostname.replace(/^www\./, '');
  const rules = window.SITE_RULES || {};
  for (const domain in rules) {
    if (host === domain || host.endsWith('.' + domain)) return rules[domain];
  }
  return null;
}

window.getSiteRule = getSiteRule;