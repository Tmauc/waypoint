import type { WaypointSchema } from "@waypointjs/core";

export const projectSchema: WaypointSchema = {
  version: "1",
  id: "project-creation",
  name: "Création de projet",
  persistenceMode: "zustand",
  steps: [
    {
      id: "informations",
      title: "Informations générales",
      url: "/journeys/project/informations",
      fields: [
        {
          id: "name",
          type: "text",
          label: "Nom du projet",
          placeholder: "Ex: Refonte plateforme e-commerce",
          validation: [{ type: "required", message: "Le nom est obligatoire" }],
        },
        {
          id: "type",
          type: "select",
          label: "Type de projet",
          options: [
            { label: "Personnel", value: "personal" },
            { label: "Professionnel", value: "pro" },
          ],
          validation: [{ type: "required", message: "Sélectionnez un type" }],
        },
        {
          id: "description",
          type: "textarea",
          label: "Description (optionnelle)",
          placeholder: "Décrivez votre projet en quelques lignes…",
        },
      ],
    },
    {
      id: "equipe",
      title: "Équipe",
      url: "/journeys/project/equipe",
      visibleWhen: {
        combinator: "and",
        rules: [
          { field: "informations.type", operator: "equals", value: "pro" },
        ],
      },
      fields: [
        {
          id: "teamSize",
          type: "select",
          label: "Taille de l'équipe",
          options: [
            { label: "1 — Solo", value: "solo" },
            { label: "2–5 personnes", value: "small" },
            { label: "6–20 personnes", value: "medium" },
            { label: "20+ personnes", value: "large" },
          ],
          validation: [{ type: "required", message: "Obligatoire" }],
        },
        {
          id: "yourRole",
          type: "text",
          label: "Votre rôle dans l'équipe",
          placeholder: "Ex: Product Manager, Lead dev…",
          validation: [{ type: "required", message: "Obligatoire" }],
        },
      ],
    },
    {
      id: "budget",
      title: "Budget",
      url: "/journeys/project/budget",
      fields: [
        {
          id: "budgetRange",
          type: "select",
          label: "Fourchette budgétaire",
          options: [
            { label: "Moins de 10 000 €", value: "<10k" },
            { label: "10 000 – 50 000 €", value: "10k-50k" },
            { label: "50 000 – 200 000 €", value: "50k-200k" },
            { label: "Plus de 200 000 €", value: ">200k" },
          ],
          validation: [{ type: "required", message: "Obligatoire" }],
        },
        {
          id: "currency",
          type: "select",
          label: "Devise",
          options: [
            { label: "Euro (€)", value: "EUR" },
            { label: "Dollar ($)", value: "USD" },
            { label: "Livre (£)", value: "GBP" },
          ],
          validation: [{ type: "required", message: "Obligatoire" }],
        },
      ],
    },
    {
      id: "lancement",
      title: "Lancement",
      url: "/journeys/project/lancement",
      fields: [
        {
          id: "launchDate",
          type: "date",
          label: "Date de lancement souhaitée",
          validation: [{ type: "required", message: "Obligatoire" }],
        },
        {
          id: "priority",
          type: "select",
          label: "Priorité",
          options: [
            { label: "🟢 Faible", value: "low" },
            { label: "🟡 Normale", value: "medium" },
            { label: "🔴 Haute", value: "high" },
          ],
          validation: [{ type: "required", message: "Obligatoire" }],
        },
      ],
    },
  ],
  externalVariables: [],
};
