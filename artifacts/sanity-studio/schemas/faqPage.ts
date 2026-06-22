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

export const faqPage = defineType({
  name: "faqPage",
  title: "FAQ Page",
  type: "document",
  fields: [
    defineField({
      name: "title",
      title: "Page Title (all languages)",
      type: "object",
      fields: localizedStringFields,
    }),
    defineField({
      name: "items",
      title: "FAQ Items",
      type: "array",
      of: [
        {
          type: "object",
          title: "FAQ Item",
          fields: [
            defineField({
              name: "question",
              title: "Question (all languages)",
              type: "object",
              fields: localizedStringFields,
            }),
            defineField({
              name: "answer",
              title: "Answer (all languages)",
              type: "object",
              fields: localizedTextFields,
            }),
          ],
          preview: {
            select: { title: "question.en" },
          },
        },
      ],
    }),
  ],
  preview: {
    select: { title: "title.en" },
    prepare() {
      return { title: "FAQ Page" };
    },
  },
});
