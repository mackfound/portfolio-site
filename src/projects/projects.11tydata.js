// Every file in src/projects/ is a project or research page at /projects/<slug>/.
export default {
  layout: "project.njk",
  permalink: "/projects/{{ page.fileSlug }}/",
  eleventyComputed: {
    metaSlot: (data) => `project-${data.page.fileSlug}`,
  },
};
