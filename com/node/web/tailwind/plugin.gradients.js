/* eslint-disable import/no-extraneous-dependencies */
const plugin = require('tailwindcss/plugin');

module.exports = plugin(({ addUtilities, e, theme }) => {
  // generate all the possible combinations of colours
  const themeColors = Object.entries(theme('colors', {}));
  const variants = ['responsive', 'hover'];

  // get list of colors
  const colors = [];
  for (const [colorname, shades] of themeColors) {
    if (typeof shades !== 'string') {
      for (const [shade, value] of Object.entries(shades)) {
        colors.push([`${colorname}-${shade}`, value]);

        if (shade === '500') {
          colors.push([colorname, value]);
        }
      }
    } else {
      colors.push([colorname, shades]);
    }
  }

  const utilities = {};
  for (let i = 0; i < colors.length; i += 1) {
    const start = e(colors[i][0]);

    for (let j = 0; j < colors.length; j += 1) {
      if (j !== i) {
        const end = e(colors[j][0]);
        utilities[`.bg-gradient-${start}-${end}`] = {
          backgroundImage: `linear-gradient(to right, ${colors[i][1]}, ${colors[j][1]})`,
        };
      }
    }
  }

  // console.log(colors[0], colors[1]);
  addUtilities(utilities, { variants });
});
