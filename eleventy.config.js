// Eleventy config for M. Doyle, Vol. V. See projectplan.md.

export default function (eleventyConfig) {
  eleventyConfig.addPassthroughCopy("src/assets");

  // Collections are registered here in P1: one glob-based line per section
  // folder, e.g. eleventyConfig.addCollection("projects", (api) => api.getFilteredByGlob("src/projects/*.md"));
}

export const config = {
  dir: {
    input: "src",
    output: "_site",
    includes: "_includes",
    data: "_data",
  },
  templateFormats: ["njk", "md"],
  markdownTemplateEngine: "njk",
  htmlTemplateEngine: "njk",
};
