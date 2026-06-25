module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ["babel-preset-expo", { jsxImportSource: "nativewind" }]
    ],
    plugins: [
      "nativewind/babel",
      "react-native-reanimated/plugin",
      [
        "module-resolver",
        {
          root: ["./src"],
          alias: {
            "@api":        "./src/api",
            "@components": "./src/components",
            "@constants":  "./src/constants",
            "@context":    "./src/context",
          },
        },
      ],
    ],
  };
};