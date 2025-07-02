module.exports = {
  root: true,
  env: {
    browser: true,
    node: true,
  },
  parser: 'vue-eslint-parser',
  extends: ['@nuxt/eslint-config', 'plugin:prettier/recommended'],
  plugins: [],
  rules: {
    'prettier/prettier': [
      'error',
      {
        tabWidth: 2,
        singleQuote: true,
        semi: false,
      },
    ],
    'vue/first-attribute-linebreak': [
      'error',
      {
        multiline: 'below',
      },
    ],
  },
}
