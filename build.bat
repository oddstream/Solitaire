@echo off

for %%f in (*.guts) do (
    echo %%~nf
    del %%~nf.html
    @copy /B /Y header.txt+%%~nf.guts+symbols.svg+footer.txt %%~nf.html >nul
REM    type Header.txt >> %%~nf.html
REM    type %%~nf.guts >> %%~nf.html
REM    type symbols.svg >> %%~nf.html
REM    type Footer.txt >> %%~nf.html
)
