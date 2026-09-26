import { execFileSync, execSync, spawnSync } from 'node:child_process'

function git(...args) {
  return execFileSync('git', args, { encoding: 'utf8' }).trim()
}

execSync('npm run build', { stdio: 'inherit' })
git('add', '-f', 'dist')

const staged = spawnSync('git', ['diff', '--cached', '--quiet', '--', 'dist'])
if (staged.status === 1) {
  execFileSync('git', ['commit', '-m', 'Deploy to production', '--', 'dist'], { stdio: 'inherit' })
} else if (staged.status !== 0) {
  throw new Error('Could not inspect the built site')
}

git('fetch', 'origin', 'gh-pages')
const tree = git('rev-parse', 'HEAD:dist')
const parent = git('rev-parse', 'origin/gh-pages')

if (tree === git('rev-parse', 'origin/gh-pages^{tree}')) {
  console.log('Published site is already up to date')
} else {
  const commit = execFileSync('git', ['commit-tree', tree, '-p', parent], {
    input: 'Deploy to production\n',
    encoding: 'utf8',
  }).trim()

  execFileSync('git', ['push', 'origin', `${commit}:refs/heads/gh-pages`], { stdio: 'inherit' })
}
