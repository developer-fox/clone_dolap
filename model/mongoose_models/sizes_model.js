
const mongoose = require('mongoose');

module.exports = new mongoose.Schema({
  woman: {
    woman_top_body: {type: [String], default: []},
    woman_bottom_body: {type: [String], default: []},
    woman_shoes_body: {type: [String], default: []},
    woman_underwear_body: {type: [String], default: []},
  },
  man: {
    man_top_body: {type: [String], default: []},
    man_bottom_body: {type: [String], default: []},
    man_shoes_body: {type: [String], default: []},
  },
  baby: {
    baby_body: {type: [String], default: []},
    child_body: {type: [String], default: []},
    baby_shoes_body: {type: [String], default: []},
    child_shoes_body: {type: [String], default: []},
  },
  
})

