SET DESTINATION=c:\Users\oddst\Dropbox\Apps\My.DropPages\oddstream.droppages.com\Public

xcopy *.html %DESTINATION% /d
xcopy *.css %DESTINATION% /d
uglifyjs Solitaire.js --warn --verbose --output %DESTINATION%\Solitaire.js
