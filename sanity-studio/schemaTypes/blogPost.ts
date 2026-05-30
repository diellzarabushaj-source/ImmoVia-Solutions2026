import { defineType, defineField } from "sanity";

export const blogPost = defineType({
  name: "blogPost",
  title: "Blog Post",
  type: "document",
  fields: [
    defineField({
      name: "title",
      title: "Title",
      type: "string",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "slug",
      title: "Slug",
      type: "slug",
      options: { source: "title", maxLength: 96 },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "status",
      title: "Status",
      type: "string",
      options: {
        list: [
          { title: "Draft", value: "draft" },
          { title: "Published", value: "published" },
        ],
        layout: "radio",
      },
      initialValue: "draft",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "publishedAt",
      title: "Published At",
      type: "datetime",
    }),
    defineField({
      name: "category",
      title: "Category",
      type: "string",
      options: {
        list: [
          { title: "Renovation & Remodeling",              value: "renovation" },
          { title: "Painting & Plastering",                value: "painting" },
          { title: "Electrical & Smart Home",              value: "electrical" },
          { title: "Plumbing & Bathroom",                  value: "plumbing" },
          { title: "Kitchen & Carpentry",                  value: "kitchen" },
          { title: "Flooring & Tiles",                     value: "flooring" },
          { title: "Interior Design & Home Staging",       value: "interior_design" },
          { title: "Cleaning, Garden & Property Services", value: "cleaning" },
          { title: "Tips & Advice",                        value: "tips" },
          { title: "Company News",                         value: "news" },
        ],
      },
    }),
    defineField({
      name: "tags",
      title: "Sub-service Tags",
      type: "array",
      description: "Tag the specific services this article covers.",
      of: [{ type: "string" }],
      options: {
        list: [
          { title: "Apartment renovation",    value: "apartment_renovation" },
          { title: "House renovation",        value: "house_renovation" },
          { title: "Interior finishing",      value: "interior_finishing" },
          { title: "Interior painting",       value: "interior_painting" },
          { title: "Exterior painting",       value: "exterior_painting" },
          { title: "Wall design",             value: "wall_design" },
          { title: "Electrical installation", value: "electrical_installation" },
          { title: "Lighting",                value: "lighting" },
          { title: "Sockets & switches",      value: "sockets_switches" },
          { title: "Bathroom renovation",     value: "bathroom_renovation" },
          { title: "Plumbing installation",   value: "plumbing_installation" },
          { title: "Shower & bathtub",        value: "shower_bathtub" },
          { title: "Kitchen renovation",      value: "kitchen_renovation" },
          { title: "Kitchen installation",    value: "kitchen_installation" },
          { title: "Custom furniture",        value: "custom_furniture" },
          { title: "Parquet",                 value: "parquet" },
          { title: "Laminate",                value: "laminate" },
          { title: "Vinyl flooring",          value: "vinyl_flooring" },
          { title: "Room concept",            value: "room_concept" },
          { title: "Furnishing",              value: "furnishing" },
          { title: "Color concept",           value: "color_concept" },
          { title: "Move-out cleaning",       value: "move_out_cleaning" },
          { title: "Construction cleaning",   value: "construction_cleaning" },
          { title: "Garden maintenance",      value: "garden_maintenance" },
        ],
        layout: "tags",
      },
    }),
    defineField({
      name: "mainImage",
      title: "Main Image",
      type: "image",
      options: { hotspot: true },
      fields: [
        defineField({ name: "alt", title: "Alt Text", type: "string" }),
      ],
    }),
    defineField({
      name: "excerpt",
      title: "Excerpt",
      type: "text",
      rows: 3,
      description: "A short summary shown in listing pages.",
    }),
    defineField({
      name: "body",
      title: "Body",
      type: "array",
      of: [
        { type: "block" },
        {
          type: "image",
          options: { hotspot: true },
          fields: [
            defineField({ name: "alt", title: "Alt Text", type: "string" }),
            defineField({
              name: "caption",
              title: "Caption",
              type: "string",
            }),
          ],
        },
      ],
    }),
  ],
  preview: {
    select: {
      title: "title",
      subtitle: "status",
      media: "mainImage",
    },
    prepare({ title, subtitle, media }) {
      return {
        title,
        subtitle: subtitle === "published" ? "Published" : "Draft",
        media,
      };
    },
  },
});
