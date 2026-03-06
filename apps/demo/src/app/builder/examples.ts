import type { WaypointSchema } from "@waypointjs/core";

// ============================================================================
// Schemas
// ============================================================================

// ---------------------------------------------------------------------------
// ONBOARDING
// ---------------------------------------------------------------------------

export const userOnboardingSchema: WaypointSchema = {
  version: "1",
  id: "user-onboarding",
  name: "User Onboarding",
  persistenceMode: "zustand",
  steps: [
    {
      id: "account",
      title: "Account",
      url: "/onboarding/account",
      fields: [
        { id: "email", type: "email", label: "Email address", validation: [{ type: "required", message: "Email is required" }, { type: "email", message: "Must be a valid email" }] },
        { id: "password", type: "password", label: "Password", validation: [{ type: "required", message: "Password is required" }, { type: "minLength", value: "8", message: "At least 8 characters" }] },
      ],
    },
    {
      id: "profile",
      title: "Profile",
      url: "/onboarding/profile",
      fields: [
        { id: "firstName", type: "text", label: "First name", validation: [{ type: "required", message: "Required" }] },
        { id: "lastName", type: "text", label: "Last name", validation: [{ type: "required", message: "Required" }] },
        { id: "birthDate", type: "date", label: "Date of birth" },
        { id: "phone", type: "tel", label: "Phone number" },
      ],
    },
    {
      id: "company",
      title: "Company",
      url: "/onboarding/company",
      visibleWhen: {
        combinator: "and",
        rules: [{ field: "profile.accountType", operator: "equals", value: "business" }],
      },
      fields: [
        { id: "companyName", type: "text", label: "Company name", validation: [{ type: "required", message: "Required" }] },
        { id: "siren", type: "text", label: "SIREN / Registration number", validation: [{ type: "required", message: "Required" }, { type: "minLength", value: "9", message: "9 digits minimum" }] },
        { id: "employees", type: "select", label: "Number of employees", options: [{ label: "1-10", value: "1-10" }, { label: "11-50", value: "11-50" }, { label: "51-200", value: "51-200" }, { label: "200+", value: "200+" }] },
      ],
    },
    {
      id: "preferences",
      title: "Preferences",
      url: "/onboarding/preferences",
      enableResumeFromHere: true,
      fields: [
        { id: "language", type: "select", label: "Language", options: [{ label: "English", value: "en" }, { label: "French", value: "fr" }, { label: "Spanish", value: "es" }], validation: [{ type: "required", message: "Required" }] },
        { id: "newsletter", type: "checkbox", label: "Subscribe to newsletter" },
        { id: "notifications", type: "checkbox", label: "Enable push notifications" },
      ],
    },
  ],
  externalVariables: [],
  customTypes: [],
};

export const saasOnboardingSchema: WaypointSchema = {
  version: "1",
  id: "saas-onboarding",
  name: "SaaS Product Onboarding",
  persistenceMode: "zustand",
  steps: [
    {
      id: "workspace",
      title: "Workspace",
      url: "/saas/workspace",
      fields: [
        { id: "name", type: "text", label: "Workspace name", validation: [{ type: "required", message: "Required" }, { type: "minLength", value: "3", message: "At least 3 characters" }] },
        { id: "type", type: "select", label: "Account type", options: [{ label: "Personal", value: "personal" }, { label: "Team (2-20)", value: "team" }, { label: "Enterprise (20+)", value: "enterprise" }], validation: [{ type: "required", message: "Required" }] },
        { id: "industry", type: "select", label: "Industry", options: [{ label: "Technology", value: "tech" }, { label: "Finance", value: "finance" }, { label: "Healthcare", value: "health" }, { label: "Education", value: "edu" }, { label: "Other", value: "other" }] },
      ],
    },
    {
      id: "team",
      title: "Invite Team",
      url: "/saas/team",
      visibleWhen: {
        combinator: "or",
        rules: [
          { field: "workspace.type", operator: "equals", value: "team" },
          { field: "workspace.type", operator: "equals", value: "enterprise" },
        ],
      },
      fields: [
        { id: "inviteEmails", type: "textarea", label: "Invite emails", placeholder: "alice@company.com\nbob@company.com", validation: [{ type: "required", message: "Add at least one email" }] },
        { id: "defaultRole", type: "radio", label: "Default role for invites", options: [{ label: "Viewer", value: "viewer" }, { label: "Editor", value: "editor" }, { label: "Admin", value: "admin" }], validation: [{ type: "required", message: "Required" }] },
      ],
    },
    {
      id: "features",
      title: "Preferences",
      url: "/saas/features",
      enableResumeFromHere: true,
      fields: [
        { id: "plan", type: "radio", label: "Select a plan", options: [{ label: "Free - limited features", value: "free" }, { label: "Pro - 12/month", value: "pro" }, { label: "Enterprise - custom pricing", value: "enterprise" }], validation: [{ type: "required", message: "Required" }] },
        { id: "integrations", type: "multiselect", label: "Connect integrations", options: [{ label: "Slack", value: "slack" }, { label: "GitHub", value: "github" }, { label: "Jira", value: "jira" }, { label: "Google Drive", value: "gdrive" }] },
        { id: "newsletter", type: "checkbox", label: "Send me product updates" },
      ],
    },
  ],
  externalVariables: [],
  customTypes: [],
};

