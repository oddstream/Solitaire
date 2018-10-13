@echo off

for %%f in (*.guts) do (
    make %%~nf.html
)
