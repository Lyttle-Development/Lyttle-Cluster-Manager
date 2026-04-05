import nextCoreWebVitals from 'eslint-config-next/core-web-vitals';
import nextTypeScript from 'eslint-config-next/typescript';

const eslintConfig = [
  ...nextCoreWebVitals,
  ...nextTypeScript,
  {
    rules: {
      'react-hooks/exhaustive-deps': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {'argsIgnorePattern': '^_', 'varsIgnorePattern': '^_'}
      ]
    }
  }
];

export default eslintConfig;