// ---------------------------------------------------------------------------
// FINANCE
// ---------------------------------------------------------------------------

export const insuranceSchema: WaypointSchema = {
  version: "1",
  id: "insurance-quote",
  name: "Insurance Quote",
  persistenceMode: "backend-step",
  steps: [
    {
      id: "insured",
      title: "About you",
      url: "/insurance/insured",
      fields: [
        { id: "age", type: "number", label: "Your age", validation: [{ type: "required", message: "Required" }, { type: "min", value: "18", message: "Must be 18 or older" }] },
        { id: "smoker", type: "radio", label: "Are you a smoker?", options: [{ label: "Yes", value: "yes" }, { label: "No", value: "no" }], validation: [{ type: "required", message: "Required" }] },
        { id: "occupation", type: "text", label: "Occupation", validation: [{ type: "required", message: "Required" }] },
      ],
    },
    {
      id: "health",
      title: "Health",
      url: "/insurance/health",
      fields: [
        { id: "conditions", type: "multiselect", label: "Pre-existing conditions", options: [{ label: "None", value: "none" }, { label: "Diabetes", value: "diabetes" }, { label: "Hypertension", value: "hypertension" }, { label: "Asthma", value: "asthma" }] },
        { id: "medications", type: "textarea", label: "Current medications", placeholder: "List any medications you are taking..." },
        { id: "smokerDetails", type: "text", label: "How many cigarettes per day?", dependsOn: ["insured.smoker"], visibleWhen: { combinator: "and", rules: [{ field: "insured.smoker", operator: "equals", value: "yes" }] }, validation: [{ type: "required", message: "Required if smoker" }] },
      ],
    },
    {
      id: "senior",
      title: "Senior options",
      url: "/insurance/senior",
      visibleWhen: { combinator: "and", rules: [{ field: "insured.age", operator: "greaterThanOrEqual", value: 60 }] },
      fields: [
        { id: "retirementStatus", type: "radio", label: "Retirement status", options: [{ label: "Retired", value: "retired" }, { label: "Still working", value: "working" }], validation: [{ type: "required", message: "Required" }] },
        { id: "dependents", type: "number", label: "Number of dependents" },
      ],
    },
    {
      id: "coverage",
      title: "Coverage",
      url: "/insurance/coverage",
      fields: [
        { id: "plan", type: "select", label: "Plan", options: [{ label: "Basic", value: "basic" }, { label: "Standard", value: "standard" }, { label: "Premium", value: "premium" }], dependsOn: ["insured.age"], validation: [{ type: "required", message: "Required" }] },
        { id: "startDate", type: "date", label: "Start date", validation: [{ type: "required", message: "Required" }] },
        { id: "familyCoverage", type: "checkbox", label: "Add family coverage", visibleWhen: { combinator: "and", rules: [{ field: "coverage.plan", operator: "in", value: ["standard", "premium"] }] } },
      ],
    },
  ],
  externalVariables: [
    { id: "customerId", label: "Customer ID", type: "string", blocking: true, usedIn: [{ stepId: "insured" }] },
  ],
  customTypes: [],
};

