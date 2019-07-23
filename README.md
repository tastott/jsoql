![JSOQL logo](https://raw.githubusercontent.com/tastott/jsoql/master/Images/jsoql-300-100.png)
##*JavaScript Object Query Language*

[![Join the chat at https://gitter.im/tastott/jsoql](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/tastott/jsoql?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)
A SQL-like language for querying JSON data.

**Please note:** it may have a cool logo, but **this project is very much a work in progress.**

###[Online demo](http://tastott.github.io/jsoql/#/home?queryText=SELECT%0A%20%20%20%20*%20%0AFROM%20%0A%20%20%20%20'http:%2F%2F~%2FData%2Forders.json'%0A)

###[Wiki](https://github.com/tastott/jsoql/wiki)

###[Examples](https://github.com/tastott/jsoql/wiki/examples)


#Command-line tool
##Install
`> npm install jsoql -g`

##Run
`> jsoql query -q "SELECT * FROM 'file://mydata.json' WHERE foo = 'bar'"`

#GUI
##Install
`> npm install jsoql-pad -g`
##Run
`> jsoql-pad`

#Coming soon

* Better Wiki

#Credits
This project relies heavily on some really cool libraries:

* [Jison](http://zaach.github.io/jison/). Language parser generator.
* [lazy.js](http://danieltao.com/lazy.js/). Functional utility library for enumerable collections.
