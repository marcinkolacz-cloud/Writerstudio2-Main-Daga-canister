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
  bgClass: "bg-yellow-400/20",
  underlineClass: "border-b-2 border-yellow-400",
});

export const annotationRed = createAnnotationMark("annotationRed", {
  color: "red",
  bgClass: "bg-red-400/20",
  underlineClass: "border-b-2 border-red-400",
});

export const annotationBlue = createAnnotationMark("annotationBlue", {
  color: "blue",
  bgClass: "bg-blue-400/20",
  underlineClass: "border-b-2 border-blue-400",
});

export const annotationOrange = createAnnotationMark("annotationOrange", {
  color: "orange",
  bgClass: "bg-orange-400/20",
  underlineClass: "border-b-2 border-orange-400",
});

export const annotationPurple = createAnnotationMark("annotationPurple", {
  color: "purple",
  bgClass: "bg-purple-400/20",
  underlineClass: "border-b-2 border-purple-400",
});
