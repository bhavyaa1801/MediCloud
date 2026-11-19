export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: { sans: ['Inter', 'system-ui', 'sans-serif'] },
      colors: {
        brand: '#4263EB', accent: '#8275D9', surface: '#F7F8FC', ink: '#17233C',
        muted: '#718096', success: '#16A36A', warning: '#E8A23B', danger: '#E05252',
      },
    },
  },
  plugins: [],
}
