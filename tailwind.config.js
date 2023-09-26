/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./views/*.{hbs,html}"],
  theme: {
    extend: {
      backgroundColor: {
        'custom-blue': '#00046F', // Define a custom color class
        'custom-green':'#198754',//Define another one
        'nav-bar-red':'#ed2602',
    },
    fontFamily: {
      display: ['Sacramento', 'cursive'],
      oxygen: ['Oxygen', 'sans-serif'],
      fontbolxr:['Bellota', 'cursive'],
      vig:['Freehand', 'cursive;'],


        },
        backgroundImage: {
          'adminbg': "url('/images/background adminbg.jpg')",
        },
    },
  },
  plugins: [],
}

