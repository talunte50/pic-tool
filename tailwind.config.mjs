/** @type {import('tailwindcss').Config} */
export default {
    content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
    theme: {
        container: {
            center: true,
            padding: '2rem',
            screens: {
                '2xl': '1400px',
            },
        },
        extend: {
        colors: {
            brand: {50:'#EEF2FF',100:'#E0E7FF',500:'#4F46E5',600:'#4338CA',700:'#3730A3'},
            surface:{0:'#FFFFFF',1:'#FAFAFB',2:'#F4F4F5'},
            ink:    {300:'#D4D4D8',500:'#71717A',700:'#3F3F46',900:'#18181B'},
        },
        borderRadius: {sm:'8px',md:'12px',lg:'16px',full:'999px'},
        boxShadow: {
            'sm':'0 1px 2px rgba(24,24,27,.06)',
            'md':'0 4px 12px rgba(24,24,27,.08)',
            'focus':'0 0 0 3px rgba(79,70,229,.25)',
        },
    },
    },
    plugins: [
        require('@tailwindcss/typography')
    ],
};
