import { defineConfig } from "vitepress";

export default defineConfig({
  title: "Markdown PDF for Zed",
  description:
    "Export Markdown to PDF with structured headers, footers, and custom styling",

  base: "/zed-markdown-pdf/",

  head: [
    [
      "link",
      { rel: "icon", type: "image/png", href: "/zed-markdown-pdf/logo.png" },
    ],
    ["meta", { name: "theme-color", content: "#3eaf7c" }],
    ["meta", { name: "og:type", content: "website" }],
    ["meta", { name: "og:site_name", content: "Markdown PDF for Zed" }],
  ],

  themeConfig: {
    logo: "/logo.png",

    nav: [
      { text: "Guide", link: "/guide/getting-started" },
      { text: "Reference", link: "/reference/settings" },
      { text: "Examples", link: "/examples/basic" },
      {
        text: "Links",
        items: [
          {
            text: "GitHub",
            link: "https://github.com/matinfo/zed-markdown-pdf",
          },
          { text: "Zed Editor", link: "https://zed.dev" },
        ],
      },
    ],

    sidebar: {
      "/guide/": [
        {
          text: "Introduction",
          items: [
            { text: "Getting Started", link: "/guide/getting-started" },
            { text: "Installation", link: "/guide/installation" },
            { text: "First Export", link: "/guide/first-export" },
          ],
        },
        {
          text: "Header & Footer",
          items: [
            { text: "Overview", link: "/guide/header-footer" },
            { text: "Zones & Layout", link: "/guide/zones" },
            { text: "Elements", link: "/guide/elements" },
            { text: "Placeholders", link: "/guide/placeholders" },
            { text: "Date Formatting", link: "/guide/date-formatting" },
            { text: "Images & Assets", link: "/guide/images" },
          ],
        },
        {
          text: "Configuration",
          items: [
            { text: "Global Settings", link: "/guide/global-settings" },
            { text: "Front Matter", link: "/guide/front-matter" },
            { text: "Custom Styling", link: "/guide/custom-styling" },
          ],
        },
      ],
      "/reference/": [
        {
          text: "Reference",
          items: [
            { text: "Settings", link: "/reference/settings" },
            {
              text: "Header/Footer Schema",
              link: "/reference/header-footer-schema",
            },
            { text: "Element Types", link: "/reference/element-types" },
            { text: "Placeholders", link: "/reference/placeholders" },
            { text: "Date Formats", link: "/reference/date-formats" },
          ],
        },
      ],
      "/examples/": [
        {
          text: "Examples",
          items: [
            { text: "Basic Header/Footer", link: "/examples/basic" },
            { text: "Two-Logo Header", link: "/examples/two-logo" },
            { text: "Corporate Letterhead", link: "/examples/corporate" },
            { text: "Academic Paper", link: "/examples/academic" },
            { text: "Custom Variables", link: "/examples/custom-variables" },
          ],
        },
      ],
    },

    socialLinks: [
      { icon: "github", link: "https://github.com/matinfo/zed-markdown-pdf" },
    ],

    footer: {
      message: "Released under the MIT License.",
      copyright: "Copyright © 2024-present",
    },

    search: {
      provider: "local",
    },

    editLink: {
      pattern:
        "https://github.com/matinfo/zed-markdown-pdf/edit/main/docs/:path",
      text: "Edit this page on GitHub",
    },
  },
});
