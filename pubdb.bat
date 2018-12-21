@echo off

SET DESTINATION=c:\Users\oddst\Dropbox\Apps\My.DropPages\oddstream.droppages.com\Public
SET CONTENT_DESTINATION=c:\Users\oddst\Dropbox\Apps\My.DropPages\oddstream.droppages.com\Content
SET IMG_DESTINATION=c:\Users\oddst\Dropbox\Apps\My.DropPages\oddstream.droppages.com\Public\img

xcopy *.html %DESTINATION% /d
xcopy index.html %CONTENT_DESTINATION% /d
xcopy *.css %DESTINATION% /d
xcopy manifest.json %DESTINATION% /d
xcopy img\*.png %IMG_DESTINATION% /d

REM java -jar compiler.jar --version
REM java -jar compiler.jar --js Solitaire.js --language_in ECMASCRIPT_2017 --language_out ECMASCRIPT_2015 --js_output_file %DESTINATION%\Solitaire.js
