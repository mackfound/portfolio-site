// Every file in src/projects/ is a project page at /projects/<slug>/.
export default {
  layout: "project.njk",
  permalink: "/projects/{{ page.fileSlug }}/",
};
