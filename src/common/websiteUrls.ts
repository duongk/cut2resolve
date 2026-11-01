// Public links owned by cut2resolve. Keep each target in this one place so the
// desktop application does not direct people to the upstream project.

const projectGithubUrl = 'https://github.com/duongk/cut2resolve';
export const websiteUrl = projectGithubUrl;

export const appLinkTargets = {
  usage: `${projectGithubUrl}#getting-started`,
  faq: `${projectGithubUrl}#documentation`,
  troubleshooting: `${projectGithubUrl}/issues`,
  'file-name-template': `${projectGithubUrl}/blob/master/docs/file-name-template.md`,
  'select-segments-by-expression': `${projectGithubUrl}/blob/master/docs/expressions.md`,
  'edit-segments-by-expression': `${projectGithubUrl}/blob/master/docs/expressions.md`,
  'select-tracks-by-expression': `${projectGithubUrl}/blob/master/docs/expressions.md`,
  'privacy-policy': `${projectGithubUrl}/blob/master/website/src/legal/privacy-policy.md`,
  licenses: `${projectGithubUrl}/releases/latest/download/licenses.txt`,
  'latest-release': 'https://api.github.com/repos/duongk/cut2resolve/releases/latest',
  discussions: `${projectGithubUrl}/discussions`,
  'bug-report': `${projectGithubUrl}/issues`,
  'feature-request': `${projectGithubUrl}/issues/new?template=3-feature.yml`,
  thanks: projectGithubUrl,
  discord: `${projectGithubUrl}/discussions`,
} as const;

export type AppLinkName = keyof typeof appLinkTargets;

export const getAppLinkUrl = (name: AppLinkName) => appLinkTargets[name];
