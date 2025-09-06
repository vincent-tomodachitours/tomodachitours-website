/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./src/**/*.{js,jsx,ts,tsx}",
        "./public/index.html",
    ],
    theme: {
        extend: {
            fontFamily: {
                ubuntu: ["Ubuntu", "sans-serif"],
                roboto: ['Roboto', 'sans-serif'],
            },
            keyframes: {
                'ken-burns': {
                    '0%': { transform: 'scale(1.05)' },
                    '50%': { transform: 'scale(1.2)' },
                    '100%': { transform: 'scale(1.05)' }
                },
                'fade-in-up': {
                    '0%': {
                        opacity: '0',
                        transform: 'translateY(30px)'
                    },
                    '100%': {
                        opacity: '1',
                        transform: 'translateY(0)'
                    }
                }
            },
            animation: {
                'ken-burns': 'ken-burns 20s ease-in-out infinite',
                'fade-in-up': 'fade-in-up 0.8s ease-out forwards'
            }
        },
    },
    plugins: [],
} 