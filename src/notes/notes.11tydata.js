// Every file in src/notes/ is a post at /notes/<slug>/.
export default {
  layout: "note.njk",
  permalink: "/notes/{{ page.fileSlug }}/",
  eleventyComputed: {
    metaSlot: (data) => `note-${data.page.fileSlug}`,
  },
};