export const loanSchema: WaypointSchema = {
  version: "1",
  id: "loan-application",
  name: "Loan Application",
  persistenceMode: "backend-step",
  steps: [
    {
      id: "identity",
      title: "Identity",
      url: "/loan/identity",
      fields: [
        { id: "firstName", type: "text", label: "First name", validation: [{ type: "required", message: "Required" }] },
        { id: "lastName", type: "text", label: "Last name", validation: [{ type: "required", message: "Required" }] },
        { id: "birthDate", type: "date", label: "Date of birth", validation: [{ type: "required", message: "Required" }] },
        { id: "nationality", type: "select", label: "Nationality", options: [{ label: "French", value: "fr" }, { label: "EU citizen", value: "eu" }, { label: "Other", value: "other" }], validation: [{ type: "required", message: "Required" }] },
      ],
    },
    {
      id: "income",
      title: "Income",
      url: "/loan/income",
      fields: [
        { id: "employmentStatus", type: "select", label: "Employment status", options: [{ label: "Employed (CDI)", value: "cdi" }, { label: "Employed (CDD)", value: "cdd" }, { label: "Self-employed", value: "self" }, { label: "Retired", value: "retired" }, { label: "Unemployed", value: "unemployed" }], validation: [{ type: "required", message: "Required" }] },
        { id: "monthlyIncome", type: "number", label: "Monthly net income", validation: [{ type: "required", message: "Required" }, { type: "min", value: "0", message: "Must be positive" }] },
        { id: "employer", type: "text", label: "Employer name", dependsOn: ["income.employmentStatus"], visibleWhen: { combinator: "or", rules: [{ field: "income.employmentStatus", operator: "equals", value: "cdi" }, { field: "income.employmentStatus", operator: "equals", value: "cdd" }] } },
        { id: "companyAge", type: "number", label: "Years in business", dependsOn: ["income.employmentStatus"], visibleWhen: { combinator: "and", rules: [{ field: "income.employmentStatus", operator: "equals", value: "self" }] }, validation: [{ type: "required", message: "Required for self-employed" }] },
      ],
    },
    {
      id: "property",
      title: "Property",
      url: "/loan/property",
      visibleWhen: { combinator: "and", rules: [{ field: "$ext.loanType", operator: "equals", value: "mortgage" }] },
      fields: [
        { id: "propertyType", type: "select", label: "Property type", options: [{ label: "Apartment", value: "apartment" }, { label: "House", value: "house" }, { label: "Commercial", value: "commercial" }], validation: [{ type: "required", message: "Required" }] },
        { id: "propertyValue", type: "number", label: "Estimated value", dependsOn: ["income.monthlyIncome"], validation: [{ type: "required", message: "Required" }, { type: "min", value: "50000", message: "Minimum 50,000" }] },
        { id: "address", type: "textarea", label: "Property address", validation: [{ type: "required", message: "Required" }] },
      ],
    },
    {
      id: "loanDetails",
      title: "Loan details",
      url: "/loan/details",
      fields: [
        { id: "amount", type: "number", label: "Requested amount", dependsOn: ["income.monthlyIncome"], validation: [{ type: "required", message: "Required" }] },
        { id: "duration", type: "select", label: "Duration", options: [{ label: "12 months", value: "12" }, { label: "24 months", value: "24" }, { label: "36 months", value: "36" }, { label: "60 months", value: "60" }, { label: "120 months", value: "120" }], validation: [{ type: "required", message: "Required" }] },
        { id: "purpose", type: "select", label: "Purpose", options: [{ label: "Home purchase", value: "home" }, { label: "Renovation", value: "renovation" }, { label: "Vehicle", value: "vehicle" }, { label: "Education", value: "education" }, { label: "Other", value: "other" }], validation: [{ type: "required", message: "Required" }] },
      ],
    },
    {
      id: "review",
      title: "Review & Submit",
      url: "/loan/review",
      enableResumeFromHere: true,
      fields: [
        { id: "terms", type: "checkbox", label: "I accept the terms and conditions", dependsOn: ["loanDetails.amount", "loanDetails.duration"], validation: [{ type: "required", message: "You must accept the terms" }] },
        { id: "signature", type: "text", label: "Electronic signature (full name)", dependsOn: ["identity.firstName", "identity.lastName"], validation: [{ type: "required", message: "Required" }] },
      ],
    },
  ],
  externalVariables: [
    { id: "loanType", label: "Loan type (mortgage / personal)", type: "string", blocking: true, usedIn: [{ stepId: "property" }] },
    { id: "applicantId", label: "Applicant ID", type: "string", blocking: true, usedIn: [{ stepId: "identity" }, { stepId: "review" }] },
  ],
  customTypes: [],
};

