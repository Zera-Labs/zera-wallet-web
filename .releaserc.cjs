module.exports = {
    branches: ['main'],
    plugins: [
      ['@semantic-release/commit-analyzer', {
        preset: 'conventionalcommits',
        releaseRules: [
          { type: 'tweak', release: 'patch' }
        ]
      }],
      ['@semantic-release/release-notes-generator', {
        preset: 'conventionalcommits'
      }],
      ['@semantic-release/changelog', {
        changelogFile: 'CHANGELOG.md'
      }],
      ['@semantic-release/exec', {
        // This runs before the git commit, with the next version
        prepareCmd: 'node .versioning/prepare.js ${nextRelease.version}'
      }],
      ['@semantic-release/git', {
        assets: [
          'CHANGELOG.md',
          'VERSION',
          '.versioning/history.json',
          'package.json'
        ],
        message: 'chore(release): ${nextRelease.version}\n\n${nextRelease.notes}'
      }],
      '@semantic-release/github'
    ]
  };
  