import { Mark, mergeAttributes } from "@tiptap/core";

export const commentMark = Mark.create({
  name: "comment",

  addAttributes() {
    return {
      "data-comment-id": {
        default: null,
        parseHTML: (element) => element.getAttribute("data-comment-id"),
        renderHTML: (attributes) => {
          if (!attributes["data-comment-id"]) return {};
          return { "data-comment-id": attributes["data-comment-id"] };
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: "span[data-comment-id]",
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "span",
      mergeAttributes(
        {
          class:
            "bg-sky-200/40 dark:bg-sky-400/25 border-b-2 border-sky-500 dark:border-sky-400 rounded-sm px-0.5 cursor-pointer",
        },
        HTMLAttributes,
      ),
      0,
    ];
  },
});
