.RECIPEPREFIX = >
deps := header.txt footer.txt symbols.svg
sources := $(sort $(wildcard *.guts))
objects := $(patsubst %.guts,%.html,$(sources))

%.html: %.guts $(deps)
#>if exist $@ del $@
# SUB is a control character; ASCII 26 decimal, 1A hex, also called Control-Z.
# It is appended by the copy command in text (default) mode. To avoid it use copy with the /b (binary) switch.
>@echo $@
>@copy /B /Y header.txt+$(patsubst %.html,%.guts,$@)+symbols.svg+footer.txt $@ >nul
#>type header.txt >> $@
#>type $(patsubst %.html,%.guts,$@) >> $@
#>type symbols.svg >> $@
#>type footer.txt >> $@

#$(objects): $(deps)
#	if exist $@ del $@
#	type header.txt >> $@
#	type $(patsubst %.html,%.guts,$@) >> $@
#	type footer.txt >> $@

# TODO try the $(shell ) function
define chain =
make -n $(1)

endef

all:
>$(foreach o,$(objects),$(call chain,$(o)))
    
count:
>@echo $(words $(sources))

guts:
>@echo $(sources)

html:
>@echo $(objects)