export const investmentSchema: WaypointSchema = {
  version: "1",
  id: "investment-profile",
  name: "Investment Risk Profile",
  persistenceMode: "backend-step",
  steps: [
    {
      id: "profile",
      title: "Your Profile",
      url: "/investment/profile",
      fields: [
        { id: "age", type: "number", label: "Your age", validation: [{ type: "required", message: "Required" }, { type: "min", value: "18", message: "Must be 18+" }] },
        { id: "annualIncome", type: "number", label: "Annual income", validation: [{ type: "required", message: "Required" }, { type: "min", value: "0", message: "Must be positive" }] },
        { id: "currentSavings", type: "number", label: "Current savings", validation: [{ type: "required", message: "Required" }] },
      ],
    },
    {
      id: "goals",
      title: "Investment Goals",
      url: "/investment/goals",
      fields: [
        { id: "objective", type: "radio", label: "Primary objective", options: [{ label: "Retirement", value: "retirement" }, { label: "Wealth growth", value: "growth" }, { label: "Regular income", value: "income" }, { label: "Speculation", value: "speculation" }], validation: [{ type: "required", message: "Required" }] },
        { id: "horizon", type: "number", label: "Investment horizon (years)", validation: [{ type: "required", message: "Required" }, { type: "min", value: "1", message: "At least 1 year" }] },
        { id: "monthlyContribution", type: "number", label: "Monthly contribution", validation: [{ type: "required", message: "Required" }] },
      ],
    },
    {
      id: "risk",
      title: "Risk Tolerance",
      url: "/investment/risk",
      fields: [
        { id: "riskLevel", type: "radio", label: "Risk appetite", options: [{ label: "Conservative - preserve capital", value: "conservative" }, { label: "Moderate - balanced growth", value: "moderate" }, { label: "Aggressive - maximize returns", value: "aggressive" }], validation: [{ type: "required", message: "Required" }] },
        { id: "maxLoss", type: "select", label: "Max acceptable annual loss", options: [{ label: "5%", value: "5" }, { label: "15%", value: "15" }, { label: "30%", value: "30" }, { label: "50%+", value: "50" }], validation: [{ type: "required", message: "Required" }] },
        { id: "experience", type: "select", label: "Investment experience", options: [{ label: "None", value: "none" }, { label: "< 2 years", value: "beginner" }, { label: "2-5 years", value: "intermediate" }, { label: "5+ years", value: "expert" }], validation: [{ type: "required", message: "Required" }] },
        { id: "leverageAccepted", type: "checkbox", label: "I understand and accept leverage risk", dependsOn: ["risk.riskLevel"], visibleWhen: { combinator: "and", rules: [{ field: "risk.riskLevel", operator: "equals", value: "aggressive" }] } },
      ],
    },
  ],
  externalVariables: [
    { id: "clientId", label: "Client ID", type: "string", blocking: true, usedIn: [{ stepId: "profile" }] },
  ],
  customTypes: [],
};

// ---------------------------------------------------------------------------
// E-COMMERCE
// ---------------------------------------------------------------------------

export const checkoutSchema: WaypointSchema = {
  version: "1",
  id: "checkout",
  name: "E-commerce Checkout",
  persistenceMode: "zustand",
  steps: [
    {
      id: "shipping",
      title: "Shipping address",
      url: "/checkout/shipping",
      fields: [
        { id: "fullName", type: "text", label: "Full name", validation: [{ type: "required", message: "Required" }] },
        { id: "address", type: "text", label: "Street address", validation: [{ type: "required", message: "Required" }] },
        { id: "city", type: "text", label: "City", validation: [{ type: "required", message: "Required" }] },
        { id: "postalCode", type: "text", label: "Postal code", validation: [{ type: "required", message: "Required" }, { type: "minLength", value: "4", message: "Invalid postal code" }] },
        { id: "country", type: "select", label: "Country", options: [{ label: "France", value: "fr" }, { label: "Belgium", value: "be" }, { label: "Switzerland", value: "ch" }, { label: "UK", value: "uk" }], validation: [{ type: "required", message: "Required" }] },
      ],
    },
    {
      id: "billing",
      title: "Billing",
      url: "/checkout/billing",
      fields: [
        { id: "sameAsShipping", type: "checkbox", label: "Same as shipping address" },
        { id: "billingAddress", type: "text", label: "Billing address", dependsOn: ["billing.sameAsShipping"], visibleWhen: { combinator: "and", rules: [{ field: "billing.sameAsShipping", operator: "notEquals", value: true }] } },
        { id: "vatNumber", type: "text", label: "VAT number (optional, for businesses)" },
      ],
    },
    {
      id: "payment",
      title: "Payment",
      url: "/checkout/payment",
      fields: [
        { id: "method", type: "radio", label: "Payment method", options: [{ label: "Credit card", value: "card" }, { label: "PayPal", value: "paypal" }, { label: "Bank transfer", value: "transfer" }], validation: [{ type: "required", message: "Required" }] },
        { id: "cardNumber", type: "text", label: "Card number", dependsOn: ["payment.method"], visibleWhen: { combinator: "and", rules: [{ field: "payment.method", operator: "equals", value: "card" }] }, validation: [{ type: "required", message: "Required" }] },
        { id: "cardExpiry", type: "text", label: "Expiry (MM/YY)", dependsOn: ["payment.cardNumber"], visibleWhen: { combinator: "and", rules: [{ field: "payment.method", operator: "equals", value: "card" }] }, validation: [{ type: "required", message: "Required" }] },
        { id: "cardCvc", type: "text", label: "CVC", dependsOn: ["payment.cardNumber"], visibleWhen: { combinator: "and", rules: [{ field: "payment.method", operator: "equals", value: "card" }] }, validation: [{ type: "required", message: "Required" }] },
      ],
    },
    {
      id: "confirmation",
      title: "Confirmation",
      url: "/checkout/confirmation",
      enableResumeFromHere: false,
      fields: [
        { id: "giftMessage", type: "textarea", label: "Gift message (optional)", placeholder: "Add a personal note to your order..." },
        { id: "terms", type: "checkbox", label: "I accept the terms and conditions", dependsOn: ["shipping.fullName", "payment.method"], validation: [{ type: "required", message: "Required" }] },
      ],
    },
  ],
  externalVariables: [],
  customTypes: [],
};

