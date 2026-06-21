import { Mark, mergeAttributes } from "@tiptap/core";

interface AnnotationMarkOptions {
  color: string;
  bgClass: string;
  underlineClass: string;
}

function createAnnotationMark(name: string, options: AnnotationMarkOptions) {
  return Mark.create<AnnotationMarkOptions>({
    name,

    addOptions() {
      return options;
    },

    addAttributes() {
      return {
        "data-explanation": {
          default: null,
          parseHTML: (element) => element.getAttribute("data-explanation"),
          renderHTML: (attributes) => {
            if (!attributes["data-explanation"]) return {};
            return { "data-explanation": attributes["data-explanation"] };
          },
        },
        "data-proposal": {
          default: null,
          parseHTML: (element) => element.getAttribute("data-proposal"),
          renderHTML: (attributes) => {
            if (!attributes["data-proposal"]) return {};
            return { "data-proposal": attributes["data-proposal"] };
          },
        },
        "data-alternative-proposal": {
          default: null,
          parseHTML: (element) =>
            element.getAttribute("data-alternative-proposal"),
          renderHTML: (attributes) => {
            if (!attributes["data-alternative-proposal"]) return {};
            return {
              "data-alternative-proposal":
                attributes["data-alternative-proposal"],
            };
          },
        },
      };
    },

    parseHTML() {
      return [
        {
          tag: `span[data-annotation="${name}"]`,
        },
      ];
    },

    renderHTML({ HTMLAttributes }) {
      return [
        "span",
        mergeAttributes(
          {
            "data-annotation": name,
            class: `${options.bgClass} ${options.underlineClass} rounded-sm px-0.5`,
          },
          HTMLAttributes,
        ),
        0,
      ];
    },
  });
}

export const annotationYellow = createAnnotationMark("annotationYellow", {
  color: "yellow",
  bgClass: "bg-yellow-500/25 dark:bg-yellow-400/30",
  underlineClass: "border-b-2 border-yellow-500 dark:border-yellow-400",
});

export const annotationRed = createAnnotationMark("annotationRed", {
  color: "red",
  bgClass: "bg-red-500/25 dark:bg-red-400/30",
  underlineClass: "border-b-2 border-red-500 dark:border-red-400",
});

export const annotationBlue = createAnnotationMark("annotationBlue", {
  color: "blue",
  bgClass: "bg-blue-500/25 dark:bg-blue-400/30",
  underlineClass: "border-b-2 border-blue-500 dark:border-blue-400",
});

export const annotationOrange = createAnnotationMark("annotationOrange", {
  color: "orange",
  bgClass: "bg-orange-500/25 dark:bg-orange-400/30",
  underlineClass: "border-b-2 border-orange-500 dark:border-orange-400",
});

export const annotationPurple = createAnnotationMark("annotationPurple", {
  color: "purple",
  bgClass: "bg-purple-500/25 dark:bg-purple-400/30",
  underlineClass: "border-b-2 border-purple-500 dark:border-purple-400",
});

export const annotationApplied = createAnnotationMark("annotationApplied", {
  color: "green",
  bgClass: "bg-green-500/20 dark:bg-green-400/25",
  underlineClass: "border-b-2 border-green-600 dark:border-green-400",
});
