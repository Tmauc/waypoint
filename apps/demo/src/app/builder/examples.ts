import type { WaypointSchema } from "@waypointjs/core";

// ---------------------------------------------------------------------------
// 1. User Onboarding — linear flow with field dependencies
// ---------------------------------------------------------------------------
export const onboardingSchema: WaypointSchema = {
  version: "1",
  id: "onboarding",
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
        { id: "employees", type: "select", label: "Number of employees", options: [{ label: "1–10", value: "1-10" }, { label: "11–50", value: "11-50" }, { label: "51–200", value: "51-200" }, { label: "200+", value: "200+" }] },
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

// ---------------------------------------------------------------------------
// 2. Insurance Quote — conditional steps based on age + external var
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
        { id: "medications", type: "textarea", label: "Current medications", placeholder: "List any medications you are taking…" },
        {
          id: "smokerDetails",
          type: "text",
          label: "How many cigarettes per day?",
          dependsOn: ["insured.smoker"],
          visibleWhen: { combinator: "and", rules: [{ field: "insured.smoker", operator: "equals", value: "yes" }] },
          validation: [{ type: "required", message: "Required if smoker" }],
        },
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
        {
          id: "familyCoverage",
          type: "checkbox",
          label: "Add family coverage",
          visibleWhen: { combinator: "and", rules: [{ field: "coverage.plan", operator: "in", value: ["standard", "premium"] }] },
        },
      ],
    },
  ],
  externalVariables: [
    { id: "customerId", label: "Customer ID", type: "string", blocking: true, usedIn: [{ stepId: "insured" }] },
  ],
  customTypes: [],
};

// ---------------------------------------------------------------------------
// 3. Loan Application — heavy field deps + external vars
// ---------------------------------------------------------------------------
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
        { id: "monthlyIncome", type: "number", label: "Monthly net income (€)", validation: [{ type: "required", message: "Required" }, { type: "min", value: "0", message: "Must be positive" }] },
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
        { id: "propertyValue", type: "number", label: "Estimated value (€)", dependsOn: ["income.monthlyIncome"], validation: [{ type: "required", message: "Required" }, { type: "min", value: "50000", message: "Minimum €50,000" }] },
        { id: "address", type: "textarea", label: "Property address", validation: [{ type: "required", message: "Required" }] },
      ],
    },
    {
      id: "loanDetails",
      title: "Loan details",
      url: "/loan/details",
      fields: [
        { id: "amount", type: "number", label: "Requested amount (€)", dependsOn: ["income.monthlyIncome"], validation: [{ type: "required", message: "Required" }] },
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

// ---------------------------------------------------------------------------
// 4. E-commerce Checkout — simple, linear, no conditions
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
        { id: "giftMessage", type: "textarea", label: "Gift message (optional)", placeholder: "Add a personal note to your order…" },
        { id: "terms", type: "checkbox", label: "I accept the terms and conditions", dependsOn: ["shipping.fullName", "payment.method"], validation: [{ type: "required", message: "Required" }] },
      ],
    },
  ],
  externalVariables: [],
  customTypes: [],
};

// ---------------------------------------------------------------------------
// Registry
// ---------------------------------------------------------------------------

export const EXAMPLES = [
  {
    id: "onboarding",
    label: "User Onboarding",
    description: "Conditional company step, field dependencies",
    color: "#6366f1",
    schema: onboardingSchema,
  },
  {
    id: "insurance",
    label: "Insurance Quote",
    description: "Age-based conditional step, smoker sub-field, external var",
    color: "#f59e0b",
    schema: insuranceSchema,
  },
  {
    id: "loan",
    label: "Loan Application",
    description: "Complex deps, mortgage step via external var, 5 steps",
    color: "#10b981",
    schema: loanSchema,
  },
  {
    id: "checkout",
    label: "E-commerce Checkout",
    description: "Linear flow, conditional card fields, same-as-shipping",
    color: "#ec4899",
    schema: checkoutSchema,
  },
] as const;
