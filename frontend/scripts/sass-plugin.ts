import type { BunPlugin } from "bun";
import { compile } from "sass";

export const sassPlugin: BunPlugin = {
  name: "sass",
  setup(build) {
    build.onLoad({ filter: /\.(scss|sass)$/ }, async ({ path }) => {
      const result = await compile(path);
      return { contents: result.css, loader: "css" };
    });
  },
};
