SET DESTINATION=c:\inetpub\wwwroot\solitaire

xcopy *.html %DESTINATION% /d
xcopy *.css %DESTINATION% /d
uglifyjs Solitaire.js --warn --verbose --compress warnings=true,drop_console=true,keep_classnames=true,passes=2 --mangle keep_classnames=true --output %DESTINATION%\Solitaire.js
