module.exports = {
  extends: [
    'stylelint-config-standard',
    'stylelint-config-standard-scss',
    'stylelint-config-recommended-vue/scss',
    'stylelint-config-recess-order'
  ],
  plugins: ['stylelint-scss', 'stylelint-prettier'],
  overrides: [
    {
      files: ['**/*.vue'],
      customSyntax: 'postcss-html'
    },
    {
      files: ['**/*.scss'],
      customSyntax: 'postcss-scss'
    }
  ],
  ignoreFiles: [
    '**/*.js',
    '**/*.jsx',
    '**/*.tsx',
    '**/*.ts',
    '**/*.json',
    '**/*.md',
    '**/*.yaml',
    'node_modules/**',
    'dist/**',
    'dist-server/**'
  ],
  rules: {
    'prettier/prettier': true,
    'value-keyword-case': null,
    'no-descending-specificity': null,
    'function-url-quotes': 'always',
    'no-empty-source': null,
    'selector-class-pattern': null,
    'property-no-unknown': null,
    'value-no-vendor-prefix': null,
    'selector-pseudo-class-no-unknown': [
      true,
      {
        ignorePseudoClasses: ['global', 'v-deep', 'deep']
      }
    ],
    // SCSS 特定规则
    'scss/at-rule-no-unknown': true,
    'scss/dollar-variable-pattern': null,
    'scss/selector-no-redundant-nesting-selector': true
  }
}