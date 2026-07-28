import { defineConfig, globalIgnores } from "eslint/config";

const eslintConfig = defineConfig([
	globalIgnores([
		".output/**",
		"dist/**",
		"build/**",
		"node_modules/**",
	]),
]);

export default eslintConfig;
