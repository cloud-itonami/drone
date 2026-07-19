import { etzhayyimUIKit } from '@etzhayyimcojp/design-system/plugin';

/** @type {import('tailwindcss').Config} */
export default {
	content: [
		'./src/**/*.{html,js,svelte,ts}',
		'../../../../../packages/ts/design-system/dist/**/*.{svelte,js}',
		'../../../../../packages/ts/design-system/dist/**/*.{svelte,js}'
	],
	darkMode: ['selector', '[data-theme="dark"]'],
	theme: {
		extend: {
			colors: {
				gv2: {
					'bg-primary': 'var(--gv2-bg-primary, #1a1a1a)',
					'bg-sidebar': 'var(--gv2-bg-sidebar, #1f1f1f)',
					'bg-hover': 'var(--gv2-bg-hover, #333333)',
					'bg-input': 'var(--gv2-bg-input, #2a2a2a)',
					'text-primary': 'var(--gv2-text-primary, #ffffff)',
					'text-secondary': 'var(--gv2-text-secondary, #a0a0a0)',
					'text-muted': 'var(--gv2-text-muted, #666666)',
					border: 'var(--gv2-border, #333333)'
				},
				drone: {
					armed: '#ef4444',
					flying: '#3b82f6',
					online: '#22c55e',
					offline: '#6b7280',
					returning: '#f59e0b',
					warning: '#f97316',
					danger: '#dc2626'
				}
			}
		}
	},
	plugins: [etzhayyimUIKit]
};
