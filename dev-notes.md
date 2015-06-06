# Jsoql.Gui

## Browser-mode hacks

### Oboe.js

* `package.json` *browser* property must be set to `oboe.node.js`

### Git
* use `> git subtree push --prefix Code/Jsoql.Gui origin gh-pages` to publish to GitHub pages
* when the subtree push goes wrong with all the "pushed branch tip is behind" nonsense, the nuclear solution is to delete and recreate the *gh-pages* branch locally and remotely
	* `> git push origin --delete gh-pages`
	* `> git branch -d gh-pages`
* any static content that lives under `node_modules` and is not `require()`d (and therefore picked up by Browserify) must be explicitly added/un-ignored for it to be pushed to GitHub Pages

