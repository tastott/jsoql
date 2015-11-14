cd Jsoql
call tsd update
call tsd rebundle
call npm run build
call npm install
cd ../Jsoql.Gui/Code
call tsd install
cd ../
call npm uninstall jsoql -g
call npm link ../Jsoql
call npm run build
call npm install