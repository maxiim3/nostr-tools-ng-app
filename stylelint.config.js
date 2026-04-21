module.exports = {
  extends: ['stylelint-config-standard', 'stylelint-config-tailwindcss'],
  rules: {
    'selector-class-pattern': null,
    'no-descending-specificity': null,
    'hue-degree-notation': null,
    'number-max-precision': null,
    'custom-property-empty-line-before': null,
    'font-family-name-quotes': null,
  },
  ignoreFiles: ['node_modules/**', 'dist/**', '.angular/**'],
};
