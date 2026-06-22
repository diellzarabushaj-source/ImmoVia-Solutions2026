import { defineField, defineType } from "sanity";

const localizedStringFields = [
  defineField({ name: "sq", title: "Albanian (Shqip)", type: "string" }),
  defineField({ name: "en", title: "English", type: "string" }),
  defineField({ name: "de", title: "German (Deutsch)", type: "string" }),
  defineField({ name: "fr", title: "French (Français)", type: "string" }),
];

const localizedTextFields = [
  defineField({ name: "sq", title: "Albanian (Shqip)", type: "text", rows: 4 }),
  defineField({ name: "en", title: "English", type: "text", rows: 4 }),
  defineField({ name: "de", title: "German (Deutsch)", type: "text", rows: 4 }),
  defineField({ name: "fr", title: "French (Français)", type: "text", rows: 4 }),
];

export const legalPage = defineType({
  name: "legalPage",
  title: "Legal Page",
  type: "document",
  fields: [
    defineField({
      name: "pageId",
      title: "Page ID",
      description: 'Use "terms" for Terms of Service, "privacy" for Privacy Policy',
      type: "string",
      options: {
        list: [
          { title: "Terms of Service", value: "terms" },
          { title: "Privacy Policy", value: "privacy" },
        ],
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "title",
      title: "Page Title (all languages)",
      type: "object",
      fields: localizedStringFields,
    }),
    defineField({
      name: "updatedAt",
      title: "Last Updated Text (all languages)",
      type: "object",
      fields: localizedStringFields,
    }),
    defineField({
      name: "intro",
      title: "Intro Paragraph (all languages)",
      type: "object",
      fields: localizedTextFields,
    }),
    defineField({
      name: "sections",
      title: "Sections",
      type: "array",
      of: [
        {
          type: "object",
          title: "Section",
          fields: [
            defineField({
              name: "title",
              title: "Section Title (all languages)",
              type: "object",
              fields: localizedStringFields,
            }),
            defineField({
              name: "body",
              title: "Section Body (all languages)",
              type: "object",
              fields: localizedTextFields,
            }),
          ],
          preview: {
            select: { title: "title.en" },
          },
        },
      ],
    }),
  ],
  preview: {
    select: { title: "title.en", subtitle: "pageId" },
  },
});