export const productReturnSchema: WaypointSchema = {
  version: "1",
  id: "product-return",
  name: "Product Return",
  persistenceMode: "backend-step",
  steps: [
    {
      id: "order",
      title: "Order Details",
      url: "/return/order",
      fields: [
        { id: "orderId", type: "text", label: "Order number", validation: [{ type: "required", message: "Required" }, { type: "minLength", value: "6", message: "Invalid order number" }] },
        { id: "itemName", type: "text", label: "Item name", validation: [{ type: "required", message: "Required" }] },
        { id: "quantity", type: "number", label: "Quantity to return", validation: [{ type: "required", message: "Required" }, { type: "min", value: "1", message: "At least 1" }] },
      ],
    },
    {
      id: "reason",
      title: "Return Reason",
      url: "/return/reason",
      fields: [
        { id: "reason", type: "select", label: "Reason for return", options: [{ label: "Defective / damaged", value: "defective" }, { label: "Wrong item received", value: "wrong-item" }, { label: "No longer needed", value: "not-needed" }, { label: "Does not match description", value: "mismatch" }, { label: "Other", value: "other" }], validation: [{ type: "required", message: "Required" }] },
        { id: "defectDescription", type: "textarea", label: "Describe the defect", dependsOn: ["reason.reason"], visibleWhen: { combinator: "and", rules: [{ field: "reason.reason", operator: "equals", value: "defective" }] }, validation: [{ type: "required", message: "Please describe the defect" }] },
        { id: "otherDetails", type: "textarea", label: "Additional details", dependsOn: ["reason.reason"], visibleWhen: { combinator: "and", rules: [{ field: "reason.reason", operator: "equals", value: "other" }] }, validation: [{ type: "required", message: "Required" }] },
      ],
    },
    {
      id: "refund",
      title: "Refund Method",
      url: "/return/refund",
      fields: [
        { id: "method", type: "radio", label: "How would you like your refund?", options: [{ label: "Original payment method", value: "original" }, { label: "Store credit", value: "credit" }, { label: "Exchange for another item", value: "exchange" }], validation: [{ type: "required", message: "Required" }] },
        { id: "exchangeItem", type: "text", label: "Replacement item reference", dependsOn: ["refund.method"], visibleWhen: { combinator: "and", rules: [{ field: "refund.method", operator: "equals", value: "exchange" }] }, validation: [{ type: "required", message: "Required" }] },
        { id: "comments", type: "textarea", label: "Additional comments (optional)" },
      ],
    },
  ],
  externalVariables: [
    { id: "customerId", label: "Customer ID", type: "string", blocking: true, usedIn: [{ stepId: "order" }] },
  ],
  customTypes: [],
};

// ---------------------------------------------------------------------------
// HEALTHCARE
// ---------------------------------------------------------------------------

