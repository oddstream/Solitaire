SET DESTINATION=c:\inetpub\wwwroot\solitaire

xcopy *.html %DESTINATION% /d
xcopy *.js %DESTINATION% /d
xcopy *.css %DESTINATION% /d
