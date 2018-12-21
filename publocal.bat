@ECHO OFF
SET DESTINATION=c:\inetpub\wwwroot\solitaire
SET IMG_DESTINATION=c:\inetpub\wwwroot\solitaire\img

xcopy *.html %DESTINATION% /d
xcopy *.css %DESTINATION% /d
xcopy manifest.json %DESTINATION% /d
xcopy img\*.png %IMG_DESTINATION% /d

java -jar compiler.jar --version
java -jar compiler.jar --js Solitaire.js --language_in ECMASCRIPT_2017 --language_out ECMASCRIPT_2015 --js_output_file %DESTINATION%\Solitaire.js
