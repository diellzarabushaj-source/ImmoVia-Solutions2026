import { defineCliConfig } from "sanity/cli";

export default defineCliConfig({
  api: {
    projectId: "c0tinigu",
    dataset: "production",
  },
  studioHost: "immovia-blog",
});
