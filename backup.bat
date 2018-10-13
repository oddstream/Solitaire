@echo off

SET DESTINATION=..\Solitaire.backup
xcopy *.guts %DESTINATION% /d
xcopy Solitaire.js %DESTINATION% /d
xcopy Solitaire.css %DESTINATION% /d
xcopy index.html %DESTINATION% /d
xcopy faq.html %DESTINATION% /d
xcopy *.txt %DESTINATION% /d
xcopy symbols.svg %DESTINATION% /d
xcopy makefile %DESTINATION% /d
xcopy *.bat %DESTINATION% /d
