// Every file in src/research/ is a research page at /research/<slug>/.
export default {
  layout: "project.njk",
  permalink: "/research/{{ page.fileSlug }}/",
};
