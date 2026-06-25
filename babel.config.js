module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ["babel-preset-expo", { jsxImportSource: "nativewind" }],
      "nativewind/babel", // 👈 It belongs here in presets, NOT in plugins!
    ],
    plugins: [
      "react-native-reanimated/plugin",
      [
        "module-resolver",
        {
          root: ["./src"],
          alias: {
            "@api": "./src/api",
            "@components": "./src/components",
            "@constants": "./src/constants",
            "@context": "./src/context"
          }
        }
      ]
    ]
  };
};