export const patientIntakeSchema: WaypointSchema = {
  version: "1",
  id: "patient-intake",
  name: "Patient Intake Form",
  persistenceMode: "backend-step",
  steps: [
    {
      id: "personal",
      title: "Personal Info",
      url: "/patient/personal",
      fields: [
        { id: "firstName", type: "text", label: "First name", validation: [{ type: "required", message: "Required" }] },
        { id: "lastName", type: "text", label: "Last name", validation: [{ type: "required", message: "Required" }] },
        { id: "birthDate", type: "date", label: "Date of birth", validation: [{ type: "required", message: "Required" }] },
        { id: "gender", type: "select", label: "Gender", options: [{ label: "Male", value: "m" }, { label: "Female", value: "f" }, { label: "Non-binary", value: "nb" }, { label: "Prefer not to say", value: "none" }], validation: [{ type: "required", message: "Required" }] },
        { id: "phone", type: "tel", label: "Phone", validation: [{ type: "required", message: "Required" }] },
        { id: "email", type: "email", label: "Email", validation: [{ type: "email", message: "Invalid email" }] },
      ],
    },
    {
      id: "medical",
      title: "Medical History",
      url: "/patient/medical",
      fields: [
        { id: "bloodType", type: "select", label: "Blood type", options: [{ label: "A+", value: "a+" }, { label: "A-", value: "a-" }, { label: "B+", value: "b+" }, { label: "B-", value: "b-" }, { label: "AB+", value: "ab+" }, { label: "AB-", value: "ab-" }, { label: "O+", value: "o+" }, { label: "O-", value: "o-" }, { label: "Unknown", value: "unknown" }] },
        { id: "allergies", type: "multiselect", label: "Known allergies", options: [{ label: "Penicillin", value: "penicillin" }, { label: "Aspirin", value: "aspirin" }, { label: "Latex", value: "latex" }, { label: "Pollen", value: "pollen" }, { label: "None", value: "none" }] },
        { id: "conditions", type: "multiselect", label: "Pre-existing conditions", options: [{ label: "Diabetes", value: "diabetes" }, { label: "Hypertension", value: "hypertension" }, { label: "Asthma", value: "asthma" }, { label: "Heart disease", value: "heart" }, { label: "None", value: "none" }] },
        { id: "currentMedications", type: "textarea", label: "Current medications", placeholder: "List all medications..." },
        { id: "surgeries", type: "textarea", label: "Previous surgeries / hospitalizations" },
      ],
    },
    {
      id: "insurance",
      title: "Insurance",
      url: "/patient/insurance",
      fields: [
        { id: "provider", type: "text", label: "Insurance provider", validation: [{ type: "required", message: "Required" }] },
        { id: "memberNumber", type: "text", label: "Member number", validation: [{ type: "required", message: "Required" }] },
        { id: "groupNumber", type: "text", label: "Group number" },
        { id: "emergencyContact", type: "text", label: "Emergency contact name", validation: [{ type: "required", message: "Required" }] },
        { id: "emergencyPhone", type: "tel", label: "Emergency contact phone", validation: [{ type: "required", message: "Required" }] },
      ],
    },
  ],
  externalVariables: [
    { id: "appointmentId", label: "Appointment ID", type: "string", blocking: true, usedIn: [{ stepId: "personal" }] },
  ],
  customTypes: [],
};

// ---------------------------------------------------------------------------
// HR / INTERNAL
// ---------------------------------------------------------------------------

export const employeeOnboardingSchema: WaypointSchema = {
  version: "1",
  id: "employee-onboarding",
  name: "Employee Onboarding",
  persistenceMode: "backend-step",
  steps: [
    {
      id: "personal",
      title: "Personal Info",
      url: "/employee/personal",
      fields: [
        { id: "firstName", type: "text", label: "First name", validation: [{ type: "required", message: "Required" }] },
        { id: "lastName", type: "text", label: "Last name", validation: [{ type: "required", message: "Required" }] },
        { id: "birthDate", type: "date", label: "Date of birth", validation: [{ type: "required", message: "Required" }] },
        { id: "phone", type: "tel", label: "Personal phone", validation: [{ type: "required", message: "Required" }] },
        { id: "address", type: "textarea", label: "Home address", validation: [{ type: "required", message: "Required" }] },
        { id: "iban", type: "text", label: "IBAN (for payroll)", validation: [{ type: "required", message: "Required" }] },
      ],
    },
    {
      id: "job",
      title: "Job Details",
      url: "/employee/job",
      fields: [
        { id: "startDate", type: "date", label: "Start date", validation: [{ type: "required", message: "Required" }] },
        { id: "department", type: "select", label: "Department", options: [{ label: "Engineering", value: "eng" }, { label: "Design", value: "design" }, { label: "Product", value: "product" }, { label: "Sales", value: "sales" }, { label: "HR", value: "hr" }, { label: "Finance", value: "finance" }], validation: [{ type: "required", message: "Required" }] },
        { id: "jobTitle", type: "text", label: "Job title", validation: [{ type: "required", message: "Required" }] },
        { id: "office", type: "select", label: "Primary office", options: [{ label: "Paris", value: "paris" }, { label: "London", value: "london" }, { label: "New York", value: "ny" }, { label: "Remote", value: "remote" }], validation: [{ type: "required", message: "Required" }] },
        { id: "remoteAllowance", type: "number", label: "Remote setup allowance", dependsOn: ["job.office"], visibleWhen: { combinator: "and", rules: [{ field: "job.office", operator: "equals", value: "remote" }] } },
      ],
    },
    {
      id: "equipment",
      title: "Equipment",
      url: "/employee/equipment",
      fields: [
        { id: "items", type: "multiselect", label: "Equipment requested", options: [{ label: "Laptop (Mac)", value: "mac" }, { label: "Laptop (PC)", value: "pc" }, { label: "External monitor", value: "monitor" }, { label: "Mechanical keyboard", value: "keyboard" }, { label: "Webcam", value: "webcam" }, { label: "Headset", value: "headset" }], validation: [{ type: "required", message: "Select at least one item" }] },
        { id: "preferences", type: "textarea", label: "Additional equipment preferences" },
      ],
    },
    {
      id: "emergency",
      title: "Emergency Contact",
      url: "/employee/emergency",
      fields: [
        { id: "name", type: "text", label: "Emergency contact name", validation: [{ type: "required", message: "Required" }] },
        { id: "phone", type: "tel", label: "Emergency contact phone", validation: [{ type: "required", message: "Required" }] },
        { id: "relation", type: "select", label: "Relationship", options: [{ label: "Spouse / Partner", value: "partner" }, { label: "Parent", value: "parent" }, { label: "Sibling", value: "sibling" }, { label: "Friend", value: "friend" }, { label: "Other", value: "other" }], validation: [{ type: "required", message: "Required" }] },
      ],
    },
  ],
  externalVariables: [
    { id: "employeeId", label: "Employee ID", type: "string", blocking: true, usedIn: [{ stepId: "personal" }, { stepId: "job" }] },
  ],
  customTypes: [],
};

