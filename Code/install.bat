cd Jsoql
call npm install
call tsd update
call tsd rebundle
call npm run build
call npm run grammar-build
cd ../Jsoql.Gui/Code
call tsd update
call tsd rebundle
cd ../
call npm install
call npm link ../Jsoql
call npm run build
