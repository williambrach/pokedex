// build.mjs — transpile JSX → JS (no runtime Babel), concatenate into one
// classic script, and assemble a static, deploy-ready dist/ for GitHub Pages.
import { transform } from 'esbuild';
import { readFile, writeFile, mkdir, rm, cp } from 'node:fs/promises';
import path from 'node:path';

const SRC = 'src';
const OUT = 'dist';

// Load order matters: each module assigns to window; later ones read those
// globals. Same ordering as the original multi-<script> setup.
const ORDER = ['pokedata', 'ui', 'ios-frame', 'tcgapi', 'store', 'settings', 'grid', 'detail', 'app'];
const ASSETS = ['index.html', 'styles.css', 'manifest.webmanifest', 'icon.svg'];

async function run() {
  await rm(OUT, { recursive: true, force: true });
  await mkdir(OUT, { recursive: true });

  let bundle = '';
  for (const name of ORDER) {
    const code = await readFile(path.join(SRC, name + '.jsx'), 'utf8');
    const res = await transform(code, {
      loader: 'jsx',
      jsx: 'transform',          // classic transform → React.createElement / React.Fragment (React is a global)
      target: 'es2019',
      minifyWhitespace: true,
      minifySyntax: true,
      minifyIdentifiers: false,  // keep cross-file global names intact
      legalComments: 'none',
    });
    bundle += `\n/* ${name} */\n` + res.code;
  }
  await writeFile(path.join(OUT, 'app.js'), bundle);

  for (const f of ASSETS) await cp(path.join(SRC, f), path.join(OUT, f));
  await cp(path.join(SRC, 'vendor'), path.join(OUT, 'vendor'), { recursive: true });

  // GitHub Pages serves the artifact as-is (skip Jekyll processing).
  await writeFile(path.join(OUT, '.nojekyll'), '');

  console.log(`Built ${OUT}/app.js (${(bundle.length / 1024).toFixed(1)} KB) + ${ASSETS.length + 2} assets`);
}

run().catch(e => { console.error(e); process.exit(1); });