export const timeoffRequestSchema: WaypointSchema = {
  version: "1",
  id: "timeoff-request",
  name: "Time-off Request",
  persistenceMode: "backend-step",
  steps: [
    {
      id: "type",
      title: "Leave Type",
      url: "/timeoff/type",
      fields: [
        { id: "leaveType", type: "radio", label: "Type of leave", options: [{ label: "Paid vacation", value: "vacation" }, { label: "Sick leave", value: "sick" }, { label: "Parental leave", value: "parental" }, { label: "Unpaid leave", value: "unpaid" }, { label: "Bereavement", value: "bereavement" }], validation: [{ type: "required", message: "Required" }] },
        { id: "justification", type: "textarea", label: "Justification / details", dependsOn: ["type.leaveType"], visibleWhen: { combinator: "or", rules: [{ field: "type.leaveType", operator: "equals", value: "sick" }, { field: "type.leaveType", operator: "equals", value: "unpaid" }, { field: "type.leaveType", operator: "equals", value: "bereavement" }] }, validation: [{ type: "required", message: "Justification required for this leave type" }] },
      ],
    },
    {
      id: "dates",
      title: "Dates",
      url: "/timeoff/dates",
      fields: [
        { id: "startDate", type: "date", label: "Start date", validation: [{ type: "required", message: "Required" }] },
        { id: "endDate", type: "date", label: "End date", validation: [{ type: "required", message: "Required" }] },
        { id: "isHalfDay", type: "checkbox", label: "Half-day only" },
        { id: "halfDayPeriod", type: "radio", label: "Which half?", options: [{ label: "Morning", value: "morning" }, { label: "Afternoon", value: "afternoon" }], dependsOn: ["dates.isHalfDay"], visibleWhen: { combinator: "and", rules: [{ field: "dates.isHalfDay", operator: "equals", value: true }] }, validation: [{ type: "required", message: "Required" }] },
      ],
    },
    {
      id: "approval",
      title: "Approval",
      url: "/timeoff/approval",
      fields: [
        { id: "managerEmail", type: "email", label: "Manager email", validation: [{ type: "required", message: "Required" }, { type: "email", message: "Invalid email" }] },
        { id: "backupContact", type: "text", label: "Backup contact (optional)" },
        { id: "notes", type: "textarea", label: "Notes for manager" },
      ],
    },
  ],
  externalVariables: [
    { id: "employeeId", label: "Employee ID", type: "string", blocking: true, usedIn: [{ stepId: "type" }] },
    { id: "availableDays", label: "Available leave days", type: "number", blocking: false, usedIn: [{ stepId: "dates" }] },
  ],
  customTypes: [],
};

// ---------------------------------------------------------------------------
// LEGAL
// ---------------------------------------------------------------------------

