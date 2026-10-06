module.exports = {
  extends: 'erb',
  plugins: ['@typescript-eslint'],
  rules: {
    // A temporary hack related to IDE not resolving correct package.json
    'import/no-extraneous-dependencies': 'off',
    'react/react-in-jsx-scope': 'off',
    'react/jsx-filename-extension': 'off',
    'import/extensions': 'off',
    'import/no-unresolved': 'off',
    'import/no-import-module-exports': 'off',
    'no-shadow': 'off',
    '@typescript-eslint/no-shadow': 'error',
    'no-unused-vars': 'off',
    '@typescript-eslint/no-unused-vars': 'error',
    // TypeScript already validates undeclared globals / named imports
    'no-undef': 'off',
    'import/named': 'off',
    // Style rules that conflict with TS / Electron / MongoDB idioms
    'import/prefer-default-export': 'off',
    'no-console': 'off',
    'no-underscore-dangle': [
      'error',
      { allow: ['_id', '_idMap'], allowAfterThis: true },
    ],
    camelcase: 'off',
    'no-restricted-syntax': 'off',
    'no-param-reassign': 'off',
    'no-return-await': 'off',
    'no-continue': 'off',
    'react/require-default-props': 'off',
    'react/destructuring-assignment': 'off',
    'react-hooks/exhaustive-deps': 'off',
    'jsx-a11y/no-static-element-interactions': 'off',
    'jsx-a11y/click-events-have-key-events': 'off',
    'jsx-a11y/no-noninteractive-element-interactions': 'off',
    'global-require': 'off',
    '@typescript-eslint/no-var-requires': 'off',
    // Tier 3 — dev-tool / desktop-app rules
    'react/no-array-index-key': 'off',
    'import/no-cycle': 'warn',
    'jsx-a11y/no-noninteractive-tabindex': 'off',
    'jsx-a11y/no-autofocus': 'warn',
  },
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
  },
  settings: {
    'import/resolver': {
      // See https://github.com/benmosher/eslint-plugin-import/issues/1396#issuecomment-575727774 for line below
      node: {
        extensions: ['.js', '.jsx', '.ts', '.tsx'],
        moduleDirectory: ['node_modules', 'src/'],
      },
      webpack: {
        config: require.resolve('./.erb/configs/webpack.config.eslint.ts'),
      },
      typescript: {},
    },
    'import/parsers': {
      '@typescript-eslint/parser': ['.ts', '.tsx'],
    },
  },
};
