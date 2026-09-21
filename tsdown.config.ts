import {defineConfig} from 'tsdown';

const externals: RegExp[] = [/^(?:react|react-dom|next|reflect-metadata)(?:\/|$)/];

const shared = {
  target: 'es2022',
  outDir: 'dist',
  fixedExtension: true,
  dts: true,
  sourcemap: true,
  deps: {neverBundle: externals},
} as const;

export default defineConfig([
  {
    ...shared,
    entry: {
      index: 'src/index.ts',
      'react/index': 'src/react/index.ts',
      'next/index': 'src/next/index.ts',
    },
    format: ['esm', 'cjs'],
    clean: true,
  },
]);
