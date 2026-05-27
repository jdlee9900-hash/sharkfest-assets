import type { Preview } from '@storybook/nextjs'
import '../app/globals.css'

const preview: Preview = {
  parameters: {
    controls: { matchers: { color: /(background|color)$/i, date: /Date$/i } },
    viewport: {
      viewports: {
        mobile:  { name: 'Mobile (390px)',  styles: { width: '390px',  height: '844px' } },
        tablet:  { name: 'Tablet (768px)',  styles: { width: '768px',  height: '1024px' } },
        desktop: { name: 'Desktop (1440px)',styles: { width: '1440px', height: '900px' } },
      },
    },
    backgrounds: {
      default: 'light',
      values: [
        { name: 'light',  value: '#fafaf9' },
        { name: 'dark',   value: '#0f172a' },
        { name: 'navy',   value: '#1e293b' },
        { name: 'white',  value: '#ffffff' },
      ],
    },
  },
}

export default preview
