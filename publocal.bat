@ECHO OFF
SET DESTINATION=c:\inetpub\wwwroot\solitaire

xcopy *.html %DESTINATION% /d
xcopy *.css %DESTINATION% /d

java -jar compiler.jar --version
java -jar compiler.jar --js Solitaire.js --language_in ECMASCRIPT_2017 --language_out ECMASCRIPT_2015 --js_output_file %DESTINATION%\Solitaire.js
