# Jsoql.Gui
## Browser-mode hacks
### Lazy.js

* `package.json` *browser* property must be set to `lazy.node.js`

### Oboe.js

* `package.json` *browser* property must be set to `oboe.node.js`

### Git
* use `> git subtree push --prefix Code/Jsoql.Gui origin gh-pages` to publish to GitHub pages
* any static content that lives under `node_modules` and is not `require()`d (and therefore picked up by Browserify) must be explicitly added/un-ignored for it to be pushed to GitHub Pages

