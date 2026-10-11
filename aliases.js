// aliases.js — complete (student + eGram + MPHC + SSC + all forms)

window.FIELD_ALIASES = window.FIELD_ALIASES || {};
window.FIELD_ALIASES = {

  // ==================== Personal ====================
    fullName: ["full name", "candidate name", "candidate's name", "applicant name", "applicant's name",
             "student name", "name of candidate", "name of applicant", "name of student",
             "उम्मीदवार का नाम", "नाम", "विद्यार्थी का नाम", "अभ्यर्थी का नाम",
             "name of the candidate", "candidate full name"],
salutation: ["salutation", "title", "prefix", "mr", "mrs", "ms", "shri", "smt"],
  firstName: ["first name", "given name", "fname", "applicant first name", "applicant's first name"],
  middleName: ["middle name", "mname", "applicant middle name", "applicant's middle name"],
  lastName: ["last name", "surname", "family name", "lname", "applicant last name", "applicant's last name"],
  fatherName: ["father name", "father's name", "fathers name", "name of father", "parent name", "guardian name", "guardian's name"],
  motherName: ["mother name", "mother's name", "mothers name", "name of mother", "mothers full name"],
  guardianName: ["guardian name", "guardian's name", "local guardian"],
    dob: ["date of birth", "dob", "birth date", "birthdate", "effective date", "jquery effectivedate", "जन्म तिथि", "date of birth dd-mm-yyyy", "birth date dd-mm-yyyy"],
  age: ["age", "age in years", "age as on"],
  identificationMark: ["identification mark", "identifying mark", "identification marks", "पहचान चिन्ह", "पहचान चिह्न", "mark of identification"],
  fatherSignature: ["father's signature", "father signature", "signature of father"],
  motherSignature: ["mother's signature", "mother signature", "signature of mother"],
  signatureHindi: ["signature in hindi", "hindi signature", "हिंदी हस्ताक्षर", "signature (hindi)"],
  consentForm: ["consent form", "consent letter", "सहमति पत्र", "no objection certificate", "noc"],
  gender: ["gender", "sex", "male female"],
  maritalStatus: ["marital status", "married status", "marital", "वैवाहिक स्थिति"],
  bloodGroup: ["blood group", "blood grp"],
  nationality: ["nationality", "citizen", "indian citizen", "are you an indian", "indian", "country of nationality"],
  religion: ["religion", "dharma", "धर्म", "select religion", "religion name"],
  caste: ["caste", "jati"],
      category: ["category", "caste category", "reservation category", "social category", "gen obc sc st",
             "श्रेणी", "category gen sc st obc", "category gen/sc/st/obc", "category (gen sc st obc)"],
  subCategory: ["sub category", "sub caste"],
  motherTongue: ["mother tongue", "language"],
    differentlyAbled: ["differently abled", "disability", "handicap", "physically challenged", "divyang", "दिव्यांगता", "disability if any"],
  disabilityType: ["disability type", "type of disability"],
  disabilityPercent: ["disability percentage", "percentage of disability", "दिव्यांगता का प्रतिशत"],
  changedName: ["have you changed your name", "changed name", "name changed", "whether name changed"],

  // ==================== Identity ====================
  aadhaarNumber: ["aadhaar", "aadhaar number", "aadhar", "uid", "uidai", "applicant aadhar card number", "applicant aadhaar"],
  panNumber: ["pan", "pan number", "pan card", "permanent account number"],
  voterId: ["voter id", "epic", "voter card"],
  drivingLicense: ["driving licence", "driving license", "dl number"],
  passportNumber: ["passport", "passport number"],
  rationCard: ["ration card", "ration card number"],
  apaarId: ["applicant apaar id", "apaar id"],

  // ==================== Contact ====================
  email: ["email", "e-mail", "email address", "email id", "mail id"],
  alternateEmail: ["alternate email", "secondary email"],
  mobile: ["mobile", "phone", "contact", "mobile number", "phone number", "contact number", "mobile no", "cell", "cellphone"],
    alternateMobile: ["alternate mobile", "alternate phone", "secondary mobile", "parent mobile", "father mobile", "mother mobile", "alternate mobile number", "वैकल्पिक मोबाइल नंबर", "alternate mobile no"],
  whatsappNumber: ["whatsapp", "whatsapp number"],
  stdCode: ["std code", "std"],

  // ==================== Address ====================
    address: ["address", "permanent address", "residential address", "home address", "present full postal address", "present address", "वर्तमान पूरा डाक पता", "postal address", "full postal address", "current postal address"],
  addressLine1: ["address line 1", "address1", "address line1", "address 1", "house no", "door no", "building", "street"],
  addressLine2: ["address line 2", "address2", "address line2", "address 2", "locality", "area", "village", "town"],
  addressLine3: ["address line 3", "address line3", "address 3"],
  village: ["village", "gram", "gram panchayat"],
  postOffice: ["post office", "po", "post"],
  taluk: ["taluk", "tehsil", "mandal", "block"],
  city: ["city", "town", "district", "district name"],
  district: ["district", "district name"],
  state: ["state", "province", "state name"],
  pincode: ["pincode", "pin code", "zip", "postal code", "zip code", "pin"],
  country: ["country"],

  currentAddress: ["current address", "present address", "temporary address", "local address"],
  currentAddressLine1: ["current address line 1", "current address1"],
  currentAddressLine2: ["current address line 2", "current address2"],
  currentCity: ["current city", "present city"],
  currentState: ["current state", "present state"],
  currentPincode: ["current pincode", "present pincode"],

  // ==================== 10th ====================
  tenthBoard: ["10th board", "sslc board", "matriculation board", "tenth board", "class 10 board", "10th board name", "matriculation 10th class education board", "10th education board"],
  tenthSchool: ["10th school", "sslc school", "matriculation school", "school name 10", "high school name"],
  tenthRollNumber: ["10th roll number", "sslc roll number", "tenth roll no", "10th roll no", "roll number", "matriculation roll number"],
  tenthRegistrationNumber: ["10th registration number", "sslc reg no", "10th reg no", "matriculation reg no"],
  tenthYear: ["10th year", "sslc year", "year of passing 10", "tenth passing year", "class 10 year", "year of passing"],
  tenthPercentage: ["10th percentage", "sslc percentage", "10th marks", "10th cgpa", "tenth percentage"],
  tenthMarks: ["10th total marks", "sslc total marks", "10th score"],
  tenthSubject: ["10th subject", "sslc stream"],

  // ==================== 12th ====================
  twelfthBoard: ["12th board", "puc board", "intermediate board", "hsc board", "higher secondary board"],
  twelfthSchool: ["12th school", "puc college", "intermediate college", "higher secondary school"],
  twelfthRollNumber: ["12th roll number", "puc roll no", "intermediate roll no", "hsc roll no"],
  twelfthRegistrationNumber: ["12th registration number", "puc reg no", "intermediate reg no"],
  twelfthYear: ["12th year", "puc year", "year of passing 12", "intermediate passing year"],
  twelfthPercentage: ["12th percentage", "puc percentage", "intermediate percentage", "hsc percentage"],
  twelfthMarks: ["12th total marks", "puc total marks"],
  twelfthStream: ["12th stream", "puc stream", "intermediate stream", "science commerce arts"],
  twelfthSubject: ["12th subject", "optional subject"],

  // ==================== Graduation ====================
  graduationUniversity: ["graduation university", "university name", "degree university", "ug university"],
  graduationCollege: ["graduation college", "degree college", "ug college", "college name"],
  graduationDegree: ["graduation degree", "degree name", "ug degree", "bachelor degree", "course name"],
  graduationCourse: ["graduation course", "ug course", "bachelor course"],
  graduationRollNumber: ["graduation roll number", "degree roll no", "ug roll no", "college roll no"],
  graduationRegistrationNumber: ["graduation registration number", "degree reg no", "university reg no"],
  graduationYear: ["graduation year", "degree year", "year of passing ug", "ug passing year"],
  graduationPercentage: ["graduation percentage", "degree percentage", "ug cgpa", "degree cgpa", "ug percentage"],
  graduationMarks: ["graduation marks", "degree marks", "ug marks"],
  graduationStream: ["graduation stream", "degree stream", "ug stream"],
  graduationStartYear: ["graduation start year", "degree start year", "ug start year"],
  graduationEndYear: ["graduation end year", "degree end year", "ug end year"],

  // ==================== PG ====================
  pgUniversity: ["pg university", "post graduation university", "masters university"],
  pgCollege: ["pg college", "post graduation college", "masters college"],
  pgDegree: ["pg degree", "post graduation degree", "masters degree"],
  pgCourse: ["pg course", "masters course"],
  pgRollNumber: ["pg roll number", "masters roll no"],
  pgRegistrationNumber: ["pg registration number", "masters reg no"],
  pgYear: ["pg year", "masters year", "year of passing pg"],
  pgPercentage: ["pg percentage", "masters percentage", "pg cgpa"],
  pgStream: ["pg stream", "masters stream"],

  // ==================== Current Education ====================
  school: ["school", "college", "institution", "university", "institute", "name of the school", "school name", "स्कूल का नाम"],
  recognized: ["recognized", "recognised", "recognition", "मान्यता प्राप्त", "recognized status"],
  currentCollege: ["current college", "present college", "college name"],
  currentUniversity: ["current university", "present university"],
  currentCourse: ["current course", "present course", "course pursuing"],
  currentYear: ["current year", "year of study", "present year"],
  currentSemester: ["current semester", "semester", "present semester"],
  rollNumber: ["roll number", "roll no", "registration number", "reg no", "enrollment number", "enrolment no"],
  studentId: ["student id", "admission number", "admission no"],
  highestQualification: ["highest level of education", "highest qualification", "education qualification", "highest education", "qualification", "highest educational qualification", "highest education qualification"],

  // ==================== Exam ====================
  examName: ["exam name", "examination name", "परीक्षा का नाम"],
  postApplied: ["post applied", "post applied for", "अभीप्तिद पद"],
  applicationNumber: ["application number", "application no", "app no", "form number"],
  registrationNumber: ["registration number", "reg no", "registration no"],
  examCenter: ["exam center", "examination center", "test center", "centre"],
  examCenter1: ["exam center 1", "first preference", "center preference 1", "centre of examination 1", "exam centre 1"],
  examCenter2: ["exam center 2", "second preference", "center preference 2", "centre of examination 2", "exam centre 2"],
  examLanguage: ["exam language", "medium", "language of exam"],
  appliedAs: ["applied as", "direct institute"],
  appliedForExamination: ["applied for examination", "exam cycle"],
  appliedPreviously: ["whether applied previously", "applied previously in ccc"],
  onlineReferenceNumber: ["have you got online reference", "online reference number"],
  examinationLocation1: ["examination location 1", "exam location 1"],
  examinationLocation2: ["examination location 2", "exam location 2"],

  // ==================== Bank ====================
  bankName: ["bank name", "bank"],
  accountNumber: ["account number", "account no", "bank account number", "sb account"],
  confirmAccountNumber: ["confirm account number", "re-enter account number", "retype account number"],
  ifscCode: ["ifsc", "ifsc code", "bank ifsc"],
  branchName: ["branch name", "bank branch"],
  accountHolderName: ["account holder name", "account holder", "name as in bank"],

  // ==================== Family ====================
  fatherOccupation: ["father occupation", "fathers occupation", "occupation of father"],
  motherOccupation: ["mother occupation", "mothers occupation"],
  fatherMobile: ["father mobile", "fathers mobile", "father contact"],
  motherMobile: ["mother mobile", "mothers mobile", "mother contact"],
  fatherEmail: ["father email", "fathers email"],
  motherEmail: ["mother email", "mothers email"],
  parentIncome: ["parent income", "family income", "annual income", "yearly income", "father income", "mother income"],

  // ==================== Special ====================
  careOf: ["care of"],
  mpDomicile: ["are you m p domicile", "m p domicile", "mp domicile", "native of m p", "domicile of m p", "मूल निवासी"],
  exServicemen: ["ex servicemen", "ex serviceman", "भूतपूर्व सैनिक"],
  mpGovtEmployee: ["permanent or temporary employee", "mp government employee", "मध्य प्रदेश सरकार", "employee of madhya pradesh", "m p government"],
  contractualBasis: ["contractual basis", "worked for not less than 5 years", "contractual"],
  declaration: ["i agree", "i hereby declare", "declaration", "मैं सहमत हूँ"],
  isProviderPresent: ["is provider present"],
  consentRelation: ["consent relation"],
  consentProviderName: ["consent provider name"],
  consentProviderAuthenticationMode: ["consent provider authentication mode"],
  consentProviderAuthenticationId: ["consent provider authentication id"],
  consentDate: ["consent date"],
  consentTime: ["consent time"],
  consentPlace: ["consent place"],

  // ==================== Password ====================
  password: ["password", "pwd", "create password"],
  confirmPassword: ["confirm password", "re-enter password", "retype password", "confirm new password"],

  // ==================== Misc ====================
  income: ["income", "annual income", "yearly income"],
  remarks: ["remarks", "narration", "description", "note", "comments"],

  // ==================== eGramSwaraj / Vendor ====================
  vendorName: ["vendor name", "payee name", "party name", "vendor", "payee"],
  amount: ["amount", "total amount", "bill amount", "payment amount", "gross amount"],
  scheme: ["scheme", "scheme name", "fund source", "grant"],
  workName: ["work name", "activity", "work", "purpose", "particulars"],
  billNo: ["bill no", "bill number", "invoice no", "voucher no"],
  accountHead: ["account head", "expenditure head", "head of account"],
  voucherDate: ["voucher date", "payment date", "date of payment"]
};

