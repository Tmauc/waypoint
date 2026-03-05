import type { WaypointSchema } from "@waypoint/core";

export const depositSchema: WaypointSchema = {
  version: "1",
  id: "deposit",
  name: "Versement",
  persistenceMode: "zustand",
  steps: [
    {
      id: "compte",
      title: "Compte bancaire",
      url: "/journeys/deposit/compte",
      fields: [
        {
          id: "accountName",
          type: "text",
          label: "Titulaire du compte",
          placeholder: "Ex: Jean Dupont",
          validation: [{ type: "required", message: "Obligatoire" }],
        },
        {
          id: "iban",
          type: "text",
          label: "IBAN",
          placeholder: "FR76 3000 6000 0112 3456 7890 189",
          validation: [
            { type: "required", message: "Obligatoire" },
            { type: "minLength", value: "15", message: "IBAN invalide (min 15 caractères)" },
          ],
        },
      ],
    },
    {
      id: "versement",
      title: "Détails du versement",
      url: "/journeys/deposit/versement",
      fields: [
        {
          id: "amount",
          type: "number",
          label: "Montant (€)",
          placeholder: "500",
          validation: [
            { type: "required", message: "Obligatoire" },
            { type: "min", value: "1", message: "Montant minimum : 1 €" },
          ],
        },
        {
          id: "schedule",
          type: "select",
          label: "Fréquence",
          options: [
            { label: "Unique", value: "once" },
            { label: "Mensuel", value: "monthly" },
            { label: "Trimestriel", value: "quarterly" },
          ],
          validation: [{ type: "required", message: "Obligatoire" }],
        },
        {
          id: "reference",
          type: "text",
          label: "Référence (optionnelle)",
          placeholder: "Ex: Facture #2024-001",
        },
      ],
    },
    {
      id: "confirmation",
      title: "Confirmation",
      url: "/journeys/deposit/confirmation",
      fields: [
        {
          id: "executionDate",
          type: "date",
          label: "Date d'exécution",
          validation: [{ type: "required", message: "Obligatoire" }],
        },
        {
          id: "notes",
          type: "textarea",
          label: "Notes internes (optionnelles)",
          placeholder: "Commentaire…",
        },
      ],
    },
  ],
  externalVariables: [],
};
