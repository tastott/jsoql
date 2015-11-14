#!/usr/bin/env node

import childProcess = require('child_process')

childProcess.fork('./node_modules/nw/bin/nw', [], { cwd: __dirname });