export const contractSigningSchema: WaypointSchema = {
  version: "1",
  id: "contract-signing",
  name: "Contract Signing",
  persistenceMode: "backend-step",
  steps: [
    {
      id: "review",
      title: "Review Terms",
      url: "/contract/review",
      fields: [
        { id: "hasRead", type: "checkbox", label: "I have read and understood the contract", validation: [{ type: "required", message: "Required" }] },
        { id: "amendments", type: "radio", label: "Amendments", options: [{ label: "I accept the terms as-is", value: "accepted" }, { label: "I request changes (will delay signing)", value: "changes" }], validation: [{ type: "required", message: "Required" }] },
        { id: "amendmentDetails", type: "textarea", label: "Describe requested changes", dependsOn: ["review.amendments"], visibleWhen: { combinator: "and", rules: [{ field: "review.amendments", operator: "equals", value: "changes" }] }, validation: [{ type: "required", message: "Required" }] },
      ],
    },
    {
      id: "identity",
      title: "Identity Verification",
      url: "/contract/identity",
      visibleWhen: { combinator: "and", rules: [{ field: "review.amendments", operator: "equals", value: "accepted" }] },
      fields: [
        { id: "fullName", type: "text", label: "Full legal name", validation: [{ type: "required", message: "Required" }] },
        { id: "birthDate", type: "date", label: "Date of birth", validation: [{ type: "required", message: "Required" }] },
        { id: "idType", type: "radio", label: "ID document type", options: [{ label: "Passport", value: "passport" }, { label: "National ID card", value: "id-card" }, { label: "Driving license", value: "driving-license" }], validation: [{ type: "required", message: "Required" }] },
        { id: "idNumber", type: "text", label: "ID number", validation: [{ type: "required", message: "Required" }] },
      ],
    },
    {
      id: "signature",
      title: "Sign",
      url: "/contract/signature",
      visibleWhen: { combinator: "and", rules: [{ field: "review.amendments", operator: "equals", value: "accepted" }] },
      fields: [
        { id: "signature", type: "text", label: "Type your full name as signature", validation: [{ type: "required", message: "Required" }] },
        { id: "signatureDate", type: "date", label: "Date of signature", validation: [{ type: "required", message: "Required" }] },
        { id: "ipConsent", type: "checkbox", label: "I consent to electronic signing", validation: [{ type: "required", message: "Required" }] },
      ],
    },
  ],
  externalVariables: [
    { id: "contractId", label: "Contract ID", type: "string", blocking: true, usedIn: [{ stepId: "review" }] },
    { id: "signerEmail", label: "Signer email", type: "string", blocking: true, usedIn: [{ stepId: "review" }, { stepId: "identity" }] },
  ],
  customTypes: [],
};

// ============================================================================
// Categories & Registry
// ============================================================================

export interface ExampleEntry {
  id: string;
  label: string;
  description: string;
  color: string;
  schema: WaypointSchema;
}

export interface ExampleCategory {
  id: string;
  label: string;
  icon: string;
  color: string;
  examples: ExampleEntry[];
}

export const EXAMPLE_CATEGORIES: ExampleCategory[] = [
  {
    id: "onboarding",
    label: "Onboarding",
    icon: ">>",
    color: "#6366f1",
    examples: [
      { id: "user-onboarding", label: "User Onboarding", description: "Conditional company step, field dependencies", color: "#6366f1", schema: userOnboardingSchema },
      { id: "saas-onboarding", label: "SaaS Product Onboarding", description: "OR conditions, multiselect integrations, team invite", color: "#818cf8", schema: saasOnboardingSchema },
    ],
  },
  {
    id: "finance",
    label: "Finance",
    icon: "$",
    color: "#f59e0b",
    examples: [
      { id: "insurance", label: "Insurance Quote", description: "Age-based conditional step, smoker sub-field, external var", color: "#f59e0b", schema: insuranceSchema },
      { id: "loan", label: "Loan Application", description: "Complex deps, mortgage step via external var, 5 steps", color: "#eab308", schema: loanSchema },
      { id: "investment", label: "Investment Risk Profile", description: "Radio fields, conditional leverage, risk assessment", color: "#d97706", schema: investmentSchema },
    ],
  },
  {
    id: "ecommerce",
    label: "E-commerce",
    icon: "#",
    color: "#ec4899",
    examples: [
      { id: "checkout", label: "E-commerce Checkout", description: "Linear flow, conditional card fields, same-as-shipping", color: "#ec4899", schema: checkoutSchema },
      { id: "product-return", label: "Product Return", description: "Conditional defect details, exchange field, external var", color: "#f472b6", schema: productReturnSchema },
    ],
  },
  {
    id: "healthcare",
    label: "Healthcare",
    icon: "+",
    color: "#06b6d4",
    examples: [
      { id: "patient-intake", label: "Patient Intake Form", description: "Multiselect allergies/conditions, blood type, emergency contact", color: "#06b6d4", schema: patientIntakeSchema },
    ],
  },
  {
    id: "hr",
    label: "HR / Internal",
    icon: "=",
    color: "#10b981",
    examples: [
      { id: "employee-onboarding", label: "Employee Onboarding", description: "Conditional remote allowance, multiselect equipment, 4 steps", color: "#10b981", schema: employeeOnboardingSchema },
      { id: "timeoff-request", label: "Time-off Request", description: "OR conditions, half-day fields, multiple external vars", color: "#34d399", schema: timeoffRequestSchema },
    ],
  },
  {
    id: "legal",
    label: "Legal",
    icon: "!",
    color: "#8b5cf6",
    examples: [
      { id: "contract-signing", label: "Contract Signing", description: "Conditional identity/sign steps, amendments, external vars", color: "#8b5cf6", schema: contractSigningSchema },
    ],
  },
];

export const EXAMPLES = EXAMPLE_CATEGORIES.flatMap((c) => c.examples);
