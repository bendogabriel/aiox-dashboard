const path = require('path');

module.exports = {
  plugins: [
    require(path.resolve(__dirname, 'node_modules/tailwindcss')),
    require('autoprefixer'),
  ],
};