// ==================== FILE UPLOAD ALIASES ====================
window.FILE_ALIASES = window.FILE_ALIASES || {};
window.FILE_ALIASES = {
  photo: [
    "photo", "photograph", "passport photo", "recent photo",
    "candidate photo", "applicant photo", "upload photo",
    "pasted photo", "candidate's photo", "photo upload",
    "upload candidate photo", "candidate photo upload",
    "उम्मीदवार की फोटो"
  ],
  signature: [
    "signature", "specimen signature", "upload signature",
    "sign here", "digital signature", "candidate's signature",
    "candidate signature", "candidate sign", "applicant signature",
    "applicant's signature", "upload candidate signature",
    "उम्मीदवार के हस्ताक्षर"
  ],
  signatureHindi: [
    "signature in hindi", "hindi signature", "signature (hindi)",
    "हिंदी हस्ताक्षर"
  ],
  parentSignature: [
    "parent's signature", "parent signature", "parents signature",
    "father's signature", "mother's signature", "father signature",
    "mother signature", "signature of parent", "signature of father",
    "signature of mother", "parent's sign", "parents sign",
    "माता या पिता के हस्ताक्षर", "माता पिता के हस्ताक्षर"
  ],
  thumbLeft: ["left thumb", "left thumb impression", "lti", "left thumb print"],
  thumbRight: ["right thumb", "right thumb impression", "rti", "right thumb print"],
  tenthMarksheet: [
    "10th marksheet", "10th mark sheet", "sslc marksheet",
    "sslc marks card", "matriculation marksheet",
    "class 10 marksheet", "tenth marksheet", "10th memo"
  ],
  tenthCertificate: [
    "10th certificate", "sslc certificate", "matriculation certificate",
    "class 10 certificate", "10th pass certificate"
  ],
  twelfthMarksheet: [
    "12th marksheet", "puc marksheet", "intermediate marksheet",
    "hsc marksheet", "12th marks card", "class 12 marksheet"
  ],
  twelfthCertificate: [
    "12th certificate", "puc certificate", "intermediate certificate",
    "hsc certificate", "higher secondary certificate"
  ],
  graduationMarksheet: [
    "graduation marksheet", "degree marksheet", "ug marksheet",
    "bachelor marksheet", "degree marks card"
  ],
  graduationCertificate: [
    "graduation certificate", "degree certificate", "ug certificate",
    "provisional degree"
  ],
  pgMarksheet: ["pg marksheet", "masters marksheet"],
  pgCertificate: ["pg certificate", "masters certificate"],
  aadhaarCard: ["aadhaar", "aadhar", "aadhaar card", "aadhar card", "uid card"],
  panCard: ["pan card", "pan"],
  voterId: ["voter id", "voter card", "epic card"],
  rationCard: ["ration card", "ration"],
  casteCertificate: [
    "caste certificate", "caste cert", "category certificate",
    "श्रेणी प्रमाणपत्र"
  ],
  incomeCertificate: ["income certificate", "income cert"],
  domicileCertificate: ["domicile certificate", "domicile", "residence certificate"],
  nativityCertificate: ["nativity certificate"],
  udidCertificate: [
    "udid certificate", "udid card", "disability certificate",
    "unique disability id", "श्रेणी udid", "यूडीआईडी प्रमाणपत्र"
  ],
  transferCertificate: ["transfer certificate", "school leaving certificate"],
  migrationCertificate: ["migration certificate"],
  characterCertificate: ["character certificate", "conduct certificate"],
  disabilityCertificate: ["disability certificate", "handicap certificate"],
  ewsCertificate: ["ews certificate", "ews"],
  consentForm: [
    "consent form", "consent letter", "no objection certificate", "noc",
    "सहमति पत्र"
  ],
  resume: ["resume", "cv", "curriculum vitae"],
  photoId: ["photo id", "photo identity", "id proof", "identity proof"]
};