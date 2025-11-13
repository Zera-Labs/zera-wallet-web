// feat: → new feature → MINOR bump

// fix: → bug fix → PATCH bump

// BREAKING CHANGE: in the commit body or feat!:/fix!: in the type → MAJOR bump
module.exports = {
    extends: ['@commitlint/config-conventional'],
    rules: {
      'type-enum': [
        2,
        'always',
        [
          'feat',
          'fix',
          'docs',
          'style',
          'refactor',
          'perf',
          'test',
          'build',
          'ci',
          'chore',
          'revert',
          'tweak',
        ]
      ],
      'subject-empty': [2, 'never']
    }
  };
