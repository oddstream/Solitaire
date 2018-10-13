@echo off

for %%f in (*.guts) do (
    echo %%~nf
    del %%~nf.html
    type Header.txt >> %%~nf.html
    type %%~nf.guts >> %%~nf.html
    type symbols.svg >> %%~nf.html
    type Footer.txt >> %%~nf.html
)
